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
                .withUrl(`${import.meta.env.VITE_API_URL || 'http://localhost:5064'}/hubs/chat`, {
                    accessTokenFactory: () => token
                })
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Information)
                .build();

            this.connection.on('ReceiveMessage', (message: MessageDto) => {
                this.messageCallbacks.forEach(cb => cb(message));
            });

            this.connection.on('EditMessage', (message: MessageDto) => {
                this.messageEditCallbacks.forEach(cb => cb(message));
            });

            this.connection.on('DeleteMessage', (message: MessageDto) => {
                this.messageDeleteCallbacks.forEach(cb => cb(message.id));
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

    async updateMessage(channelId: string, messageId: string, data: UpdateMessageDto): Promise<void> {
        if (!this.isConnected()) throw new Error('Not connected');
        try {
            await this.connection!.invoke('EditMessage', messageId, data.content, channelId);
        } catch (err) {
            console.error('Failed to update message:', err);
            throw err;
        }
    }

    async deleteMessage(channelId: string, messageId: string): Promise<void> {
        if (!this.isConnected()) throw new Error('Not connected');
        try {
            await this.connection!.invoke('DeleteMessage', messageId, channelId);
        } catch (err) {
            console.error('Failed to delete message:', err);
            throw err;
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
            formData.append('channelId', channelId);
            if (caption) {
                formData.append('caption', caption);
            }
            formData.append('file', imageFile);

            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5064'}/api/message/image`, {
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

            if (result.success && result.data) {
                try {
                    // Determine the correct ID property name (casing might vary)
                    const messageId = result.data.id || result.data.Id;
                    if (messageId && this.connection) {
                        await this.connection.invoke('NotifyImageSent', channelId, messageId);
                    }
                } catch (hubError) {
                    console.error('Failed to notify hub about image:', hubError);
                    // Don't throw here, as the upload was successful
                }
            }

            return result.data;
        } catch (err) {
            console.error('Failed to send image message:', err);
            return null;
        }
    }
}

export const chatService = new ChatService();
