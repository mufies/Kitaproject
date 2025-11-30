// chatService.ts
import * as signalR from '@microsoft/signalr';
import type { MessageDto, ApiResponse } from '../types/api';
import api from './api';

class ChatService {
    private connection: signalR.HubConnection | null = null;
    private messageCallbacks: ((message: MessageDto) => void)[] = [];

    async connect(token: string) {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            return;
        }

        try {
            // Stop old connection
            if (this.connection) {
                await this.connection.stop();
            }

            // Create new connection
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl('http://localhost:5064/hubs/chat', {
                    accessTokenFactory: () => token
                })
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Information)
                .build();

            this.connection.on('ReceiveMessage', (message: MessageDto) => {
                this.messageCallbacks.forEach(cb => cb(message));
            });

            this.connection.onclose(() => {
            });

            await this.connection.start();

        } catch (err) {
            this.connection = null;
            throw err;
        }
    }

    async joinChannel(channelId: string) {
        if (!this.isConnected()) throw new Error('Not connected');
        await this.connection!.invoke('JoinChannel', channelId);
    }

    async leaveChannel(channelId: string) {
        if (!this.isConnected()) return;
        await this.connection!.invoke('LeaveChannel', channelId);
    }

    async sendMessage(channelId: string, content: string) {
        if (!this.isConnected()) throw new Error('Not connected');
        await this.connection!.invoke('SendMessage', channelId, content);
    }

    onMessageReceived(callback: (message: MessageDto) => void) {
        this.messageCallbacks.push(callback);
    }

    async fetchChannelMessages(channelId: string, token: string): Promise<MessageDto[]> {
        try {
            const response = await api.get<ApiResponse<MessageDto[]>>(
                `/message/channel/${channelId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            return response.data.data || [];
        } catch (err) {
            console.error('Failed to fetch messages:', err);
            return [];
        }
    }

    async disconnect() {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
            this.messageCallbacks = [];
        }
    }

    isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }
}

export const chatService = new ChatService();
