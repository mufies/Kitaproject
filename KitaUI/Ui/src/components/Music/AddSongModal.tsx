import { useState, useEffect } from 'react';
import { Search, X, Music, Loader2, Play, Pause, Check } from 'lucide-react';
import type { SongDto } from '../../types/api';
import { searchSongs } from '../../services/musicService';
import { addSongToPlaylist } from '../../utils/musicAPI';


interface AddSongModalProps {
    playlistId: string;
    playlistSongs: SongDto[];
    isOpen: boolean;
    onClose: () => void;
    onSongAdded: () => void;
}


export default function AddSongModal({
    playlistId,
    playlistSongs,
    isOpen,
    onClose,
    onSongAdded
}: AddSongModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchedSongs, setSearchedSongs] = useState<SongDto[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
    const [currentPreviewSongId, setCurrentPreviewSongId] = useState<string | null>(null);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
    const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
    const [isAddingMultiple, setIsAddingMultiple] = useState(false);


    // Debounced search function
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchedSongs([]);
            return;
        }


        setIsSearching(true);
        const timeoutId = setTimeout(async () => {
            try {
                const results = await searchSongs(searchQuery);
                // Filter out songs already in playlist
                const playlistSongIds = playlistSongs.map(s => s.id);
                const filteredResults = results.filter(s => !playlistSongIds.includes(s.id));
                setSearchedSongs(filteredResults);
            } catch (error) {
                console.error('Error searching songs:', error);
                setSearchedSongs([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);


        return () => clearTimeout(timeoutId);
    }, [searchQuery, playlistSongs]);


    // Cleanup audio on modal close
    useEffect(() => {
        if (!isOpen) {
            if (previewAudio) {
                previewAudio.pause();
                previewAudio.currentTime = 0;
                setPreviewAudio(null);
            }
            setCurrentPreviewSongId(null);
            setIsPreviewPlaying(false);
            setSearchQuery('');
            setSearchedSongs([]);
            setSelectedSongIds(new Set());
        }
    }, [isOpen, previewAudio]);


    const handleAddSingleSong = async (songId: string) => {
        try {
            await addSongToPlaylist(playlistId, songId);
            setSearchedSongs(prev => prev.filter(s => s.id !== songId));
            onSongAdded();
            onClose();
        } catch (error) {
            console.error('Error adding song:', error);
        }
    };


    const handleAddMultipleSongs = async () => {
        if (selectedSongIds.size === 0) return;

        setIsAddingMultiple(true);
        try {
            // Add all selected songs
            await Promise.all(
                Array.from(selectedSongIds).map(songId =>
                    addSongToPlaylist(playlistId, songId)
                )
            );

            // Remove added songs from search results
            setSearchedSongs(prev =>
                prev.filter(s => !selectedSongIds.has(s.id))
            );
            setSelectedSongIds(new Set());
            onSongAdded();
            onClose();
        } catch (error) {
            console.error('Error adding songs:', error);
        } finally {
            setIsAddingMultiple(false);
        }
    };


    const toggleSongSelection = (songId: string) => {
        setSelectedSongIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(songId)) {
                newSet.delete(songId);
            } else {
                newSet.add(songId);
            }
            return newSet;
        });
    };


    const handlePreviewSong = (song: SongDto) => {
        // If clicking on same song, toggle play/pause
        if (currentPreviewSongId === song.id && previewAudio) {
            if (previewAudio.paused) {
                previewAudio.play();  // Chỉ resume từ vị trí đã dừng
                setIsPreviewPlaying(true);
                console.log('Playing song:', song.title);
            } else {
                previewAudio.pause();  // Pause ngay tại chỗ
                setIsPreviewPlaying(false);
                console.log('Pausing song:', song.title);
            }
            return;
        }



        // Stop current preview if playing
        if (previewAudio) {
            previewAudio.pause();
            previewAudio.currentTime = 0;
        }


        // Create new audio element
        const audio = new Audio(`${song.streamUrl}`);


        // Set up event listeners
        audio.addEventListener('loadedmetadata', () => {
            const startTime = Math.max(0, (song.duration || 30) / 2);
            audio.currentTime = startTime;
        });


        audio.addEventListener('timeupdate', () => {
            const startTime = Math.max(0, (song.duration || 30) / 2);
            if (audio.currentTime >= startTime + 15) {
                audio.pause();
                setCurrentPreviewSongId(null);
                setIsPreviewPlaying(false);
            }
        });


        audio.addEventListener('ended', () => {
            setCurrentPreviewSongId(null);
            setIsPreviewPlaying(false);
        });


        audio.addEventListener('error', () => {
            console.error('Error loading audio preview');
            setCurrentPreviewSongId(null);
            setIsPreviewPlaying(false);
        });


        setPreviewAudio(audio);
        setCurrentPreviewSongId(song.id);
        audio.play().then(() => {
            setIsPreviewPlaying(true);
        }).catch(err => {
            console.error('Error playing preview:', err);
            setCurrentPreviewSongId(null);
            setIsPreviewPlaying(false);
        });
    };


    const formatSongDuration = (seconds?: number): string => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };


    if (!isOpen) return null;


    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#1e1e1e] rounded-xl w-full max-w-2xl max-h-[80vh] border border-[#333] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-[#333]">
                    <div>
                        <h2 className="text-xl font-bold text-white">Add Songs to Playlist</h2>
                        {selectedSongIds.size > 0 && (
                            <p className="text-sm text-[#a7a7a7] mt-1">
                                {selectedSongIds.size} song{selectedSongIds.size !== 1 ? 's' : ''} selected
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-[#a7a7a7] hover:text-white transition-colors">
                        <div className="p-1 rounded-full hover:bg-white/10"><X size={20} /></div>
                    </button>
                </div>


                {/* Search Input */}
                <div className="p-4 border-b border-[#333]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a7a7a7]" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for songs..."
                            className="w-full bg-[#2a2a2a] border border-[#333] rounded-full px-10 py-2 text-white placeholder-[#a7a7a7] focus:outline-none focus:border-[#ff7a3c] transition-colors"
                            autoFocus
                        />
                        {isSearching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ff7a3c] animate-spin" size={18} />
                        )}
                    </div>
                </div>


                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {!searchQuery.trim() ? (
                        <div className="text-center py-16">
                            <Search className="w-16 h-16 text-[#a7a7a7]/30 mx-auto mb-4" />
                            <p className="text-[#a7a7a7] text-sm">Start typing to search for songs...</p>
                        </div>
                    ) : isSearching ? (
                        <div className="text-center py-16">
                            <Loader2 className="w-12 h-12 text-[#ff7a3c] animate-spin mx-auto mb-4" />
                            <p className="text-[#a7a7a7] text-sm">Searching...</p>
                        </div>
                    ) : searchedSongs.length === 0 ? (
                        <div className="text-center py-16">
                            <Music className="w-16 h-16 text-[#a7a7a7]/30 mx-auto mb-4" />
                            <p className="text-center text-[#a7a7a7] text-sm">No songs found</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {searchedSongs.map((song) => {
                                const isPlayingPreview = currentPreviewSongId === song.id;
                                const isSelected = selectedSongIds.has(song.id);


                                return (
                                    <div
                                        key={song.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors group ${isSelected
                                            ? 'bg-[#ff7a3c]/10 border-[#ff7a3c]'
                                            : 'hover:bg-[#333] border-transparent'
                                            }`}
                                    >
                                        {/* Checkbox */}
                                        <button
                                            onClick={() => toggleSongSelection(song.id)}
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected
                                                ? 'bg-[#ff7a3c] border-[#ff7a3c]'
                                                : 'border-[#555] hover:border-[#ff7a3c]'
                                                }`}
                                        >
                                            {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                                        </button>


                                        {/* Preview Button */}
                                        <button
                                            onClick={() => handlePreviewSong(song)}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isPlayingPreview && isPreviewPlaying
                                                ? 'bg-[#ff7a3c] text-black hover:scale-105'
                                                : 'bg-[#2a2a2a] text-white hover:bg-[#ff7a3c] hover:text-black'
                                                }`}
                                            title="Preview 15 seconds"
                                        >
                                            {isPlayingPreview && isPreviewPlaying ? (
                                                <Pause size={16} fill="currentColor" />
                                            ) : (
                                                <Play size={16} fill="currentColor" className="ml-0.5" />
                                            )}
                                        </button>


                                        {/* Song Cover */}
                                        <div className="w-10 h-10 bg-[#333] rounded overflow-hidden flex-shrink-0">
                                            {song.coverUrl ? (
                                                <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-[#ff7a3c] to-[#ff4d6d] flex items-center justify-center text-xs font-bold text-white">
                                                    {song.title.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>


                                        {/* Song Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white font-medium truncate">{song.title}</div>
                                            <div className="text-[#a7a7a7] text-sm truncate">
                                                {song.artist || song.uploader || 'Unknown'}
                                            </div>
                                        </div>


                                        {/* Duration */}
                                        <div className="text-[#a7a7a7] text-sm font-mono hidden sm:block">
                                            {formatSongDuration(song.duration)}
                                        </div>


                                        {/* Quick Add Button (single song) */}
                                        <button
                                            onClick={() => handleAddSingleSong(song.id)}
                                            className="px-4 py-2 bg-[#ff7a3c] hover:bg-[#ff8c52] text-white text-sm font-bold rounded-full transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                        >
                                            Add
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>


                <div className="flex justify-between items-center gap-3 p-4 border-t border-[#333]">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-white border border-[#555] rounded-full hover:border-white transition-colors"
                    >
                        Close
                    </button>

                    {selectedSongIds.size > 0 && (
                        <button
                            onClick={handleAddMultipleSongs}
                            disabled={isAddingMultiple}
                            className="px-6 py-2 bg-[#ff7a3c] hover:bg-[#ff8c52] text-white font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isAddingMultiple ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                `Add ${selectedSongIds.size} Song${selectedSongIds.size !== 1 ? 's' : ''}`
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}