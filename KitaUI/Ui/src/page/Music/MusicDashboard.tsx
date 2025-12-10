import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SongDto, PlaylistDto } from '../../types/api';
import { getAllSongs, getUserPlaylists, createPlaylist } from '../../utils/musicAPI';
import { searchSongs } from '../../services/musicService';
import { MusicPlayer } from '../../components/MusicPlayer';
import CreatePlaylistModal from '../../components/CreatePlaylistModal';
import { UploadSongModal } from '../../components/UploadSongModal';
import { ImportPlaylistModal } from '../../components/ImportPlaylistModal';
import { SongInteractionBar } from '../../components/SongInteractionBar';
import SearchBar from '../../components/SearchBar';

export const MusicDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [songs, setSongs] = useState<SongDto[]>([]);
    const [allSongs, setAllSongs] = useState<SongDto[]>([]); // Store all songs for fallback
    const [playlists, setPlaylists] = useState<PlaylistDto[]>([]);
    const [currentSong, setCurrentSong] = useState<SongDto | null>(null);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
    const [showUploadSong, setShowUploadSong] = useState(false);
    const [showImportPlaylist, setShowImportPlaylist] = useState(false);
    const [activeTab, setActiveTab] = useState<'songs' | 'playlists'>('songs');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [songsResponse, playlistsResponse] = await Promise.all([
                getAllSongs(),
                getUserPlaylists()
            ]);

            if (songsResponse.success) {
                setSongs(songsResponse.data);
                setAllSongs(songsResponse.data); // Store all songs
            }

            if (playlistsResponse.success) {
                setPlaylists(playlistsResponse.data);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle search with debouncing (debounce is in SearchBar component)
    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);

        // If query is empty, show all songs
        if (!query.trim()) {
            setSongs(allSongs);
            setIsSearching(false);
            return;
        }

        try {
            setIsSearching(true);
            const results = await searchSongs(query);
            setSongs(results);
        } catch (error) {
            console.error('Error searching songs:', error);
            setSongs([]);
        } finally {
            setIsSearching(false);
        }
    }, [allSongs]);

    const handlePlaySong = (song: SongDto, index: number) => {
        setCurrentSong(song);
        setCurrentSongIndex(index);
    };

    const handleNext = () => {
        if (songs.length > 0) {
            const nextIndex = (currentSongIndex + 1) % songs.length;
            setCurrentSong(songs[nextIndex]);
            setCurrentSongIndex(nextIndex);
        }
    };

    const handlePrevious = () => {
        if (songs.length > 0) {
            const prevIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1;
            setCurrentSong(songs[prevIndex]);
            setCurrentSongIndex(prevIndex);
        }
    };

    const handleCreatePlaylist = async (name: string, description: string, coverFile?: File) => {
        try {
            const response = await createPlaylist(
                { name, description: description || undefined },
                coverFile
            );
            if (response.success) {
                setPlaylists([...playlists, response.data]);
                setShowCreatePlaylist(false);
            }
        } catch (error) {
            console.error('Error creating playlist:', error);
        }
    };

    const handlePlaylistClick = (playlistId: string) => {
        navigate(`/music/playlist/${playlistId}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#121212] text-white p-6 pb-[120px]">
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <div className="w-12 h-12 border-4 border-[#282828] border-t-[#1db954] rounded-full animate-spin"></div>
                    <p className="text-[#b3b3b3] text-base">Loading your music...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#121212] text-white p-6 pb-[120px]">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-[#1db954] to-[#1ed760] bg-clip-text text-transparent">
                    Your Library
                </h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowImportPlaylist(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-transparent text-white border border-white rounded-full text-sm font-bold hover:bg-white hover:text-black hover:scale-105 transition-all"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                        </svg>
                        Import Playlist
                    </button>
                    <button
                        onClick={() => setShowUploadSong(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#1db954] text-white rounded-full text-sm font-bold hover:bg-[#1ed760] hover:scale-105 transition-all"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                        </svg>
                        Upload Song
                    </button>
                </div>
            </div>

            {/* Search Bar - Only show in Songs tab */}
            {activeTab === 'songs' && (
                <div className="mb-8 flex justify-center">
                    <SearchBar
                        onSearch={handleSearch}
                        placeholder="Search songs by title or artist..."
                        debounceMs={300}
                        isLoading={isSearching}
                    />
                </div>
            )}

            {/* Results count */}
            {activeTab === 'songs' && searchQuery && (
                <div className="mb-4 text-sm text-gray-400">
                    Found {songs.length} result{songs.length !== 1 ? 's' : ''} for "{searchQuery}"
                </div>
            )}

            <div className="flex gap-4 mb-6 border-b border-[#282828]">
                <button
                    className={`pb-3 text-base font-bold relative transition-colors ${activeTab === 'songs' ? 'text-white' : 'text-[#b3b3b3] hover:text-white'
                        }`}
                    onClick={() => setActiveTab('songs')}
                >
                    Songs
                    {activeTab === 'songs' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1db954]"></div>
                    )}
                </button>
                <button
                    className={`pb-3 text-base font-bold relative transition-colors ${activeTab === 'playlists' ? 'text-white' : 'text-[#b3b3b3] hover:text-white'
                        }`}
                    onClick={() => setActiveTab('playlists')}
                >
                    Playlists
                    {activeTab === 'playlists' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1db954]"></div>
                    )}
                </button>
            </div>

            <div>
                {activeTab === 'songs' ? (
                    <div>
                        {songs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-[#b3b3b3]">
                                <svg className="w-16 h-16 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                                <h3 className="text-2xl font-bold text-white">No songs yet</h3>
                                <p className="text-sm">Upload your first song to get started</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
                                {songs.map((song, index) => (
                                    <div
                                        key={song.id}
                                        className={`bg-[#181818] rounded-lg p-4 cursor-pointer transition-all hover:bg-[#282828] hover:-translate-y-1 ${currentSong?.id === song.id ? 'bg-[#282828] ring-2 ring-[#1db954]' : ''
                                            }`}
                                        onClick={() => handlePlaySong(song, index)}
                                    >
                                        <div className="relative w-full aspect-square rounded bg-[#282828] mb-4 overflow-hidden group">
                                            {song.coverUrl ? (
                                                <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[#b3b3b3]">
                                                    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center hover:bg-[#1ed760] hover:scale-110 transition-all shadow-lg">
                                                    {currentSong?.id === song.id ? (
                                                        <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M8 5v14l11-7z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="min-h-[62px]">
                                            <h3 className="text-base font-bold text-white mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                                                {song.title}
                                            </h3>
                                            <p className="text-sm text-[#b3b3b3] whitespace-nowrap overflow-hidden text-ellipsis mb-2">
                                                {song.artist}
                                            </p>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <SongInteractionBar songId={song.id} showStats={true} size="sm" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Your Playlists</h2>
                            <button
                                className="flex items-center gap-2 px-5 py-2.5 bg-transparent text-white border border-white rounded-full text-sm font-bold hover:bg-white hover:text-black hover:scale-105 transition-all"
                                onClick={() => setShowCreatePlaylist(true)}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                </svg>
                                Create Playlist
                            </button>
                        </div>

                        {playlists.length === 0 ? (
                            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-[#b3b3b3]">
                                <svg className="w-16 h-16 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                                <h3 className="text-2xl font-bold text-white">No playlists yet</h3>
                                <p className="text-sm">Create your first playlist to organize your music</p>
                                <button
                                    className="mt-4 px-8 py-3 bg-[#1db954] text-white rounded-full text-sm font-bold hover:bg-[#1ed760] hover:scale-105 transition-all"
                                    onClick={() => setShowCreatePlaylist(true)}
                                >
                                    Create Playlist
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
                                {playlists.map((playlist) => (
                                    <div
                                        key={playlist.id}
                                        className="bg-[#181818] rounded-lg p-4 cursor-pointer transition-all hover:bg-[#282828] hover:-translate-y-1"
                                        onClick={() => handlePlaylistClick(playlist.id)}
                                    >
                                        <div className="relative w-full aspect-square rounded bg-[#282828] mb-4 overflow-hidden group">
                                            {playlist.coverUrl ? (
                                                <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
                                            ) : playlist.songs && playlist.songs.length > 0 ? (
                                                <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5">
                                                    {playlist.songs.slice(0, 4).map((song, idx) => (
                                                        song.coverUrl ? (
                                                            <img key={idx} src={song.coverUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div key={idx} className="w-full h-full flex items-center justify-center bg-[#181818] text-[#b3b3b3]">
                                                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                                                </svg>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[#b3b3b3]">
                                                    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center hover:bg-[#1ed760] hover:scale-110 transition-all shadow-lg">
                                                    <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M8 5v14l11-7z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="min-h-[62px]">
                                            <h3 className="text-base font-bold text-white mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                                                {playlist.name}
                                            </h3>
                                            <p className="text-sm text-[#b3b3b3] line-clamp-2">
                                                {playlist.description || `${playlist.songs?.length || 0} songs`}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <MusicPlayer
                currentSong={currentSong}
                playlist={songs}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onSongEnd={handleNext}
            />

            {showCreatePlaylist && (
                <CreatePlaylistModal
                    isOpen={showCreatePlaylist}
                    onClose={() => setShowCreatePlaylist(false)}
                    onCreatePlaylist={handleCreatePlaylist}
                />
            )}

            {showUploadSong && (
                <UploadSongModal
                    onClose={() => setShowUploadSong(false)}
                    onSuccess={loadData}
                />
            )}

            {showImportPlaylist && (
                <ImportPlaylistModal
                    onClose={() => setShowImportPlaylist(false)}
                    onSuccess={loadData}
                />
            )}
        </div>
    );
};
