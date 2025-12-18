import api from './api';

export interface Song {
    id: string;
    title: string;
    artist: string;
    album?: string;
    artistId?: string;
    albumId?: string;
    userId?: string;
    duration: number;
    streamUrl: string;
    coverUrl?: string;
    status: string;
    type: string;
    genres: string[];
    audioQuality: string;
    createdAt?: string;
}

export interface Playlist {
    id: string;
    name: string;
    description?: string;
    coverUrl?: string;
    isPublic: boolean;
    ownerId: string;
    songs: Song[];
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    isSuccess: boolean;
}

// Search songs with full-text search
export const searchSongs = async (query: string): Promise<Song[]> => {
    try {
        const response = await api.get<ApiResponse<Song[]>>(`/music/songs/search`, {
            params: { q: query }
        });
        return response.data.data || [];
    } catch (error) {
        console.error('Error searching songs:', error);
        return [];
    }
};

// Get all songs
export const getAllSongs = async (): Promise<Song[]> => {
    try {
        const response = await api.get<ApiResponse<Song[]>>('/music/songs');
        return response.data.data || [];
    } catch (error) {
        console.error('Error fetching songs:', error);
        return [];
    }
};

// Get song by ID
export const getSongById = async (id: string): Promise<Song | null> => {
    try {
        const response = await api.get<ApiResponse<Song>>(`/music/songs/${id}`);
        return response.data.data || null;
    } catch (error) {
        console.error('Error fetching song:', error);
        return null;
    }
};

// ========== Playlist APIs ==========

// Get all playlists
export const getAllPlaylists = async (): Promise<Playlist[]> => {
    try {
        const response = await api.get<ApiResponse<Playlist[]>>('/playlist/all');
        return response.data.data || [];
    } catch (error) {
        console.error('Error fetching all playlists:', error);
        return [];
    }
};

// Get user's playlists
export const getUserPlaylists = async (): Promise<Playlist[]> => {
    try {
        const response = await api.get<ApiResponse<Playlist[]>>('/playlist');
        return response.data.data || [];
    } catch (error) {
        console.error('Error fetching user playlists:', error);
        return [];
    }
};

// Get public playlists
export const getPublicPlaylists = async (): Promise<Playlist[]> => {
    try {
        const response = await api.get<ApiResponse<Playlist[]>>('/playlist/public');
        return response.data.data || [];
    } catch (error) {
        console.error('Error fetching public playlists:', error);
        return [];
    }
};

// Get playlist by ID
export const getPlaylistById = async (id: string): Promise<Playlist | null> => {
    try {
        const response = await api.get<ApiResponse<Playlist>>(`/playlist/${id}`);
        return response.data.data || null;
    } catch (error) {
        console.error('Error fetching playlist:', error);
        return null;
    }
};
