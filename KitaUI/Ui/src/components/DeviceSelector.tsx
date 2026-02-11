import { useState, useEffect } from "react";
import { musicControlService, type DeviceConnection, type DeviceList } from "../services/musicControlService";

export const DeviceSelector = () => {
    const [devices, setDevices] = useState<DeviceConnection[]>([]);
    const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        loadDevices();

        musicControlService.onDeviceListUpdated((deviceList: DeviceList) => {
            setDevices(deviceList.devices);
            setActiveDeviceId(deviceList.activeDeviceId);
        });

        musicControlService.onActiveDeviceChanged((activeDevice: DeviceConnection) => {
            setActiveDeviceId(activeDevice.deviceId);
        });

        return () => {
            // Cleanup listeners if needed
        };
    }, []); // Empty deps - using singleton

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
        <div className="relative inline-block">
            <button
                className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white cursor-pointer transition-all duration-200 hover:bg-white/15"
                onClick={() => setIsOpen(!isOpen)}
                title="Select playback device"
            >
                <span className="text-lg">🎵</span>
                <span className="text-sm max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {getActiveDevice()?.deviceName || "No device selected"}
                </span>
                <span className="text-[10px] ml-1">{isOpen ? "▼" : "▲"}</span>
            </button>

            {isOpen && (
                <div className="absolute bottom-full mb-2 right-0 bg-[rgba(30,30,30,0.95)] backdrop-blur-[10px] border border-white/10 rounded-xl min-w-[280px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-[1000] overflow-hidden">
                    <div className="px-4 py-4 text-sm font-semibold text-white/80 border-b border-white/10">
                        Select a device
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {devices.length === 0 ? (
                            <div className="py-8 text-center text-white/50 text-sm">
                                No devices available
                            </div>
                        ) : (
                            devices.map((device) => (
                                <button
                                    key={device.deviceId}
                                    className={`flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none text-white cursor-pointer transition-colors duration-200 text-left hover:bg-white/10 ${device.deviceId === activeDeviceId ? "bg-[rgba(29,185,84,0.2)]" : ""
                                        }`}
                                    onClick={() => handleSelectDevice(device.deviceId)}
                                >
                                    <span className="text-lg">{getDeviceIcon(device.deviceType)}</span>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium mb-0.5">
                                            {device.deviceName}
                                        </div>
                                        <div className="text-xs text-white/60 capitalize">
                                            {device.deviceType}
                                        </div>
                                    </div>
                                    {device.deviceId === activeDeviceId && (
                                        <span className="text-[#1db954] text-lg font-bold">✓</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
