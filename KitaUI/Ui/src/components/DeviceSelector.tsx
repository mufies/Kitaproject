import { useState, useEffect } from "react";
import { MusicControlService, type DeviceConnection, type DeviceList } from "../services/musicControlService";

interface DeviceSelectorProps {
    musicControlService: MusicControlService;
}

export const DeviceSelector = ({ musicControlService }: DeviceSelectorProps) => {
    const [devices, setDevices] = useState<DeviceConnection[]>([]);
    const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Load initial device list
        loadDevices();

        // Listen for device list updates
        musicControlService.onDeviceListUpdated((deviceList: DeviceList) => {
            setDevices(deviceList.devices);
            setActiveDeviceId(deviceList.activeDeviceId);
        });

        // Listen for active device changes
        musicControlService.onActiveDeviceChanged((activeDevice: DeviceConnection) => {
            setActiveDeviceId(activeDevice.deviceId);
        });

        return () => {
            // Cleanup listeners if needed
        };
    }, [musicControlService]);

    const loadDevices = async () => {
        try {
            const deviceList = await musicControlService.getConnectedDevices();
            setDevices(deviceList.devices);
            setActiveDeviceId(deviceList.activeDeviceId);
        } catch (error) {
            console.error("Error loading devices:", error);
        }
    };

    const handleSelectDevice = async (deviceId: string) => {
        try {
            await musicControlService.selectActiveDevice(deviceId);
            setIsOpen(false);
        } catch (error) {
            console.error("Error selecting device:", error);
        }
    };

    const getActiveDevice = () => {
        return devices.find(d => d.deviceId === activeDeviceId);
    };

    const getDeviceIcon = (deviceType: string) => {
        switch (deviceType) {
            case "mobile":
                return "📱";
            case "desktop":
                return "🖥️";
            default:
                return "🌐";
        }
    };

    return (
        <div className="device-selector">
            <button
                className="device-selector-button"
                onClick={() => setIsOpen(!isOpen)}
                title="Select playback device"
            >
                <span className="device-icon">🎵</span>
                <span className="device-name">
                    {getActiveDevice()?.deviceName || "No device selected"}
                </span>
                <span className="dropdown-icon">{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
                <div className="device-dropdown">
                    <div className="device-dropdown-header">Select a device</div>
                    <div className="device-list">
                        {devices.length === 0 ? (
                            <div className="no-devices">No devices available</div>
                        ) : (
                            devices.map((device) => (
                                <button
                                    key={device.deviceId}
                                    className={`device-item ${device.deviceId === activeDeviceId ? "active" : ""}`}
                                    onClick={() => handleSelectDevice(device.deviceId)}
                                >
                                    <span className="device-icon">{getDeviceIcon(device.deviceType)}</span>
                                    <div className="device-info">
                                        <div className="device-name">{device.deviceName}</div>
                                        <div className="device-type">{device.deviceType}</div>
                                    </div>
                                    {device.deviceId === activeDeviceId && (
                                        <span className="active-indicator">✓</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .device-selector {
                    position: relative;
                    display: inline-block;
                }

                .device-selector-button {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 20px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .device-selector-button:hover {
                    background: rgba(255, 255, 255, 0.15);
                }

                .device-icon {
                    font-size: 18px;
                }

                .device-name {
                    font-size: 14px;
                    max-width: 150px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .dropdown-icon {
                    font-size: 10px;
                    margin-left: 4px;
                }

                .device-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    background: rgba(30, 30, 30, 0.95);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    min-width: 280px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    z-index: 1000;
                    overflow: hidden;
                }

                .device-dropdown-header {
                    padding: 16px;
                    font-size: 14px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.8);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .device-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .no-devices {
                    padding: 32px;
                    text-align: center;
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 14px;
                }

                .device-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 12px 16px;
                    background: transparent;
                    border: none;
                    color: white;
                    cursor: pointer;
                    transition: background 0.2s;
                    text-align: left;
                }

                .device-item:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .device-item.active {
                    background: rgba(29, 185, 84, 0.2);
                }

                .device-info {
                    flex: 1;
                }

                .device-info .device-name {
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 2px;
                }

                .device-info .device-type {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.6);
                    text-transform: capitalize;
                }

                .active-indicator {
                    color: #1db954;
                    font-size: 18px;
                    font-weight: bold;
                }
            `}</style>
        </div>
    );
};
