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
            <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#1a141a] border-t-[#ff7a3c] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/50 text-sm">Loading playlist...</p>
                </div>
            </div>
        );
    }

    const totalDuration = songs.reduce((acc, song) => acc + (song.duration || 0), 0);

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-[#0f0f0f] text-white">
            {/* Hero Section */}
            <div className="relative w-full h-[40vh] min-h-[340px] max-h-[500px]">
                {/* Dynamic Background */}
                <div className="absolute inset-0 z-0">
                    {playlist.coverUrl ? (
                        <>
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url(${playlist.coverUrl})` }}
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
                        onClick={() => navigate('/music')}
                        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 hover:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-bold text-sm">Back</span>
                    </button>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 w-full p-8 z-10 flex items-end gap-8">
                    {/* Playlist Art */}
                    <div className="relative group shrink-0">
                        <div className="w-[180px] h-[180px] sm:w-[230px] sm:h-[230px] rounded-lg overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
                            {playlist.coverUrl ? (
                                <img
                                    src={playlist.coverUrl}
                                    alt={playlist.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#ff7a3c] to-[#ff4d6d] flex items-center justify-center">
                                    <span className="text-6xl font-black text-white">{playlist.name.charAt(0).toUpperCase()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 mb-4">
                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="bg-white/10 px-2 py-0.5 rounded">Playlist</span>
                        </p>

                        <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black text-white mb-6 drop-shadow-2xl tracking-tight leading-none line-clamp-2">
                            {playlist.name}
                        </h1>

                        <div className="flex flex-col gap-4">
                            <p className="text-white/80 text-lg sm:text-lg font-medium drop-shadow-md line-clamp-2 max-w-3xl">
                                {playlist.description || "No description provided."}
                            </p>

                            <div className="flex items-center gap-2 text-white text-sm font-medium flex-wrap">
                                <span className="font-bold text-white text-base">You</span>
                                <span className="w-1 h-1 bg-white/60 rounded-full mx-1"></span>
                                <span className="text-white/90">
                                    <span className="font-bold">{songs.length}</span> songs,
                                </span>
                                <span className="text-white/70 ml-1">
                                    {formatDuration(totalDuration)}
                                </span>
                                <span className="w-1 h-1 bg-white/60 rounded-full mx-1"></span>
                                <span className="text-white/90 bg-white/10 px-2 py-0.5 rounded text-xs uppercase tracking-wide">
                                    {playlist.isPublic ? "Public" : "Private"}
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
                            className="w-14 h-14 bg-[#ff7a3c] rounded-full flex items-center justify-center hover:scale-105 hover:bg-[#ff8c52] transition-all duration-200 shadow-xl text-black"
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
                                <Pause size={28} fill="currentColor" />
                            ) : (
                                <Play size={28} fill="currentColor" className="ml-1" />
                            )}
                        </button>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsAddSongModalOpen(true)}
                                className="text-[#b3b3b3] hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                                title="Add songs"
                            >
                                <Plus size={32} />
                            </button>
                            <button
                                onClick={handleOpenEditModal}
                                className="text-[#b3b3b3] hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                                title="Edit playlist"
                            >
                                <Edit2 size={24} />
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="text-[#b3b3b3] hover:text-red-500 transition-colors p-2 rounded-full hover:bg-white/10"
                                title="Delete playlist"
                            >
                                <Trash2 size={24} />
                            </button>

                        </div>
                    </div>

                    {/* Songs List */}
                    <div className="w-full">
                        {songs.length === 0 ? (
                            <div className="bg-gradient-to-r from-[#1e1e1e] to-[#252525] rounded-xl p-12 text-center border border-white/5 shadow-2xl mt-4">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Music size={40} className="text-white/20" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">It's a bit quiet here</h3>
                                <p className="text-[#a7a7a7] mb-8 max-w-md mx-auto">This playlist has no songs yet. Add some tracks to bring it to life.</p>
                                <button
                                    onClick={() => setIsAddSongModalOpen(true)}
                                    className="bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform shadow-lg shadow-white/10"
                                >
                                    Find Songs
                                </button>
                            </div>
                        ) : (
                            <div className="w-full">
                                {/* Header Row */}
                                <div className="grid grid-cols-[16px_1fr_120px] sm:grid-cols-[16px_1fr_120px_60px] md:grid-cols-[16px_4fr_3fr_120px_60px_60px] gap-4 px-4 py-3 border-b border-white/10 text-[#a7a7a7] text-sm font-medium uppercase tracking-wider sticky top-0 bg-[#121212] z-10">
                                    <div className="text-center">#</div>
                                    <div>Title</div>
                                    <div className="hidden md:block text-left">Date Added</div>
                                    <div className="text-right hidden sm:block"><Clock size={16} className="ml-auto" /></div>
                                    <div></div>
                                    <div></div>
                                </div>

                                {/* Song Rows */}
                                <div className="mt-2">
                                    {songs.map((song, index) => (
                                        <div
                                            key={song.id}
                                            className="grid grid-cols-[16px_1fr_120px] sm:grid-cols-[16px_1fr_120px_60px] md:grid-cols-[16px_4fr_3fr_120px_60px_60px] gap-4 px-4 py-3 hover:bg-[#ffffff10] rounded-md group transition-colors items-center cursor-pointer"
                                            onClick={() => navigate(`/music/song/${song.id}`)}
                                        >
                                            <div className="relative text-center text-[#a7a7a7] font-medium w-4 flex justify-center">
                                                {currentSong?.id === song.id && isPlaying ? (
                                                    <button onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} className="text-[#ff7a3c]">
                                                        <Pause size={14} fill="currentColor" />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <span className="group-hover:hidden">
                                                            {currentSong?.id === song.id ? (
                                                                <span className="text-[#ff7a3c]">▶</span>
                                                            ) : (
                                                                index + 1
                                                            )}
                                                        </span>
                                                        <button
                                                            className="hidden group-hover:block text-white"
                                                            onClick={(e) => { e.stopPropagation(); playSong(song, songs); }}
                                                        >
                                                            <Play size={14} fill="currentColor" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                                                    {song.coverUrl ? (
                                                        <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-[#333] flex items-center justify-center">
                                                            <Music size={16} className="text-white/50" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-white font-medium text-base truncate pr-2 group-hover:text-[#ff7a3c] transition-colors">{song.title}</span>
                                                    <span className="text-[#a7a7a7] text-sm truncate group-hover:text-white transition-colors cursor-pointer hover:underline">
                                                        {song.artist || song.uploader || 'Unknown'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="hidden md:block text-[#a7a7a7] text-sm font-medium">
                                                {song.createdAt ? new Date(song.createdAt).toLocaleDateString() : '-'}
                                            </div>

                                            <div className="text-right text-[#a7a7a7] font-mono text-sm hidden sm:block">
                                                {formatSongDuration(song.duration)}
                                            </div>

                                            <div className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => handleToggleFavorite(song.id, e)}
                                                    className={`${favoritedSongs.has(song.id) ? 'text-[#ff7a3c]' : 'text-[#a7a7a7]'} hover:text-[#ff7a3c] hover:scale-110 transition-all p-2`}
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
                                                        className="text-[#a7a7a7] hover:text-white hover:scale-110 transition-all p-2"
                                                        title="Remove from playlist"
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
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setIsEditModalOpen(false)}>
                    <div className="bg-[#1e1e1e] rounded-xl w-full max-w-md overflow-hidden border border-[#333] shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-[#333]">
                            <h2 className="text-lg font-bold text-white">Edit Playlist</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-[#a7a7a7] hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Cover Image Upload */}
                            <div className="flex justify-center mb-6">
                                <div className="relative group w-40 h-40">
                                    <div className="w-full h-full rounded-lg overflow-hidden border-2 border-[#333] bg-[#2a2a2a] flex items-center justify-center shadow-lg">
                                        {previewAvatar ? (
                                            <img
                                                src={previewAvatar}
                                                alt="Playlist Cover"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-[#a7a7a7]">
                                                <Music size={40} className="mb-2 opacity-50" />
                                                <span className="text-xs">No Cover</span>
                                            </div>
                                        )}

                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                            <Camera size={32} className="text-white" />
                                        </div>
                                    </div>

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        title="Change cover image"
                                    />

                                    {editedCoverFile && (
                                        <div className="absolute -bottom-2 -right-2 bg-[#ff7a3c] rounded-full p-1.5 shadow-md z-20">
                                            <Upload size={14} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-2">Playlist Name</label>
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[#2a2a2a] border border-[#333] rounded-xl text-white focus:outline-none focus:border-[#ff7a3c] transition-colors text-sm"
                                    placeholder="Enter playlist name"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-2">Description</label>
                                <textarea
                                    value={editedDescription}
                                    onChange={(e) => setEditedDescription(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[#2a2a2a] border border-[#333] rounded-xl text-white focus:outline-none focus:border-[#ff7a3c] transition-colors text-sm resize-none"
                                    placeholder="Enter description"
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="editIsPublic"
                                    checked={editedIsPublic}
                                    onChange={(e) => setEditedIsPublic(e.target.checked)}
                                    className="w-4 h-4 rounded accent-[#ff7a3c]"
                                />
                                <label htmlFor="editIsPublic" className="text-sm text-white cursor-pointer">
                                    Make this playlist public
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-5 border-t border-[#333]">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-5 py-2 text-white border border-[#555] rounded-full hover:border-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdatePlaylist}
                                disabled={!editedName.trim()}
                                className="px-5 py-2 bg-[#ff7a3c] hover:bg-[#ff8c52] text-white rounded-full font-bold transition-all disabled:opacity-50"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="bg-[#1e1e1e] rounded-xl w-full max-w-md overflow-hidden border border-[#333]" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="w-12 h-12 bg-[#ff7a3c]/10 rounded-xl flex items-center justify-center mb-4">
                                <Trash2 size={24} className="text-[#ff7a3c]" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Delete Playlist?</h2>
                            <p className="text-white/60 text-sm mb-6">
                                Are you sure you want to delete "<span className="font-medium text-white">{playlist?.name}</span>"? This action cannot be undone.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 px-5 py-2 text-white border border-[#555] rounded-full hover:border-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeletePlaylist}
                                    className="flex-1 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
