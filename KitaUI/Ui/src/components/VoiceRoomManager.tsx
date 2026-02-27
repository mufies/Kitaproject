import { useEffect } from 'react';
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useParticipants
} from '@livekit/components-react';
import { useVoice } from '../contexts/VoiceContext';

interface VoiceRoomManagerProps {
    onParticipantsChange: (channelId: string, participants: Array<{ identity: string; name: string; isSpeaking: boolean; isMicrophoneEnabled: boolean }>) => void;
    isVoiceChannelActive: boolean; 
}

function ParticipantReporter({ channelId, onParticipantsChange }: { channelId: string; onParticipantsChange: VoiceRoomManagerProps['onParticipantsChange'] }) {
    const participants = useParticipants();

    useEffect(() => {
        const participantData = participants.map(p => ({
            identity: p.identity,
            name: p.name || p.identity,
            isSpeaking: p.isSpeaking,
            isMicrophoneEnabled: p.isMicrophoneEnabled
        }));
        onParticipantsChange(channelId, participantData);
    }, [participants, onParticipantsChange, channelId]);

    return null;
}

export default function VoiceRoomManager({ onParticipantsChange, isVoiceChannelActive }: VoiceRoomManagerProps) {
    const { connection } = useVoice();

    if (!connection || isVoiceChannelActive) {
        return null;
    }

    return (
        <LiveKitRoom
            token={connection.token}
            serverUrl={connection.serverUrl}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={() => {}}
        >
            <ParticipantReporter 
                channelId={connection.channelId} 
                onParticipantsChange={onParticipantsChange}
            />
            <RoomAudioRenderer />
        </LiveKitRoom>
    );
}
