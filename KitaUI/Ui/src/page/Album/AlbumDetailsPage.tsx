import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Plus, Trash2, Music, X, Search, Clock, Heart, Play, Pause } from 'lucide-react';
import { albumService, type AlbumDetail } from '../../services/albumService';
import { artistService } from '../../services/artistService';
import { getMySongs } from '../../utils/musicAPI';
import type { SongDto } from '../../types/api';
import { usePlay } from '../../context/PlayContext';

const AlbumDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { playSong, isPlaying, currentSong, togglePlayPause, playlist } = usePlay();
    const [album, setAlbum] = useState<AlbumDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isAddSongsModalOpen, setIsAddSongsModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isLikeLoading, setIsLikeLoading] = useState(false);

    const checkManagerStatus = async (artistId: string) => {
        try {
            const myArtists = await artistService.getMyArtists();
            setIsManager(myArtists.some(a => a.id === artistId));
        } catch (error) {
            console.error('Failed to check manager status:', error);
            setIsManager(false);
        }
    };

    const fetchAlbumDetails = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const data = await albumService.getAlbumById(id);
            setAlbum(data);
            if (data.artistId) {
                await checkManagerStatus(data.artistId);
            }
            // Check if user liked this album
            try {
                const liked = await albumService.isLikingAlbum(id);
                setIsLiked(liked);
            } catch (e) {
                console.error('Failed to check like status:', e);
            }
        } catch (error) {
            console.error('Failed to fetch album details:', error);
            navigate(-1);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAlbumDetails();
    }, [id]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !id) return;
        setIsUploading(true);
        try {
            const file = e.target.files[0];
            await albumService.uploadAlbumImage(id, file);
            await fetchAlbumDetails();
        } catch (error) {
            console.error('Failed to upload image:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveSong = async (songId: string) => {
        if (!id) return;
        if (!window.confirm('Xóa bài hát này khỏi album?')) return;
        try {
            await albumService.removeSongsFromAlbum(id, [songId]);
            await fetchAlbumDetails();
        } catch (error) {
            console.error('Failed to remove song:', error);
        }
    };

    const handleDeleteAlbum = async () => {
        if (!id) return;
        if (!window.confirm(`Xóa album "${album?.name}"? Các bài hát sẽ không bị xóa.`)) return;
        try {
            await albumService.deleteAlbum(id);
            navigate(-1);
        } catch (error) {
            console.error('Failed to delete album:', error);
            alert('Xóa album thất bại.');
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Convert album songs to SongDto format for playback
    const getPlayableSongs = (): SongDto[] => {
        if (!album) return [];
        return album.songs.map(song => ({
            id: song.id,
            title: song.title,
            artist: song.artist || album.artistName || '',
            streamUrl: song.streamUrl,
            coverUrl: song.coverUrl || album.imageUrl,
            duration: song.duration,
            artistId: album.artistId,
            albumId: album.id,
        }));
    };

    // Check if this album is currently playing
    const isAlbumPlaying = (): boolean => {
        if (!album || !currentSong || playlist.length === 0) return false;
        const albumSongIds = album.songs.map(s => s.id);
        return albumSongIds.includes(currentSong.id) && isPlaying;
    };

    // Handle play button click on album
    const handlePlayAlbum = () => {
        if (!album || album.songs.length === 0) return;
        const playableSongs = getPlayableSongs();
        if (isAlbumPlaying()) {
            togglePlayPause();
        } else {
            playSong(playableSongs[0], playableSongs);
        }
    };

    // Handle play button click on a specific song
    const handlePlaySong = (songIndex: number) => {
        if (!album) return;
        const playableSongs = getPlayableSongs();
        const song = playableSongs[songIndex];
        if (song) {
            if (currentSong?.id === song.id) {
                togglePlayPause();
            } else {
                playSong(song, playableSongs);
            }
        }
    };

    if (isLoading) {
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

    if (!album) return null;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-white text-black font-sans selection:bg-black selection:text-white relative">
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}>
            </div>

            {/* Hero Section */}
            <div className="relative w-full border-b-4 border-black bg-gray-50 z-10 p-8 pt-20 flex flex-col md:flex-row items-end gap-8 mb-8 overflow-hidden">
                <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-20">ALBUM_RECORD</div>
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
                {/* Album Art */}
                <div className="relative group shrink-0 z-10 w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] cursor-pointer">
                    <div className="w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] rounded-none overflow-hidden bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                        <img
                            src={album.imageUrl || "/assets/images/default-album.svg"}
                            alt={album.name}
                            className={`w-full h-full object-cover transition-all duration-500 ${!isManager ? 'grayscale hover:grayscale-0' : 'group-hover:grayscale'}`}
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "/assets/images/default-album.svg";
                            }}
                        />
                    </div>
                    {isManager && (
                        <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 opacity-0 group-hover:opacity-100 rounded-none border-4 border-black border-dashed m-1 cursor-pointer transition-all duration-300">
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                            />
                            <Upload size={32} className="text-white mb-2" strokeWidth={2} />
                            <span className="text-white font-black text-xs uppercase tracking-widest">UPDATE_COVER</span>
                        </label>
                    )}
                </div>

                {/* Album Info */}
                <div className="flex-1 min-w-0 z-10 w-full mb-2">
                    <p className="text-black text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <span className="bg-black text-white px-3 py-1 border-2 border-black">ALBUM_REF</span>
                        <span>[ {album.id.substring(0, 8)} ]</span>
                    </p>

                    <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-black mb-6 uppercase tracking-tighter leading-none line-clamp-2">
                        {album.name}
                    </h1>

                    <div className="flex flex-col gap-4">
                        <p className="text-gray-700 text-sm sm:text-base font-bold uppercase tracking-wide line-clamp-2 max-w-3xl border-l-4 border-black pl-4">
                            {album.description || "NO DATA"}
                        </p>

                        <div className="flex items-center gap-3 text-black text-[10px] font-black uppercase tracking-widest flex-wrap mt-2">
                            <span className="bg-gray-200 px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:bg-black hover:text-white" onClick={() => navigate(`/artist/${album.artistId}`)}>
                                ARTIST: {album.artistName}
                            </span>
                            <span className="w-1.5 h-1.5 bg-black rounded-none mx-1"></span>
                            <span className="bg-white px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                YEAR: 2025
                            </span>
                            <span className="w-1.5 h-1.5 bg-black rounded-none mx-1"></span>
                            <span className="bg-white px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                ITEMS: {album.songs.length}
                            </span>
                            <span className="w-1.5 h-1.5 bg-black rounded-none mx-1"></span>
                            <span className="bg-white px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                RUNTIME: {Math.floor(album.songs.reduce((acc, s) => acc + s.duration, 0) / 60)}M {album.songs.reduce((acc, s) => acc + s.duration, 0) % 60}S
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Background */}
            <div className="min-h-[500px] relative z-10">
                <div className="p-4 sm:p-8 pb-32 max-w-[1400px] mx-auto">

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 mt-4 bg-gray-50 p-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative w-full">
                        <div className="absolute top-0 right-0 bg-black text-white text-[10px] uppercase font-black px-2 py-0.5 tracking-widest">CONTROLS</div>

                        <div className="flex w-full sm:w-auto justify-between items-center sm:gap-6">
                            <button
                                onClick={handlePlayAlbum}
                                disabled={!album || album.songs.length === 0}
                                className="w-16 h-16 bg-black text-white border-2 border-transparent hover:border-black flex items-center justify-center transition-all hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {isAlbumPlaying() ? (
                                    <Pause size={32} fill="currentColor" />
                                ) : (
                                    <Play size={32} fill="currentColor" className="ml-1" />
                                )}
                            </button>
                        </div>

                        {/* Like Button */}
                        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                            <button
                                onClick={async () => {
                                    if (!id || isLikeLoading) return;
                                    setIsLikeLoading(true);
                                    try {
                                        if (isLiked) {
                                            await albumService.unlikeAlbum(id);
                                            setIsLiked(false);
                                        } else {
                                            await albumService.likeAlbum(id);
                                            setIsLiked(true);
                                        }
                                    } catch (error) {
                                        console.error('Failed to toggle like:', error);
                                    } finally {
                                        setIsLikeLoading(false);
                                    }
                                }}
                                disabled={isLikeLoading}
                                className={`flex items-center gap-2 px-4 py-3 border-2 border-black transition-all ${isLiked
                                    ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] translate-x-1 translate-y-1'
                                    : 'bg-white text-black hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(150,150,150,1)]'
                                    }`}
                                title={isLiked ? 'Remove from Your Library' : 'Save to Your Library'}
                            >
                                <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={isLiked ? 2 : 3} />
                                <span className="font-black text-xs uppercase tracking-wider">{isLiked ? 'BOOKMARKED' : 'BOOKMARK'}</span>
                            </button>

                            {isManager && (
                                <>
                                    <button
                                        onClick={() => setIsAddSongsModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-3 bg-white text-black border-2 border-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(150,150,150,1)]"
                                        title="Add existing song"
                                    >
                                        <Plus size={20} strokeWidth={3} />
                                        <span className="font-black text-xs uppercase tracking-wider hidden sm:inline">ADD_SONG</span>
                                    </button>
                                    <button
                                        onClick={() => setIsUploadModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-3 bg-white text-black border-2 border-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(150,150,150,1)]"
                                        title="Upload and add song"
                                    >
                                        <Upload size={20} strokeWidth={3} />
                                        <span className="font-black text-xs uppercase tracking-wider hidden sm:inline">UPLOAD_SONG</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {isManager && (
                            <button
                                onClick={handleDeleteAlbum}
                                className="ml-auto flex items-center gap-2 bg-red-600 text-white border-2 border-transparent hover:border-red-600 hover:bg-red-50 hover:text-red-600 font-black text-xs tracking-widest uppercase py-3 px-4 transition-all shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]"
                            >
                                <Trash2 size={16} strokeWidth={3} />
                                <span className="hidden sm:inline">DELETE ALBUM</span>
                            </button>
                        )}
                        <div className="ml-auto text-black font-black uppercase text-[10px] tracking-widest mr-4 hidden xl:block">
                            INITIALIZE SEQUENCE //
                        </div>
                    </div>

                    {/* Songs List */}
                    <div className="w-full bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
                        <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-10">TRACK_LOG</div>

                        {album.songs.length === 0 ? (
                            <div className="p-16 text-center bg-gray-50 border-b-4 border-black relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-200 rotate-45 translate-x-16 -translate-y-16 opacity-50"></div>
                                <div className="w-20 h-20 bg-white border-4 border-black flex items-center justify-center mx-auto mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                    <Music size={40} className="text-black" strokeWidth={2} />
                                </div>
                                <h3 className="text-2xl font-black text-black mb-2 uppercase tracking-tight">ARCHIVE EMPTY</h3>
                                <p className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-8 max-w-md mx-auto">This album has no tracks logged. Input required to initialize playback.</p>
                                {isManager && (
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                                        <button
                                            onClick={() => setIsAddSongsModalOpen(true)}
                                            className="bg-black text-white font-black uppercase tracking-widest text-sm py-3 px-8 border-2 border-black hover:bg-white hover:text-black transition-colors shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                        >
                                            LOCATE DATA
                                        </button>
                                        <button
                                            onClick={() => setIsUploadModalOpen(true)}
                                            className="bg-white text-black font-black uppercase tracking-widest text-sm py-3 px-8 border-2 border-black hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(150,150,150,1)]"
                                        >
                                            UPLOAD DATA
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full">
                                {/* Header Row */}
                                <div className="grid grid-cols-[16px_1fr_120px] sm:grid-cols-[16px_1fr_120px_60px] md:grid-cols-[16px_4fr_3fr_120px_60px] gap-4 px-6 py-4 border-b-4 border-black text-black text-xs font-black uppercase tracking-widest bg-gray-100 z-10 sticky top-0">
                                    <div className="text-center">#</div>
                                    <div>TITLE</div>
                                    <div className="hidden md:block text-left">TIMESTAMP</div>
                                    <div className="text-right hidden sm:block"><Clock size={16} className="ml-auto" strokeWidth={3} /></div>
                                    <div></div>
                                </div>

                                {/* Song Rows */}
                                <div className="divide-y-2 divide-gray-100">
                                    {album.songs.map((song, index) => (
                                        <div
                                            key={song.id}
                                            className="grid grid-cols-[16px_1fr_120px] sm:grid-cols-[16px_1fr_120px_60px] md:grid-cols-[16px_4fr_3fr_120px_60px] gap-4 px-6 py-4 hover:bg-gray-100 group transition-colors items-center cursor-pointer border-l-4 border-transparent hover:border-black"
                                            onClick={() => navigate(`/music/song/${song.id}`)}
                                        >
                                            <div className="relative text-center text-gray-500 font-bold w-4 flex justify-center uppercase">
                                                {currentSong?.id === song.id && isPlaying ? (
                                                    <button onClick={(e) => { e.stopPropagation(); handlePlaySong(index); }} className="text-black">
                                                        <Pause size={16} fill="currentColor" />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <span className="group-hover:hidden">{currentSong?.id === song.id ? <Play size={16} fill="currentColor" className="text-black" /> : String(index + 1).padStart(2, '0')}</span>
                                                        <button onClick={(e) => { e.stopPropagation(); handlePlaySong(index); }} className="hidden group-hover:block text-black">
                                                            <Play size={16} fill="currentColor" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-black font-black text-sm uppercase truncate pr-2 group-hover:underline transition-all">{song.title}</span>
                                                    <span className="text-gray-500 text-[10px] font-bold uppercase truncate group-hover:text-black transition-colors hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/artist/${album.artistId}`); }}>
                                                        {album.artistName}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="hidden md:block text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                                [2025_DATA_ENTRY]
                                            </div>

                                            <div className="text-right text-black font-black text-xs hidden sm:block">
                                                {formatDuration(song.duration)}
                                            </div>

                                            <div className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isManager && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveSong(song.id); }}
                                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 border-2 border-transparent hover:border-red-600 transition-all font-black uppercase text-[10px] flex items-center justify-center gap-1"
                                                        title="Remove from album"
                                                    >
                                                        <Trash2 size={16} strokeWidth={3} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Songs Modal */}
            {
                isAddSongsModalOpen && (
                    <AddSongsToAlbumModal
                        albumId={id!}
                        artistId={album.artistId}
                        existingSongIds={album.songs.map(s => s.id)}
                        onClose={() => setIsAddSongsModalOpen(false)}
                        onSongsAdded={fetchAlbumDetails}
                    />
                )
            }

            {/* Upload Song Modal */}
            {
                isUploadModalOpen && (
                    <UploadSongToAlbumModal
                        albumId={id!}
                        onClose={() => setIsUploadModalOpen(false)}
                        onSuccess={fetchAlbumDetails}
                    />
                )
            }
        </div >
    );
};

// ============ Add Songs Modal ============
interface AddSongsModalProps {
    albumId: string;
    artistId: string;
    existingSongIds: string[];
    onClose: () => void;
    onSongsAdded: () => void;
}

const AddSongsToAlbumModal: React.FC<AddSongsModalProps> = ({ albumId, artistId, existingSongIds, onClose, onSongsAdded }) => {
    const [songs, setSongs] = useState<SongDto[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        const fetchSongs = async () => {
            try {
                const response = await getMySongs();
                // Filter to only songs from this artist and not already in album
                const available = (response.data || []).filter(
                    (s: SongDto) => s.artistId === artistId && !existingSongIds.includes(s.id)
                );
                setSongs(available);
            } catch (error) {
                console.error('Failed to fetch songs:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSongs();
    }, [existingSongIds, artistId]);

    const filteredSongs = useMemo(() => {
        if (!searchQuery.trim()) return songs;
        const q = searchQuery.toLowerCase();
        return songs.filter(s => s.title.toLowerCase().includes(q));
    }, [songs, searchQuery]);

    const toggleSelect = (songId: string) => {
        setSelectedIds(prev =>
            prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]
        );
    };

    const handleAddSongs = async () => {
        if (selectedIds.length === 0) return;
        setIsAdding(true);
        try {
            await albumService.addSongsToAlbum(albumId, selectedIds);
            onSongsAdded();
            onClose();
        } catch (error) {
            console.error('Failed to add songs:', error);
            alert('Thêm bài hát thất bại.');
        } finally {
            setIsAdding(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-none w-full max-w-2xl max-h-[80vh] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col animate-in fade-in zoom-in duration-200 relative" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-10">SEARCH_LOG</div>
                <div className="flex items-center justify-between p-6 border-b-4 border-black bg-gray-50">
                    <h2 className="text-2xl font-black text-black uppercase tracking-tight">ADD TRACK TO ALBUM</h2>
                    <button onClick={onClose} className="text-black hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black p-1">
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b-4 border-black bg-white">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black" size={20} strokeWidth={3} />
                        <input
                            type="text"
                            placeholder="SEARCH DATABASE..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-black rounded-none px-12 py-3 text-black placeholder-gray-400 font-bold uppercase tracking-wider focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow text-sm"
                        />
                    </div>
                </div>

                {/* Song List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white">
                    {isLoading ? (
                        <div className="text-center text-gray-400 font-black uppercase tracking-widest py-12 text-sm">LOADING DATA...</div>
                    ) : filteredSongs.length === 0 ? (
                        <div className="text-center text-gray-400 font-black uppercase tracking-widest py-12 text-sm">
                            {searchQuery ? 'NO MATCHES FOUND.' : 'NO TRACKS AVAILABLE.'}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredSongs.map(song => (
                                <div
                                    key={song.id}
                                    onClick={() => toggleSelect(song.id)}
                                    className={`flex items-center gap-4 p-3 border-2 cursor-pointer transition-all group ${selectedIds.includes(song.id)
                                        ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] translate-x-1 translate-y-1'
                                        : 'bg-white text-black border-transparent hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                        }`}
                                >
                                    <div className={`w-6 h-6 border-2 flex items-center justify-center shrink-0 ${selectedIds.includes(song.id)
                                        ? 'border-white bg-white'
                                        : 'border-black group-hover:bg-gray-200'
                                        }`}>
                                        {selectedIds.includes(song.id) && (
                                            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="w-12 h-12 bg-gray-200 border-2 border-black shrink-0 relative overflow-hidden">
                                        <img
                                            src={song.coverUrl || "/assets/images/default-album.svg"}
                                            alt={song.title}
                                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-black truncate uppercase text-sm ${selectedIds.includes(song.id) ? 'text-white' : 'text-black'}`}>{song.title}</div>
                                        <div className={`text-[10px] font-bold uppercase truncate tracking-widest ${selectedIds.includes(song.id) ? 'text-gray-300' : 'text-gray-500'}`}>{song.artist || 'Unknown'}</div>
                                    </div>
                                    <div className={`text-xs font-black ${selectedIds.includes(song.id) ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {formatDuration(song.duration || 0)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t-4 border-black bg-gray-50 flex items-center justify-between">
                    <span className="text-black font-black uppercase tracking-widest text-xs">
                        {selectedIds.length > 0 ? `SELECTED: ${selectedIds.length}` : 'AWAITING SELECTION'}
                    </span>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-xs border-2 border-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(150,150,150,1)]"
                        >
                            ABORT
                        </button>
                        <button
                            onClick={handleAddSongs}
                            disabled={selectedIds.length === 0 || isAdding}
                            className="px-6 py-3 bg-black text-white font-black uppercase tracking-widest text-xs border-2 border-black hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            {isAdding ? 'EXECUTING...' : `AUTHORIZE (${selectedIds.length})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============ Upload Song Modal (simplified, inline) ============
interface UploadModalProps {
    albumId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const UploadSongToAlbumModal: React.FC<UploadModalProps> = ({ albumId, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [songFile, setSongFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const handleSongFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type.startsWith('audio/')) {
                setSongFile(file);
                setError('');
                // Auto-fill title from filename
                if (!title) {
                    const name = file.name.replace(/\.[^/.]+$/, '');
                    setTitle(name);
                }
            } else {
                setError('Vui lòng chọn file âm thanh hợp lệ');
            }
        }
    };

    const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type.startsWith('image/')) {
                setCoverFile(file);
                setError('');
            } else {
                setError('Vui lòng chọn file ảnh hợp lệ');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Vui lòng nhập tên bài hát');
            return;
        }
        if (!songFile) {
            setError('Vui lòng chọn file nhạc');
            return;
        }

        try {
            setIsUploading(true);
            setError('');

            // Import the uploadSong function
            const { uploadSong } = await import('../../utils/musicAPI');

            const response = await uploadSong(
                { title: title.trim(), artist: '' },
                songFile,
                coverFile || undefined
            );

            // Add the uploaded song to the album
            if (response.data?.id) {
                await albumService.addSongsToAlbum(albumId, [response.data.id]);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Upload thất bại');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-none w-full max-w-lg border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200 relative" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-10">UPLOAD_INTERFACE</div>
                <div className="flex items-center justify-between p-6 border-b-4 border-black bg-gray-50">
                    <h2 className="text-2xl font-black text-black uppercase tracking-tight">TRANSMIT NEW TRACK</h2>
                    <button onClick={onClose} className="text-black hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black p-1">
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border-4 border-red-600 text-red-600 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
                            ERR: {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-black text-black mb-2 uppercase tracking-widest">DESIGNATION *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="INPUT TRACK TITLE"
                            disabled={isUploading}
                            className="w-full bg-gray-50 border-2 border-black px-4 py-3 text-black placeholder-gray-400 font-bold uppercase text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-black mb-2 uppercase tracking-widest">AUDIO DATA *</label>
                        <div className="relative border-4 border-dashed border-gray-300 bg-gray-50 p-6 hover:border-black hover:bg-gray-100 transition-colors cursor-pointer group">
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={handleSongFileChange}
                                disabled={isUploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="text-center flex flex-col items-center">
                                <Music className="text-gray-400 group-hover:text-black mb-2 transition-colors" size={32} strokeWidth={2} />
                                {songFile ? (
                                    <p className="text-black font-black uppercase text-xs truncate max-w-full">{songFile.name}</p>
                                ) : (
                                    <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">AWAITING FILE INPUT...</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-black mb-2 uppercase tracking-widest">COVER ART (OPTIONAL)</label>
                        <div className="relative border-4 border-dashed border-gray-300 bg-gray-50 p-6 hover:border-black hover:bg-gray-100 transition-colors cursor-pointer group">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverFileChange}
                                disabled={isUploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="text-center flex flex-col items-center">
                                {coverFile ? (
                                    <div>
                                        <img src={URL.createObjectURL(coverFile)} alt="Cover" className="w-20 h-20 mx-auto object-cover mb-2 border-2 border-black grayscale group-hover:grayscale-0 transition-all" />
                                        <p className="text-black font-black uppercase text-xs truncate max-w-[150px]">{coverFile.name}</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">AWAITING IMAGE INPUT...</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t-4 border-black border-dashed mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isUploading}
                            className="flex-1 py-3 bg-white text-black font-black uppercase tracking-widest text-xs border-2 border-black hover:bg-black hover:text-white transition-all disabled:opacity-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(150,150,150,1)]"
                        >
                            ABORT
                        </button>
                        <button
                            type="submit"
                            disabled={isUploading}
                            className="flex-1 py-3 bg-black text-white font-black uppercase tracking-widest text-xs border-2 border-black hover:bg-white hover:text-black transition-all disabled:opacity-50 shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            {isUploading ? 'TRANSMITTING...' : 'AUTHORIZE UPLOAD'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AlbumDetailsPage;
