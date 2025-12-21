// chatService.ts
import * as signalR from '@microsoft/signalr';
import type { MessageDto, UpdateMessageDto, ApiResponse } from '../types/api';
import api from './api';

class ChatService {
    private connection: signalR.HubConnection | null = null;
    private messageCallbacks: ((message: MessageDto) => void)[] = [];
    private messageEditCallbacks: ((message: MessageDto) => void)[] = [];
    private messageDeleteCallbacks: ((messageId: string) => void)[] = [];

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

            this.connection.on('MessageEdited', (message: MessageDto) => {
                this.messageEditCallbacks.forEach(cb => cb(message));
            });

            this.connection.on('MessageDeleted', (messageId: string) => {
                this.messageDeleteCallbacks.forEach(cb => cb(messageId));
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

    onMessageEdited(callback: (message: MessageDto) => void) {
        this.messageEditCallbacks.push(callback);
    }

    onMessageDeleted(callback: (messageId: string) => void) {
        this.messageDeleteCallbacks.push(callback);
    }

    clearCallbacks() {
        this.messageCallbacks = [];
        this.messageEditCallbacks = [];
        this.messageDeleteCallbacks = [];
    }

    // REST API methods
    async fetchChannelMessages(channelId: string, take: number = 50, skip: number = 0): Promise<MessageDto[]> {
        try {
            const response = await api.get<ApiResponse<MessageDto[]>>(
                `/channel/${channelId}/messages?take=${take}&skip=${skip}`
            );
            return response.data.data || [];
        } catch (err) {
            console.error('Failed to fetch messages:', err);
            return [];
        }
    }

    async updateMessage(channelId: string, messageId: string, data: UpdateMessageDto): Promise<MessageDto | null> {
        try {
            const response = await api.put<ApiResponse<MessageDto>>(
                `/channel/${channelId}/messages/${messageId}`,
                data
            );
            return response.data.data;
        } catch (err) {
            console.error('Failed to update message:', err);
            return null;
        }
    }

    async deleteMessage(channelId: string, messageId: string): Promise<boolean> {
        try {
            const response = await api.delete<ApiResponse<boolean>>(
                `/channel/${channelId}/messages/${messageId}`
            );
            return response.data.success;
        } catch (err) {
            console.error('Failed to delete message:', err);
            return false;
        }
    }

    async disconnect() {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
            this.clearCallbacks();
        }
    }

    isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }

    async sendImageMessage(channelId: string, imageFile: File, caption?: string): Promise<MessageDto | null> {
        try {
            const formData = new FormData();
            formData.append('ChannelId', channelId);
            if (caption) {
                formData.append('Caption', caption);
            }
            formData.append('File', imageFile);

            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://localhost:5064/api/message/image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            const result = await response.json();
            return result.data;
        } catch (err) {
            console.error('Failed to send image message:', err);
            return null;
        }
    }
}

export const chatService = new ChatService();
