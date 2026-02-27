import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from 'react';

export type VoiceParticipant = {
    identity: string;
    name: string;
    isSpeaking: boolean;
    isMicrophoneEnabled: boolean;
};

interface VoiceConnection {
    channelId: string;
    channelName: string;
    token: string;
    serverUrl: string;
}

interface VoiceContextType {
    connection: VoiceConnection | null;
    voiceParticipantsByChannel: Map<string, VoiceParticipant[]>;
    joinVoice: (channelId: string, channelName: string, token: string, serverUrl: string, leaveCallback: () => void) => void;
    clearVoiceConnection: () => void;
    leaveVoice: () => void;
    setChannelParticipants: (channelId: string, participants: VoiceParticipant[]) => void;
}

const VoiceContext = createContext<VoiceContextType>({
    connection: null,
    voiceParticipantsByChannel: new Map(),
    joinVoice: () => {},
    clearVoiceConnection: () => {},
    leaveVoice: () => {},
    setChannelParticipants: () => {},
});

export function VoiceProvider({ children }: { children: ReactNode }) {
    const [connection, setConnection] = useState<VoiceConnection | null>(null);
    const [voiceParticipantsByChannel, setVoiceParticipantsByChannel] = useState<Map<string, VoiceParticipant[]>>(new Map());
    const leaveCallbackRef = useRef<(() => void) | null>(null);

    const joinVoice = useCallback((channelId: string, channelName: string, token: string, serverUrl: string, leaveCallback: () => void) => {
        setConnection({ channelId, channelName, token, serverUrl });
        leaveCallbackRef.current = leaveCallback;
    }, []);

    const clearVoiceConnection = useCallback(() => {
        setConnection(null);
        leaveCallbackRef.current = null;
    }, []);

    const leaveVoice = useCallback(() => {
        const cb = leaveCallbackRef.current;
        setConnection(null);
        leaveCallbackRef.current = null;
        if (cb) cb();
    }, []);

    const setChannelParticipants = useCallback((channelId: string, participants: VoiceParticipant[]) => {
        setVoiceParticipantsByChannel(prev => {
            const next = new Map(prev);
            if (participants.length === 0) {
                next.delete(channelId);
            } else {
                next.set(channelId, participants);
            }
            return next;
        });
    }, []);

    return (
        <VoiceContext.Provider value={{ connection, voiceParticipantsByChannel, joinVoice, clearVoiceConnection, leaveVoice, setChannelParticipants }}>
            {children}
        </VoiceContext.Provider>
    );
}

export function useVoice() {
    return useContext(VoiceContext);
}
