import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, ThumbsUp, ThumbsDown, Heart, MessageCircle, Send, Trash2, Music } from 'lucide-react';
import type { SongDto, SongStaticsDto, CommentDto } from '../../types/api';
import { getSongById } from '../../utils/musicAPI';
import { getSongStatics, toggleLike, toggleDislike, toggleFavorite, getUserInteractionStatus } from '../../services/songStaticsService';
import { getCommentsBySongId, createComment, deleteComment } from '../../services/commentService';
import { usePlay } from '../../context/PlayContext';
import { useAuth } from '../../context/AuthContext';

export default function SongPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { playSong, currentSong, isPlaying, togglePlayPause } = usePlay();
    const { token } = useAuth();

    // Get current user ID from token
    const getCurrentUserId = (): string | null => {
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.userId || payload.sub || null;
        } catch {
            return null;
        }
    };

    const currentUserId = getCurrentUserId();

    // Song data
    const [song, setSong] = useState<SongDto | null>(null);
    const [statistics, setStatistics] = useState<SongStaticsDto | null>(null);
    const [comments, setComments] = useState<CommentDto[]>([]);

    // User interaction states
    const [hasLiked, setHasLiked] = useState(false);
    const [hasDisliked, setHasDisliked] = useState(false);
    const [hasFavorited, setHasFavorited] = useState(false);

    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    useEffect(() => {
        if (id) {
            loadSongData();
        }
    }, [id]);

    const loadSongData = async () => {
        if (!id) return;

        try {
            setIsLoading(true);
            const [songResponse, statsResponse, commentsResponse, interactionStatus] = await Promise.all([
                getSongById(id),
                getSongStatics(id),
                getCommentsBySongId(id),
                getUserInteractionStatus(id)
            ]);

            if (songResponse.success) {
                setSong(songResponse.data);
            } else {
                navigate('/music');
            }

            if (statsResponse.success) {
                setStatistics(statsResponse.data);
            }

            if (commentsResponse.success) {
                setComments(commentsResponse.data);
            }

            setHasLiked(interactionStatus.hasLiked);
            setHasDisliked(interactionStatus.hasDisliked);
            setHasFavorited(interactionStatus.hasFavorited);
        } catch (error) {
            console.error('Error loading song data:', error);
            navigate('/music');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async () => {
        if (!id) return;
        try {
            await toggleLike(id, hasLiked);
            setHasLiked(!hasLiked);
            if (!hasLiked && hasDisliked) {
                setHasDisliked(false);
            }
            // Refresh statistics
            const statsResponse = await getSongStatics(id);
            if (statsResponse.success) {
                setStatistics(statsResponse.data);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleDislike = async () => {
        if (!id) return;
        try {
            await toggleDislike(id, hasDisliked);
            setHasDisliked(!hasDisliked);
            if (!hasDisliked && hasLiked) {
                setHasLiked(false);
            }
            // Refresh statistics
            const statsResponse = await getSongStatics(id);
            if (statsResponse.success) {
                setStatistics(statsResponse.data);
            }
        } catch (error) {
            console.error('Error toggling dislike:', error);
        }
    };

    const handleFavorite = async () => {
        if (!id) return;
        try {
            await toggleFavorite(id, hasFavorited);
            setHasFavorited(!hasFavorited);
            // Refresh statistics
            const statsResponse = await getSongStatics(id);
            if (statsResponse.success) {
                setStatistics(statsResponse.data);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const handleCreateComment = async () => {
        if (!id || !commentText.trim()) return;

        try {
            setIsSubmittingComment(true);
            const response = await createComment(id, commentText.trim());
            if (response.success) {
                setComments([response.data, ...comments]);
                setCommentText('');
            }
        } catch (error) {
            console.error('Error creating comment:', error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!window.confirm('Delete this comment?')) return;

        try {
            await deleteComment(commentId);
            setComments(comments.filter(c => c.id !== commentId));
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const formatDuration = (seconds?: number): string => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (isLoading || !song) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#1a141a] border-t-[#ff7a3c] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/50 text-sm">Loading song...</p>
                </div>
            </div>
        );
    }

    const isCurrentSong = currentSong?.id === song.id;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-[#0f0f0f] text-white">
            {/* Hero Section */}
            <div className="relative w-full h-[50vh] min-h-[400px] max-h-[600px]">
                {/* Background */}
                <div className="absolute inset-0 z-0">
                    {song.coverUrl ? (
                        <>
                            <div
                                className="absolute inset-0 bg-cover bg-center blur-3xl opacity-40"
                                style={{ backgroundImage: `url(${song.coverUrl})` }}
                            ></div>
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#121212]/80 to-[#121212]"></div>
                        </>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-b from-[#ff7a3c]/50 to-[#121212]"></div>
                    )}
                </div>

                {/* Back Button */}
                <div className="absolute top-8 left-8 z-20">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 hover:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-bold text-sm">Back</span>
                    </button>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 w-full p-8 z-10 flex items-end gap-8">
                    {/* Song Cover */}
                    <div className="relative shrink-0">
                        <div className="w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] rounded-lg overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
                            {song.coverUrl ? (
                                <img
                                    src={song.coverUrl}
                                    alt={song.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#ff7a3c] to-[#ff4d6d] flex items-center justify-center">
                                    <Music size={80} className="text-white/50" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0 mb-4">
                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Song</p>
                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-4 drop-shadow-2xl tracking-tight leading-none line-clamp-2">
                            {song.title}
                        </h1>
                        <div className="flex items-center gap-3 text-white text-lg font-medium flex-wrap">
                            <span className="font-bold">{song.artist || song.uploader || 'Unknown Artist'}</span>
                            {song.album && (
                                <>
                                    <span className="w-1 h-1 bg-white/60 rounded-full"></span>
                                    <span className="text-white/80">{song.album}</span>
                                </>
                            )}
                            {song.duration && (
                                <>
                                    <span className="w-1 h-1 bg-white/60 rounded-full"></span>
                                    <span className="text-white/70">{formatDuration(song.duration)}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-gradient-to-b from-[#121212] to-black min-h-[500px]">
                <div className="p-8 pb-32 max-w-[1400px] mx-auto">
                    {/* Action Bar */}
                    <div className="flex items-center gap-6 mb-8">
                        {/* Play Button */}
                        <button
                            className="w-14 h-14 bg-[#ff7a3c] rounded-full flex items-center justify-center hover:scale-105 hover:bg-[#ff8c52] transition-all duration-200 shadow-xl text-black"
                            onClick={() => {
                                if (isCurrentSong && isPlaying) {
                                    togglePlayPause();
                                } else if (isCurrentSong && !isPlaying) {
                                    togglePlayPause();
                                } else {
                                    playSong(song, [song]);
                                }
                            }}
                        >
                            {isCurrentSong && isPlaying ? (
                                <Pause size={28} fill="currentColor" />
                            ) : (
                                <Play size={28} fill="currentColor" className="ml-1" />
                            )}
                        </button>

                        {/* Like/Dislike/Favorite Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleLike}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${hasLiked
                                    ? 'bg-[#ff7a3c] text-white'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                                    }`}
                            >
                                <ThumbsUp size={20} fill={hasLiked ? 'currentColor' : 'none'} />
                                <span className="font-medium">{statistics?.likeCount || 0}</span>
                            </button>

                            <button
                                onClick={handleDislike}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${hasDisliked
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                                    }`}
                            >
                                <ThumbsDown size={20} fill={hasDisliked ? 'currentColor' : 'none'} />
                                <span className="font-medium">{statistics?.dislikeCount || 0}</span>
                            </button>

                            <button
                                onClick={handleFavorite}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${hasFavorited
                                    ? 'bg-pink-600 text-white'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                                    }`}
                            >
                                <Heart size={20} fill={hasFavorited ? 'currentColor' : 'none'} />
                                <span className="font-medium">{statistics?.favoriteCount || 0}</span>
                            </button>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Plays</p>
                            <p className="text-2xl font-bold text-white">{statistics?.playCount || 0}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Likes</p>
                            <p className="text-2xl font-bold text-white">{statistics?.likeCount || 0}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Favorites</p>
                            <p className="text-2xl font-bold text-white">{statistics?.favoriteCount || 0}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Comments</p>
                            <p className="text-2xl font-bold text-white">{comments.length}</p>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="max-w-4xl">
                        <div className="flex items-center gap-3 mb-6">
                            <MessageCircle size={24} className="text-[#ff7a3c]" />
                            <h2 className="text-2xl font-bold">Comments</h2>
                        </div>

                        {/* Comment Input */}
                        <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full bg-transparent text-white placeholder-white/40 resize-none focus:outline-none mb-3"
                                rows={3}
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handleCreateComment}
                                    disabled={!commentText.trim() || isSubmittingComment}
                                    className="flex items-center gap-2 px-5 py-2 bg-[#ff7a3c] hover:bg-[#ff8c52] text-white rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={16} />
                                    {isSubmittingComment ? 'Posting...' : 'Comment'}
                                </button>
                            </div>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-4">
                            {comments.length === 0 ? (
                                <div className="text-center py-12 text-white/40">
                                    <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
                                    <p>No comments yet. Be the first to comment!</p>
                                </div>
                            ) : (
                                comments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/[0.07] transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                {/* User Avatar */}
                                                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
                                                    {comment.userAvatar ? (
                                                        <img
                                                            src={comment.userAvatar}
                                                            alt={comment.userName || 'User'}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff7a3c] to-[#ff4d6d] text-white font-bold text-sm">
                                                            {(comment.userName || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Comment Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span
                                                            className="font-bold text-white hover:text-[#ff7a3c] cursor-pointer transition-colors hover:underline"
                                                            onClick={() => navigate(`/user/${comment.userId}`)}
                                                        >
                                                            {comment.userName || 'User'}
                                                        </span>
                                                        <span className="text-white/40 text-sm">{formatDate(comment.createdAt)}</span>
                                                    </div>
                                                    <p className="text-white/90 whitespace-pre-wrap break-words">{comment.content}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {currentUserId === comment.userId && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="text-white/40 hover:text-red-500 transition-colors p-2"
                                                        title="Delete comment"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
