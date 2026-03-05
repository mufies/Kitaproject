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
        <div className="fixed bottom-0 left-0 right-0 h-[80px] md:h-[88px] bg-white border-t-4 border-black flex items-center justify-between px-3 md:px-6 gap-2 sm:gap-4 z-[1000] select-none transition-all duration-300 shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.1)]">
            {/* Left: Song Info */}
            <div className="flex items-center gap-3 min-w-0 w-[45%] md:w-[30%] lg:w-1/3 overflow-hidden">
                <div className="relative group w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 overflow-hidden border-2 border-black bg-gray-100 flex-shrink-0 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    onClick={() => navigate('/music/now-playing')}>
                    {currentSong.coverUrl ? (
                        <img
                            src={currentSong.coverUrl}
                            alt={currentSong.title}
                            className={`w-full h-full object-cover transition-transform duration-500 hover:scale-110 grayscale group-hover:grayscale-0`}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-black">
                            <ListMusic size={24} strokeWidth={2.5} />
                        </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex flex-col min-w-0 pr-2">
                    <h4 className="text-xs sm:text-sm font-black text-black hover:underline cursor-pointer truncate uppercase tracking-tighter"
                        title={currentSong.title}
                        onClick={() => navigate('/music/now-playing')}>
                        {currentSong.title}
                    </h4>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate flex items-center gap-1">
                        <span className="text-gray-400 hidden xl:inline">
                            {currentSong.artistId ? 'ARTIST:' : 'UPLOADER:'}
                        </span>
                        <span
                            className="hover:text-black hover:underline cursor-pointer transition-colors text-black"
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

                <div className="ml-2 hidden xl:block border-l-2 border-black pl-4">
                    <SongInteractionBar songId={currentSong.id} showStats={false} size="sm" />
                </div>
            </div>

            {/* Center: Controls & Progress */}
            <div className="flex flex-col items-center justify-center gap-1 md:gap-2 flex-1 max-w-[600px] mx-auto min-w-[150px]">

                {/* Waveform Progress Bar (Top) */}
                <div className="hidden md:flex items-center gap-3 w-full group h-8 mt-1">
                    <span className="text-[10px] font-black text-black w-[35px] text-right select-none border-2 border-black px-1">
                        {formatTime(currentTime)}
                    </span>

                    <div
                        className="relative flex-1 h-full flex items-center border-b-2 border-black pb-1"
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
                        <div className="w-full h-full flex items-end justify-between gap-[2px] pointer-events-none px-1">
                            {WAVE_BARS.map((heightScale, index) => {
                                const barProgress = index / (WAVE_BARS.length - 1);
                                const currentProgress = duration ? currentTime / duration : 0;
                                const isPlayed = barProgress <= currentProgress;

                                return (
                                    <div
                                        key={index}
                                        className={`w-1 transition-all duration-200 ${isPlayed
                                            ? 'bg-black'
                                            : 'bg-gray-300'
                                            }`}
                                        style={{
                                            height: `${heightScale * 100}%`,
                                            opacity: 1,
                                            transform: `scaleY(${isHoveringSeek && isPlayed ? 1.2 : 1})`,
                                            transformOrigin: 'bottom'
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <span className="text-[10px] font-black text-black w-[35px] select-none border-2 border-black px-1">
                        {formatTime(duration)}
                    </span>
                </div>

                {/* Controls (Bottom) */}
                <div className="flex items-center gap-6 md:gap-8">
                    <button onClick={previousSong} className="cursor-pointer text-black hover:text-white hover:bg-black p-1 transition-all active:scale-95 disabled:opacity-50 border-2 border-transparent hover:border-black" title="Previous">
                        <SkipBack size={18} fill="currentColor" strokeWidth={2} />
                    </button>

                    <button
                        onClick={togglePlayPause}
                        className="w-10 h-10 md:w-11 md:h-11 bg-white border-2 border-black text-black flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] cursor-pointer"
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? (
                            <Pause fill="currentColor" strokeWidth={2} />
                        ) : (
                            <Play fill="currentColor" strokeWidth={2} className="ml-1" />
                        )}
                    </button>

                    <button onClick={nextSong} className="cursor-pointer text-black hover:text-white hover:bg-black p-1 transition-all active:scale-95 disabled:opacity-50 border-2 border-transparent hover:border-black" title="Next">
                        <SkipForward size={18} fill="currentColor" strokeWidth={2} />
                    </button>
                </div>
            </div>

            {/* Right: Volume & Extras */}
            <div className="hidden md:flex items-center justify-end gap-3 w-[30%] lg:w-1/3 min-w-[180px]">
                <button className="text-black hover:text-white p-2 border-2 border-transparent hover:border-black hover:bg-black transition-colors" title="Lyrics">
                    <Mic2 size={18} strokeWidth={2.5} />
                </button>
                <div className="hidden lg:block">
                    <DeviceSelector />
                </div>

                <div className="flex items-center gap-2 ml-2 group"
                    onMouseEnter={() => setIsHoveringVolume(true)}
                    onMouseLeave={() => setIsHoveringVolume(false)}
                >
                    <button onClick={toggleMute} className="text-black hover:text-gray-500 transition-colors" title={isMuted ? "Unmute" : "Mute"}>
                        {isMuted || volume === 0 ? <VolumeX size={20} strokeWidth={2.5} /> : <Volume2 size={20} strokeWidth={2.5} />}
                    </button>

                    <div className="relative w-24 h-6 flex items-center border-2 border-black bg-white">
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
                        <div className="w-full h-full bg-gray-200 overflow-hidden relative">
                            <div
                                className={`h-full transition-colors ${isHoveringVolume ? 'bg-black' : 'bg-gray-800'}`}
                                style={{ width: `${isMuted ? 0 : volumePercent}%` }}
                            />
                        </div>
                        {/* Thumb */}
                        <div
                            className={`absolute w-1 h-full bg-white border-x-2 border-black shadow transition-all pointer-events-none ${isHoveringVolume ? 'opacity-100' : 'opacity-0'}`}
                            style={{ left: `max(0%, min(calc(${isMuted ? 0 : volumePercent}% - 4px), calc(100% - 4px)))` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
