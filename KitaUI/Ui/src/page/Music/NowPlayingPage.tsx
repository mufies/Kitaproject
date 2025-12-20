import React from 'react';
import { usePlay } from '../../context/PlayContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Disc } from 'lucide-react';

const NowPlayingPage: React.FC = () => {
    const { currentSong, isPlaying } = usePlay();
    const navigate = useNavigate();

    // State for cross-fade transition
    const [displayCover, setDisplayCover] = React.useState(currentSong?.coverUrl);
    const [nextCover, setNextCover] = React.useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = React.useState(false);

    React.useEffect(() => {
        if (currentSong?.coverUrl && currentSong.coverUrl !== displayCover && !isTransitioning) {
            setNextCover(currentSong.coverUrl);
            setIsTransitioning(true);

            const timer = setTimeout(() => {
                setDisplayCover(currentSong.coverUrl);
                setNextCover(null);
                setIsTransitioning(false);
            }, 1000); // Match transition duration

            return () => clearTimeout(timer);
        }
    }, [currentSong?.coverUrl, displayCover, isTransitioning]);

    // If no song is loaded or selected, show a placeholder or redirect
    // But better to just show a "No music playing" state
    if (!currentSong) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-160px)] text-zinc-400 gap-4">
                <Disc size={64} className="opacity-20" />
                <p>No music is currently playing</p>
                <button
                    onClick={() => navigate('/music')}
                    className="px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:scale-105 transition-transform"
                >
                    Discover Music
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-zinc-900 flex flex-col items-center justify-center overflow-hidden">
            {/* Background Transitions */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Base Layer (Previous/Current) */}
                <div
                    className="absolute inset-0 bg-cover bg-center blur-[100px] scale-125 opacity-60"
                    style={{ backgroundImage: `url(${displayCover || '/default-album-art.png'})` }}
                />

                <div
                    className={`absolute inset-0 bg-cover bg-center blur-[100px] scale-125 transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-60' : 'opacity-0'}`}
                    style={{ backgroundImage: `url(${nextCover || ''})` }}
                />

                <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="absolute top-6 left-6 z-20 p-2 rounded-full bg-black/20 hover:bg-white/10 text-white transition-all backdrop-blur-md border border-white/5"
            >
                <ArrowLeft size={24} />
            </button>

            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-32 max-w-7xl w-full px-8 md:px-16 h-full pb-24">

                {/* Left: Song Info */}
                <div className="flex-1 flex flex-col justify-center items-start text-left space-y-8 max-w-2xl animate-slideUp">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-2xl leading-[1.1] line-clamp-2">
                            {currentSong.title}
                        </h1>
                        <div className="flex flex-col items-start gap-2 text-xl md:text-2xl text-zinc-200 font-light">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-full bg-white/10 text-sm font-medium backdrop-blur-md border border-white/5 shadow-sm">
                                    {currentSong.artistId ? 'Artist' : 'Uploader'}
                                </span>
                                <span
                                    className="hover:text-white hover:underline cursor-pointer transition-colors font-medium text-shadow-sm"
                                    onClick={() => {
                                        if (currentSong.artistId) {
                                            navigate(`/artist/${currentSong.artistId}`);
                                        } else if (currentSong.userId) {
                                            navigate(`/profile/${currentSong.userId}`);
                                        }
                                    }}
                                >
                                    {currentSong.artistId ? currentSong.artist : (currentSong.uploader || 'Unknown')}
                                </span>
                            </div>
                            {currentSong.album && (
                                <p className="text-zinc-400 text-lg flex items-center gap-2 pl-1">
                                    <span className="w-1 h-1 rounded-full bg-zinc-500" />
                                    <span className="cursor-pointer hover:text-white transition-colors">{currentSong.album}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Additional decorations or controls could go here */}
                </div>

                {/* Right: Vinyl Record */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="relative w-[320px] h-[320px] md:w-[500px] md:h-[500px] flex-shrink-0">
                        {/* The Record */}
                        <div
                            className={`w-full h-full rounded-full shadow-2xl relative flex items-center justify-center border border-white/5`}
                            style={{
                                background: 'linear-gradient(135deg, #181818 0%, #050505 100%)',
                                boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.9)',
                                animation: 'spin 6s linear infinite', // Ensure this matches index.css keyframes name
                                animationPlayState: isPlaying ? 'running' : 'paused'
                            }}
                        >
                            {/* Grooves / Texture */}
                            <div
                                className="absolute inset-4 rounded-full opacity-20 pointer-events-none"
                                style={{
                                    background: 'repeating-radial-gradient(#4a4a4a 0, #4a4a4a 1px, transparent 2px, transparent 4px)'
                                }}
                            />

                            {/* Realistic Shine Effect */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/5 via-transparent to-white/5 pointer-events-none" />

                            {/* Inner Label / Album Art */}
                            <div className="w-[45%] h-[45%] rounded-full overflow-hidden relative shadow-inner border-4 border-[#1a1a1a]">
                                <img
                                    src={currentSong.coverUrl || '/default-album-art.png'}
                                    alt="Album Center"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Center Hole */}
                            <div className="absolute w-3 h-3 bg-black rounded-full shadow-sm z-20" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NowPlayingPage;
