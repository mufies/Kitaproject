import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Plus, Trash2, Music, X, Search, MoreHorizontal, Clock, Heart, Play, Pause } from 'lucide-react';
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
        return <div className="p-8 text-center text-white">Loading...</div>;
    }

    if (!album) return null;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            {/* Hero Section */}
            <div className="relative w-full h-[40vh] min-h-[340px] max-h-[500px]">
                {/* Dynamic Background */}
                <div className="absolute inset-0 z-0">
                    {album.imageUrl ? (
                        <>
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url(${album.imageUrl})` }}
                            ></div>
                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#121212]/60 to-[#121212]"></div>
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
                    {/* Album Art */}
                    <div className="relative group shrink-0">
                        <div className="w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] rounded-lg overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
                            <img
                                src={album.imageUrl || "/assets/images/default-album.svg"}
                                alt={album.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = "/assets/images/default-album.svg";
                                }}
                            />
                        </div>
                        {isManager && (
                            <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-lg cursor-pointer transition-all duration-300 backdrop-blur-sm">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                />
                                <Upload size={32} className="text-white mb-2" />
                                <span className="text-white font-bold text-sm">Change Cover</span>
                            </label>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 mb-4">
                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="bg-white/10 px-2 py-0.5 rounded">Album</span>
                        </p>

                        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white mb-6 drop-shadow-2xl tracking-tight leading-none line-clamp-2">
                            {album.name}
                        </h1>

                        <div className="flex flex-col gap-4">
                            <p className="text-white/80 text-lg sm:text-xl font-medium drop-shadow-md line-clamp-2 max-w-3xl">
                                {album.description || "No description provided."}
                            </p>

                            <div className="flex items-center gap-2 text-white text-sm font-medium flex-wrap">
                                {/* Artist Avatar Tiny (Optional, using text for now) */}
                                <div className="flex items-center gap-2 hover:underline cursor-pointer" onClick={() => navigate(`/artist/${album.artistId}`)}>
                                    {/* Ideally show artist avatar here if available in album details, but using text is safe */}
                                    <span className="font-bold text-white text-base">{album.artistName}</span>
                                </div>
                                <span className="w-1 h-1 bg-white/60 rounded-full mx-1"></span>
                                <span className="text-white/90">
                                    {/* Year placeholder if needed */}
                                    2025
                                </span>
                                <span className="w-1 h-1 bg-white/60 rounded-full mx-1"></span>
                                <span className="text-white/90">
                                    <span className="font-bold">{album.songs.length}</span> songs,
                                </span>
                                <span className="text-white/70 ml-1">
                                    {/* Calculate total duration roughly */}
                                    {Math.floor(album.songs.reduce((acc, s) => acc + s.duration, 0) / 60)} min {album.songs.reduce((acc, s) => acc + s.duration, 0) % 60} sec
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Background */}
            <div className="bg-gradient-to-b from-[#121212] via-[#121212] to-black min-h-[500px]">
                <div className="p-8 pb-32 max-w-[1920px] mx-auto">

                    {/* Action Bar */}
                    <div className="flex items-center gap-6 mb-8">
                        <button
                            onClick={handlePlayAlbum}
                            disabled={!album || album.songs.length === 0}
                            className="w-14 h-14 bg-[#ff7a3c] rounded-full flex items-center justify-center hover:scale-105 hover:bg-[#ff8c52] transition-all duration-200 shadow-xl text-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAlbumPlaying() ? (
                                <Pause className="w-6 h-6 fill-current" />
                            ) : (
                                <Play className="w-6 h-6 fill-current ml-1" />
                            )}
                        </button>

                        {/* Like Button */}
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
                            className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${isLiked ? 'text-[#ff7a3c]' : 'text-[#b3b3b3] hover:text-white'}`}
                            title={isLiked ? 'Remove from Your Library' : 'Save to Your Library'}
                        >
                            <Heart size={32} className={isLiked ? 'fill-current' : ''} />
                        </button>

                        {isManager && (
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsAddSongsModalOpen(true)}
                                    className="text-[#b3b3b3] hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                                    title="Add existing song"
                                >
                                    <Plus size={32} />
                                </button>
                                <button
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="text-[#b3b3b3] hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                                    title="Upload and add song"
                                >
                                    <Upload size={24} />
                                </button>
                                <button className="text-[#b3b3b3] hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
                                    <MoreHorizontal size={32} />
                                </button>
                            </div>
                        )}

                        {isManager && (
                            <button
                                onClick={handleDeleteAlbum}
                                className="ml-auto flex items-center gap-2 text-[#b3b3b3] hover:text-red-500 font-bold text-sm tracking-widest uppercase py-2 px-4 rounded-full transition-colors hover:bg-white/5"
                            >
                                Delete Album
                            </button>
                        )}
                    </div>

                    {/* Songs List */}
                    <div className="w-full">
                        {album.songs.length === 0 ? (
                            <div className="bg-gradient-to-r from-[#1e1e1e] to-[#252525] rounded-xl p-12 text-center border border-white/5 shadow-2xl mt-4">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Music size={40} className="text-white/20" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">It's a bit quiet here</h3>
                                <p className="text-[#a7a7a7] mb-8 max-w-md mx-auto">This album has no songs yet. Add some tracks to bring it to life.</p>
                                {isManager && (
                                    <div className="flex items-center justify-center gap-4">
                                        <button
                                            onClick={() => setIsAddSongsModalOpen(true)}
                                            className="bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform shadow-lg shadow-white/10"
                                        >
                                            Add Existing Songs
                                        </button>
                                        <button
                                            onClick={() => setIsUploadModalOpen(true)}
                                            className="bg-[#333] text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform shadow-lg border border-white/10"
                                        >
                                            Upload New
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full">
                                {/* Header Row */}
                                <div className="grid grid-cols-[16px_1fr_120px] sm:grid-cols-[16px_1fr_120px_60px] md:grid-cols-[16px_4fr_3fr_120px_60px] gap-4 px-4 py-3 border-b border-white/10 text-[#a7a7a7] text-sm font-medium uppercase tracking-wider sticky top-0 bg-[#121212] z-10">
                                    <div className="text-center">#</div>
                                    <div>Title</div>
                                    <div className="hidden md:block text-left">Date Added</div>
                                    <div className="text-right hidden sm:block"><Clock size={16} className="ml-auto" /></div>
                                    <div></div>
                                </div>

                                {/* Song Rows */}
                                <div className="mt-2">
                                    {album.songs.map((song, index) => (
                                        <div
                                            key={song.id}
                                            className="grid grid-cols-[16px_1fr_120px] sm:grid-cols-[16px_1fr_120px_60px] md:grid-cols-[16px_4fr_3fr_120px_60px] gap-4 px-4 py-3 hover:bg-[#ffffff10] rounded-md group transition-colors items-center cursor-pointer"
                                            onClick={() => navigate(`/music/song/${song.id}`)}
                                        >
                                            <div className="relative text-center text-[#a7a7a7] font-medium w-4 flex justify-center">
                                                {currentSong?.id === song.id && isPlaying ? (
                                                    <button onClick={(e) => { e.stopPropagation(); handlePlaySong(index); }} className="text-[#ff7a3c]">
                                                        <Pause className="w-4 h-4 fill-current" />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <span className="group-hover:hidden">{currentSong?.id === song.id ? <Play className="w-4 h-4 fill-current text-[#ff7a3c]" /> : index + 1}</span>
                                                        <button onClick={(e) => { e.stopPropagation(); handlePlaySong(index); }} className="hidden group-hover:block text-white">
                                                            <Play className="w-4 h-4 fill-current" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 min-w-0">
                                                {/* Optional: Show song cover in list if we want, typically album view doesn't repeating album cover, but if songs have unique art... usually not for album tracks. Skipping to keep it clean like Spotify album view. */}

                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-white font-medium text-base truncate pr-2 group-hover:text-green-400 transition-colors">{song.title}</span>
                                                    <span className="text-[#a7a7a7] text-sm truncate group-hover:text-white transition-colors cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/artist/${album.artistId}`); }}>
                                                        {album.artistName}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="hidden md:block text-[#a7a7a7] text-sm font-medium">
                                                {/* Placeholder for Date Added */}
                                                Dec 19, 2025
                                            </div>

                                            <div className="text-right text-[#a7a7a7] font-mono text-sm hidden sm:block">
                                                {formatDuration(song.duration)}
                                            </div>

                                            <div className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isManager && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveSong(song.id); }}
                                                        className="text-[#a7a7a7] hover:text-white hover:scale-110 transition-all p-2"
                                                        title="Remove from album"
                                                    >
                                                        <Trash2 size={16} />
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#1e1e1e] rounded-xl w-full max-w-2xl max-h-[80vh] border border-[#333] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-[#333]">
                    <h2 className="text-xl font-bold text-white">Thêm bài hát vào Album</h2>
                    <button onClick={onClose} className="text-[#a7a7a7] hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-[#333]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a7a7a7]" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm bài hát..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-[#2a2a2a] border border-[#333] rounded-full px-10 py-2 text-white placeholder-[#a7a7a7] focus:outline-none focus:border-green-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Song List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {isLoading ? (
                        <div className="text-center text-[#a7a7a7] py-8">Đang tải...</div>
                    ) : filteredSongs.length === 0 ? (
                        <div className="text-center text-[#a7a7a7] py-8">
                            {searchQuery ? 'Không tìm thấy bài hát.' : 'Không có bài hát nào để thêm.'}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredSongs.map(song => (
                                <div
                                    key={song.id}
                                    onClick={() => toggleSelect(song.id)}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedIds.includes(song.id)
                                        ? 'bg-green-500/20 border border-green-500/50'
                                        : 'hover:bg-[#333] border border-transparent'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedIds.includes(song.id)
                                        ? 'bg-green-500 border-green-500'
                                        : 'border-[#666]'
                                        }`}>
                                        {selectedIds.includes(song.id) && (
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="w-10 h-10 bg-[#333] rounded overflow-hidden flex-shrink-0">
                                        <img
                                            src={song.coverUrl || "/assets/images/default-album.svg"}
                                            alt={song.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium truncate">{song.title}</div>
                                        <div className="text-[#a7a7a7] text-sm truncate">{song.artist || 'Unknown'}</div>
                                    </div>
                                    <div className="text-[#a7a7a7] text-sm font-mono">
                                        {formatDuration(song.duration || 0)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#333] flex items-center justify-between">
                    <span className="text-[#a7a7a7] text-sm">
                        {selectedIds.length > 0 ? `Đã chọn ${selectedIds.length} bài hát` : 'Chọn bài hát để thêm'}
                    </span>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 text-white border border-[#555] rounded-full hover:border-white transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleAddSongs}
                            disabled={selectedIds.length === 0 || isAdding}
                            className="px-5 py-2 bg-green-500 text-black font-bold rounded-full hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAdding ? 'Đang thêm...' : `Thêm ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`}
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#1e1e1e] rounded-xl w-full max-w-lg border border-[#333] shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-[#333]">
                    <h2 className="text-xl font-bold text-white">Upload bài hát mới</h2>
                    <button onClick={onClose} className="text-[#a7a7a7] hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-white mb-2">Tên bài hát *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Nhập tên bài hát"
                            disabled={isUploading}
                            className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-[#666] focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-white mb-2">File nhạc *</label>
                        <div className="relative border-2 border-dashed border-[#444] rounded-lg p-6 hover:border-green-500 transition-colors cursor-pointer bg-[#2a2a2a]/50">
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={handleSongFileChange}
                                disabled={isUploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="text-center">
                                <Music className="mx-auto text-green-500 mb-2" size={32} />
                                {songFile ? (
                                    <p className="text-white font-medium">{songFile.name}</p>
                                ) : (
                                    <p className="text-[#a7a7a7]">Kéo thả hoặc click để chọn file</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-white mb-2">Ảnh bìa (tùy chọn)</label>
                        <div className="relative border-2 border-dashed border-[#444] rounded-lg p-6 hover:border-green-500 transition-colors cursor-pointer bg-[#2a2a2a]/50">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverFileChange}
                                disabled={isUploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="text-center">
                                {coverFile ? (
                                    <div>
                                        <img src={URL.createObjectURL(coverFile)} alt="Cover" className="w-20 h-20 mx-auto rounded-lg object-cover mb-2" />
                                        <p className="text-white text-sm">{coverFile.name}</p>
                                    </div>
                                ) : (
                                    <p className="text-[#a7a7a7]">Kéo thả hoặc click để chọn ảnh</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isUploading}
                            className="flex-1 py-3 text-white border border-[#555] rounded-full hover:border-white transition-colors disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isUploading}
                            className="flex-1 py-3 bg-green-500 text-black font-bold rounded-full hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                            {isUploading ? 'Đang upload...' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AlbumDetailsPage;
