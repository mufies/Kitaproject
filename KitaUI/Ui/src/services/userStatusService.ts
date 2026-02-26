// userStatusService.ts
import * as signalR from '@microsoft/signalr';
import type { UserStatus } from '../types/api';

class UserStatusService {
    private connection: signalR.HubConnection | null = null;
    private statusCallbacks: ((status: UserStatus) => void)[] = [];
    private userStatuses: Map<string, UserStatus> = new Map();

    async connect(token: string) {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            return;
        }

        try {
            if (this.connection) {
                await this.connection.stop();
            }

            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(`${import.meta.env.VITE_API_URL || 'http://localhost:5064'}/hubs/userstatus`, {
                    accessTokenFactory: () => token
                })
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Information)
                .build();

            this.connection.on('UserStatusChanged', (status: UserStatus) => {
                console.log('🟡 UserStatusChanged event received:', status);
                console.log(`  - User ${status.userId}: online=${status.isOnline}, song=${status.currentlyPlayingSong?.songTitle || 'none'}`);
                this.userStatuses.set(status.userId, status);

                this.statusCallbacks.forEach(cb => cb(status));
            });

            this.connection.onreconnecting(() => {
                console.log('🟡 UserStatus connection reconnecting...');
            });

            this.connection.onreconnected(() => {
                console.log('🟢 UserStatus connection reconnected');
            });

            this.connection.onclose(() => {
                console.log('🔴 UserStatus connection closed');
            });

            await this.connection.start();
            console.log('🟢 UserStatus connection established');

        } catch (err) {
            console.error('Failed to connect to UserStatusHub:', err);
            this.connection = null;
            throw err;
        }
    }

    async updateCurrentlyPlayingSong(songId: string, songTitle: string, artistName: string, coverUrl: string) {
        if (!this.isConnected()) {
            console.warn('Not connected to UserStatusHub');
            return;
        }

        try {
            await this.connection!.invoke('UpdateCurrentlyPlayingSong', songId, songTitle, artistName, coverUrl);
        } catch (err) {
            console.error('Failed to update currently playing song:', err);
        }
    }

    async clearCurrentlyPlayingSong() {
        if (!this.isConnected()) {
            console.warn('Not connected to UserStatusHub');
            return;
        }

        try {
            await this.connection!.invoke('ClearCurrentlyPlayingSong');
        } catch (err) {
            console.error('Failed to clear currently playing song:', err);
        }
    }

    async getUserStatus(userId: string): Promise<UserStatus | null> {
        if (this.userStatuses.has(userId)) {
            return this.userStatuses.get(userId)!;
        }

        if (!this.isConnected()) {
            return null;
        }

        try {
            const status = await this.connection!.invoke<UserStatus>('GetUserStatus', userId);
            this.userStatuses.set(userId, status);
            return status;
        } catch (err) {
            console.error('Failed to get user status:', err);
            return null;
        }
    }

    async getUsersStatus(userIds: string[]): Promise<UserStatus[]> {
        if (!this.isConnected()) {
            console.warn('🔴 getUsersStatus: Not connected to hub');
            return [];
        }

        try {
            console.log('🔵 getUsersStatus: Requesting status for users:', userIds);
            const statuses = await this.connection!.invoke<UserStatus[]>('GetUsersStatus', userIds);
            console.log('🟢 getUsersStatus: Received statuses:', statuses);
            statuses.forEach(status => {
                console.log(`  - User ${status.userId}: online=${status.isOnline}, song=${status.currentlyPlayingSong?.songTitle || 'none'}`);
                this.userStatuses.set(status.userId, status);
            });
            return statuses;
        } catch (err) {
            console.error('🔴 Failed to get users status:', err);
            return [];
        }
    }

    onStatusChanged(callback: (status: UserStatus) => void) {
        this.statusCallbacks.push(callback);

        return () => {
            this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
        };
    }

    clearCallbacks() {
        this.statusCallbacks = [];
    }

    async disconnect() {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
            this.clearCallbacks();
            this.userStatuses.clear();
        }
    }

    isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }

    // Get cached status without server call
    getCachedStatus(userId: string): UserStatus | null {
        return this.userStatuses.get(userId) || null;
    }
}

export const userStatusService = new UserStatusService();
