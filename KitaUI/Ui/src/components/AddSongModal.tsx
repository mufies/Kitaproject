import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { Song } from '../types/music';
import { formatDuration } from '../data/mockData';

interface AddSongModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableSongs: Song[];
    onAddSongs: (songIds: string[]) => void;
}

export default function AddSongModal({ isOpen, onClose, availableSongs, onAddSongs }: AddSongModalProps) {
    const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSongs = availableSongs.filter(song =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.album.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSong = (songId: string) => {
        const newSelected = new Set(selectedSongs);
        if (newSelected.has(songId)) {
            newSelected.delete(songId);
        } else {
            newSelected.add(songId);
        }
        setSelectedSongs(newSelected);
    };

    const handleAddSongs = () => {
        if (selectedSongs.size > 0) {
            onAddSongs(Array.from(selectedSongs));
            setSelectedSongs(new Set());
            setSearchQuery('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-red-500/20 animate-slideUp">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Add Songs</h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {selectedSongs.size} song{selectedSongs.size !== 1 ? 's' : ''} selected
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
                    >
                        <X className="text-gray-400 hover:text-white" size={24} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-gray-700/50">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search songs, artists, or albums..."
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                    />
                </div>

                {/* Song List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-2">
                    {filteredSongs.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-400">
                                {searchQuery ? 'No songs found matching your search' : 'No available songs to add'}
                            </p>
                        </div>
                    ) : (
                        filteredSongs.map((song) => (
                            <div
                                key={song.id}
                                onClick={() => toggleSong(song.id)}
                                className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedSongs.has(song.id)
                                    ? 'bg-red-600/20 border border-red-500/50'
                                    : 'bg-gray-800/30 border border-transparent hover:bg-gray-800/60 hover:border-gray-700'
                                    }`}
                            >
                                {/* Checkbox */}
                                <div className="flex-shrink-0">
                                    <div
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${selectedSongs.has(song.id)
                                            ? 'bg-red-600 border-red-600'
                                            : 'border-gray-600'
                                            }`}
                                    >
                                        {selectedSongs.has(song.id) && (
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                </div>

                                {/* Album Art */}
                                <img
                                    src={song.coverUrl}
                                    alt={song.album}
                                    className="w-12 h-12 rounded-md object-cover"
                                />

                                {/* Song Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-medium truncate">{song.title}</h4>
                                    <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                                </div>

                                {/* Duration */}
                                <div className="text-gray-400 text-sm font-mono">
                                    {formatDuration(song.duration)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-700/50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddSongs}
                        disabled={selectedSongs.size === 0}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-red-600 disabled:hover:to-red-700 flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        Add {selectedSongs.size > 0 && `(${selectedSongs.size})`}
                    </button>
                </div>
            </div>
        </div>
    );
}
