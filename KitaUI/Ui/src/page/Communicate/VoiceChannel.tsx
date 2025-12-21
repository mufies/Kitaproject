import { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Users } from 'lucide-react';
import type { ChannelDto } from '../../types/api';

interface VoiceChannelProps {
    channel: ChannelDto;
}

export default function VoiceChannel({ channel }: VoiceChannelProps) {
    const [isJoined, setIsJoined] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(false);

    const handleJoin = () => {
        setIsJoined(true);
        // Connect to WebRTC/SignalR here
    };

    const handleLeave = () => {
        setIsJoined(false);
        setIsMuted(false);
        setIsVideoOn(false);
    };

    if (!isJoined) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#120c12] h-full">
                <div className="w-24 h-24 bg-[#1a141a] rounded-full flex items-center justify-center mb-6 shadow-2xl border border-[#ffffff05]">
                    <Users size={40} className="text-[#ff7a3c]" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{channel.name}</h2>
                <p className="text-[#ffffff50] mb-8">No one is currently in this channel.</p>

                <button
                    onClick={handleJoin}
                    className="bg-[#ff7a3c] hover:bg-[#ff8c52] text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-[#ff7a3c]/20 hover:scale-105"
                >
                    Join Voice
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0a070a]">
            {/* Grid */}
            <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
                {/* User Card */}
                <div className="bg-[#1a141a] rounded-2xl relative aspect-video flex items-center justify-center border border-[#ffffff0d] group hover:border-[#ffffff20] transition-all overflow-hidden">
                    {isVideoOn ? (
                        <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center text-[#ffffff30]">
                            Camera Feed Mockup
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-[#ff7a3c] to-[#ff4d4d] border-4 ${isMuted ? 'border-red-500' : 'border-green-500'} flex items-center justify-center shadow-lg relative`}>
                                <span className="text-white font-bold text-2xl">U</span>
                                {isMuted && <div className="absolute -bottom-1 -right-1 bg-red-500 p-1 rounded-full"><MicOff size={12} className="text-white" /></div>}
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg text-white text-xs font-medium border border-white/10">
                        You
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="h-20 bg-[#120c12] border-t border-[#ffffff0d] flex items-center justify-center gap-4 px-4 pb-4">
                <button
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`p-4 rounded-2xl transition-all ${isVideoOn ? 'bg-white text-black' : 'bg-[#1a141a] text-white hover:bg-[#251d25]'}`}
                >
                    {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-[#1a141a] text-white hover:bg-[#251d25]'}`}
                >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button className="p-4 rounded-2xl bg-[#1a141a] text-white hover:bg-[#251d25] transition-all">
                    <Monitor size={20} />
                </button>
                <button
                    onClick={handleLeave}
                    className="p-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all px-8 border border-red-500/20"
                >
                    <PhoneOff size={20} />
                </button>
            </div>
        </div>
    );
}
