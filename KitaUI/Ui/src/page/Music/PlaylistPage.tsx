import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Pause, Music, Trash2, Edit2, Clock, X, Upload, Camera, Heart } from 'lucide-react';
import type { PlaylistDto, SongDto } from '../../types/api';
import { getPlaylistById, getSongsInPlaylist, removeSongFromPlaylist, deletePlaylist, updatePlaylist } from '../../utils/musicAPI';
import { usePlay } from '../../context/PlayContext';
import AddSongModal from '../../components/Music/AddSongModal';
import { toggleFavorite, getUserInteractionStatus } from '../../services/songStaticsService';

export default function PlaylistPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { playSong, currentSong, isPlaying, togglePlayPause } = usePlay();
    const [playlist, setPlaylist] = useState<PlaylistDto | null>(null);
    const [songs, setSongs] = useState<SongDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedIsPublic, setEditedIsPublic] = useState(false);
    const [editedCoverFile, setEditedCoverFile] = useState<File | null>(null);
    const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
    const [favoritedSongs, setFavoritedSongs] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (id) {
            loadPlaylistData();
        }
    }, [id]);

    const loadPlaylistData = async () => {
        if (!id) return;

        try {
            setIsLoading(true);
            const [playlistResponse, songsResponse] = await Promise.all([
                getPlaylistById(id),
                getSongsInPlaylist(id)
            ]);

            if (playlistResponse.success) {
                setPlaylist(playlistResponse.data);
            } else {
                navigate('/music');
            }

            if (songsResponse.success) {
                setSongs(songsResponse.data);
                // Load favorite status for all songs
                await loadFavoriteStatus(songsResponse.data);
            }
        } catch (error) {
            console.error('Error loading playlist:', error);
            navigate('/music');
        } finally {
            setIsLoading(false);
        }
    };

    const loadFavoriteStatus = async (songList: SongDto[]) => {
        try {
            const favoriteStatuses = await Promise.all(
                songList.map(song => getUserInteractionStatus(song.id))
            );
            const favorited = new Set<string>();
            songList.forEach((song, index) => {
                if (favoriteStatuses[index].hasFavorited) {
                    favorited.add(song.id);
                }
            });
            setFavoritedSongs(favorited);
        } catch (error) {
            console.error('Error loading favorite status:', error);
        }
    };

    const handleToggleFavorite = async (songId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const isFavorited = favoritedSongs.has(songId);
            await toggleFavorite(songId, isFavorited);

            // Update local state
            setFavoritedSongs(prev => {
                const newSet = new Set(prev);
                if (isFavorited) {
                    newSet.delete(songId);
                } else {
                    newSet.add(songId);
                }
                return newSet;
            });

            // If unfavoriting from the Favorite playlist, reload to remove the song
            if (playlist?.name === 'Favorite' && isFavorited) {
                await loadPlaylistData();
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };


    const handleRemoveSong = async (songId: string) => {
        if (!id) return;
        if (!window.confirm("Remove this song from playlist?")) return;

        try {
            await removeSongFromPlaylist(id, songId);
            await loadPlaylistData();
        } catch (error) {
            console.error('Error removing song:', error);
        }
    };



    const handleOpenEditModal = () => {
        setEditedName(playlist?.name || '');
        setEditedDescription(playlist?.description || '');
        setEditedIsPublic(playlist?.isPublic || false);
        setEditedCoverFile(null);
        setPreviewAvatar(playlist?.coverUrl || null);
        setIsEditModalOpen(true);
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setEditedCoverFile(file);
            setPreviewAvatar(URL.createObjectURL(file));
        }
    };

    const handleUpdatePlaylist = async () => {
        if (!id || !playlist) return;

        try {
            const updatedData: PlaylistDto = {
                ...playlist,
                name: editedName,
                description: editedDescription,
                isPublic: editedIsPublic
            };

            await updatePlaylist(id, updatedData, editedCoverFile || undefined);

            // Cleanup preview URL if it was created
            if (previewAvatar && previewAvatar !== playlist.coverUrl) {
                URL.revokeObjectURL(previewAvatar);
            }

            await loadPlaylistData();
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Error updating playlist:', error);
        }
    };

    const handleDeletePlaylist = async () => {
        if (!id) return;

        try {
            await deletePlaylist(id);
            navigate('/music');
        } catch (error) {
            console.error('Error deleting playlist:', error);
        }
    };

    const formatDuration = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    const formatSongDuration = (seconds?: number): string => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };



    if (isLoading || !playlist) {
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

    const totalDuration = songs.reduce((acc, song) => acc + (song.duration || 0), 0);

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-white text-black font-sans selection:bg-black selection:text-white relative">
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}>
            </div>

            {/* Hero Section */}
            <div className="relative w-full border-b-4 border-black bg-gray-50 z-10 p-8 pt-20 flex flex-col md:flex-row items-end gap-8 mb-8 overflow-hidden">
                <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-20">VIEW_COLLECTION</div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-black opacity-5 rotate-45 pointer-events-none"></div>

                {/* Back Button */}
                <div className="absolute top-6 left-8 z-20">
                    <button
                        onClick={() => navigate('/music')}
                        className="flex items-center gap-2 text-black hover:bg-black hover:text-white transition-colors bg-white border-2 border-black px-4 py-2 uppercase tracking-widest text-xs font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                    >
                        <ArrowLeft size={16} strokeWidth={3} />
                        <span>RETURN</span>
                    </button>
                </div>

                {/* Content */}
                {/* Playlist Art */}
                <div className="relative group shrink-0 z-10">
                    <div className="w-[180px] h-[180px] sm:w-[230px] sm:h-[230px] rounded-none overflow-hidden bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                        {playlist.coverUrl ? (
                            <img
                                src={playlist.coverUrl}
                                alt={playlist.name}
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center border-4 border-transparent">
                                <span className="text-8xl font-black text-black">{playlist.name.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-w-0 z-10 w-full mb-2">
                    <p className="text-black text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <span className="bg-black text-white px-3 py-1 border-2 border-black">COLLECTION_REF</span>
                        <span>[ {playlist.id.substring(0, 8)} ]</span>
                    </p>

                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-black mb-6 uppercase tracking-tighter leading-none line-clamp-2">
                        {playlist.name}
                    </h1>

                    <div className="flex flex-col gap-4">
                        <p className="text-gray-600 text-sm font-bold uppercase tracking-widest line-clamp-2 max-w-3xl border-l-4 border-black pl-3 py-1">
                            {playlist.description || "NO PARAMETERS DEFINED"}
                        </p>

                        <div className="flex items-center gap-3 text-black text-[10px] font-black uppercase tracking-widest flex-wrap mt-2">
                            <span className="bg-gray-200 px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                OWNER: YOU
                            </span>
                            <span className="w-1.5 h-1.5 bg-black rounded-none mx-1"></span>
                            <span className="bg-white px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                ITEMS: {songs.length}
                            </span>
                            <span className="w-1.5 h-1.5 bg-black rounded-none mx-1"></span>
                            <span className="bg-white px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                RUNTIME: {formatDuration(totalDuration)}
                            </span>
                            <span className="w-1.5 h-1.5 bg-black rounded-none mx-1"></span>
                            <span className="bg-black text-white px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(150,150,150,1)]">
                                {playlist.isPublic ? "NETWORK: GLOBAL" : "NETWORK: LOCAL"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Background */}
            <div className="min-h-[500px] relative z-10 px-4 sm:px-8 pb-32 max-w-[1920px] mx-auto">

                {/* Action Bar */}
                <div className="flex items-center gap-6 mb-8 mt-4 bg-gray-50 p-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
                    <div className="absolute top-0 right-0 bg-black text-white text-[10px] uppercase font-black px-2 py-0.5 tracking-widest">CONTROLS</div>
                    <button
                        className="w-16 h-16 bg-black text-white border-2 border-transparent hover:border-black flex items-center justify-center transition-all hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group"
                        onClick={() => {
                            if (songs.length > 0) {
                                // Check if currently playing a song from this playlist
                                const isPlayingFromThisPlaylist = currentSong && songs.some(s => s.id === currentSong.id);
                                if (isPlayingFromThisPlaylist && isPlaying) {
                                    togglePlayPause();
                                }
                                else if (isPlayingFromThisPlaylist && !isPlaying) {
                                    togglePlayPause();
                                }
                                else {
                                    playSong(songs[0], songs);
                                }
                            }
                        }}
                    >
                        {currentSong && songs.some(s => s.id === currentSong.id) && isPlaying ? (
                            <Pause size={32} fill="currentColor" />
                        ) : (
                            <Play size={32} fill="currentColor" className="ml-1" />
                        )}
                    </button>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsAddSongModalOpen(true)}
                            className="text-black border-2 border-transparent hover:border-black transition-colors p-3 hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            title="Add songs"
                        >
                            <Plus size={24} strokeWidth={3} />
                        </button>
                        <button
                            onClick={handleOpenEditModal}
                            className="text-black border-2 border-transparent hover:border-black transition-colors p-3 hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            title="Edit playlist"
                        >
                            <Edit2 size={24} strokeWidth={3} />
                        </button>
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="text-black border-2 border-transparent hover:border-red-600 hover:text-red-600 transition-colors p-3 hover:bg-red-50 hover:shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]"
                            title="Delete playlist"
                        >
                            <Trash2 size={24} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="ml-auto text-black font-black uppercase text-[10px] tracking-widest mr-4 hidden sm:block">
                        INITIALIZE SEQUENCE //
                    </div>
                </div>

                {/* Songs List */}
                <div className="w-full bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mb-12">
                    {songs.length === 0 ? (
                        <div className="p-16 text-center border-dashed border-2 border-gray-300 m-8 bg-gray-50">
                            <div className="w-20 h-20 bg-gray-200 border-2 border-black flex items-center justify-center mx-auto mb-6 transform -rotate-12">
                                <Music size={40} className="text-black" />
                            </div>
                            <h3 className="text-xl font-black uppercase text-black mb-2 tracking-widest">ARCHIVE EMPTY</h3>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto font-bold uppercase tracking-widest text-xs">NO AUDIO DATA PRESENT IN THIS COLLECTION. INITIATE TRANSFER TO POPULATE RECORD.</p>
                            <button
                                onClick={() => setIsAddSongModalOpen(true)}
                                className="bg-black text-white font-black uppercase text-xs tracking-widest py-3 px-8 border-2 border-black hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                            >
                                LOCATE DATA
                            </button>
                        </div>
                    ) : (
                        <div className="w-full">
                            {/* Header Row */}
                            <div className="grid grid-cols-[16px_1fr_120px] sm:grid-cols-[16px_1fr_120px_60px] md:grid-cols-[16px_4fr_3fr_120px_60px_60px] gap-4 px-6 py-4 border-b-4 border-black text-black text-[10px] font-black uppercase tracking-[0.2em] relative bg-gray-50 z-10">
                                <div className="text-center">#</div>
                                <div>DESIGNATION</div>
                                <div className="hidden md:block text-left">TIMESTAMP</div>
                                <div className="text-right hidden sm:block"><Clock size={14} className="ml-auto" /></div>
                                <div></div>
                                <div></div>
                            </div>

                            {/* Song Rows */}
                            <div className="bg-white">
                                {songs.map((song, index) => (
                                    <div
                                        key={song.id}
                                        className="grid grid-cols-[16px_1fr_120px] sm:grid-cols-[16px_1fr_120px_60px] md:grid-cols-[16px_4fr_3fr_120px_60px_60px] gap-4 px-6 py-3 border-b-2 border-gray-100 last:border-b-0 hover:bg-gray-50 hover:border-black group transition-all items-center cursor-pointer relative hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                        onClick={() => navigate(`/music/song/${song.id}`)}
                                    >

                                        <div className="relative text-center text-gray-500 font-black text-xs w-4 flex justify-center">
                                            {currentSong?.id === song.id && isPlaying ? (
                                                <button onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} className="text-black">
                                                    <Pause size={14} fill="currentColor" />
                                                </button>
                                            ) : (
                                                <>
                                                    <span className="group-hover:hidden">
                                                        {currentSong?.id === song.id ? (
                                                            <span className="text-black">▶</span>
                                                        ) : (
                                                            (index + 1).toString().padStart(2, '0')
                                                        )}
                                                    </span>
                                                    <button
                                                        className="hidden group-hover:block text-black"
                                                        onClick={(e) => { e.stopPropagation(); playSong(song, songs); }}
                                                    >
                                                        <Play size={14} fill="currentColor" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 bg-gray-200 border-2 border-black overflow-hidden flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] group-hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                                                {song.coverUrl ? (
                                                    <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                        <Music size={16} className="text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-black font-black text-sm uppercase tracking-tight truncate pr-2 group-hover:underline">{song.title}</span>
                                                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest truncate group-hover:text-black transition-colors cursor-pointer">
                                                    {song.artist || song.uploader || 'UNKNOWN'} // REF
                                                </span>
                                            </div>
                                        </div>

                                        <div className="hidden md:block text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                            LOG: {song.createdAt ? new Date(song.createdAt).toLocaleDateString() : '-'}
                                        </div>

                                        <div className="text-right text-gray-500 font-black text-[10px] uppercase hidden sm:block">
                                            {formatSongDuration(song.duration)}
                                        </div>

                                        <div className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleToggleFavorite(song.id, e)}
                                                className={`${favoritedSongs.has(song.id) ? 'text-black' : 'text-gray-400'} hover:text-black hover:scale-110 transition-all p-2`}
                                                title={favoritedSongs.has(song.id) ? "Remove from favorites" : "Add to favorites"}
                                            >
                                                <Heart size={16} fill={favoritedSongs.has(song.id) ? 'currentColor' : 'none'} />
                                            </button>
                                        </div>

                                        {/* Delete button - hidden for Favorite playlist */}
                                        {playlist?.name !== 'Favorite' && (
                                            <div className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveSong(song.id); }}
                                                    className="text-gray-400 hover:text-red-600 hover:scale-110 transition-all p-2"
                                                    title="Remove from collection"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Song Modal */}
            <AddSongModal
                playlistId={id!}
                playlistSongs={songs}
                isOpen={isAddSongModalOpen}
                onClose={() => setIsAddSongModalOpen(false)}
                onSongAdded={loadPlaylistData}
            />

            {/* Edit Playlist Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsEditModalOpen(false)}>
                    <div className="bg-white border-4 border-black w-full max-w-md overflow-hidden shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative" onClick={(e) => e.stopPropagation()}>
                        <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest">FORM_01</div>
                        <div className="flex justify-between items-center p-6 border-b-4 border-black bg-gray-50">
                            <h2 className="text-2xl font-black text-black uppercase tracking-tighter">ALTER_COLLECTION</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 border-2 border-transparent hover:border-black transition-colors hover:bg-black hover:text-white">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Cover Image Upload */}
                            <div className="flex justify-center mb-6">
                                <div className="relative group w-40 h-40">
                                    <div className="w-full h-full rounded-none overflow-hidden border-4 border-black bg-gray-200 flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                                        {previewAvatar ? (
                                            <img
                                                src={previewAvatar}
                                                alt="Playlist Cover"
                                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <Music size={40} className="mb-2 opacity-50 text-black" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-black">NO MEDIA</span>
                                            </div>
                                        )}

                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm">
                                            <Camera size={32} className="text-white" strokeWidth={2} />
                                        </div>
                                    </div>

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        title="Change visual input"
                                    />

                                    {editedCoverFile && (
                                        <div className="absolute -bottom-3 -right-3 bg-black border-2 border-white rounded-none p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-20">
                                            <Upload size={16} className="text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-black mb-2 uppercase tracking-widest">DESIGNATION</label>
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-black text-black font-bold focus:outline-none rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow uppercase"
                                    placeholder="Enter string value"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-black mb-2 uppercase tracking-widest">PARAMETERS</label>
                                <textarea
                                    value={editedDescription}
                                    onChange={(e) => setEditedDescription(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-black text-black font-bold focus:outline-none rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow resize-none uppercase"
                                    placeholder="Enter details"
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-gray-50 border-2 border-black p-4">
                                <input
                                    type="checkbox"
                                    id="editIsPublic"
                                    checked={editedIsPublic}
                                    onChange={(e) => setEditedIsPublic(e.target.checked)}
                                    className="w-5 h-5 rounded-none border-2 border-black text-black focus:ring-black accent-black cursor-pointer"
                                />
                                <label htmlFor="editIsPublic" className="text-xs font-black text-black uppercase tracking-widest cursor-pointer">
                                    Broadcast to Global Network
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 p-6 border-t-4 border-black bg-gray-50">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-6 py-3 font-black text-black uppercase tracking-widest text-xs border-2 border-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                            >
                                ABORT
                            </button>
                            <button
                                onClick={handleUpdatePlaylist}
                                disabled={!editedName.trim()}
                                className="px-6 py-3 bg-black text-white font-black uppercase tracking-widest text-xs border-2 border-black hover:bg-gray-800 hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] hover:shadow-none"
                            >
                                COMMIT CHANGES
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="bg-white rounded-none w-full max-w-md overflow-hidden border-4 border-black shadow-[16px_16px_0px_0px_rgba(220,38,38,1)] border-t-8 border-t-red-600 relative" onClick={(e) => e.stopPropagation()}>
                        <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 tracking-widest">CRITICAL</div>
                        <div className="p-8">
                            <div className="w-16 h-16 bg-red-50 border-4 border-red-600 flex items-center justify-center mx-auto mb-6 transform -rotate-12">
                                <Trash2 size={32} className="text-red-600" strokeWidth={3} />
                            </div>
                            <h2 className="text-2xl font-black text-black mb-2 uppercase tracking-tighter text-center">PURGE COLLECTION?</h2>
                            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-8 text-center border-y-2 border-dashed border-gray-300 py-4">
                                Target node "<span className="font-black text-black">{playlist?.name}</span>" will be permanently erased from archive. This sequence cannot be aborted once initiated.
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 px-6 py-3 font-black text-black uppercase tracking-widest text-xs border-2 border-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                                >
                                    ABORT
                                </button>
                                <button
                                    onClick={handleDeletePlaylist}
                                    className="flex-1 px-6 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-xs border-2 border-black hover:bg-red-700 hover:translate-x-[2px] hover:translate-y-[2px] transition-all shadow-[4px_4px_0px_0px_rgba(150,0,0,1)] hover:shadow-none"
                                >
                                    AUTHORIZE PURGE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
