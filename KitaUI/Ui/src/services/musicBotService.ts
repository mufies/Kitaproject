import api from './api';

export interface BotStatus {
    channelId: string;
    userCount: number;
    currentSongId?: string;
    currentSongStreamUrl?: string;
    playbackStartedAt?: string;
    isPlaying: boolean;
    queueLength: number;
    volume: number;
    scheduledLeaveTime?: string;
    createdAt: string;
}

export interface Song {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration: number;
    coverUrl?: string;
}

// Join bot to channel
export const joinBot = async (channelId: string, playlistId?: string, songIds?: string[]): Promise<void> => {
    const payload: any = {};
    if (playlistId) payload.playlistId = playlistId;
    if (songIds) payload.songIds = songIds;

    await api.post(`/musicbot/join/${channelId}`, payload);
};

// Leave bot from channel
export const leaveBot = async (channelId: string): Promise<void> => {
    await api.post(`/musicbot/leave/${channelId}`);
};

// Play a specific song
export const playSong = async (channelId: string, songId: string): Promise<void> => {
    await api.post(`/musicbot/play/${channelId}/${songId}`);
};

// Add song to queue
export const addSongToQueue = async (channelId: string, songId: string): Promise<void> => {
    await api.post(`/musicbot/queue/${channelId}/${songId}`);
};

// Pause playback
export const pauseBot = async (channelId: string): Promise<void> => {
    await api.post(`/musicbot/pause/${channelId}`);
};

// Resume playback
export const resumeBot = async (channelId: string): Promise<void> => {
    await api.post(`/musicbot/resume/${channelId}`);
};

// Skip to next song
export const skipBot = async (channelId: string): Promise<void> => {
    await api.post(`/musicbot/skip/${channelId}`);
};

// Set volume
export const setBotVolume = async (channelId: string, volume: number): Promise<void> => {
    await api.post(`/musicbot/volume/${channelId}`, { volume });
};

// Get bot status
export const getBotStatus = async (channelId: string): Promise<BotStatus | null> => {
    try {
        const response = await api.get<{ data: BotStatus }>(`/musicbot/status/${channelId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching bot status:', error);
        return null;
    }
};
