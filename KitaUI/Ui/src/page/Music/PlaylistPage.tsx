import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Music, Trash2 } from 'lucide-react';
import type { PlaylistDto, SongDto } from '../../types/api';
import { getPlaylistById, getSongsInPlaylist, addSongToPlaylist, removeSongFromPlaylist } from '../../utils/musicAPI';
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

            if (playlistResponse.success) {
                setPlaylist(playlistResponse.data);
            } else {
                navigate('/music');
            }

            if (songsResponse.success) {
                setSongs(songsResponse.data);
            }

            if (allSongsResponse.success) {
                // Filter out songs already in playlist
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
            // Add all selected songs
            await Promise.all(
                selectedSongs.map(songId => addSongToPlaylist(id, songId))
            );

            // Reload playlist data
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
            // Reload playlist data
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

    if (isLoading || !playlist) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#121212] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#282828] border-t-[#1db954] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#b3b3b3]">Loading playlist...</p>
                </div>
            </div>
        );
    }

    const totalDuration = songs.reduce((acc, song) => acc + (song.duration || 0), 0);
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#121212] text-white pb-[120px]">
            {/* Playlist Header */}
            <div className="relative bg-gradient-to-b from-[#1db954]/20 to-transparent">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <button
                        onClick={() => navigate('/music')}
                        className="flex items-center gap-2 text-[#b3b3b3] hover:text-white mb-6 transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Library
                    </button>

                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                        {/* Cover Image */}
                        <div className="flex-shrink-0">
                            {playlist.coverUrl ? (
                                <img
                                    src={playlist.coverUrl}
                                    alt={playlist.name}
                                    className="w-48 h-48 md:w-56 md:h-56 rounded-lg shadow-2xl object-cover"
                                />
                            ) : (
                                <div className="w-48 h-48 md:w-56 md:h-56 rounded-lg shadow-2xl bg-[#282828] flex items-center justify-center">
                                    <Music size={64} className="text-[#b3b3b3]" />
                                </div>
                            )}
                        </div>

                        {/* Playlist Info */}
                        <div className="flex-1">
                            <p className="text-sm font-medium text-[#b3b3b3] mb-2">PLAYLIST</p>
                            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                {playlist.name}
                            </h1>
                            {playlist.description && (
                                <p className="text-[#b3b3b3] mb-4 max-w-2xl">{playlist.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-[#b3b3b3]">
                                <span className="font-medium text-white">{songs.length} songs</span>
                                {totalDuration > 0 && (
                                    <>
                                        <span>•</span>
                                        <span>
                                            {hours > 0 && `${hours} hr `}
                                            {minutes} min
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex items-center gap-4 mb-6">
                    <button className="w-14 h-14 bg-[#1db954] hover:bg-[#1ed760] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all">
                        <Play size={24} fill="black" className="text-black ml-1" />
                    </button>
                    <button
                        onClick={() => setIsAddSongModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-transparent border border-[#535353] hover:border-white text-white rounded-full font-medium transition-all hover:scale-105"
                    >
                        <Plus size={20} />
                        Add Songs
                    </button>
                </div>

                {/* Songs List */}
                {songs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 bg-[#282828] rounded-full flex items-center justify-center mb-4">
                            <Music size={40} className="text-[#b3b3b3]" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">No songs yet</h2>
                        <p className="text-[#b3b3b3] mb-6">Add some songs to get started</p>
                        <button
                            onClick={() => setIsAddSongModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-[#1db954] hover:bg-[#1ed760] rounded-full font-medium transition-all hover:scale-105"
                        >
                            <Plus size={20} />
                            Add Your First Song
                        </button>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm text-[#b3b3b3] border-b border-[#282828]">
                            <div className="col-span-6 md:col-span-5">TITLE</div>
                            <div className="hidden md:block md:col-span-4">ALBUM</div>
                            <div className="col-span-4 md:col-span-2 text-right">DURATION</div>
                            <div className="col-span-2 md:col-span-1"></div>
                        </div>

                        {/* Songs */}
                        {songs.map((song) => (
                            <div
                                key={song.id}
                                className="grid grid-cols-12 gap-4 px-4 py-3 rounded hover:bg-[#282828] transition-colors group"
                            >
                                <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                                    {song.coverUrl ? (
                                        <img src={song.coverUrl} alt={song.title} className="w-10 h-10 rounded" />
                                    ) : (
                                        <div className="w-10 h-10 bg-[#282828] rounded flex items-center justify-center">
                                            <Music size={20} className="text-[#b3b3b3]" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-white font-medium">{song.title}</p>
                                        <p className="text-sm text-[#b3b3b3]">{song.artist}</p>
                                    </div>
                                </div>
                                <div className="hidden md:block md:col-span-4 flex items-center text-[#b3b3b3]">
                                    {song.album || '-'}
                                </div>
                                <div className="col-span-4 md:col-span-2 flex items-center justify-end text-[#b3b3b3]">
                                    {song.duration ? `${Math.floor(song.duration / 60)}:${String(Math.floor(song.duration % 60)).padStart(2, '0')}` : '-'}
                                </div>
                                <div className="col-span-2 md:col-span-1 flex items-center justify-end">
                                    <button
                                        onClick={() => handleRemoveSong(song.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-[#3e3e3e] rounded transition-all"
                                        title="Remove from playlist"
                                    >
                                        <Trash2 size={16} className="text-[#b3b3b3] hover:text-red-500" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Song Modal */}
            {isAddSongModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setIsAddSongModalOpen(false)}>
                    <div className="bg-[#282828] rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-[#404040]">
                            <h2 className="text-2xl font-bold text-white">Add Songs to Playlist</h2>
                            <button onClick={() => setIsAddSongModalOpen(false)} className="p-2 text-[#b3b3b3] hover:text-white transition-colors">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
                            {availableSongs.length === 0 ? (
                                <p className="text-center text-[#b3b3b3] py-8">No more songs available to add</p>
                            ) : (
                                <div className="space-y-2">
                                    {availableSongs.map((song) => (
                                        <div
                                            key={song.id}
                                            onClick={() => toggleSongSelection(song.id)}
                                            className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors ${selectedSongs.includes(song.id) ? 'bg-[#1db954]/20' : 'hover:bg-[#3e3e3e]'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedSongs.includes(song.id)}
                                                onChange={() => { }}
                                                className="w-5 h-5"
                                            />
                                            {song.coverUrl ? (
                                                <img src={song.coverUrl} alt={song.title} className="w-12 h-12 rounded" />
                                            ) : (
                                                <div className="w-12 h-12 bg-[#282828] rounded flex items-center justify-center">
                                                    <Music size={24} className="text-[#b3b3b3]" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p className="text-white font-medium">{song.title}</p>
                                                <p className="text-sm text-[#b3b3b3]">{song.artist}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 p-6 border-t border-[#404040]">
                            <button
                                onClick={() => setIsAddSongModalOpen(false)}
                                className="px-6 py-3 bg-transparent text-white border border-[#535353] rounded-full text-sm font-bold hover:border-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddSongs}
                                disabled={selectedSongs.length === 0}
                                className="px-6 py-3 bg-[#1db954] text-white rounded-full text-sm font-bold hover:bg-[#1ed760] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add {selectedSongs.length > 0 && `(${selectedSongs.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
