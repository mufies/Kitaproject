import { useState } from 'react';
import { MicOff, PhoneOff, Users, Loader2 } from 'lucide-react';
import type { ChannelDto } from '../../types/api';
import { getVoiceToken } from '../../services/livekitService';
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useParticipants,
    TrackToggle
} from '@livekit/components-react';
import { Track } from 'livekit-client';

interface VoiceChannelProps {
    channel: ChannelDto;
}

function ParticipantList() {
    const participants = useParticipants();

    return (
        <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
            {participants.map((participant) => (
                <ParticipantTile
                    key={participant.identity}
                    name={participant.name || participant.identity}
                    isSpeaking={participant.isSpeaking}
                    isMicrophoneEnabled={participant.isMicrophoneEnabled}
                />
            ))}
        </div>
    );
}

interface ParticipantTileProps {
    name: string;
    isSpeaking: boolean;
    isMicrophoneEnabled: boolean;
}

function ParticipantTile({ name, isSpeaking, isMicrophoneEnabled }: ParticipantTileProps) {
    const initial = name.charAt(0).toUpperCase();
    const borderColor = isSpeaking ? 'border-green-500' : (isMicrophoneEnabled ? 'border-green-500/30' : 'border-red-500');

    return (
        <div className="bg-[#1a141a] rounded-2xl relative aspect-video flex items-center justify-center border border-[#ffffff0d] group hover:border-[#ffffff20] transition-all overflow-hidden">
            <div className="flex flex-col items-center">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-[#ff7a3c] to-[#ff4d4d] border-4 ${borderColor} flex items-center justify-center shadow-lg relative transition-all`}>
                    <span className="text-white font-bold text-2xl">{initial}</span>
                    {!isMicrophoneEnabled && (
                        <div className="absolute -bottom-1 -right-1 bg-red-500 p-1 rounded-full">
                            <MicOff size={12} className="text-white" />
                        </div>
                    )}
                </div>
            </div>
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg text-white text-xs font-medium border border-white/10">
                {name}
            </div>
        </div>
    );
}

function VoiceControls({ onLeave }: { onLeave: () => void }) {
    return (
        <div className="h-20 bg-[#120c12] border-t border-[#ffffff0d] flex items-center justify-center gap-4 px-4 pb-4">
            <TrackToggle
                source={Track.Source.Microphone}
                className="p-4 rounded-2xl bg-[#1a141a] text-white hover:bg-[#251d25] transition-all"
            />

            <button
                onClick={onLeave}
                className="p-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all px-8 border border-red-500/20"
            >
                <PhoneOff size={20} />
            </button>
        </div>
    );
}

export default function VoiceChannel({ channel }: VoiceChannelProps) {
    const [isJoined, setIsJoined] = useState(false);
    const [token, setToken] = useState<string>('');
    const [serverUrl, setServerUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');

    const handleJoin = async () => {
        setIsLoading(true);
        setError('');

        try {
            console.log('Joining voice channel:', channel.id, 'Type:', typeof channel.id);
            const response = await getVoiceToken(channel.id);
            setToken(response.token);
            setServerUrl(response.serverUrl);
            setIsJoined(true);
        } catch (err: any) {
            console.error('Failed to join voice channel:', err);
            console.error('Error response:', err.response?.data);
            const errorMsg = err.response?.data?.message || 'Failed to join voice channel. Please try again.';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLeave = () => {
        setIsJoined(false);
        setToken('');
        setServerUrl('');
        setError('');
    };

    if (!isJoined) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#120c12] h-full">
                <div className="w-24 h-24 bg-[#1a141a] rounded-full flex items-center justify-center mb-6 shadow-2xl border border-[#ffffff05]">
                    <Users size={40} className="text-[#ff7a3c]" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{channel.name}</h2>
                <p className="text-[#ffffff50] mb-8">Join the voice channel to start talking.</p>

                {error && (
                    <p className="text-red-500 mb-4 text-sm">{error}</p>
                )}

                <button
                    onClick={handleJoin}
                    disabled={isLoading}
                    className="bg-[#ff7a3c] hover:bg-[#ff8c52] disabled:bg-[#ff7a3c]/50 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-[#ff7a3c]/20 hover:scale-105 disabled:scale-100 flex items-center gap-2"
                >
                    {isLoading && <Loader2 size={20} className="animate-spin" />}
                    {isLoading ? 'Connecting...' : 'Join Voice'}
                </button>
            </div>
        );
    }

    return (
        <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={handleLeave}
            className="flex flex-col h-full bg-[#0a070a]"
        >
            <ParticipantList />
            <VoiceControls onLeave={handleLeave} />
            <RoomAudioRenderer />
        </LiveKitRoom>
    );
}
