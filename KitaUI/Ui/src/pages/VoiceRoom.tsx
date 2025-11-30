import { useState } from 'react';

interface VoiceRoomProps {
    channelId: string;
    channelName: string;
}

export default function VoiceRoom({ channelId, channelName }: VoiceRoomProps) {
    const [isJoined, setIsJoined] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);

    const handleJoin = () => {
        console.log(`🎤 Joining voice channel: ${channelId}`);
        setIsJoined(true);
        // TODO: Implement actual voice connection logic
    };

    const handleLeave = () => {
        console.log(`👋 Leaving voice channel: ${channelId}`);
        setIsJoined(false);
        setIsMuted(false);
        setIsDeafened(false);
        // TODO: Implement disconnect logic
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        console.log(`🎤 Mute: ${!isMuted}`);
    };

    const toggleDeafen = () => {
        const newDeafened = !isDeafened;
        setIsDeafened(newDeafened);
        if (newDeafened) {
            setIsMuted(true); // Auto mute when deafened
        }
        console.log(`🔇 Deafen: ${newDeafened}`);
    };

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-800 to-purple-900 px-6 py-4 border-b border-purple-700 shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                🎤 {channelName}
                            </h2>
                            {isJoined && (
                                <span className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    Connected
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-purple-300">
                            Voice Channel: <span className="font-mono text-purple-200">{channelId}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-6">
                {!isJoined ? (
                    <div className="text-center">
                        <div className="mb-8">
                            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Voice Channel</h3>
                            <p className="text-gray-400">Join the voice channel to start talking</p>
                        </div>
                        <button
                            onClick={handleJoin}
                            className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            Join Voice Channel
                        </button>
                    </div>
                ) : (
                    <div className="w-full max-w-2xl">
                        {/* Voice Controls */}
                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
                            <div className="text-center mb-8">
                                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center animate-pulse">
                                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-green-400 mb-2">Connected to Voice</h3>
                                <p className="text-gray-400 text-sm">You are now in the voice channel</p>
                            </div>

                            {/* Control Buttons */}
                            <div className="flex justify-center gap-4 mb-6">
                                <button
                                    onClick={toggleMute}
                                    className={`p-4 rounded-full transition-all duration-200 ${isMuted
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-gray-700 hover:bg-gray-600'
                                        }`}
                                    title={isMuted ? 'Unmute' : 'Mute'}
                                >
                                    {isMuted ? (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    )}
                                </button>

                                <button
                                    onClick={toggleDeafen}
                                    className={`p-4 rounded-full transition-all duration-200 ${isDeafened
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-gray-700 hover:bg-gray-600'
                                        }`}
                                    title={isDeafened ? 'Undeafen' : 'Deafen'}
                                >
                                    {isDeafened ? (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                    )}
                                </button>

                                <button
                                    onClick={handleLeave}
                                    className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all duration-200"
                                    title="Leave Voice"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Status Indicators */}
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                                    <span className="text-gray-400">Microphone</span>
                                    <span className={isMuted ? 'text-red-400' : 'text-green-400'}>
                                        {isMuted ? 'Muted' : 'Active'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                                    <span className="text-gray-400">Audio Output</span>
                                    <span className={isDeafened ? 'text-red-400' : 'text-green-400'}>
                                        {isDeafened ? 'Deafened' : 'Active'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="mt-6 text-center text-sm text-gray-500">
                            <p>Voice channel functionality is in development</p>
                            <p className="mt-1">WebRTC integration coming soon</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
