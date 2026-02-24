import { useNavigate } from 'react-router-dom';
import { Play, TrendingUp, Disc, MoreHorizontal, Speaker } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import themeSong from '../assets/Song/theme.mp3';

export default function Home() {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(new Audio(themeSong));

    useEffect(() => {
        setIsVisible(true);
        // Set volume lower for subtle effect
        audioRef.current.volume = 0.5;

        // Restore saved playback time
        const savedTime = sessionStorage.getItem('homeVinylTime');
        if (savedTime) {
            audioRef.current.currentTime = parseFloat(savedTime);
        }

        return () => {
            // Save time and cleanup
            sessionStorage.setItem('homeVinylTime', audioRef.current.currentTime.toString());
            audioRef.current.pause();
        };
    }, []);

    const handleMouseEnter = () => {
        setIsPlaying(true);
        audioRef.current.play().catch(error => {
            console.error("Audio playback failed:", error);
        });
    };

    const handleMouseLeave = () => {
        setIsPlaying(false);
        audioRef.current.pause();
        // Save current time instead of resetting
        sessionStorage.setItem('homeVinylTime', audioRef.current.currentTime.toString());
    };

    const featuredPlaylists = [
        {
            id: '1',
            title: 'Kitasan Favorites',
            description: 'Top tracks for the festival season',
            image: '/src/assets/kitasan_playlist_1_1765341146682.png',
            songs: 50
        },
        {
            id: '2',
            title: 'Late Night Practice',
            description: 'Beats to keep you running',
            image: '/src/assets/kitasan_playlist_2_1765341165904.png',
            songs: 42
        },
        {
            id: '3',
            title: 'Victory Lap',
            description: 'Celebration anthems',
            image: '/src/assets/kitasan_playlist_1_1765341146682.png',
            songs: 38
        },
        {
            id: '4',
            title: 'Study & Strategy',
            description: 'Focus music for race planning',
            image: '/src/assets/kitasan_playlist_2_1765341165904.png',
            songs: 65
        }
    ];

    const trendingAlbums = [
        {
            id: '1',
            title: 'Black & Red',
            artist: 'Kitasan Black',
            listeners: '1.2M',
            image: '/src/assets/kitasan_trending_1765341183668.png'
        },
        {
            id: '2',
            title: 'Festival Night',
            artist: 'Satono Diamond',
            listeners: '980K',
            image: '/src/assets/kitasan_trending_1765341183668.png'
        },
        {
            id: '3',
            title: 'Speed of Sound',
            artist: 'Duramente',
            listeners: '850K',
            image: '/src/assets/kitasan_trending_1765341183668.png'
        }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden">
            {/* Background Texture */}
            <div className="fixed inset-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}>
            </div>

            {/* Decorative Elements */}
            <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-red-900/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-amber-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center px-6 lg:px-20 pt-20">
                <div className="grid lg:grid-cols-2 gap-12 w-full max-w-7xl mx-auto items-center">

                    {/* Left: Text Content */}
                    <div className={`space-y-8 z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-red-500/30 rounded-full bg-red-950/20 backdrop-blur-md">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            <span className="text-red-400 text-sm font-medium tracking-wider">KITA PROJECT</span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black leading-tight tracking-tight">
                            RHYTHM <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-amber-500">
                                OF SPEED
                            </span>
                        </h1>

                        <p className="text-xl text-gray-300 max-w-lg leading-relaxed border-l-2 border-red-600 pl-6">
                            Experience music with the intensity of a race. <br />
                            Curated playlists inspired by legends.
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <button
                                onClick={() => navigate('/music')}
                                className="group relative px-8 py-4 bg-red-600 text-white font-bold rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(220,20,60,0.5)] flex items-center gap-3"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <Play className="w-5 h-5 fill-current relative z-10" />
                                <span className="relative z-10">Start Listening</span>
                            </button>

                            <button
                                onClick={() => navigate('/music')}
                                className="px-8 py-4 border border-gray-700 hover:border-white rounded-full font-bold transition-all hover:bg-white/5 flex items-center gap-3"
                            >
                                <Disc className="w-5 h-5" />
                                <span>Browse Vinyls</span>
                            </button>
                        </div>
                    </div>

                    {/* Right: Spinning Vinyl */}
                    <div className={`relative flex justify-center items-center transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                        {/* Glow effect behind */}
                        <div className="absolute w-[80%] h-[80%] bg-red-600/20 rounded-full blur-[60px] animate-pulse"></div>

                        {/* The Vinyl Record */}
                        <div
                            className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full shadow-2xl cursor-pointer group"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            style={{
                                animation: `spin 8s linear infinite`,
                                animationPlayState: isPlaying ? 'running' : 'paused',
                                boxShadow: '0 0 0 10px #1a1a1a, 0 0 0 25px #0a0a0a, 0 20px 50px -10px rgba(0,0,0,0.5)'
                            }}
                        >
                            {/* Vinyl Texture */}
                            <div className="absolute inset-0 rounded-full bg-[#111] overflow-hidden border-4 border-gray-800">
                                <div className="absolute inset-0 opacity-20"
                                    style={{
                                        backgroundImage: 'repeating-radial-gradient(#333 0, #111 2px, #111 3px)'
                                    }}></div>

                                {/* Light reflection on vinyl */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent rounded-full pointer-events-none"></div>
                            </div>

                            {/* Center Label (Album Art) */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-red-600 rounded-full border-8 border-[#0a0a0a] overflow-hidden flex items-center justify-center">
                                <img
                                    src="src/assets/3ba24ff35f84be33f4458bb4599935b6.jpg"
                                    alt="Album Art"
                                    className="w-full h-full object-cover opacity-80 mix-blend-overlay"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="font-bold text-black/80 text-xl tracking-widest">キタ</span>
                                </div>
                            </div>
                        </div>

                        {/* Tone Arm (Stylized representation) */}
                        <div className={`absolute top-0 right-10 w-4 h-64 bg-gray-800 origin-top transition-transform duration-700 rounded-full shadow-xl border border-gray-700 ${isPlaying ? 'rotate-12' : '-rotate-12'}`}>
                            <div className="absolute -bottom-2 -left-2 w-8 h-12 bg-gray-700 rounded-md"></div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 animate-bounce">
                    <span className="text-xs uppercase tracking-[0.2em]">Scroll</span>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
                </div>
            </section>

            {/* Content Sections Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 space-y-32">

                {/* Featured Playlists */}
                <section>
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <h2 className="text-4xl font-bold mb-2 flex items-center gap-3">
                                <Disc className="w-8 h-8 text-red-500 animate-spin-slow" />
                                FEATURED COLLECTIONS
                            </h2>
                            <div className="h-1 w-20 bg-red-600 mt-4"></div>
                        </div>
                        <button onClick={() => navigate('/music')} className="text-sm font-bold tracking-widest hover:text-red-500 transition-colors">
                            VIEW ALL
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {featuredPlaylists.map((playlist) => (
                            <div
                                key={playlist.id}
                                className="group cursor-pointer relative"
                                onClick={() => navigate('/music')}
                            >
                                {/* Vinyl Record sliding out animation */}
                                <div className="absolute top-2 left-2 right-2 bottom-2 rounded-full bg-black border border-gray-800 transition-transform duration-500 group-hover:translate-x-12 group-hover:rotate-12 flex items-center justify-center shadow-xl z-0">
                                    <div className="w-1/3 h-1/3 bg-red-900 rounded-full border-4 border-black"></div>
                                </div>

                                {/* Sleeve Cover */}
                                <div className="relative z-10 aspect-square bg-gray-900 rounded-sm overflow-hidden shadow-lg transition-transform duration-300 group-hover:-translate-y-2 border border-gray-800 group-hover:border-red-500/50">
                                    <img
                                        src={playlist.image}
                                        alt={playlist.title}
                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0"
                                    />

                                    {/* Overlay Info */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                            <p className="text-red-400 text-xs font-bold tracking-widest mb-1">PLAYLIST</p>
                                            <h3 className="text-xl font-bold leading-tight">{playlist.title}</h3>
                                            <p className="text-sm text-gray-300 mt-1">{playlist.songs} Tracks</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Trending Charts */}
                <section className="grid lg:grid-cols-3 gap-12 items-start">
                    <div className="lg:col-span-1 space-y-6">
                        <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-800">
                            TOP <br /> CHARTS
                        </h2>
                        <p className="text-gray-300">
                            The most played tracks this week. Handpicked vibes for your daily routine.
                        </p>
                        <button
                            onClick={() => navigate('/music')}
                            className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-red-500 hover:text-white transition-colors"
                        >
                            Play Top 50
                        </button>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        {trendingAlbums.map((album, idx) => (
                            <div
                                key={album.id}
                                className="group flex items-center gap-6 p-4 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10 cursor-pointer"
                                onClick={() => navigate('/music')}
                            >
                                <span className="text-3xl font-black text-gray-800 group-hover:text-red-600 transition-colors w-12 text-center">
                                    0{idx + 1}
                                </span>

                                <div className="relative w-16 h-16 rounded overflow-hidden">
                                    <img src={album.image} className="w-full h-full object-cover" alt={album.title} />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="w-6 h-6 fill-white" />
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-bold text-lg group-hover:text-red-400 transition-colors">{album.title}</h3>
                                    <p className="text-gray-500 text-sm">{album.artist}</p>
                                </div>

                                <div className="hidden sm:flex items-center gap-8 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Speaker className="w-4 h-4" />
                                        <span>{album.listeners}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-green-500" />
                                    </div>
                                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer CTA */}
                <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-red-900/40 to-black border border-red-900/30 p-12 lg:p-24 text-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>

                    <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter">
                        JOIN THE <span className="text-red-500">KITA</span> CLUB
                    </h2>
                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                        Create your profile, build your collection, and share your taste with the community.
                    </p>

                    <button
                        onClick={() => navigate('/music')}
                        className="px-12 py-5 bg-white text-black font-black text-lg rounded-full hover:bg-red-600 hover:text-white transition-all transform hover:scale-105 shadow-2xl"
                    >
                        GET STARTED
                    </button>
                </section>

            </div>

            {/* Inline Styles for Keyframe Animations */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
