import api from './api';

export interface Song {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration: number;
    streamUrl: string;
    coverUrl?: string;
    status: string;
    type: string;
    genres: string[];
    audioQuality: string;
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
