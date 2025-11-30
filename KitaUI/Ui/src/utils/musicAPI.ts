import { axiosInstance } from "./fetchAPI";
import type { CreateSongDto, SongDto, CreatePlaylistDto, PlaylistDto, ApiResponse } from "../types/api";

// ==================== SONGS ====================

/**
 * Upload a new song with audio file and optional cover image
 */
export const uploadSong = async (
    songData: CreateSongDto,
    songFile: File,
    coverFile?: File
): Promise<ApiResponse<SongDto>> => {
    try {
        const formData = new FormData();

        // Append song data
        formData.append('title', songData.title);
        formData.append('artist', songData.artist);
        if (songData.album) formData.append('album', songData.album);
        if (songData.duration) formData.append('duration', songData.duration.toString());

        // Append files
        formData.append('songFile', songFile);
        if (coverFile) {
            formData.append('coverFile', coverFile);
        }

        const { data } = await axiosInstance.post('/music/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    } catch (error) {
        console.error("Error uploading song:", error);
        throw error;
    }
};

/**
 * Create a song with URLs (without file upload)
 */
export const createSong = async (songData: CreateSongDto): Promise<ApiResponse<SongDto>> => {
    try {
        const { data } = await axiosInstance.post('/music/songs', songData);
        return data;
    } catch (error) {
        console.error("Error creating song:", error);
        throw error;
    }
};

/**
 * Get all songs
 */
export const getAllSongs = async (): Promise<ApiResponse<SongDto[]>> => {
    try {
        const { data } = await axiosInstance.get('/music/songs');
        return data;
    } catch (error) {
        console.error("Error fetching songs:", error);
        throw error;
    }
};

// ==================== PLAYLISTS ====================

/**
 * Create a new playlist
 */
export const createPlaylist = async (playlistData: CreatePlaylistDto): Promise<ApiResponse<PlaylistDto>> => {
    try {
        const { data } = await axiosInstance.post('/music/playlists', playlistData);
        return data;
    } catch (error) {
        console.error("Error creating playlist:", error);
        throw error;
    }
};

/**
 * Get all playlists for the current user
 */
export const getUserPlaylists = async (): Promise<ApiResponse<PlaylistDto[]>> => {
    try {
        const { data } = await axiosInstance.get('/music/playlists');
        return data;
    } catch (error) {
        console.error("Error fetching playlists:", error);
        throw error;
    }
};

/**
 * Add a song to a playlist
 */
export const addSongToPlaylist = async (playlistId: string, songId: string): Promise<ApiResponse<void>> => {
    try {
        const { data } = await axiosInstance.post(`/music/playlists/${playlistId}/songs/${songId}`);
        return data;
    } catch (error) {
        console.error("Error adding song to playlist:", error);
        throw error;
    }
};

/**
 * Get a specific playlist by ID
 */
export const getPlaylistById = async (playlistId: string): Promise<ApiResponse<PlaylistDto>> => {
    try {
        const { data } = await axiosInstance.get(`/music/playlists/${playlistId}`);
        return data;
    } catch (error) {
        console.error("Error fetching playlist:", error);
        throw error;
    }
};
