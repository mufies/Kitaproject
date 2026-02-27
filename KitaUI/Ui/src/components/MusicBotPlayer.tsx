import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, Volume2, Music, List, Plus, X, UserX } from 'lucide-react';
import * as musicBotService from '../services/musicBotService';
import { voiceHubService } from '../services/voiceHubService';
import { searchSongs, getSongById } from '../services/musicService';
import type { Song } from '../services/musicService';

interface MusicBotPlayerProps {
    channelId: string;
    isConnected: boolean;
}

export default function MusicBotPlayer({ channelId, isConnected }: MusicBotPlayerProps) {
    const [botStatus, setBotStatus] = useState<musicBotService.BotStatus | null>(null);
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [volume, setVolume] = useState(50);
    const [showAddSong, setShowAddSong] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Song[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

    // Listen for SignalR events for real-time sync
    useEffect(() => {
        if (!isConnected) return;

        const handleBotStatusChanged = (data: any) => {
            console.log('Bot status changed via SignalR:', data);
            if (data.channelId === channelId) {
                setBotStatus({
                    channelId: data.channelId,
                    userCount: data.userCount,
                    currentSongId: data.currentSongId,
                    currentSongStreamUrl: data.currentSongStreamUrl,
                    playbackStartedAt: data.playbackStartedAt,
                    isPlaying: data.isPlaying,
                    queueLength: data.queueLength,
                    volume: data.volume,
                    scheduledLeaveTime: data.scheduledLeaveTime,
                    createdAt: data.createdAt
                });
                setVolume(data.volume);
            }
        };

        const handleBotLeft = (data: any) => {
            console.log('Bot left via SignalR:', data);
            if (data.channelId === channelId) {
                setBotStatus(null);
                setCurrentSong(null);
            }
        };

        voiceHubService.on('BotStatusChanged', handleBotStatusChanged);
        voiceHubService.on('BotLeft', handleBotLeft);

        return () => {
            voiceHubService.off('BotStatusChanged', handleBotStatusChanged);
            voiceHubService.off('BotLeft', handleBotLeft);
        };
    }, [channelId, isConnected]);

    // Fetch bot status periodically
    useEffect(() => {
        if (!isConnected) return;

        const fetchStatus = async () => {
            const status = await musicBotService.getBotStatus(channelId);
            if (status) {
                setBotStatus(status);
                setVolume(status.volume);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);
        return () => clearInterval(interval);
    }, [channelId, isConnected]);

    useEffect(() => {
        const fetchCurrentSong = async () => {
            if (botStatus?.currentSongId) {
                const song = await getSongById(botStatus.currentSongId);
                setCurrentSong(song);
            } else {
                setCurrentSong(null);
            }
        };

        fetchCurrentSong();
    }, [botStatus?.currentSongId]);

    // Sync audio playback with bot status
    useEffect(() => {
        if (!audioElement || !botStatus) return;

        // Update audio source if stream URL changed
        if (botStatus.currentSongStreamUrl && audioElement.src !== botStatus.currentSongStreamUrl) {
            audioElement.src = botStatus.currentSongStreamUrl;
            audioElement.load();

            // Calculate playback position based on start time
            if (botStatus.playbackStartedAt && botStatus.isPlaying) {
                const startTime = new Date(botStatus.playbackStartedAt).getTime();
                const currentTime = Date.now();
                const elapsedSeconds = (currentTime - startTime) / 1000;

                audioElement.currentTime = elapsedSeconds;
                audioElement.play().catch(err => console.error('Error playing audio:', err));
            }
        }

        // Sync play/pause state - MUST check isPlaying to control audio
        if (botStatus.isPlaying && audioElement.paused) {
            audioElement.play().catch(err => console.error('Error playing audio:', err));
        } else if (!botStatus.isPlaying && !audioElement.paused) {
            audioElement.pause();
        }

        // Sync volume (convert 0-100 to 0-1)
        audioElement.volume = botStatus.volume / 100;
    }, [audioElement, botStatus?.currentSongStreamUrl, botStatus?.isPlaying, botStatus?.volume, botStatus?.playbackStartedAt]);

    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            setIsSearching(true);
            const results = await searchSongs(searchQuery);
            setSearchResults(results);
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    const handlePlayPause = async () => {
        try {
            if (botStatus?.isPlaying) {
                await musicBotService.pauseBot(channelId);
            } else {
                await musicBotService.resumeBot(channelId);
            }
            const status = await musicBotService.getBotStatus(channelId);
            if (status) {
                setBotStatus(status);
                setVolume(status.volume);
            }
        } catch (error) {
            console.error('Error toggling playback:', error);
        }
    };

    const handleSkip = async () => {
        try {
            await musicBotService.skipBot(channelId);
            const status = await musicBotService.getBotStatus(channelId);
            if (status) {
                setBotStatus(status);
                setVolume(status.volume);
            }
        } catch (error) {
            console.error('Error skipping song:', error);
        }
    };

    const handleVolumeChange = async (newVolume: number) => {
        setVolume(newVolume);
        try {
            await musicBotService.setBotVolume(channelId, newVolume);
        } catch (error) {
            console.error('Error setting volume:', error);
        }
    };

    const handleAddToQueue = async (songId: string) => {
        try {
            const shouldAutoPlay = botStatus && !botStatus.currentSongId && botStatus.queueLength === 0;

            await musicBotService.addSongToQueue(channelId, songId);

            if (shouldAutoPlay) {
                setTimeout(async () => {
                    try {
                        await musicBotService.skipBot(channelId);
                    } catch (error) {
                        console.error('Error auto-playing first song:', error);
                    }
                }, 500); 
            }

            setShowAddSong(false);
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Error adding song to queue:', error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleJoinBot = async () => {
        try {
            await musicBotService.joinBot(channelId);
        } catch (error) {
            console.error('Error joining bot:', error);
        }
    };

    const handleKickBot = async () => {
        try {
            await musicBotService.leaveBot(channelId);
            setBotStatus(null);
            setCurrentSong(null);
            setVolume(50);
        } catch (error) {
            console.error('Error kicking bot:', error);
        }
    };

    if (!isConnected || !botStatus) {
        return (
            <div className="bg-[#1a141a] border-t border-[#ffffff0d] p-4 flex items-center justify-center">
                <button
                    onClick={handleJoinBot}
                    className="px-6 py-3 bg-gradient-to-r from-[#ff7a3c] to-[#ff4d4d] hover:from-[#ff8c52] hover:to-[#ff5e5e] text-white rounded-xl transition-all shadow-lg shadow-[#ff7a3c]/30 flex items-center gap-2 font-medium"
                >
                    <Music size={20} />
                    Join Music Bot
                </button>
            </div>
        );
    }

    return (
        <>
            <audio ref={setAudioElement} />

            <div className="bg-[#1a141a] border-t border-[#ffffff0d] p-4 space-y-3">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#ff7a3c] to-[#ff4d4d] rounded-xl flex items-center justify-center shadow-lg">
                        <Music size={24} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold truncate">
                            {currentSong?.title || 'No song playing'}
                        </h4>
                        <p className="text-[#ffffff70] text-sm truncate">
                            {currentSong?.artist || 'Music Bot'}
                        </p>
                    </div>
                    <div className="text-[#ffffff50] text-sm">
                        <List size={16} className="inline mr-1" />
                        {botStatus.queueLength} in queue
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePlayPause}
                            className="w-10 h-10 bg-[#ff7a3c] hover:bg-[#ff8c52] rounded-full flex items-center justify-center transition-all shadow-lg shadow-[#ff7a3c]/30"
                        >
                            {botStatus.isPlaying ? (
                                <Pause size={18} className="text-white" fill="white" />
                            ) : (
                                <Play size={18} className="text-white ml-0.5" fill="white" />
                            )}
                        </button>
                        <button
                            onClick={handleSkip}
                            disabled={botStatus.queueLength === 0}
                            className="w-10 h-10 bg-[#251d25] hover:bg-[#2d252d] disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all"
                        >
                            <SkipForward size={18} className="text-white" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 flex-1 max-w-xs">
                        <Volume2 size={18} className="text-[#ffffff70]" />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) => handleVolumeChange(Number(e.target.value))}
                            className="flex-1 h-1 bg-[#ffffff20] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#ff7a3c] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <span className="text-[#ffffff70] text-sm w-8">{volume}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowAddSong(true)}
                            className="px-4 py-2 bg-[#251d25] hover:bg-[#2d252d] text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                        >
                            <Plus size={16} />
                            Add Song
                        </button>
                        <button
                            onClick={handleKickBot}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium border border-red-500/20"
                            title="Kick bot from channel"
                        >
                            <UserX size={16} />
                            Kick Bot
                        </button>
                    </div>
                </div>

                {showAddSong && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-[#1a141a] rounded-2xl border border-[#ffffff0d] w-full max-w-2xl max-h-[80vh] flex flex-col">
                            <div className="p-6 border-b border-[#ffffff0d] flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">Add to Queue</h3>
                                <button
                                    onClick={() => {
                                        setShowAddSong(false);
                                        setSearchQuery('');
                                        setSearchResults([]);
                                    }}
                                    className="text-[#ffffff70] hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 border-b border-[#ffffff0d]">
                                <input
                                    type="text"
                                    placeholder="Search for songs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#251d25] text-white rounded-xl border border-[#ffffff0d] focus:outline-none focus:border-[#ff7a3c] transition-colors"
                                    autoFocus
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {isSearching ? (
                                    <div className="text-center text-[#ffffff50] py-8">Searching...</div>
                                ) : searchResults.length > 0 ? (
                                    <div className="space-y-2">
                                        {searchResults.map((song) => (
                                            <div
                                                key={song.id}
                                                className="flex items-center gap-4 p-3 bg-[#251d25] hover:bg-[#2d252d] rounded-xl transition-all cursor-pointer group"
                                                onClick={() => handleAddToQueue(song.id)}
                                            >
                                                <div className="w-12 h-12 bg-gradient-to-br from-[#ff7a3c] to-[#ff4d4d] rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Music size={20} className="text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-white font-medium truncate">{song.title}</h4>
                                                    <p className="text-[#ffffff70] text-sm truncate">{song.artist}</p>
                                                </div>
                                                <div className="text-[#ffffff50] text-sm">
                                                    {formatTime(song.duration)}
                                                </div>
                                                <Plus
                                                    size={20}
                                                    className="text-[#ff7a3c] opacity-0 group-hover:opacity-100 transition-opacity"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : searchQuery.length >= 2 ? (
                                    <div className="text-center text-[#ffffff50] py-8">No songs found</div>
                                ) : (
                                    <div className="text-center text-[#ffffff50] py-8">
                                        Start typing to search for songs
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
