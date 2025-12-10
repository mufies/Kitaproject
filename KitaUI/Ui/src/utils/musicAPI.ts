import { axiosInstance } from "./fetchAPI";
import type { CreateSongDto, SongDto, CreatePlaylistDto, PlaylistDto, ApiResponse, ImportPlaylistRequestDto, ImportPlaylistResponseDto } from "../types/api";

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
 * Create a new song (without file upload)
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

/**
 * Get a song by ID
 */
export const getSongById = async (songId: string): Promise<ApiResponse<SongDto>> => {
    try {
        const { data } = await axiosInstance.get(`/music/songs/${songId}`);
        return data;
    } catch (error) {
        console.error("Error fetching song:", error);
        throw error;
    }
};

/**
 * Update a song
 */
export const updateSong = async (songId: string, songData: SongDto): Promise<ApiResponse<SongDto>> => {
    try {
        const { data } = await axiosInstance.put(`/music/songs/${songId}`, songData);
        return data;
    } catch (error) {
        console.error("Error updating song:", error);
        throw error;
    }
};

/**
 * Change song status
 */
export const changeSongStatus = async (songId: string, status: string): Promise<ApiResponse<SongDto>> => {
    try {
        const { data } = await axiosInstance.patch(`/music/songs/${songId}/status`, { status });
        return data;
    } catch (error) {
        console.error("Error changing song status:", error);
        throw error;
    }
};

// ==================== PLAYLISTS ====================

/**
 * Create a new playlist with optional cover image
 */
export const createPlaylist = async (
    playlistData: CreatePlaylistDto,
    coverFile?: File
): Promise<ApiResponse<PlaylistDto>> => {
    try {
        const formData = new FormData();
        formData.append('name', playlistData.name);
        if (playlistData.description) formData.append('description', playlistData.description);
        formData.append('isPublic', String(playlistData.isPublic || false));

        if (coverFile) {
            formData.append('coverFile', coverFile);
        }

        const { data } = await axiosInstance.post('/playlist', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    } catch (error) {
        console.error("Error creating playlist:", error);
        throw error;
    }
};

/**
 * Get all playlists
 */
export const getAllPlaylists = async (): Promise<ApiResponse<PlaylistDto[]>> => {
    try {
        const { data } = await axiosInstance.get('/playlist/all');
        return data;
    } catch (error) {
        console.error("Error fetching playlists:", error);
        throw error;
    }
};

/**
 * Get a playlist by ID
 */
export const getPlaylistById = async (playlistId: string): Promise<ApiResponse<PlaylistDto>> => {
    try {
        const { data } = await axiosInstance.get(`/playlist/${playlistId}`);
        return data;
    } catch (error) {
        console.error("Error fetching playlist:", error);
        throw error;
    }
};

/**
 * Get user's playlists (uses auth token, no userId needed)
 */
export const getUserPlaylists = async (): Promise<ApiResponse<PlaylistDto[]>> => {
    try {
        const { data } = await axiosInstance.get('/playlist');
        return data;
    } catch (error) {
        console.error("Error fetching user playlists:", error);
        throw error;
    }
};

/**
 * Update a playlist
 */
export const updatePlaylist = async (playlistId: string, playlistData: PlaylistDto): Promise<ApiResponse<PlaylistDto>> => {
    try {
        const { data } = await axiosInstance.put(`/playlist/${playlistId}`, playlistData);
        return data;
    } catch (error) {
        console.error("Error updating playlist:", error);
        throw error;
    }
};

/**
 * Delete a playlist
 */
export const deletePlaylist = async (playlistId: string): Promise<ApiResponse<PlaylistDto>> => {
    try {
        const { data } = await axiosInstance.delete(`/playlist/${playlistId}`);
        return data;
    } catch (error) {
        console.error("Error deleting playlist:", error);
        throw error;
    }
};

/**
 * Add a song to a playlist
 */
export const addSongToPlaylist = async (playlistId: string, songId: string): Promise<ApiResponse<PlaylistDto>> => {
    try {
        const { data } = await axiosInstance.post(`/playlist/${playlistId}/songs/${songId}`);
        return data;
    } catch (error) {
        console.error("Error adding song to playlist:", error);
        throw error;
    }
};



/**
 * Remove a song from a playlist
 */
export const removeSongFromPlaylist = async (playlistId: string, songId: string): Promise<ApiResponse<PlaylistDto>> => {
    try {
        const { data } = await axiosInstance.delete(`/playlist/${playlistId}/songs/${songId}`);
        console.log(data);
        return data;

    } catch (error) {
        console.error("Error removing song from playlist:", error);
        throw error;
    }
};

/**
 * Get songs in a playlist
 */
export const getSongsInPlaylist = async (playlistId: string): Promise<ApiResponse<SongDto[]>> => {
    try {
        const { data } = await axiosInstance.get(`/playlist/${playlistId}/songs`);
        return data;
    } catch (error) {
        console.error("Error fetching playlist songs:", error);
        throw error;
    }
};

/**
 * Get playlists containing a specific song
 */
export const getPlaylistsBySongId = async (songId: string): Promise<ApiResponse<PlaylistDto[]>> => {
    try {
        const { data } = await axiosInstance.get(`/playlist/song/${songId}`);
        return data;
    } catch (error) {
        console.error("Error fetching playlists by song:", error);
        throw error;
    }
};

/**
 * Search playlists by name or description
 */
export const searchPlaylists = async (searchQuery: string): Promise<ApiResponse<PlaylistDto[]>> => {
    try {
        const { data } = await axiosInstance.get(`/playlist/search`, {
            params: { query: searchQuery }
        });
        return data;
    } catch (error) {
        console.error("Error searching playlists:", error);
        throw error;
    }
};

/**
 * Get public playlists
 */
export const getPublicPlaylists = async (): Promise<ApiResponse<PlaylistDto[]>> => {
    try {
        const { data } = await axiosInstance.get(`/playlist/public`);
        return data;
    } catch (error) {
        console.error("Error fetching public playlists:", error);
        throw error;
    }
};

/**
 * Get private playlists
 */
export const getPrivatePlaylists = async (): Promise<ApiResponse<PlaylistDto[]>> => {
    try {
        const { data } = await axiosInstance.get(`/playlist/private`);
        return data;
    } catch (error) {
        console.error("Error fetching private playlists:", error);
        throw error;
    }
};

/**
 * Get playlists by user ID and song ID
 */
export const getPlaylistsByUserAndSong = async (userId: string, songId: string): Promise<ApiResponse<PlaylistDto[]>> => {
    try {
        const { data } = await axiosInstance.get(`/playlist/user/${userId}/song/${songId}`);
        return data;
    } catch (error) {
        console.error("Error fetching playlists by user and song:", error);
        throw error;
    }
};

// ==================== IMPORT PLAYLIST ====================

/**
 * Import a playlist from external source (e.g., Spotify, YouTube)
 */
export const importPlaylist = async (playlistUrl: string): Promise<ApiResponse<ImportPlaylistResponseDto>> => {
    try {
        const request: ImportPlaylistRequestDto = { playlistUrl };
        const { data } = await axiosInstance.post('/playlist/importPlaylist', request);
        return data;
    } catch (error) {
        console.error("Error importing playlist:", error);
        throw error;
    }
};
