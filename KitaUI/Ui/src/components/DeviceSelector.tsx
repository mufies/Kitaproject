import { usePlay } from "../context/PlayContext";

export const DeviceSelector = () => {
    const { devices, activeDeviceId, switchDevice } = usePlay();

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

    const getActiveDevice = () => {
        return devices.find(d => d.deviceId === activeDeviceId);
    };

    // If 0 or 1 device, don't show the selector
    if (devices.length <= 1) {
        return null;
    }

    return (
        <div className="relative inline-block group">
            <button
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white cursor-pointer transition-all duration-200 hover:bg-white/10 hover:border-white/20"
                title="Select playback device"
            >
                <span className="text-sm">🎵</span>
                <span className="text-xs max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-zinc-300">
                    {getActiveDevice()?.deviceName || "No device"}
                </span>
                <span className="text-[9px] text-zinc-500 ml-0.5">▲</span>
            </button>

            {/* Dropdown on hover */}
            <div className="absolute bottom-full mb-2 right-0 bg-[rgba(24,24,24,0.97)] backdrop-blur-xl border border-white/10 rounded-xl min-w-[280px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-[1000] overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                <div className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-white/5">
                    Devices
                </div>
                <div className="max-h-[300px] overflow-y-auto py-1">
                    {devices.map((device) => {
                        const isActive = device.deviceId === activeDeviceId;
                        return (
                            <button
                                key={device.deviceId}
                                className={`flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none text-white cursor-pointer transition-all duration-150 text-left hover:bg-white/8 ${isActive ? "bg-[rgba(255,122,60,0.1)]" : ""}`}
                                onClick={() => switchDevice(device.deviceId)}
                            >
                                <span className="text-lg">{getDeviceIcon(device.deviceType)}</span>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium mb-0.5 truncate ${isActive ? "text-[#ff7a3c]" : "text-white"}`}>
                                        {device.deviceName}
                                    </div>
                                    <div className="text-[11px] text-zinc-500 capitalize">
                                        {device.deviceType}
                                        {isActive && " · Playing"}
                                    </div>
                                </div>
                                {isActive && (
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-[#ff7a3c] rounded-full animate-pulse" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
