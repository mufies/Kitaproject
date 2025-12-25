import { axiosInstance } from "../utils/fetchAPI";
import type { ApiResponse, SongStaticsDto, UserInteractionStatus } from "../types/api";

/**
 * Get song statistics by song ID
 */
export const getSongStatics = async (songId: string): Promise<ApiResponse<SongStaticsDto>> => {
    try {
        const { data } = await axiosInstance.get(`/SongStatics/songs/${songId}/stats`);
        return data;
    } catch (error) {
        console.error("Error fetching song statistics:", error);
        throw error;
    }
};

/**
 * Increment play count for a song
 */
export const incrementPlayCount = async (songId: string): Promise<ApiResponse<SongStaticsDto>> => {
    try {
        const { data } = await axiosInstance.post(`/SongStatics/songs/${songId}/play`);
        return data;
    } catch (error) {
        console.error("Error incrementing play count:", error);
        throw error;
    }
};

/**
 * Toggle like status for a song
 */
export const toggleLike = async (songId: string, isLiked: boolean): Promise<ApiResponse<SongStaticsDto>> => {
    try {
        if (isLiked) {
            // Remove like
            const { data } = await axiosInstance.delete(`/SongStatics/songs/${songId}/like`);
            return data;
        } else {
            // Add like
            const { data } = await axiosInstance.post(`/SongStatics/songs/${songId}/like`);
            return data;
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        throw error;
    }
};

/**
 * Toggle dislike status for a song
 */
export const toggleDislike = async (songId: string, isDisliked: boolean): Promise<ApiResponse<SongStaticsDto>> => {
    try {
        if (isDisliked) {
            // Remove dislike
            const { data } = await axiosInstance.delete(`/SongStatics/songs/${songId}/dislike`);
            return data;
        } else {
            // Add dislike
            const { data } = await axiosInstance.post(`/SongStatics/songs/${songId}/dislike`);
            return data;
        }
    } catch (error) {
        console.error("Error toggling dislike:", error);
        throw error;
    }
};

/**
 * Toggle favorite status for a song
 */
export const toggleFavorite = async (songId: string, isFavorited: boolean): Promise<ApiResponse<SongStaticsDto>> => {
    try {
        if (isFavorited) {
            // Remove favorite
            const { data } = await axiosInstance.delete(`/SongStatics/songs/${songId}/favorite`);
            return data;
        } else {
            // Add favorite
            const { data } = await axiosInstance.post(`/SongStatics/songs/${songId}/favorite`);
            return data;
        }
    } catch (error) {
        console.error("Error toggling favorite:", error);
        throw error;
    }
};

/**
 * Get user's interaction status for a song (liked, disliked, favorited)
 */
export const getUserInteractionStatus = async (songId: string): Promise<UserInteractionStatus> => {
    try {
        const [likeResponse, dislikeResponse, favoriteResponse] = await Promise.all([
            axiosInstance.get(`/SongStatics/songs/${songId}/like/status`),
            axiosInstance.get(`/SongStatics/songs/${songId}/dislike/status`),
            axiosInstance.get(`/SongStatics/songs/${songId}/favorite/status`)
        ]);

        return {
            hasLiked: likeResponse.data.hasLiked || false,
            hasDisliked: dislikeResponse.data.hasDisliked || false,
            hasFavorited: favoriteResponse.data.hasFavorited || false
        };
    } catch (error) {
        console.error("Error fetching user interaction status:", error);
        throw error;
    }
};
