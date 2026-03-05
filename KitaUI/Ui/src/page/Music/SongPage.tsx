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
            <div className="min-h-screen bg-white text-black flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
                </div>
                <div className="text-center relative z-10">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-black font-black uppercase tracking-[0.2em] text-xs">Accessing Data...</p>
                </div>
            </div>
        );
    }

    const isCurrentSong = currentSong?.id === song.id;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-white text-black font-sans selection:bg-black selection:text-white relative">
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}>
            </div>

            {/* Hero Section */}
            <div className="relative w-full border-b-4 border-black bg-gray-50 z-10 p-8 pt-20 flex flex-col md:flex-row items-end gap-8 mb-8 overflow-hidden">
                <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-20">AUDIO_RECORD</div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-black opacity-5 rotate-45 pointer-events-none"></div>

                {/* Back Button */}
                <div className="absolute top-6 left-8 z-20">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-black hover:bg-black hover:text-white transition-colors bg-white border-2 border-black px-4 py-2 uppercase tracking-widest text-xs font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                    >
                        <ArrowLeft size={16} strokeWidth={3} />
                        <span>RETURN</span>
                    </button>
                </div>

                {/* Content */}
                {/* Song Cover */}
                <div className="relative shrink-0 z-10">
                    <div className="w-[180px] h-[180px] sm:w-[250px] sm:h-[250px] rounded-none overflow-hidden bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                        {song.coverUrl ? (
                            <img
                                src={song.coverUrl}
                                alt={song.title}
                                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center border-4 border-transparent">
                                <Music size={80} className="text-black opacity-20" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0 z-10 w-full mb-2">
                    <p className="text-black text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <span className="bg-black text-white px-3 py-1 border-2 border-black">TRACK_REF</span>
                        <span>[ {song.id.substring(0, 8)} ]</span>
                    </p>

                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-black mb-6 uppercase tracking-tighter leading-none line-clamp-2">
                        {song.title}
                    </h1>

                    <div className="flex items-center gap-3 text-black text-[10px] font-black uppercase tracking-widest flex-wrap mt-2">
                        <span className="bg-gray-200 px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            ARTIST: {song.artist || song.uploader || 'UNKNOWN'}
                        </span>
                        {song.album && (
                            <>
                                <span className="w-1.5 h-1.5 bg-black rounded-none mx-1"></span>
                                <span className="bg-white px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] truncate max-w-[200px]">
                                    ALBUM: {song.album}
                                </span>
                            </>
                        )}
                        {song.duration && (
                            <>
                                <span className="w-1.5 h-1.5 bg-black rounded-none mx-1"></span>
                                <span className="bg-white px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    RUNTIME: {formatDuration(song.duration)}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="min-h-[500px] relative z-10">
                <div className="p-4 sm:p-8 pb-32 max-w-[1400px] mx-auto">
                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 mt-4 bg-gray-50 p-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative w-full">
                        <div className="absolute top-0 right-0 bg-black text-white text-[10px] uppercase font-black px-2 py-0.5 tracking-widest">CONTROLS</div>

                        <div className="flex w-full sm:w-auto justify-between items-center sm:gap-6">
                            {/* Play Button */}
                            <button
                                className="w-16 h-16 bg-black text-white border-2 border-transparent hover:border-black flex items-center justify-center transition-all hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group"
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
                                    <Pause size={32} fill="currentColor" />
                                ) : (
                                    <Play size={32} fill="currentColor" className="ml-1" />
                                )}
                            </button>
                        </div>

                        {/* Like/Dislike/Favorite Buttons */}
                        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                            <button
                                onClick={handleLike}
                                className={`flex items-center gap-2 px-4 py-3 border-2 border-black transition-all ${hasLiked
                                    ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] translate-x-1 translate-y-1'
                                    : 'bg-white text-black hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(150,150,150,1)]'
                                    }`}
                            >
                                <ThumbsUp size={18} fill={hasLiked ? 'currentColor' : 'none'} strokeWidth={hasLiked ? 2 : 3} />
                                <span className="font-black text-xs">{statistics?.likeCount || 0}</span>
                            </button>

                            <button
                                onClick={handleDislike}
                                className={`flex items-center gap-2 px-4 py-3 border-2 border-black transition-all ${hasDisliked
                                    ? 'bg-red-600 text-white shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] translate-x-1 translate-y-1 border-red-600'
                                    : 'bg-white text-black hover:bg-red-50 hover:text-red-600 hover:border-red-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]'
                                    }`}
                            >
                                <ThumbsDown size={18} fill={hasDisliked ? 'currentColor' : 'none'} strokeWidth={hasDisliked ? 2 : 3} />
                                <span className="font-black text-xs">{statistics?.dislikeCount || 0}</span>
                            </button>

                            <button
                                onClick={handleFavorite}
                                className={`flex items-center gap-2 px-4 py-3 border-2 border-black transition-all ${hasFavorited
                                    ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] translate-x-1 translate-y-1'
                                    : 'bg-white text-black hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(150,150,150,1)]'
                                    }`}
                            >
                                <Heart size={18} fill={hasFavorited ? 'currentColor' : 'none'} strokeWidth={hasFavorited ? 2 : 3} />
                                <span className="font-black text-xs">{statistics?.favoriteCount || 0}</span>
                            </button>
                        </div>

                        <div className="ml-auto text-black font-black uppercase text-[10px] tracking-widest mr-4 hidden sm:block">
                            INITIALIZE SEQUENCE //
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 flex-wrap">
                        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] relative overflow-hidden group hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                            <div className="absolute -right-4 -bottom-4 bg-gray-100 w-16 h-16 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 relative z-10">BROADCASTS</p>
                            <p className="text-3xl font-black text-black relative z-10">{statistics?.playCount || 0}</p>
                        </div>
                        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] relative overflow-hidden group hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                            <div className="absolute -right-4 -bottom-4 bg-gray-100 w-16 h-16 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 relative z-10">APPROVALS</p>
                            <p className="text-3xl font-black text-black relative z-10">{statistics?.likeCount || 0}</p>
                        </div>
                        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] relative overflow-hidden group hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                            <div className="absolute -right-4 -bottom-4 bg-gray-100 w-16 h-16 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 relative z-10">BOOKMARKS</p>
                            <p className="text-3xl font-black text-black relative z-10">{statistics?.favoriteCount || 0}</p>
                        </div>
                        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] relative overflow-hidden group hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                            <div className="absolute -right-4 -bottom-4 bg-gray-100 w-16 h-16 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 relative z-10">COMMUNICATIONS</p>
                            <p className="text-3xl font-black text-black relative z-10">{comments.length}</p>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="max-w-4xl bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
                        <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-10">LOG_ENTRIES</div>

                        <div className="p-6 border-b-4 border-black bg-gray-50">
                            <div className="flex items-center gap-3">
                                <MessageCircle size={24} className="text-black" strokeWidth={3} />
                                <h2 className="text-2xl font-black uppercase tracking-tight text-black">COMMUNICATIONS</h2>
                            </div>
                        </div>

                        <div className="p-6 bg-white">
                            {/* Comment Input */}
                            <div className="bg-gray-50 border-2 border-black p-4 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] focus-within:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                                <textarea
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="INPUT DATA STREAM..."
                                    className="w-full bg-transparent text-black placeholder-gray-400 font-bold resize-none focus:outline-none mb-4 uppercase text-sm"
                                    rows={3}
                                />
                                <div className="flex justify-end border-t-2 border-dashed border-gray-300 pt-4">
                                    <button
                                        onClick={handleCreateComment}
                                        disabled={!commentText.trim() || isSubmittingComment}
                                        className="flex items-center gap-2 px-6 py-2 bg-black hover:bg-white text-white hover:text-black border-2 border-black font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                        <Send size={16} strokeWidth={3} />
                                        {isSubmittingComment ? 'TRANSMITTING...' : 'TRANSMIT'}
                                    </button>
                                </div>
                            </div>

                            {/* Comments List */}
                            <div className="space-y-0">
                                {comments.length === 0 ? (
                                    <div className="text-center py-16 border-2 border-dashed border-gray-300 bg-gray-50">
                                        <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" strokeWidth={2} />
                                        <p className="text-gray-500 font-black uppercase tracking-widest text-xs">NO COMMUNICATIONS DETECTED IN LOG.</p>
                                    </div>
                                ) : (
                                    comments.map((comment, i) => (
                                        <div
                                            key={comment.id}
                                            className={`p-4 hover:bg-gray-50 transition-colors border-2 border-transparent hover:border-black group ${i !== comments.length - 1 ? 'border-b-gray-200' : ''}`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                                    {/* User Avatar */}
                                                    <div className="w-10 h-10 rounded-none border-2 border-black overflow-hidden flex-shrink-0 bg-gray-200">
                                                        {comment.userAvatar ? (
                                                            <img
                                                                src={comment.userAvatar}
                                                                alt={comment.userName || 'User'}
                                                                className="w-full h-full object-cover grayscale"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-300 text-black font-black text-sm">
                                                                {(comment.userName || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Comment Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span
                                                                className="font-black text-black hover:bg-black hover:text-white px-1 -ml-1 cursor-pointer transition-colors uppercase text-xs"
                                                                onClick={() => navigate(`/user/${comment.userId}`)}
                                                            >
                                                                {comment.userName || 'UNKNOWN_USER'}
                                                            </span>
                                                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                                                [{formatDate(comment.createdAt)}]
                                                            </span>
                                                        </div>
                                                        <p className="text-black font-medium whitespace-pre-wrap break-words text-sm">{comment.content}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {currentUserId === comment.userId && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors p-2 border-2 border-transparent hover:border-red-600"
                                                            title="Purge record"
                                                        >
                                                            <Trash2 size={16} strokeWidth={3} />
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
        </div>
    );
}
