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
    currentTime: number;        // Will convert to int before sending
    volume: number;             // Will convert to 0-100 scale
    playlistId?: string;
    queue: string[];
    lastUpdated: string;        // ISO string, SignalR auto converts to DateTime
}


export interface DeviceList {
    devices: DeviceConnection[];
    activeDeviceId?: string;
}

export class MusicControlService {
    private hubConnection: signalR.HubConnection;
    private currentDeviceId?: string;
    private connecting: boolean = false;
    private connectionPromise: Promise<void> | null = null;

    constructor() {
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${import.meta.env.VITE_API_URL || "http://localhost:5064"}/hubs/music-control`, {
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
            // Re-registration is handled by deviceService
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

        this.hubConnection.on("Seek", (positionSeconds: number) => {
            console.log("Received Seek command:", positionSeconds);
        });

        this.hubConnection.on("PlaybackStateUpdated", (state: PlaybackState) => {
            console.log("Playback state updated:", state);
        });
    }

    public async connect() {
        // If already connected, return immediately
        if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
            return;
        }

        // If currently connecting, wait for that connection to complete
        if (this.connecting && this.connectionPromise) {
            return this.connectionPromise;
        }

        // Mark as connecting and create new connection promise
        this.connecting = true;
        this.connectionPromise = this._connect();
        
        try {
            await this.connectionPromise;
        } finally {
            this.connecting = false;
            this.connectionPromise = null;
        }
    }

    private async _connect() {
        try {
            if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
                await this.hubConnection.start();
                console.log("Connected to MusicControl Hub");
            }
        } catch (error) {
            console.error("Error connecting to MusicControl Hub:", error);
            this.connecting = false;
            this.connectionPromise = null;
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

    public async seek(positionSeconds: number) {
        await this.hubConnection.invoke("Seek", positionSeconds);
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

    public onSeek(callback: (positionSeconds: number) => void) {
        this.hubConnection.on("Seek", callback);
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


    //  Remove Event Listener
    public offPlay(callback: () => void) {
        this.hubConnection.off("Play", callback);
    }

    public offPause(callback: () => void) {
        this.hubConnection.off("Pause", callback);
    }

    public offNext(callback: () => void) {
        this.hubConnection.off("Next", callback);
    }

    public offPrevious(callback: () => void) {
        this.hubConnection.off("Previous", callback);
    }

    public offSetVolume(callback: (volume: number) => void) {
        this.hubConnection.off("SetVolume", callback);
    }

    public offPlaySong(callback: (songId: string, startTime: number) => void) {
        this.hubConnection.off("PlaySong", callback);
    }

    public offSeek(callback: (positionSeconds: number) => void) {
        this.hubConnection.off("Seek", callback);
    }

    public offPlaybackStateUpdated(callback: (state: PlaybackState) => void) {
        this.hubConnection.off("PlaybackStateUpdated", callback);
    }

    public offDeviceListUpdated(callback: (deviceList: DeviceList) => void) {
        this.hubConnection.off("DeviceListUpdated", callback);
    }

    public offActiveDeviceChanged(callback: (activeDevice: DeviceConnection) => void) {
        this.hubConnection.off("ActiveDeviceChanged", callback);
    }

    public offDeviceRegistered(callback: (deviceId: string) => void) {
        this.hubConnection.off("DeviceRegistered", callback);
    }

}

// Export singleton instance
export const musicControlService = new MusicControlService();