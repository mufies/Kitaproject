import React, { useState, useEffect } from 'react';
import {
    likeSong,
    unlikeSong,
    dislikeSong,
    removeDislike,
    addToFavorites,
    removeFromFavorites,
    shareSong,
    getSongStats,
    getUserSongInteractions
} from '../utils/songStaticsAPI';
import type { SongStaticsDto } from '../types/api';

interface SongInteractionBarProps {
    songId: string;
    showStats?: boolean;
    size?: 'sm' | 'md' | 'lg';
    onStatsChange?: (stats: SongStaticsDto) => void;
}

export const SongInteractionBar: React.FC<SongInteractionBarProps> = ({
    songId,
    showStats = true,
    size = 'md',
    onStatsChange
}) => {
    const [stats, setStats] = useState<SongStaticsDto | null>(null);
    const [hasLiked, setHasLiked] = useState(false);
    const [hasDisliked, setHasDisliked] = useState(false);
    const [hasFavorited, setHasFavorited] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    const buttonSize = size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-3' : 'p-2';

    useEffect(() => {
        loadData();
    }, [songId]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [statsResponse, interactions] = await Promise.all([
                getSongStats(songId),
                getUserSongInteractions(songId)
            ]);

            if (statsResponse.success) {
                setStats(statsResponse.data);
            }
            setHasLiked(interactions.hasLiked);
            setHasDisliked(interactions.hasDisliked);
            setHasFavorited(interactions.hasFavorited);
        } catch (error) {
            console.error('Error loading song data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async () => {
        if (actionLoading) return;
        setActionLoading('like');
        try {
            let response;
            if (hasLiked) {
                response = await unlikeSong(songId);
                setHasLiked(false);
            } else {
                response = await likeSong(songId);
                setHasLiked(true);
                setHasDisliked(false); // Remove dislike when liking
            }
            if (response.success) {
                setStats(response.data);
                onStatsChange?.(response.data);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDislike = async () => {
        if (actionLoading) return;
        setActionLoading('dislike');
        try {
            let response;
            if (hasDisliked) {
                response = await removeDislike(songId);
                setHasDisliked(false);
            } else {
                response = await dislikeSong(songId);
                setHasDisliked(true);
                setHasLiked(false); // Remove like when disliking
            }
            if (response.success) {
                setStats(response.data);
                onStatsChange?.(response.data);
            }
        } catch (error) {
            console.error('Error toggling dislike:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleFavorite = async () => {
        if (actionLoading) return;
        setActionLoading('favorite');
        try {
            let response;
            if (hasFavorited) {
                response = await removeFromFavorites(songId);
                setHasFavorited(false);
            } else {
                response = await addToFavorites(songId);
                setHasFavorited(true);
            }
            if (response.success) {
                setStats(response.data);
                onStatsChange?.(response.data);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleShare = async () => {
        if (actionLoading) return;
        setActionLoading('share');
        try {
            const response = await shareSong(songId);
            if (response.success) {
                setStats(response.data);
                onStatsChange?.(response.data);
                // Copy link to clipboard or show share dialog
                if (navigator.share) {
                    await navigator.share({
                        title: stats?.songTitle || 'Check out this song!',
                        url: window.location.href
                    });
                } else {
                    await navigator.clipboard.writeText(window.location.href);
                    // Could show toast notification here
                }
            }
        } catch (error) {
            console.error('Error sharing:', error);
        } finally {
            setActionLoading(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2">
                <div className={`${buttonSize} bg-[#3e3e3e] rounded-full animate-pulse`}></div>
                <div className={`${buttonSize} bg-[#3e3e3e] rounded-full animate-pulse`}></div>
                <div className={`${buttonSize} bg-[#3e3e3e] rounded-full animate-pulse`}></div>
                <div className={`${buttonSize} bg-[#3e3e3e] rounded-full animate-pulse`}></div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            {/* Like Button */}
            <button
                onClick={handleLike}
                disabled={!!actionLoading}
                className={`${buttonSize} rounded-full transition-all flex items-center gap-1 ${hasLiked
                        ? 'text-[#1db954] bg-[#1db954]/10'
                        : 'text-[#b3b3b3] hover:text-white hover:bg-[#3e3e3e]'
                    } disabled:opacity-50`}
                title="Like"
            >
                <svg className={iconSize} viewBox="0 0 24 24" fill={hasLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
                {showStats && stats && <span className="text-xs">{stats.likeCount}</span>}
            </button>

            {/* Dislike Button */}
            <button
                onClick={handleDislike}
                disabled={!!actionLoading}
                className={`${buttonSize} rounded-full transition-all flex items-center gap-1 ${hasDisliked
                        ? 'text-red-500 bg-red-500/10'
                        : 'text-[#b3b3b3] hover:text-white hover:bg-[#3e3e3e]'
                    } disabled:opacity-50`}
                title="Dislike"
            >
                <svg className={iconSize} viewBox="0 0 24 24" fill={hasDisliked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                </svg>
                {showStats && stats && <span className="text-xs">{stats.dislikeCount}</span>}
            </button>

            {/* Favorite Button */}
            <button
                onClick={handleFavorite}
                disabled={!!actionLoading}
                className={`${buttonSize} rounded-full transition-all flex items-center gap-1 ${hasFavorited
                        ? 'text-pink-500 bg-pink-500/10'
                        : 'text-[#b3b3b3] hover:text-white hover:bg-[#3e3e3e]'
                    } disabled:opacity-50`}
                title="Favorite"
            >
                <svg className={iconSize} viewBox="0 0 24 24" fill={hasFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {showStats && stats && <span className="text-xs">{stats.favoriteCount}</span>}
            </button>

            {/* Share Button */}
            <button
                onClick={handleShare}
                disabled={!!actionLoading}
                className={`${buttonSize} rounded-full transition-all flex items-center gap-1 text-[#b3b3b3] hover:text-white hover:bg-[#3e3e3e] disabled:opacity-50`}
                title="Share"
            >
                <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                {showStats && stats && <span className="text-xs">{stats.shareCount}</span>}
            </button>
        </div>
    );
};

export default SongInteractionBar;
