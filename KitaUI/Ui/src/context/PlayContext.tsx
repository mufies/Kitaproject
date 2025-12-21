import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import type { SongDto } from '../types/api';
import { incrementPlayCount } from '../utils/songStaticsAPI';
import { addToListenHistory } from '../utils/fetchAPI';

// Helper to handle play() promise - ignores AbortError which occurs when play is interrupted
const safePlay = (audio: HTMLAudioElement): Promise<void> => {
    return audio.play().catch((error) => {
        if (error.name !== 'AbortError') {
            console.error('Audio playback error:', error);
        }
    });
};

interface PlayContextType {
    // State
    currentSong: SongDto | null;
    playlist: SongDto[];
    currentIndex: number;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;

    // Actions
    playSong: (song: SongDto, playlist?: SongDto[], currentTime?: number) => void;
    togglePlayPause: () => void;
    nextSong: () => void;
    previousSong: () => void;
    seekTo: (time: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
}

const PlayContext = createContext<PlayContextType | undefined>(undefined);

export const PlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Audio element ref
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // State
    const [currentSong, setCurrentSong] = useState<SongDto | null>(null);
    const [playlist, setPlaylist] = useState<SongDto[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);

    // Track if play count has been incremented for current song
    const hasCountedPlayRef = useRef(false);

    // Initialize audio element
    // Refs to access current values in event handlers without causing re-renders
    const currentSongRef = useRef<SongDto | null>(null);
    const currentIndexRef = useRef<number>(-1);
    const playlistRef = useRef<SongDto[]>([]);

    // Keep refs in sync with state
    useEffect(() => {
        currentSongRef.current = currentSong;
    }, [currentSong]);

    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    useEffect(() => {
        playlistRef.current = playlist;
    }, [playlist]);

    // Initialize audio element only once
    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.volume = 0;

        const audio = audioRef.current;

        // Event listeners
        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);

            // Check 80% threshold for play count
            if (audio.duration > 0 && !hasCountedPlayRef.current) {
                const threshold = audio.duration * 0.8;
                if (audio.currentTime >= threshold && currentSongRef.current) {
                    hasCountedPlayRef.current = true;
                    incrementPlayCount(currentSongRef.current.id).catch((error) => {
                        console.error('Failed to increment play count:', error);
                    });
                }
            }
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            // Auto-play next song if available
            const currentIdx = currentIndexRef.current;
            const currentPlaylist = playlistRef.current;
            if (currentIdx < currentPlaylist.length - 1) {
                const nextIndex = currentIdx + 1;
                const nextSongItem = currentPlaylist[nextIndex];
                if (nextSongItem) {
                    setCurrentIndex(nextIndex);
                    setCurrentSong(nextSongItem);
                    hasCountedPlayRef.current = false;
                    audio.src = nextSongItem.streamUrl;
                    audio.load();
                    safePlay(audio).then(() => {
                        setIsPlaying(true);
                        // Add to listen history when next song starts
                        addToListenHistory(nextSongItem.id).catch((error) => {
                            console.error('Failed to add to listen history:', error);
                        });
                    });
                }
            }
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleError = (e: Event) => {
            const audioEl = e.target as HTMLAudioElement;
            if (audioEl.src) {
                console.error('Audio error:', audioEl.error?.code, audioEl.error?.message);
            }
        };


        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('error', handleError);
            audio.pause();
            audio.src = '';
        };
    }, []); // Empty deps - only run on mount

    // Update volume when changed
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    // Play a song
    const playSong = useCallback((song: SongDto, songPlaylist?: SongDto[]) => {
        const audio = audioRef.current;
        if (!audio) return;

        // Reset play count tracking for new song
        hasCountedPlayRef.current = false;

        // Set playlist if provided
        if (songPlaylist) {
            setPlaylist(songPlaylist);
            const index = songPlaylist.findIndex(s => s.id === song.id);
            setCurrentIndex(index >= 0 ? index : 0);
        } else {
            setPlaylist([song]);
            setCurrentIndex(0);
        }

        setCurrentSong(song);
        audio.src = song.streamUrl;
        audio.load();
        safePlay(audio).then(() => {
            setIsPlaying(true);
            // Add to listen history when song starts playing
            addToListenHistory(song.id).catch((error) => {
                console.error('Failed to add to listen history:', error);
            });
        });
    }, []);

    // Toggle play/pause
    const togglePlayPause = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || !currentSong) return;

        if (isPlaying) {
            audio.pause();
        } else {
            safePlay(audio);
        }
    }, [isPlaying, currentSong]);

    // Next song
    const nextSong = useCallback(() => {
        if (playlist.length === 0 || currentIndex >= playlist.length - 1) return;

        const audio = audioRef.current;
        if (!audio) return;

        const nextIndex = currentIndex + 1;
        const song = playlist[nextIndex];
        if (song) {
            hasCountedPlayRef.current = false;
            setCurrentIndex(nextIndex);
            setCurrentSong(song);
            audio.src = song.streamUrl;
            audio.load();
            safePlay(audio).then(() => {
                setIsPlaying(true);
                addToListenHistory(song.id).catch((error) => {
                    console.error('Failed to add to listen history:', error);
                });
            });
        }
    }, [playlist, currentIndex]);

    // Previous song
    const previousSong = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // If more than 3 seconds into song, restart it
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
            return;
        }

        if (playlist.length === 0 || currentIndex <= 0) return;

        const prevIndex = currentIndex - 1;
        const song = playlist[prevIndex];
        if (song) {
            hasCountedPlayRef.current = false;
            setCurrentIndex(prevIndex);
            setCurrentSong(song);
            audio.src = song.streamUrl;
            audio.load();
            safePlay(audio).then(() => {
                setIsPlaying(true);
                addToListenHistory(song.id).catch((error) => {
                    console.error('Failed to add to listen history:', error);
                });
            });
        }
    }, [playlist, currentIndex]);

    // Seek to time
    const seekTo = useCallback((time: number) => {
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    // Set volume
    const setVolume = useCallback((vol: number) => {
        setVolumeState(vol);
        setIsMuted(false);
    }, []);

    // Toggle mute
    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    const value: PlayContextType = {
        currentSong,
        playlist,
        currentIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playSong,
        togglePlayPause,
        nextSong,
        previousSong,
        seekTo,
        setVolume,
        toggleMute,
    };

    return (
        <PlayContext.Provider value={value}>
            {children}
        </PlayContext.Provider>
    );
};

export const usePlay = () => {
    const context = useContext(PlayContext);
    if (context === undefined) {
        throw new Error('usePlay must be used within a PlayProvider');
    }
    return context;
};
