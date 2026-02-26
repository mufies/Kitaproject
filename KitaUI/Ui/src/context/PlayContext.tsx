import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import type { SongDto } from '../types/api';
import { incrementPlayCount } from '../utils/songStaticsAPI';
import { addToListenHistory } from '../utils/fetchAPI';
import { getSongById } from '../utils/musicAPI';
import { musicControlService } from '../services/musicControlService';
import { deviceService } from '../services/deviceService';
import { userStatusService } from '../services/userStatusService';
import type { DeviceConnection } from '../services/musicControlService';

const safePlay = (audio: HTMLAudioElement): Promise<void> => {
    return audio.play().catch((error) => {
        if (error.name !== 'AbortError') {
            console.error('Audio playback error:', error);
        }
    });
};

interface PlayContextType {
    currentSong: SongDto | null;
    playlist: SongDto[];
    currentIndex: number;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;

    // Device state
    isActiveDevice: boolean;
    devices: DeviceConnection[];
    activeDeviceId: string | undefined;
    currentDeviceId: string | undefined;

    // Actions
    playSong: (song: SongDto, playlist?: SongDto[], currentTime?: number) => void;
    togglePlayPause: () => void;
    nextSong: () => void;
    previousSong: () => void;
    seekTo: (time: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    switchDevice: (deviceId: string) => void;
}

const PlayContext = createContext<PlayContextType | undefined>(undefined);

export const PlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [currentSong, setCurrentSong] = useState<SongDto | null>(null);
    const [playlist, setPlaylist] = useState<SongDto[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);

    // Device state
    const [isActiveDevice, setIsActiveDevice] = useState(false);
    const [devices, setDevices] = useState<DeviceConnection[]>([]);
    const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>(undefined);
    const [currentDeviceId, setCurrentDeviceId] = useState<string | undefined>(undefined);

    const isSyncingRef = useRef(false);
    const hasCountedPlayRef = useRef(false);
    const currentSongRef = useRef<SongDto | null>(null);
    const currentIndexRef = useRef<number>(-1);
    const playlistRef = useRef<SongDto[]>([]);
    const isActiveDeviceRef = useRef(false);
    const currentTimeRef = useRef(0);          // Tracks last known playback position
    const lastSyncedSongIdRef = useRef<string | undefined>(undefined); // Avoids re-fetching

    // Keep refs in sync with state
    useEffect(() => { currentSongRef.current = currentSong; }, [currentSong]);
    useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
    useEffect(() => { playlistRef.current = playlist; }, [playlist]);
    useEffect(() => { isActiveDeviceRef.current = isActiveDevice; }, [isActiveDevice]);

    // Initialize audio element only once
    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.volume = 0;

        const audio = audioRef.current;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            currentTimeRef.current = audio.currentTime;   // keep ref in sync for device switching

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
                        addToListenHistory(nextSongItem.id).catch((error) => {
                            console.error('Failed to add to listen history:', error);
                        });
                    });
                }
            }
        };

        const handlePlay = () => {
            setIsPlaying(true);
            if (currentSongRef.current) {
                userStatusService.updateCurrentlyPlayingSong(
                    currentSongRef.current.id,
                    currentSongRef.current.title,
                    currentSongRef.current.artist,
                    currentSongRef.current.coverUrl || ""
                ).catch(err => console.error('Failed to update user status:', err));
            }
        };
        const handlePause = () => {
            setIsPlaying(false);
            userStatusService.clearCurrentlyPlayingSong()
                .catch(err => console.error('Failed to clear user status:', err));
        };
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
    }, []);

    // --- Device initialization (uses deviceService) ---
    useEffect(() => {
        let cleanupDevice: (() => void) | null = null;
        let isSubscribed = true;

        const init = async () => {
            try {
                cleanupDevice = await deviceService.initializeDevice();
                if (!isSubscribed) {
                    cleanupDevice?.();
                    return;
                }
            } catch (error) {
                console.error('[PlayContext] Failed to initialize device:', error);
            }
        };

        // Subscribe to device state changes
        const unsubDeviceChange = deviceService.onDeviceChange(async (info) => {
            if (!isSubscribed) return;

            const wasActive = isActiveDeviceRef.current;
            // Update ref EAGERLY (before React state re-render) so playback logic is correct
            isActiveDeviceRef.current = info.isActiveDevice;

            setIsActiveDevice(info.isActiveDevice);
            setDevices(info.devices);
            setActiveDeviceId(info.activeDeviceId);
            setCurrentDeviceId(info.currentDeviceId);

            if (!info.isActiveDevice && audioRef.current) {
                // Became inactive — pause local audio
                audioRef.current.pause();
            } else if (info.isActiveDevice && !wasActive) {
                // Just became the ACTIVE device
                const song = currentSongRef.current;
                const audio = audioRef.current;

                // Always fetch server playback state first so we don't auto-play
                // when the user just opened the page and nothing was playing.
                try {
                    const state = await musicControlService.getPlaybackState();
                    const shouldPlay = state?.isPlaying === true;

                    if (song && audio) {
                        console.log('[PlayContext] Became active device, shouldPlay:', shouldPlay, 'song:', song.title);
                        if (audio.src !== song.streamUrl) {
                            audio.src = song.streamUrl;
                            audio.load();
                        }
                        audio.currentTime = currentTimeRef.current;
                        if (shouldPlay) {
                            safePlay(audio).then(() => {
                                setIsPlaying(true);
                            }).catch(console.error);
                        }
                    } else if (!song && state?.currentSongId) {
                        // No song loaded locally yet — restore from server state
                        const response = await getSongById(state.currentSongId);
                        const fetchedSong = response?.data;
                        if (fetchedSong && audio) {
                            setCurrentSong(fetchedSong);
                            currentSongRef.current = fetchedSong;
                            lastSyncedSongIdRef.current = fetchedSong.id;
                            const startTime = state.currentTime || 0;
                            currentTimeRef.current = startTime;
                            audio.src = fetchedSong.streamUrl;
                            audio.load();
                            audio.currentTime = startTime;
                            if (shouldPlay) {
                                safePlay(audio).then(() => setIsPlaying(true)).catch(console.error);
                            }
                        }
                    }
                } catch (err) {
                    console.error('[PlayContext] Failed to fetch playback state on device activation:', err);
                }
            }
        });

        // Subscribe to playback sync (for new device joining an existing session)
        const unsubPlaybackSync = deviceService.onPlaybackSync(async (state) => {
            if (!isSubscribed) return;
            console.log('[PlayContext] Received initial playback sync:', state);
            setIsPlaying(state.isPlaying);
            const normalizedVolume = state.volume > 1 ? state.volume / 100 : state.volume;
            setVolumeState(normalizedVolume);
            currentTimeRef.current = state.currentTime || 0;

            // Fetch the song so controller browser displays it
            if (state.currentSongId && state.currentSongId !== lastSyncedSongIdRef.current) {
                lastSyncedSongIdRef.current = state.currentSongId;
                // First check local playlist
                const inPlaylist = playlistRef.current.find(s => s.id === state.currentSongId);
                if (inPlaylist) {
                    setCurrentSong(inPlaylist);
                    currentSongRef.current = inPlaylist;
                } else {
                    try {
                        const response = await getSongById(state.currentSongId);
                        const song = response?.data;
                        if (song && isSubscribed) {
                            setCurrentSong(song);
                            currentSongRef.current = song;
                        }
                    } catch (err) {
                        console.error('[PlayContext] Failed to fetch song from sync:', err);
                    }
                }
            }
        });

        init();

        return () => {
            isSubscribed = false;
            cleanupDevice?.();
            unsubDeviceChange();
            unsubPlaybackSync();
        };
    }, []);

    // --- Playback command listeners (from other devices) ---
    useEffect(() => {
        let isSubscribed = true;

        const handleRemotePlay = () => {
            if (!isSubscribed || !isActiveDeviceRef.current) return;
            if (!isSyncingRef.current && audioRef.current) {
                isSyncingRef.current = true;
                safePlay(audioRef.current).finally(() => {
                    isSyncingRef.current = false;
                });
            }
        };

        const handleRemotePause = () => {
            if (!isSubscribed || !isActiveDeviceRef.current) return;
            if (!isSyncingRef.current && audioRef.current) {
                isSyncingRef.current = true;
                audioRef.current.pause();
                setTimeout(() => { isSyncingRef.current = false; }, 100);
            }
        };

        const handleRemoteNext = () => {
            if (!isSubscribed || isSyncingRef.current || !isActiveDeviceRef.current) return;
            const currentIdx = currentIndexRef.current;
            const currentPlaylist = playlistRef.current;
            if (currentPlaylist.length > 0 && currentIdx < currentPlaylist.length - 1) {
                const nextIndex = currentIdx + 1;
                const song = currentPlaylist[nextIndex];
                if (song && audioRef.current) {
                    hasCountedPlayRef.current = false;
                    setCurrentIndex(nextIndex);
                    setCurrentSong(song);
                    audioRef.current.src = song.streamUrl;
                    audioRef.current.load();
                    safePlay(audioRef.current).then(() => {
                        setIsPlaying(true);
                        addToListenHistory(song.id).catch(console.error);
                    });
                }
            }
        };

        const handleRemotePrevious = () => {
            if (!isSubscribed || !isActiveDeviceRef.current) return;
            if (!isSyncingRef.current && audioRef.current) {
                const audio = audioRef.current;
                if (audio.currentTime > 3) {
                    audio.currentTime = 0;
                    return;
                }

                const currentIdx = currentIndexRef.current;
                const currentPlaylist = playlistRef.current;
                if (currentPlaylist.length > 0 && currentIdx > 0) {
                    const prevIndex = currentIdx - 1;
                    const song = currentPlaylist[prevIndex];
                    if (song) {
                        hasCountedPlayRef.current = false;
                        setCurrentIndex(prevIndex);
                        setCurrentSong(song);
                        audio.src = song.streamUrl;
                        audio.load();
                        safePlay(audio).then(() => {
                            setIsPlaying(true);
                            addToListenHistory(song.id).catch(console.error);
                        });
                    }
                }
            }
        };

        const handleRemoteVolume = (vol: number) => {
            if (!isSubscribed || isSyncingRef.current) return;
            // Only the active device applies local volume; others update UI
            const normalized = vol > 1 ? vol / 100 : vol;
            isSyncingRef.current = true;
            setVolumeState(normalized);
            if (isActiveDeviceRef.current && audioRef.current) {
                audioRef.current.volume = normalized;
            }
            setTimeout(() => { isSyncingRef.current = false; }, 100);
        };

        const handleRemoteSeek = (positionSeconds: number) => {
            if (!isSubscribed || !isActiveDeviceRef.current) return;
            if (audioRef.current) {
                audioRef.current.currentTime = positionSeconds;
            }
            setCurrentTime(positionSeconds);
        };

        const handleRemotePlaySong = (songId: string, _startTime: number) => {
            if (!isSubscribed) return;
            console.log('[PlayContext] Received PlaySong command:', songId, _startTime);
            // TODO: Load and play the specific song by ID
        };

        const handlePlaybackStateUpdated = async (state: {
            currentSongId?: string;
            isPlaying: boolean;
            currentTime: number;
            volume: number;
            queue: string[];
        }) => {
            if (!isSubscribed || isSyncingRef.current) return;
            console.log('[PlayContext] PlaybackState update:', state);

            // Keep time ref in sync so "become active" logic can resume correctly
            currentTimeRef.current = state.currentTime;

            const currentPlaylist = playlistRef.current;
            let songToUpdate = currentPlaylist.find(s => s.id === state.currentSongId);

            // Fetch song from API if not found in local playlist
            if (!songToUpdate && state.currentSongId && state.currentSongId !== lastSyncedSongIdRef.current) {
                lastSyncedSongIdRef.current = state.currentSongId;
                try {
                    const response = await getSongById(state.currentSongId);
                    const fetched = response?.data;
                    if (fetched && isSubscribed) {
                        songToUpdate = fetched;
                        setCurrentSong(fetched);
                        currentSongRef.current = fetched;
                    }
                } catch (err) {
                    console.error('[PlayContext] Could not fetch song for state update:', err);
                }
            } else if (songToUpdate && currentSongRef.current?.id !== state.currentSongId) {
                setCurrentSong(songToUpdate);
                const index = currentPlaylist.findIndex(s => s.id === state.currentSongId);
                if (index >= 0) setCurrentIndex(index);
            }

            setIsPlaying(state.isPlaying);
            const normalizedVol = state.volume > 1 ? state.volume / 100 : state.volume;
            setVolumeState(normalizedVol);

            // Only drive audio on the active device
            if (isActiveDeviceRef.current && audioRef.current && songToUpdate) {
                const audio = audioRef.current;
                if (audio.src !== songToUpdate.streamUrl) {
                    audio.src = songToUpdate.streamUrl;
                    audio.load();
                }
                audio.currentTime = state.currentTime;
                if (state.isPlaying) safePlay(audio);
                else audio.pause();
            } else if (!isActiveDeviceRef.current && audioRef.current) {
                audioRef.current.pause();
            }
        };

        musicControlService.onPlay(handleRemotePlay);
        musicControlService.onPause(handleRemotePause);
        musicControlService.onNext(handleRemoteNext);
        musicControlService.onPrevious(handleRemotePrevious);
        musicControlService.onSetVolume(handleRemoteVolume);
        musicControlService.onSeek(handleRemoteSeek);
        musicControlService.onPlaySong(handleRemotePlaySong);
        musicControlService.onPlaybackStateUpdated(handlePlaybackStateUpdated);

        return () => {
            isSubscribed = false;
            musicControlService.offPlay(handleRemotePlay);
            musicControlService.offPause(handleRemotePause);
            musicControlService.offNext(handleRemoteNext);
            musicControlService.offPrevious(handleRemotePrevious);
            musicControlService.offSetVolume(handleRemoteVolume);
            musicControlService.offSeek(handleRemoteSeek);
            musicControlService.offPlaySong(handleRemotePlaySong);
            musicControlService.offPlaybackStateUpdated(handlePlaybackStateUpdated);
        };
    }, []);

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

        hasCountedPlayRef.current = false;

        if (songPlaylist) {
            setPlaylist(songPlaylist);
            const index = songPlaylist.findIndex(s => s.id === song.id);
            setCurrentIndex(index >= 0 ? index : 0);
        } else {
            setPlaylist([song]);
            setCurrentIndex(0);
        }

        setCurrentSong(song);

        // Only play audio if this is the active device
        if (isActiveDeviceRef.current) {
            audio.src = song.streamUrl;
            audio.load();
            safePlay(audio).then(() => {
                setIsPlaying(true);
                addToListenHistory(song.id).catch((error) => {
                    console.error('Failed to add to listen history:', error);
                });
            });
        } else {
            // Controller mode — just update UI
            setIsPlaying(true);
        }

        // Sync playback state to all devices
        if (!isSyncingRef.current) {
            const playbackState = {
                currentSongId: song.id,
                isPlaying: true,
                currentTime: 0,
                volume: Math.round(volume * 100),
                queue: songPlaylist ? songPlaylist.map(s => s.id) : [song.id],
                lastUpdated: new Date().toISOString()
            };
            musicControlService.syncPlaybackState(playbackState).catch(console.error);
        }
    }, [volume]);

    // Toggle play/pause
    const togglePlayPause = useCallback(() => {
        const audio = audioRef.current;
        if (!currentSong) return;

        if (isActiveDeviceRef.current && audio) {
            // Active device — control local audio
            if (isPlaying) {
                audio.pause();
            } else {
                safePlay(audio);
            }
        }

        // Send command to other devices
        if (!isSyncingRef.current) {
            if (isPlaying) {
                musicControlService.pause().catch(console.error);
            } else {
                musicControlService.play().catch(console.error);
            }

            // Sync playback state
            if (currentSong) {
                const playbackState = {
                    currentSongId: currentSong.id,
                    isPlaying: !isPlaying,
                    currentTime: audio?.currentTime || 0,
                    volume: Math.round(volume * 100),
                    queue: playlist.map(s => s.id),
                    lastUpdated: new Date().toISOString()
                };
                musicControlService.syncPlaybackState(playbackState).catch(console.error);
            }
        }

        if (!isActiveDeviceRef.current) {
            // Controller mode — toggle UI state directly
            setIsPlaying(!isPlaying);
        }
    }, [isPlaying, currentSong, volume, playlist]);

    // Next song
    const nextSong = useCallback(() => {
        if (playlist.length === 0 || currentIndex >= playlist.length - 1) return;

        const audio = audioRef.current;
        const nextIndex = currentIndex + 1;
        const song = playlist[nextIndex];
        if (!song) return;

        hasCountedPlayRef.current = false;
        setCurrentIndex(nextIndex);
        setCurrentSong(song);

        if (isActiveDeviceRef.current && audio) {
            audio.src = song.streamUrl;
            audio.load();
            safePlay(audio).then(() => {
                setIsPlaying(true);
                addToListenHistory(song.id).catch((error) => {
                    console.error('Failed to add to listen history:', error);
                });
            });
        } else {
            setIsPlaying(true);
        }

        // Sync playback state
        const playbackState = {
            currentSongId: song.id,
            isPlaying: true,
            currentTime: 0,
            volume: Math.round(volume * 100),
            queue: playlist.map(s => s.id),
            lastUpdated: new Date().toISOString()
        };
        musicControlService.syncPlaybackState(playbackState).catch(console.error);
    }, [playlist, currentIndex, volume]);

    // Previous song
    const previousSong = useCallback(() => {
        const audio = audioRef.current;

        // If more than 3 seconds into song, restart it
        if (audio && audio.currentTime > 3) {
            audio.currentTime = 0;
            return;
        }

        if (playlist.length === 0 || currentIndex <= 0) return;

        const prevIndex = currentIndex - 1;
        const song = playlist[prevIndex];
        if (!song) return;

        hasCountedPlayRef.current = false;
        setCurrentIndex(prevIndex);
        setCurrentSong(song);

        if (isActiveDeviceRef.current && audio) {
            audio.src = song.streamUrl;
            audio.load();
            safePlay(audio).then(() => {
                setIsPlaying(true);
                addToListenHistory(song.id).catch((error) => {
                    console.error('Failed to add to listen history:', error);
                });
            });
        } else {
            setIsPlaying(true);
        }

        // Sync playback state
        const playbackState = {
            currentSongId: song.id,
            isPlaying: true,
            currentTime: 0,
            volume: Math.round(volume * 100),
            queue: playlist.map(s => s.id),
            lastUpdated: new Date().toISOString()
        };
        musicControlService.syncPlaybackState(playbackState).catch(console.error);
    }, [playlist, currentIndex, volume]);

    // Seek to time
    const seekTo = useCallback((time: number) => {
        const audio = audioRef.current;
        if (isActiveDeviceRef.current && audio) {
            // Active device — seek locally
            audio.currentTime = time;
        } else {
            // Controller — send seek command to active device via hub
            if (!isSyncingRef.current) {
                musicControlService.seek(time).catch(console.error);
            }
        }
        setCurrentTime(time);
    }, []);

    // Set volume
    const setVolume = useCallback((vol: number) => {
        setVolumeState(vol);
        setIsMuted(false);
        // Send to hub as 0-100 integer (backend scale)
        if (!isSyncingRef.current) {
            musicControlService.setVolume(Math.round(vol * 100)).catch(console.error);
        }
    }, []);

    // Toggle mute
    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    // Switch device
    const switchDevice = useCallback(async (deviceId: string) => {
        try {
            await deviceService.switchToDevice(deviceId);
        } catch (error) {
            console.error('Failed to switch device:', error);
        }
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
        isActiveDevice,
        devices,
        activeDeviceId,
        currentDeviceId,
        playSong,
        togglePlayPause,
        nextSong,
        previousSong,
        seekTo,
        setVolume,
        toggleMute,
        switchDevice,
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
