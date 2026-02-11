import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import type { SongDto } from '../types/api';
import { incrementPlayCount } from '../utils/songStaticsAPI';
import { addToListenHistory } from '../utils/fetchAPI';
import { musicControlService } from '../services/musicControlService';
import { userStatusService } from '../services/userStatusService';

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
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [currentSong, setCurrentSong] = useState<SongDto | null>(null);
    const [playlist, setPlaylist] = useState<SongDto[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [isActiveDevice, setIsActiveDevice] = useState(false);

    const isSyncingRef = useRef(false);
    const currentDeviceIdRef = useRef<string | undefined>(undefined);

    const hasCountedPlayRef = useRef(false);
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

        const handlePlay = () => {
            setIsPlaying(true);
            // Update user status when playing
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
    }, []); // Empty deps - only run on mount

    useEffect(() => {
        let isSubscribed = true;

        const initMusicControl = async () => {
            if (!isSubscribed) return;

            try {
                await musicControlService.connect();

                if (!isSubscribed) {
                    // Component unmounted during connection - but don't disconnect singleton
                    return;
                }


                // Register this device
                const deviceName = `Web - ${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}`;
                const deviceType = navigator.userAgent.includes('Mobile') ? 'mobile' : 'web';
                await musicControlService.registerDevice(deviceName, deviceType);

                // Listen to playback commands from other devices
                musicControlService.onPlay(() => {
                    if (!isSyncingRef.current && audioRef.current) {
                        isSyncingRef.current = true;
                        safePlay(audioRef.current).finally(() => {
                            isSyncingRef.current = false;
                        });
                    }
                });

                musicControlService.onPause(() => {
                    if (!isSyncingRef.current && audioRef.current) {
                        isSyncingRef.current = true;
                        audioRef.current.pause();
                        setTimeout(() => { isSyncingRef.current = false; }, 100);
                    }
                });

                musicControlService.onNext(() => {
                    if (!isSyncingRef.current) {
                        // Call next song handler
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
                    }
                });

                musicControlService.onPrevious(() => {
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
                });

                musicControlService.onSetVolume((vol: number) => {
                    if (!isSyncingRef.current) {
                        isSyncingRef.current = true;
                        setVolumeState(vol);
                        setTimeout(() => { isSyncingRef.current = false; }, 100);
                    }
                });

                musicControlService.onPlaySong((songId: string, startTime: number) => {
                    console.log("Received PlaySong command:", songId, startTime);
                    // TODO: Load and play the specific song
                });

                // Handle playback state updates from other devices
                musicControlService.onPlaybackStateUpdated((state) => {
                    if (isSyncingRef.current) return;
                    
                    console.log("Received PlaybackState update:", state);
                    
                    // Update UI state for all devices
                    // Find the song in current playlist if available
                    const currentPlaylist = playlistRef.current;
                    let songToUpdate = currentPlaylist.find(s => s.id === state.currentSongId);
                    
                    if (songToUpdate && currentSongRef.current?.id !== state.currentSongId) {
                        setCurrentSong(songToUpdate);
                        const index = currentPlaylist.findIndex(s => s.id === state.currentSongId);
                        if (index >= 0) {
                            setCurrentIndex(index);
                        }
                    }
                    
                    setIsPlaying(state.isPlaying);
                    setVolumeState(state.volume);
                    
                    // Only play audio on active device
                    const audio = audioRef.current;
                    if (audio && songToUpdate) {
                        const activeDeviceId = state.playlistId; // We can use a custom field or check active device
                        const myDeviceId = currentDeviceIdRef.current;
                        
                        // Check if this is the active device
                        musicControlService.getConnectedDevices().then((deviceList) => {
                            const isThisDeviceActive = deviceList.activeDeviceId === myDeviceId;
                            
                            if (isThisDeviceActive && state.currentSongId) {
                                // This is the active device - update audio
                                if (audio.src !== songToUpdate.streamUrl) {
                                    audio.src = songToUpdate.streamUrl;
                                    audio.load();
                                }
                                audio.currentTime = state.currentTime;
                                if (state.isPlaying) {
                                    safePlay(audio);
                                } else {
                                    audio.pause();
                                }
                            } else {
                                // This is not the active device - pause local audio
                                audio.pause();
                            }
                        }).catch(console.error);
                    }
                });

                // Handle active device changes
                musicControlService.onActiveDeviceChanged((activeDevice) => {
                    console.log("Active device changed:", activeDevice);
                    const myDeviceId = musicControlService.getCurrentDeviceId();
                    setIsActiveDevice(activeDevice.deviceId === myDeviceId);
                    
                    // If this device becomes inactive, pause local audio
                    if (activeDevice.deviceId !== myDeviceId && audioRef.current) {
                        audioRef.current.pause();
                    }
                    
                    // Get updated playback state
                    musicControlService.getPlaybackState().then((state) => {
                        if (state && state.currentSongId) {
                            console.log("Syncing playback state after device change:", state);
                        }
                    }).catch(console.error);
                });

                // Handle device registration
                musicControlService.onDeviceRegistered(async (deviceId) => {
                    console.log("Device registered with ID:", deviceId);
                    currentDeviceIdRef.current = deviceId;
                    
                    try {
                        // Get list of connected devices
                        const deviceList = await musicControlService.getConnectedDevices();
                        console.log("Connected devices:", deviceList);
                        
                        // If this is the only device (first device), automatically set it as active
                        if (deviceList.devices.length === 1) {
                            console.log("First device - automatically setting as active");
                            await musicControlService.selectActiveDevice(deviceId);
                            setIsActiveDevice(true);
                        } else if (deviceList.activeDeviceId) {
                            // There are other devices and one is already active
                            console.log("Multiple devices detected, active device:", deviceList.activeDeviceId);
                            setIsActiveDevice(deviceList.activeDeviceId === deviceId);
                            
                            // Sync playback state from server
                            const state = await musicControlService.getPlaybackState();
                            if (state && state.currentSongId) {
                                console.log("Syncing playback state from server:", state);
                            }
                        } else {
                            // Multiple devices but no active device - let user choose
                            console.log("Multiple devices but no active device - waiting for user selection");
                        }
                    } catch (error) {
                        console.error("Error handling device registration:", error);
                    }
                });

            } catch (error) {
                if (isSubscribed) {
                    console.error("Failed to connect to MusicControl Hub:", error);
                }
            }
        };

        initMusicControl();

        return () => {
            isSubscribed = false;
            // Don't disconnect - the singleton service handles its own lifecycle
        };
    }, []); // Empty deps - handlers use refs

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
            
            // Sync playback state to all devices
            if (!isSyncingRef.current) {
                const playbackState = {
                    currentSongId: song.id,
                    isPlaying: true,
                    currentTime: 0,
                    volume: volume,
                    queue: songPlaylist ? songPlaylist.map(s => s.id) : [song.id],
                    lastUpdated: new Date().toISOString()
                };
                musicControlService.syncPlaybackState(playbackState).catch(console.error);
            }
        });
    }, [volume]);

    // Toggle play/pause
    const togglePlayPause = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || !currentSong) return;

        if (isPlaying) {
            audio.pause();
            // Sync pause to other devices
            if (!isSyncingRef.current) {
                musicControlService.pause().catch(console.error);
                
                // Sync playback state
                if (currentSong) {
                    const playbackState = {
                        currentSongId: currentSong.id,
                        isPlaying: false,
                        currentTime: audio.currentTime,
                        volume: volume,
                        queue: playlist.map(s => s.id),
                        lastUpdated: new Date().toISOString()
                    };
                    musicControlService.syncPlaybackState(playbackState).catch(console.error);
                }
            }
        } else {
            safePlay(audio);
            // Sync play to other devices
            if (!isSyncingRef.current) {
                musicControlService.play().catch(console.error);
                
                // Sync playback state
                if (currentSong) {
                    const playbackState = {
                        currentSongId: currentSong.id,
                        isPlaying: true,
                        currentTime: audio.currentTime,
                        volume: volume,
                        queue: playlist.map(s => s.id),
                        lastUpdated: new Date().toISOString()
                    };
                    musicControlService.syncPlaybackState(playbackState).catch(console.error);
                }
            }
        }
    }, [isPlaying, currentSong, volume, playlist]);

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
                
                // Sync playback state
                const playbackState = {
                    currentSongId: song.id,
                    isPlaying: true,
                    currentTime: 0,
                    volume: volume,
                    queue: playlist.map(s => s.id),
                    lastUpdated: new Date().toISOString()
                };
                musicControlService.syncPlaybackState(playbackState).catch(console.error);
            });
        }
    }, [playlist, currentIndex, volume]);

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
                
                // Sync playback state
                const playbackState = {
                    currentSongId: song.id,
                    isPlaying: true,
                    currentTime: 0,
                    volume: volume,
                    queue: playlist.map(s => s.id),
                    lastUpdated: new Date().toISOString()
                };
                musicControlService.syncPlaybackState(playbackState).catch(console.error);
            });
        }
    }, [playlist, currentIndex, volume]);

    // Seek to time
    const seekTo = useCallback((time: number) => {
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = time;
            setCurrentTime(time);
            // TODO: Sync seek position to other devices if needed
        }
    }, []);

    // Set volume
    const setVolume = useCallback((vol: number) => {
        setVolumeState(vol);
        setIsMuted(false);
        // Sync volume to other devices
        if (!isSyncingRef.current) {
            musicControlService.setVolume(vol).catch(console.error);
        }
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
