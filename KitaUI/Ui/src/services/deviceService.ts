import { musicControlService, type DeviceConnection, type DeviceList } from './musicControlService';

/**
 * Generates a browser-specific device name using the browser's user agent
 * and a persisted short ID in localStorage for uniqueness across sessions.
 */
function detectBrowserName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
    if (ua.includes('Brave')) return 'Brave';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    return 'Browser';
}

function getPlatformType(): string {
    const ua = navigator.userAgent;
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) return 'Mobile';
    return 'Desktop';
}

function getOrCreateShortId(): string {
    const key = 'kita_device_short_id';
    let id = localStorage.getItem(key);
    if (!id) {
        id = Math.random().toString(36).substring(2, 6);
        localStorage.setItem(key, id);
    }
    return id;
}

export type DeviceChangeCallback = (info: {
    isActiveDevice: boolean;
    activeDeviceId: string | undefined;
    currentDeviceId: string | undefined;
    devices: DeviceConnection[];
}) => void;

export type PlaybackStateSyncCallback = (state: {
    currentSongId?: string;
    isPlaying: boolean;
    currentTime: number;
    volume: number;
    queue: string[];
}) => void;

export class DeviceService {
    private currentDeviceId: string | undefined;
    private activeDeviceId: string | undefined;
    private devices: DeviceConnection[] = [];
    private isActive = false;
    private initPromise: Promise<() => void> | null = null;

    private deviceChangeCallbacks: DeviceChangeCallback[] = [];
    private playbackSyncCallbacks: PlaybackStateSyncCallback[] = [];

    /**
     * Returns a browser-specific device name like "Chrome - Desktop #a3f2"
     */
    public getDeviceName(): string {
        const browser = detectBrowserName();
        const platform = getPlatformType();
        const shortId = getOrCreateShortId();
        return `${browser} - ${platform} #${shortId}`;
    }

    /**
     * Returns the device type for registration
     */
    public getDeviceType(): string {
        return getPlatformType() === 'Mobile' ? 'mobile' : 'web';
    }

    /**
     * Initialize device: connect to hub, register, and handle auto-select logic.
     * Returns cleanup function.
     */
    public async initializeDevice(): Promise<() => void> {
        // If already initializing or initialized, return the existing promise
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._doInit();
        return this.initPromise;
    }

    private async _doInit(): Promise<() => void> {

        await musicControlService.connect();

        const deviceName = this.getDeviceName();
        const deviceType = this.getDeviceType();

        // Set up event handlers BEFORE registering
        const handleDeviceRegistered = async (deviceId: string) => {
            console.log('[DeviceService] Device registered with ID:', deviceId);
            this.currentDeviceId = deviceId;

            try {
                const deviceList = await musicControlService.getConnectedDevices();
                this.devices = deviceList.devices;
                this.activeDeviceId = deviceList.activeDeviceId;

                if (deviceList.devices.length === 1) {
                    // Only device — auto-select as active
                    console.log('[DeviceService] Only device, auto-selecting as active');
                    await musicControlService.selectActiveDevice(deviceId);
                    this.isActive = true;
                    this.activeDeviceId = deviceId;
                } else if (deviceList.activeDeviceId) {
                    // There are other devices, one is already active
                    this.isActive = deviceList.activeDeviceId === deviceId;
                    console.log('[DeviceService] Multiple devices, active:', deviceList.activeDeviceId, 'isThis:', this.isActive);

                    // Sync playback state from server for new joiner
                    if (!this.isActive) {
                        const state = await musicControlService.getPlaybackState();
                        if (state && state.currentSongId) {
                            console.log('[DeviceService] Syncing playback state for new device:', state);
                            this.notifyPlaybackSync(state);
                        }
                    }
                } else {
                    // Multiple devices but no active — auto-select this one
                    console.log('[DeviceService] Multiple devices but no active, selecting this device');
                    await musicControlService.selectActiveDevice(deviceId);
                    this.isActive = true;
                    this.activeDeviceId = deviceId;
                }

                this.notifyDeviceChange();
            } catch (error) {
                console.error('[DeviceService] Error handling device registration:', error);
            }
        };

        const handleDeviceListUpdated = (deviceList: DeviceList) => {
            console.log('[DeviceService] Device list updated:', deviceList);
            this.devices = deviceList.devices;
            this.activeDeviceId = deviceList.activeDeviceId;
            this.isActive = this.activeDeviceId === this.currentDeviceId;
            this.notifyDeviceChange();
        };

        const handleActiveDeviceChanged = (activeDevice: DeviceConnection) => {
            console.log('[DeviceService] Active device changed:', activeDevice);
            this.activeDeviceId = activeDevice.deviceId;
            this.isActive = activeDevice.deviceId === this.currentDeviceId;
            this.notifyDeviceChange();
        };

        musicControlService.onDeviceRegistered(handleDeviceRegistered);
        musicControlService.onDeviceListUpdated(handleDeviceListUpdated);
        musicControlService.onActiveDeviceChanged(handleActiveDeviceChanged);

        // Register the device
        await musicControlService.registerDevice(deviceName, deviceType);

        // Return cleanup function
        return () => {
            musicControlService.offDeviceRegistered(handleDeviceRegistered);
            musicControlService.offDeviceListUpdated(handleDeviceListUpdated);
            musicControlService.offActiveDeviceChanged(handleActiveDeviceChanged);
            // Allow re-initialization on next mount if needed (e.g. full disconnect)
            this.initPromise = null;
        };
    }

    // --- State getters ---

    public getCurrentDeviceId(): string | undefined {
        return this.currentDeviceId;
    }

    public getActiveDeviceId(): string | undefined {
        return this.activeDeviceId;
    }

    public getDevices(): DeviceConnection[] {
        return this.devices;
    }

    public isThisDeviceActive(): boolean {
        return this.isActive;
    }

    // --- Actions ---

    public async switchToDevice(deviceId: string): Promise<void> {
        await musicControlService.selectActiveDevice(deviceId);
    }

    // --- Callbacks ---

    public onDeviceChange(callback: DeviceChangeCallback): () => void {
        this.deviceChangeCallbacks.push(callback);
        return () => {
            this.deviceChangeCallbacks = this.deviceChangeCallbacks.filter(cb => cb !== callback);
        };
    }

    public onPlaybackSync(callback: PlaybackStateSyncCallback): () => void {
        this.playbackSyncCallbacks.push(callback);
        return () => {
            this.playbackSyncCallbacks = this.playbackSyncCallbacks.filter(cb => cb !== callback);
        };
    }

    private notifyDeviceChange() {
        const info = {
            isActiveDevice: this.isActive,
            activeDeviceId: this.activeDeviceId,
            currentDeviceId: this.currentDeviceId,
            devices: this.devices,
        };
        this.deviceChangeCallbacks.forEach(cb => cb(info));
    }

    private notifyPlaybackSync(state: {
        currentSongId?: string;
        isPlaying: boolean;
        currentTime: number;
        volume: number;
        queue: string[];
    }) {
        this.playbackSyncCallbacks.forEach(cb => cb(state));
    }
}

// Export singleton instance
export const deviceService = new DeviceService();
