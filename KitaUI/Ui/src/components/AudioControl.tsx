import React, { useState } from 'react';
import { usePlay } from '../context/PlayContext';
import { SongInteractionBar } from './SongInteractionBar';
import { DeviceSelector } from './DeviceSelector';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Mic2, ListMusic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Generate a static waveform pattern (45 bars for better density)
const WAVE_BARS = Array.from({ length: 45 }, (_, i) => {
    // Combine sine waves and randomness for a natural look
    const val = Math.sin(i * 0.3) * 0.4 + 0.6;
    return Math.max(0.2, val * 0.7 + Math.random() * 0.3);
});

export const AudioControl: React.FC = () => {
    const navigate = useNavigate();
    const {
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        togglePlayPause,
        nextSong,
        previousSong,
        seekTo,
        setVolume,
        toggleMute,
        musicControlService,
    } = usePlay();

    const [isHoveringSeek, setIsHoveringSeek] = useState(false);
    const [isHoveringVolume, setIsHoveringVolume] = useState(false);

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        seekTo(time);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
    };

    // Calculate progress percentage for volume gradient
    const volumePercent = volume * 100;

    if (!currentSong) {
        return null; // Don't show anything if no song is active (cleaner)
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[88px] bg-black/80 backdrop-blur-xl border-t border-white/5 grid grid-cols-[1fr_2fr_1fr] items-center px-6 gap-4 z-[1000] select-none transition-all duration-300 pb-3">
            {/* Left: Song Info */}
            <div className="flex items-center gap-4 min-w-[180px] overflow-hidden">
                <div className="relative group w-14 h-14 rounded-md overflow-hidden shadow-lg flex-shrink-0 cursor-pointer"
                    onClick={() => navigate('/music/now-playing')}>
                    {currentSong.coverUrl ? (
                        <img
                            src={currentSong.coverUrl}
                            alt={currentSong.title}
                            className={`w-full h-full object-cover transition-transform duration-500 ${isPlaying ? 'scale-100' : 'scale-100'}`}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                            <ListMusic size={24} />
                        </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex flex-col min-w-0 pr-2">
                    <h4 className="text-sm font-medium text-white hover:underline cursor-pointer truncate"
                        title={currentSong.title}
                        onClick={() => navigate('/music/now-playing')}>
                        {currentSong.title}
                    </h4>
                    <p className="text-xs text-zinc-400 truncate flex items-center gap-1">
                        <span className="text-zinc-500">
                            {currentSong.artistId ? 'Artist:' : 'Uploader:'}
                        </span>
                        <span
                            className="hover:text-white hover:underline cursor-pointer transition-colors"
                            title={currentSong.artistId ? currentSong.artist : (currentSong.uploader || 'Unknown')}
                            onClick={() => {
                                if (currentSong.artistId) {
                                    navigate(`/artist/${currentSong.artistId}`);
                                } else if (currentSong.userId) {
                                    navigate(`/profile/${currentSong.userId}`);
                                }
                            }}>
                            {currentSong.artistId ? currentSong.artist : (currentSong.uploader || 'Unknown')}
                        </span>
                    </p>
                </div>

                <div className="ml-2 hidden lg:block">
                    <SongInteractionBar songId={currentSong.id} showStats={false} size="sm" />
                </div>
            </div>

            {/* Center: Controls & Progress */}
            <div className="flex flex-col items-center justify-center gap-3 max-w-[600px] w-full mx-auto">

                {/* Waveform Progress Bar (Top) */}
                <div className="flex items-center gap-3 w-full group h-8">
                    <span className="text-[11px] font-mono text-zinc-500 w-[35px] text-right select-none">
                        {formatTime(currentTime)}
                    </span>

                    <div
                        className="relative flex-1 h-full flex items-center"
                        onMouseEnter={() => setIsHoveringSeek(true)}
                        onMouseLeave={() => setIsHoveringSeek(false)}
                    >
                        {/* Interactive Input Overlay */}
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />

                        {/* Waveform Visualization */}
                        <div className="w-full h-full flex items-end justify-between gap-[2px] pointer-events-none px-1 pb-1">
                            {WAVE_BARS.map((heightScale, index) => {
                                const barProgress = index / (WAVE_BARS.length - 1);
                                const currentProgress = duration ? currentTime / duration : 0;
                                const isPlayed = barProgress <= currentProgress;

                                return (
                                    <div
                                        key={index}
                                        className={`w-1 rounded-t-full transition-all duration-200 ${isPlayed
                                            ? 'bg-[#ff7a3c]'
                                            : 'bg-zinc-700/40'
                                            }`}
                                        style={{
                                            height: `${heightScale * 100}%`,
                                            opacity: isPlayed ? 1 : 0.5,
                                            transform: `scaleY(${isHoveringSeek ? 1.1 : 1})`,
                                            transformOrigin: 'bottom'
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <span className="text-[11px] font-mono text-zinc-500 w-[35px] select-none">
                        {formatTime(duration)}
                    </span>
                </div>

                {/* Controls (Bottom) */}
                <div className="flex items-center gap-8">
                    <button onClick={previousSong} className="cursor-pointer text-zinc-400 hover:text-white transition-all hover:scale-110 active:scale-95 disabled:opacity-50" title="Previous">
                        <SkipBack size={14} fill="currentColor" />
                    </button>

                    <button
                        onClick={togglePlayPause}
                        className="w-9 h-9 rounded-full bg-[#ff7a3c] text-white flex items-center justify-center hover:scale-105 active:scale-95 hover:bg-[#ff8f5c] transition-all shadow-lg shadow-[#ff7a3c]/20 cursor-pointer"
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? (
                            <Pause fill="currentColor" />
                        ) : (
                            <Play fill="currentColor" />
                        )}
                    </button>

                    <button onClick={nextSong} className="cursor-pointer text-zinc-400 hover:text-white transition-all hover:scale-110 active:scale-95 disabled:opacity-50" title="Next">
                        <SkipForward size={17} fill="currentColor" />
                    </button>
                </div>
            </div>

            {/* Right: Volume & Extras */}
            <div className="flex items-center justify-end gap-3 min-w-[180px]">
                <button className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors hidden sm:block" title="Lyrics">
                    <Mic2 size={18} />
                </button>
                <div className="hidden md:block">
                    <DeviceSelector musicControlService={musicControlService} />
                </div>

                <div className="flex items-center gap-2 ml-2 group"
                    onMouseEnter={() => setIsHoveringVolume(true)}
                    onMouseLeave={() => setIsHoveringVolume(false)}
                >
                    <button onClick={toggleMute} className="text-zinc-300 hover:text-white transition-colors" title={isMuted ? "Unmute" : "Mute"}>
                        {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>

                    <div className="relative w-24 h-8 flex items-center">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        {/* Visual Volume Track (kept simple bar style) */}
                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-white rounded-full transition-colors ${isHoveringVolume ? 'bg-[#ff7a3c]' : 'bg-white'}`}
                                style={{ width: `${isMuted ? 0 : volumePercent}%` }}
                            />
                        </div>
                        {/* Thumb */}
                        <div
                            className={`absolute w-3 h-3 bg-white rounded-full shadow transition-all pointer-events-none transform -translate-x-[6px] ${isHoveringVolume ? 'scale-100' : 'scale-0'}`}
                            style={{ left: `${isMuted ? 0 : volumePercent}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
