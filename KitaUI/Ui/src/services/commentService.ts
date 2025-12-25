import { axiosInstance } from "../utils/fetchAPI";
import type { ApiResponse, CommentDto } from "../types/api";

/**
 * Get all comments for a song
 */
export const getCommentsBySongId = async (songId: string): Promise<ApiResponse<CommentDto[]>> => {
    try {
        const { data } = await axiosInstance.get(`/Comment/songs/${songId}/comments`);
        return data;
    } catch (error) {
        console.error("Error fetching comments:", error);
        throw error;
    }
};

/**
 * Create a new comment for a song
 */
export const createComment = async (songId: string, content: string): Promise<ApiResponse<CommentDto>> => {
    try {
        const { data } = await axiosInstance.post('/Comment/comments', {
            songId,
            content
        });
        return data;
    } catch (error) {
        console.error("Error creating comment:", error);
        throw error;
    }
};

/**
 * Update an existing comment
 */
export const updateComment = async (commentId: string, content: string): Promise<ApiResponse<CommentDto>> => {
    try {
        const { data } = await axiosInstance.put(`/Comment/comments/${commentId}`, content, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return data;
    } catch (error) {
        console.error("Error updating comment:", error);
        throw error;
    }
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string): Promise<ApiResponse<string>> => {
    try {
        const { data } = await axiosInstance.delete(`/Comment/comments/${commentId}`);
        return data;
    } catch (error) {
        console.error("Error deleting comment:", error);
        throw error;
    }
};
