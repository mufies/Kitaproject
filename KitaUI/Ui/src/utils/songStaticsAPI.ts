import { axiosInstance } from "./fetchAPI";
import type { ApiResponse, SongStaticsDto } from "../types/api";

// ==================== SONG STATISTICS ====================

/**
 * Get song statistics (play count, likes, dislikes, favorites, shares)
 */
export const getSongStats = async (songId: string): Promise<ApiResponse<SongStaticsDto>> => {
    try {
        const { data } = await axiosInstance.get(`/songstatics/songs/${songId}/stats`);
        return data;
    } catch (error) {
        console.error("Error fetching song stats:", error);
        throw error;
    }
};

/**
 * Increment play count for a song
 */
export const incrementPlayCount = async (songId: string): Promise<ApiResponse<SongStaticsDto>> => {
    try {
        const { data } = await axiosInstance.post(`/songstatics/songs/${songId}/play`);
        return data;
    } catch (error) {
        console.error("Error incrementing play count:", error);
        throw error;
    }
};

/**
 * Like a song
 */
export const likeSong = async (songId: string): Promise<ApiResponse<SongStaticsDto>> => {
    try {
        const { data } = await axiosInstance.post(`/songstatics/songs/${songId}/like`);
        return data;
    } catch (error) {
        console.error("Error liking song:", error);
        throw error;
    }
};

/**
 * Unlike a song
 */
export const unlikeSong = async (songId: string): Promise<ApiResponse<SongStaticsDto>> => {
    try {
        const { data } = await axiosInstance.delete(`/songstatics/songs/${songId}/like`);
        return data;
    } catch (error) {
        console.error("Error unliking song:", error);
        throw error;
    }
};

/**
 * Dislike a song
 */
export const dislikeSong = async (songId: string): Promise<ApiResponse<SongStaticsDto>> => {
    try {
        const { data } = await axiosInstance.post(`/songstatics/songs/${songId}/dislike`);
        return data;
    } catch (error) {
        console.error("Error disliking song:", error);
        throw error;
    }
};

/**
 * Remove dislike from a song
 */
export const removeDislike = async (songId: string): Promise<ApiResponse<SongStaticsDto>> => {
    try {
        const { data } = await axiosInstance.delete(`/songstatics/songs/${songId}/dislike`);
        return data;
    } catch (error) {
        console.error("Error removing dislike:", error);
        throw error;
    }
};

/**
 * Add song to favorites
 */
export const addToFavorites = async (songId: string): Promise<ApiResponse<SongStaticsDto>> => {
    try {
        const { data } = await axiosInstance.post(`/songstatics/songs/${songId}/favorite`);
        return data;
    } catch (error) {
        console.error("Error adding to favorites:", error);
        throw error;
    }
};

/**
 * Remove song from favorites
 */
export const removeFromFavorites = async (songId: string): Promise<ApiResponse<SongStaticsDto>> => {
    try {
        const { data } = await axiosInstance.delete(`/songstatics/songs/${songId}/favorite`);
        return data;
    } catch (error) {
        console.error("Error removing from favorites:", error);
        throw error;
    }
};

/**
 * Share a song (increment share count)
 */
export const shareSong = async (songId: string): Promise<ApiResponse<SongStaticsDto>> => {
    try {
        const { data } = await axiosInstance.post(`/songstatics/songs/${songId}/share`);
        return data;
    } catch (error) {
        console.error("Error sharing song:", error);
        throw error;
    }
};

/**
 * Check if user has liked a song
 */
export const hasUserLikedSong = async (songId: string): Promise<{ hasLiked: boolean }> => {
    try {
        const { data } = await axiosInstance.get(`/songstatics/songs/${songId}/like/status`);
        return data;
    } catch (error) {
        console.error("Error checking like status:", error);
        throw error;
    }
};

/**
 * Check if user has disliked a song
 */
export const hasUserDislikedSong = async (songId: string): Promise<{ hasDisliked: boolean }> => {
    try {
        const { data } = await axiosInstance.get(`/songstatics/songs/${songId}/dislike/status`);
        return data;
    } catch (error) {
        console.error("Error checking dislike status:", error);
        throw error;
    }
};

/**
 * Check if user has favorited a song
 */
export const hasUserFavoritedSong = async (songId: string): Promise<{ hasFavorited: boolean }> => {
    try {
        const { data } = await axiosInstance.get(`/songstatics/songs/${songId}/favorite/status`);
        return data;
    } catch (error) {
        console.error("Error checking favorite status:", error);
        throw error;
    }
};

/**
 * Get all user interaction statuses for a song at once
 */
export const getUserSongInteractions = async (songId: string): Promise<{
    hasLiked: boolean;
    hasDisliked: boolean;
    hasFavorited: boolean;
}> => {
    try {
        const [likeStatus, dislikeStatus, favoriteStatus] = await Promise.all([
            hasUserLikedSong(songId),
            hasUserDislikedSong(songId),
            hasUserFavoritedSong(songId)
        ]);
        return {
            hasLiked: likeStatus.hasLiked,
            hasDisliked: dislikeStatus.hasDisliked,
            hasFavorited: favoriteStatus.hasFavorited
        };
    } catch (error) {
        console.error("Error fetching user interactions:", error);
        throw error;
    }
};
