import * as signalR from '@microsoft/signalr';

class VoiceHubService {
    private connection: signalR.HubConnection | null = null;
    private listeners: Map<string, Set<(data: any) => void>> = new Map();

    async connect(): Promise<void> {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            console.log('Voice hub already connected');
            return;
        }

        const token = localStorage.getItem('auth_token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const hubBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5064';

        try {
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(`${hubBaseUrl}/hubs/voice`, {
                    accessTokenFactory: () => token
                })
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Information)
                .build();

            // Setup event handlers
            this.connection.on('BotStatusChanged', (data) => {
                this.emit('BotStatusChanged', data);
            });

            this.connection.on('BotLeft', (data) => {
                this.emit('BotLeft', data);
            });



            await this.connection.start();
        } catch (error) {
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
            this.listeners.clear();
        }
    }

    async joinRoom(channelId: string, username: string): Promise<void> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            throw new Error('Not connected to voice hub');
        }
        await this.connection.invoke('JoinRoom', channelId, username);
    }

    async leaveRoom(channelId: string): Promise<void> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            return;
        }
        await this.connection.invoke('LeaveRoom', channelId);
    }

    on(event: string, callback: (data: any) => void): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    off(event: string, callback: (data: any) => void): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(callback);
        }
    }

    private emit(event: string, data: any): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(callback => callback(data));
        }
    }

    isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }
}

export const voiceHubService = new VoiceHubService();
