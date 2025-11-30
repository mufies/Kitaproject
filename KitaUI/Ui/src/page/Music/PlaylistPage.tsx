import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SongCard from '../../components/SongCard';
import AddSongModal from '../../components/AddSongModal';
import { getPlaylistById, getAvailableSongs, mockSongs } from '../../data/mockData';
import type { Playlist } from '../../types/music';
import { ArrowLeft, Plus, Play, Music } from 'lucide-react';

export default function PlaylistPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);

    useEffect(() => {
        if (id) {
            const foundPlaylist = getPlaylistById(id);
            if (foundPlaylist) {
                setPlaylist(foundPlaylist);
            } else {
                navigate('/music');
            }
        }
    }, [id, navigate]);

    const handleAddSongs = (songIds: string[]) => {
        if (!playlist) return;

        const songsToAdd = mockSongs.filter(song => songIds.includes(song.id));
        const updatedPlaylist = {
            ...playlist,
            songs: [...playlist.songs, ...songsToAdd],
            updatedAt: new Date(),
        };
        setPlaylist(updatedPlaylist);
    };

    const handleRemoveSong = (songId: string) => {
        if (!playlist) return;

        const updatedPlaylist = {
            ...playlist,
            songs: playlist.songs.filter(song => song.id !== songId),
            updatedAt: new Date(),
        };
        setPlaylist(updatedPlaylist);
    };

    if (!playlist) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
                <div className="text-center">
                    <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Loading playlist...</p>
                </div>
            </div>
        );
    }

    const totalDuration = playlist.songs.reduce((acc, song) => acc + song.duration, 0);
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
            {/* Playlist Header */}
            <div className="relative bg-gradient-to-b from-red-900/30 to-transparent">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <button
                        onClick={() => navigate('/music')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors duration-200 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
                        Back to Playlists
                    </button>

                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
                        {/* Cover Image */}
                        <div className="flex-shrink-0">
                            <img
                                src={playlist.coverUrl}
                                alt={playlist.name}
                                className="w-48 h-48 md:w-64 md:h-64 rounded-xl shadow-2xl shadow-black/50 object-cover"
                            />
                        </div>

                        {/* Playlist Info */}
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-400 mb-2">PLAYLIST</p>
                            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                {playlist.name}
                            </h1>
                            <p className="text-gray-300 mb-4 max-w-2xl">{playlist.description}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span className="font-medium text-white">{playlist.songs.length} songs</span>
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <button className="w-14 h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300 hover:scale-105">
                        <Play size={24} fill="white" className="text-white ml-1" />
                    </button>
                    <button
                        onClick={() => setIsAddSongModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 rounded-full font-medium transition-all duration-300"
                    >
                        <Plus size={20} />
                        Add Songs
                    </button>
                </div>

                {/* Songs List */}
                {playlist.songs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="w-24 h-24 bg-gradient-to-br from-red-600/20 to-red-800/20 rounded-full flex items-center justify-center mb-6">
                            <Music size={48} className="text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">No songs yet</h2>
                        <p className="text-gray-400 mb-6">Add some songs to get started</p>
                        <button
                            onClick={() => setIsAddSongModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-full font-medium transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
                        >
                            <Plus size={20} />
                            Add Your First Song
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm text-gray-400 border-b border-gray-800">
                            <div className="col-span-6 md:col-span-5">TITLE</div>
                            <div className="hidden md:block md:col-span-4">ALBUM</div>
                            <div className="col-span-4 md:col-span-2 text-right">DURATION</div>
                            <div className="col-span-2 md:col-span-1"></div>
                        </div>

                        {/* Songs */}
                        {playlist.songs.map((song) => (
                            <SongCard
                                key={song.id}
                                song={song}
                                onRemove={handleRemoveSong}
                                showRemove={true}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Add Song Modal */}
            <AddSongModal
                isOpen={isAddSongModalOpen}
                onClose={() => setIsAddSongModalOpen(false)}
                availableSongs={getAvailableSongs(playlist.id)}
                onAddSongs={handleAddSongs}
            />
        </div>
    );
}
