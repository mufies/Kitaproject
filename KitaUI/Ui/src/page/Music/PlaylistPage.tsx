import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Music, Trash2, Edit2, Search } from 'lucide-react';
import type { PlaylistDto, SongDto } from '../../types/api';
import { getPlaylistById, getSongsInPlaylist, addSongToPlaylist, removeSongFromPlaylist, deletePlaylist, updatePlaylist } from '../../utils/musicAPI';
import { getAllSongs } from '../../utils/musicAPI';

export default function PlaylistPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [playlist, setPlaylist] = useState<PlaylistDto | null>(null);
    const [songs, setSongs] = useState<SongDto[]>([]);
    const [availableSongs, setAvailableSongs] = useState<SongDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
    const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedIsPublic, setEditedIsPublic] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (id) {
            loadPlaylistData();
        }
    }, [id]);

    const loadPlaylistData = async () => {
        if (!id) return;

        try {
            setIsLoading(true);
            const [playlistResponse, songsResponse, allSongsResponse] = await Promise.all([
                getPlaylistById(id),
                getSongsInPlaylist(id),
                getAllSongs()
            ]);
            console.log(playlistResponse);

            if (playlistResponse.success) {
                setPlaylist(playlistResponse.data);
            } else {
                navigate('/music');
            }

            if (songsResponse.success) {
                setSongs(songsResponse.data);
            }

            if (allSongsResponse.success) {
                const playlistSongIds = songsResponse.success ? songsResponse.data.map(s => s.id) : [];
                const available = allSongsResponse.data.filter(s => !playlistSongIds.includes(s.id));
                setAvailableSongs(available);
            }
        } catch (error) {
            console.error('Error loading playlist:', error);
            navigate('/music');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSongs = async () => {
        if (!id || selectedSongs.length === 0) return;

        try {
            await Promise.all(
                selectedSongs.map(songId => addSongToPlaylist(id, songId))
            );
            await loadPlaylistData();
            setSelectedSongs([]);
            setIsAddSongModalOpen(false);
        } catch (error) {
            console.error('Error adding songs:', error);
        }
    };

    const handleRemoveSong = async (songId: string) => {
        if (!id) return;

        try {
            await removeSongFromPlaylist(id, songId);
            await loadPlaylistData();
        } catch (error) {
            console.error('Error removing song:', error);
        }
    };

    const toggleSongSelection = (songId: string) => {
        setSelectedSongs(prev =>
            prev.includes(songId)
                ? prev.filter(id => id !== songId)
                : [...prev, songId]
        );
    };

    const handleOpenEditModal = () => {
        setEditedName(playlist?.name || '');
        setEditedDescription(playlist?.description || '');
        setEditedIsPublic(playlist?.isPublic || false);
        setIsEditModalOpen(true);
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

            await updatePlaylist(id, updatedData);
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

    // Filter available songs based on search query
    const filteredSongs = useMemo(() => {
        if (!searchQuery.trim()) return availableSongs;
        const query = searchQuery.toLowerCase();
        return availableSongs.filter(song =>
            song.title.toLowerCase().includes(query) ||
            song.artist?.toLowerCase().includes(query) ||
            song.uploader?.toLowerCase().includes(query)
        );
    }, [availableSongs, searchQuery]);

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
        <div className="min-h-screen bg-[#0f0f0f] text-white pb-[120px]">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
                <button
                    onClick={() => navigate('/music')}
                    className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors text-sm font-medium"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                <div className="flex items-start gap-4 mb-6">
                    {/* Cover */}
                    <div className="flex-shrink-0">
                        {playlist.coverUrl ? (
                            <img
                                src={playlist.coverUrl}
                                alt={playlist.name}
                                className="w-20 h-20 rounded-xl object-cover"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#ff7a3c] to-[#ff4d6d] flex items-center justify-center text-xs font-bold">
                                {playlist.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/50 mb-1">PLAYLIST</div>
                        <h1 className="text-2xl font-bold truncate mb-2">{playlist.name}</h1>
                        {playlist.description && (
                            <p className="text-xs text-white/40 line-clamp-2 mb-2">{playlist.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-white/50">
                            <span className="font-medium">{songs.length} tracks</span>
                            <span>•</span>
                            <span>{formatDuration(totalDuration)}</span>
                            <span>•</span>
                            <span>{playlist.isPublic ? "Public" : "Private"}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button className="w-12 h-12 bg-[#ff7a3c] hover:bg-[#ff8c52] rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-all">
                        <Play size={20} fill="currentColor" className="ml-0.5" />
                    </button>
                    <button
                        onClick={() => setIsAddSongModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#1a141a] hover:bg-[#221a22] border border-white/20 text-white rounded-xl text-xs font-medium transition-all hover:scale-105"
                    >
                        <Plus size={16} />
                        Add Songs
                    </button>
                    <button
                        onClick={handleOpenEditModal}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#1a141a] hover:bg-[#221a22] border border-white/20 text-white rounded-xl text-xs font-medium transition-all hover:scale-105"
                    >
                        <Edit2 size={16} />
                        Edit
                    </button>
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#1a141a] hover:bg-[#221a22] border border-white/20 text-white/70 hover:text-[#ff7a3c] rounded-xl text-xs font-medium transition-all hover:scale-105"
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                </div>
            </div>

            {/* Songs List */}
            <div className="px-6 space-y-1">
                {songs.length === 0 ? (
                    <div className="bg-[#1a141a] rounded-xl p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-xl flex items-center justify-center">
                            <Music size={32} className="text-white/50" />
                        </div>
                        <h2 className="text-lg font-bold mb-2">No songs yet</h2>
                        <p className="text-white/50 mb-6 text-sm">Add some songs to get started</p>
                        <button
                            onClick={() => setIsAddSongModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 mx-auto bg-[#ff7a3c] hover:bg-[#ff8c52] rounded-xl font-medium transition-all"
                        >
                            <Plus size={16} />
                            Add Your First Song
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3 px-1 py-2 text-[11px] text-white/40 mb-1">
                            <div className="w-10" />
                            <div className="flex-1 min-w-0">TITLE</div>
                            <div className="w-24 text-right hidden md:block">DATE ADDED</div>
                            <div className="w-20 text-right hidden sm:block">DURATION</div>
                            <div className="w-8" />
                        </div>

                        {/* Songs */}
                        {songs.map((song) => (
                            <div
                                key={song.id}
                                className="bg-[#1a141a] hover:bg-[#221a22] rounded-xl p-3 transition-colors group cursor-pointer flex items-center gap-3"
                            >
                                {/* Cover */}
                                <div className="w-10 h-10 rounded-lg flex-shrink-0">
                                    {song.coverUrl ? (
                                        <img src={song.coverUrl} alt={song.title} className="w-10 h-10 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff7a3c] to-[#ff4d6d] flex items-center justify-center text-xs font-bold">
                                            {song.title.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate text-white">{song.title}</p>
                                    <p className="text-[11px] text-white/50 truncate">{song.artist ? `Artist: ${song.artist}` : `Uploader: ${song.uploader || 'Unknown'}`}</p>
                                </div>

                                {/* Date Added - Always render for alignment */}
                                <div className="w-24 text-right text-[11px] text-white/50 hidden md:block flex-shrink-0">
                                    {song.createdAt
                                        ? new Date(song.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                        : '-'}
                                </div>

                                {/* Duration - Always render for alignment */}
                                <div className="w-20 text-right text-[11px] text-white/50 hidden sm:block flex-shrink-0">
                                    {song.duration
                                        ? `${Math.floor(song.duration / 60)}:${String(Math.floor(song.duration % 60)).padStart(2, '0')}`
                                        : '-'}
                                </div>

                                {/* Remove */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveSong(song.id);
                                    }}
                                    className="w-8 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg transition-all flex-shrink-0 flex items-center justify-center"
                                    title="Remove from playlist"
                                >
                                    <Trash2 size={14} className="text-white/50 hover:text-[#ff7a3c]" />
                                </button>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Add Song Modal - Match style */}
            {isAddSongModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => { setIsAddSongModalOpen(false); setSearchQuery(''); }}>
                    <div className="bg-[#1a141a] rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-[#221a22]">
                            <h2 className="text-lg font-bold text-white">Add Songs</h2>
                            <button onClick={() => { setIsAddSongModalOpen(false); setSearchQuery(''); }} className="p-1.5 hover:bg-[#221a22] rounded-lg transition-colors">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="px-5 pt-5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search songs..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-[#0f0f0f] border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#ff7a3c] transition-colors text-sm placeholder:text-white/40"
                                />
                            </div>
                        </div>

                        <div className="p-5 overflow-y-auto max-h-[calc(70vh-250px)]">
                            {filteredSongs.length === 0 ? (
                                <p className="text-center text-white/50 py-8 text-sm">
                                    {searchQuery ? 'No songs found' : 'No more songs available'}
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {filteredSongs.map((song) => (
                                        <div
                                            key={song.id}
                                            onClick={() => toggleSongSelection(song.id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-[#221a22] ${selectedSongs.includes(song.id) ? 'bg-[#ff7a3c]/10 border border-[#ff7a3c]/30' : ''
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedSongs.includes(song.id)}
                                                onChange={() => { }}
                                                className="w-4 h-4 rounded accent-[#ff7a3c]"
                                            />
                                            <div className="w-10 h-10 rounded-lg flex-shrink-0">
                                                {song.coverUrl ? (
                                                    <img src={song.coverUrl} alt={song.title} className="w-10 h-10 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff7a3c] to-[#ff4d6d] flex items-center justify-center text-xs font-bold">
                                                        {song.title.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{song.title}</p>
                                                <p className="text-[11px] text-white/50 truncate">
                                                    {song.artist ? `Artist: ${song.artist}` : `Uploader: ${song.uploader || 'Unknown'}`}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-[11px] text-white/50">
                                                    {formatSongDuration(song.duration)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 p-5 border-t border-[#221a22] bg-[#0f0f0f]">
                            <button
                                onClick={() => { setIsAddSongModalOpen(false); setSearchQuery(''); }}
                                className="px-6 py-2.5 text-xs font-medium text-white/70 hover:text-white transition-colors border border-white/20 rounded-xl hover:bg-[#1a141a]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddSongs}
                                disabled={selectedSongs.length === 0}
                                className="px-6 py-2.5 bg-[#ff7a3c] hover:bg-[#ff8c52] text-white rounded-xl text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                <Plus size={14} />
                                Add {selectedSongs.length > 0 && `(${selectedSongs.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Playlist Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setIsEditModalOpen(false)}>
                    <div className="bg-[#1a141a] rounded-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-[#221a22]">
                            <h2 className="text-lg font-bold text-white">Edit Playlist</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 hover:bg-[#221a22] rounded-lg transition-colors">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-2">Playlist Name</label>
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#ff7a3c] transition-colors text-sm"
                                    placeholder="Enter playlist name"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-2">Description (Optional)</label>
                                <textarea
                                    value={editedDescription}
                                    onChange={(e) => setEditedDescription(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#ff7a3c] transition-colors text-sm resize-none"
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

                        <div className="flex justify-end gap-3 p-5 border-t border-[#221a22] bg-[#0f0f0f]">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-6 py-2.5 text-xs font-medium text-white/70 hover:text-white transition-colors border border-white/20 rounded-xl hover:bg-[#1a141a]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdatePlaylist}
                                disabled={!editedName.trim()}
                                className="px-6 py-2.5 bg-[#ff7a3c] hover:bg-[#ff8c52] text-white rounded-xl text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="bg-[#1a141a] rounded-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
                                    className="flex-1 px-6 py-2.5 text-xs font-medium text-white/70 hover:text-white transition-colors border border-white/20 rounded-xl hover:bg-[#221a22]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeletePlaylist}
                                    className="flex-1 px-6 py-2.5 bg-[#ff7a3c] hover:bg-[#ff4d6d] text-white rounded-xl text-xs font-medium transition-all"
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
