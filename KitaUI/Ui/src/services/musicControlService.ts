import * as signalR from "@microsoft/signalr";

export interface DeviceConnection {
    connectionId: string;
    deviceId: string;
    deviceName: string;
    deviceType: string;
    connectedAt: string;
}

export interface PlaybackState {
    currentSongId?: string;
    isPlaying: boolean;
    currentTime: number;
    volume: number;
    playlistId?: string;
    queue: string[];
    lastUpdated: string;
}

export interface DeviceList {
    devices: DeviceConnection[];
    activeDeviceId?: string;
}

export class MusicControlService {
    private hubConnection: signalR.HubConnection;
    private currentDeviceId?: string;
    private deviceName?: string;
    private deviceType?: string;

    constructor() {
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5064/hubs/music-control", {
                accessTokenFactory: () => localStorage.getItem("auth_token") || "",
            })
            .withAutomaticReconnect()
            .build();

        this.setupConnectionHandlers();
        this.setupEventHandlers();
    }

    private setupConnectionHandlers() {
        this.hubConnection.onreconnecting(() => {
            console.log("MusicControl Hub: Reconnecting...");
        });

        this.hubConnection.onreconnected(async () => {
            console.log("MusicControl Hub: Reconnected");
            // Re-register device after reconnection
            if (this.deviceName && this.deviceType) {
                try {
                    await this.registerDevice(this.deviceName, this.deviceType);
                    console.log("Device re-registered after reconnection");
                } catch (error) {
                    console.error("Failed to re-register device:", error);
                }
            }
        });

        this.hubConnection.onclose(() => {
            console.log("MusicControl Hub: Connection closed");
        });
    }

    private setupEventHandlers() {
        // Device events
        this.hubConnection.on("DeviceRegistered", (deviceId: string) => {
            this.currentDeviceId = deviceId;
            console.log("Device registered:", deviceId);
        });

        this.hubConnection.on("DeviceListUpdated", (deviceList: DeviceList) => {
            console.log("Device list updated:", deviceList);
        });

        this.hubConnection.on("ActiveDeviceChanged", (activeDevice: DeviceConnection) => {
            console.log("Active device changed:", activeDevice);
        });

        // Playback control events (received when we are the active device)
        this.hubConnection.on("Play", () => {
            console.log("Received Play command");
        });

        this.hubConnection.on("Pause", () => {
            console.log("Received Pause command");
        });

        this.hubConnection.on("Next", () => {
            console.log("Received Next command");
        });

        this.hubConnection.on("Previous", () => {
            console.log("Received Previous command");
        });

        this.hubConnection.on("SetVolume", (volume: number) => {
            console.log("Received SetVolume command:", volume);
        });

        this.hubConnection.on("PlaySong", (songId: string, startTime: number) => {
            console.log("Received PlaySong command:", songId, startTime);
        });

        this.hubConnection.on("PlaybackStateUpdated", (state: PlaybackState) => {
            console.log("Playback state updated:", state);
        });
    }

    public async connect() {
        try {
            // Only start if currently disconnected
            if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
                await this.hubConnection.start();
                console.log("Connected to MusicControl Hub");
            } else if (this.hubConnection.state === signalR.HubConnectionState.Connecting) {
                // Wait for connection to complete
                console.log("Connection in progress, waiting...");
                while (this.hubConnection.state === signalR.HubConnectionState.Connecting) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                console.log("Connection completed");
            } else {
                console.log(`Already ${this.hubConnection.state}, skipping connect`);
            }
        } catch (error) {
            console.error("Error connecting to MusicControl Hub:", error);
            throw error;
        }
    }

    public async disconnect() {
        try {
            await this.hubConnection.stop();
            console.log("Disconnected from MusicControl Hub");
        } catch (error) {
            console.error("Error disconnecting from MusicControl Hub:", error);
        }
    }

    // Device Management
    public async registerDevice(deviceName: string, deviceType: string = "web") {
        this.deviceName = deviceName;
        this.deviceType = deviceType;
        await this.hubConnection.invoke("RegisterDevice", deviceName, deviceType);
    }

    public async selectActiveDevice(deviceId: string) {
        await this.hubConnection.invoke("SelectActiveDevice", deviceId);
    }

    public async getConnectedDevices(): Promise<DeviceList> {
        return await this.hubConnection.invoke("GetConnectedDevices");
    }

    // Playback Control (sends commands to active device)
    public async play() {
        await this.hubConnection.invoke("Play");
    }

    public async pause() {
        await this.hubConnection.invoke("Pause");
    }

    public async next() {
        await this.hubConnection.invoke("Next");
    }

    public async previous() {
        await this.hubConnection.invoke("Previous");
    }

    public async setVolume(volume: number) {
        await this.hubConnection.invoke("SetVolume", volume);
    }

    public async playSong(songId: string, startTime: number = 0) {
        await this.hubConnection.invoke("PlaySong", songId, startTime);
    }

    // Playback State
    public async syncPlaybackState(state: PlaybackState) {
        await this.hubConnection.invoke("SyncPlaybackState", state);
    }

    public async getPlaybackState(): Promise<PlaybackState | null> {
        return await this.hubConnection.invoke("GetPlaybackState");
    }

    // Event Listeners
    public onPlay(callback: () => void) {
        this.hubConnection.on("Play", callback);
    }

    public onPause(callback: () => void) {
        this.hubConnection.on("Pause", callback);
    }

    public onNext(callback: () => void) {
        this.hubConnection.on("Next", callback);
    }

    public onPrevious(callback: () => void) {
        this.hubConnection.on("Previous", callback);
    }

    public onSetVolume(callback: (volume: number) => void) {
        this.hubConnection.on("SetVolume", callback);
    }

    public onPlaySong(callback: (songId: string, startTime: number) => void) {
        this.hubConnection.on("PlaySong", callback);
    }

    public onPlaybackStateUpdated(callback: (state: PlaybackState) => void) {
        this.hubConnection.on("PlaybackStateUpdated", callback);
    }

    public onDeviceListUpdated(callback: (deviceList: DeviceList) => void) {
        this.hubConnection.on("DeviceListUpdated", callback);
    }

    public onActiveDeviceChanged(callback: (activeDevice: DeviceConnection) => void) {
        this.hubConnection.on("ActiveDeviceChanged", callback);
    }

    public onDeviceRegistered(callback: (deviceId: string) => void) {
        this.hubConnection.on("DeviceRegistered", callback);
    }

    public getCurrentDeviceId(): string | undefined {
        return this.currentDeviceId;
    }

    public getConnectionState(): signalR.HubConnectionState {
        return this.hubConnection.state;
    }
}

// Export singleton instance
export const musicControlService = new MusicControlService();