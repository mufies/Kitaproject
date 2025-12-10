import { useNavigate } from 'react-router-dom';
import { Play, Music, TrendingUp, ChevronRight, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const featuredPlaylists = [
        {
            id: '1',
            title: 'Top Hits 2024',
            description: 'The biggest songs right now',
            image: '/src/assets/kitasan_playlist_1_1765341146682.png',
            songs: 50
        },
        {
            id: '2',
            title: 'Chill Vibes',
            description: 'Relax and unwind with these tracks',
            image: '/src/assets/kitasan_playlist_2_1765341165904.png',
            songs: 42
        },
        {
            id: '3',
            title: 'Workout Energy',
            description: 'High energy beats for your workout',
            image: '/src/assets/kitasan_playlist_1_1765341146682.png',
            songs: 38
        },
        {
            id: '4',
            title: 'Lo-Fi Study',
            description: 'Focus music for productivity',
            image: '/src/assets/kitasan_playlist_2_1765341165904.png',
            songs: 65
        }
    ];

    const trendingAlbums = [
        {
            id: '1',
            title: 'Midnight Dreams',
            artist: 'The Weeknd',
            image: '/src/assets/kitasan_trending_1765341183668.png'
        },
        {
            id: '2',
            title: 'Summer Vibes',
            artist: 'Dua Lipa',
            image: '/src/assets/kitasan_trending_1765341183668.png'
        },
        {
            id: '3',
            title: 'Urban Legends',
            artist: 'Drake',
            image: '/src/assets/kitasan_trending_1765341183668.png'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-900/30 via-black to-amber-900/20">
                    <div className="absolute inset-0 bg-[url('/src/assets/kitasan_hero_background_1765341125395.png')] bg-cover bg-center opacity-40 animate-pulse"></div>
                </div>

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div className="absolute top-0 left-0 w-96 h-96 bg-orange-600/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/30 rounded-full blur-3xl animate-pulse delay-700"></div>

                {/* Hero Content */}
                <div className={`relative z-10 text-center px-4 max-w-5xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600/20 border border-orange-500/50 rounded-full mb-6 backdrop-blur-sm">
                        <Star className="w-4 h-4 text-orange-400" />
                        <span className="text-sm text-orange-400 font-medium">Welcome to Kitaproject</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-orange-200 to-amber-200 bg-clip-text text-transparent animate-gradient">
                        Your Music,<br />Your Moments
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto">
                        Discover millions of songs, create playlists, and share your favorite music with friends
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={() => navigate('/music')}
                            className="group relative px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-700 rounded-full font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 flex items-center gap-2"
                        >
                            <Play className="w-5 h-5" fill="white" />
                            <span>Start Listening</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="relative">Start Listening</span>
                        </button>

                        <button
                            onClick={() => navigate('/music')}
                            className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
                        >
                            <Music className="w-5 h-5" />
                            <span>Browse Library</span>
                        </button>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <ChevronRight className="w-6 h-6 text-white/50 rotate-90" />
                </div>
            </section>

            {/* Featured Playlists Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-4xl font-bold mb-2 flex items-center gap-3">
                                <Star className="w-8 h-8 text-orange-500" />
                                Featured Playlists
                            </h2>
                            <p className="text-gray-400">Curated collections just for you</p>
                        </div>
                        <button
                            onClick={() => navigate('/music')}
                            className="text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-2 group"
                        >
                            <span>View All</span>
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredPlaylists.map((playlist, index) => (
                            <div
                                key={playlist.id}
                                className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/30"
                                style={{ animationDelay: `${index * 100}ms` }}
                                onClick={() => navigate('/music')}
                            >
                                <div className="relative aspect-square overflow-hidden">
                                    <img
                                        src={playlist.image}
                                        alt={playlist.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                                            <Play className="text-white ml-1" size={28} fill="white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h3 className="text-white font-bold text-lg mb-1 truncate group-hover:text-orange-400 transition-colors duration-300">
                                        {playlist.title}
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                                        {playlist.description}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>{playlist.songs} songs</span>
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-orange-400">
                                            Play →
                                        </span>
                                    </div>
                                </div>

                                <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange-500/50 rounded-xl transition-colors duration-300 pointer-events-none"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trending Now Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-orange-950/10 to-transparent">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-4xl font-bold mb-2 flex items-center gap-3">
                                <TrendingUp className="w-8 h-8 text-orange-500" />
                                Trending Now
                            </h2>
                            <p className="text-gray-400">What everyone's listening to</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {trendingAlbums.map((album, index) => (
                            <div
                                key={album.id}
                                className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/40 border border-gray-800 hover:border-orange-500/60"
                                onClick={() => navigate('/music')}
                            >
                                <div className="relative aspect-square overflow-hidden">
                                    <img
                                        src={album.image}
                                        alt={album.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-2"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>

                                    <div className="absolute top-4 right-4 bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                        <TrendingUp className="w-4 h-4" />
                                        #{index + 1}
                                    </div>

                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className="text-white font-bold text-xl mb-1 group-hover:text-orange-400 transition-colors">
                                            {album.title}
                                        </h3>
                                        <p className="text-gray-300 text-sm">{album.artist}</p>
                                    </div>

                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-2xl">
                                            <Play className="text-white ml-1" size={32} fill="white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="relative bg-gradient-to-r from-orange-600/20 via-amber-600/20 to-orange-600/20 rounded-3xl p-12 border border-orange-500/40 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-amber-600/10 animate-pulse"></div>

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-bold mb-4">
                                Ready to dive in?
                            </h2>
                            <p className="text-xl text-gray-300 mb-8">
                                Start your musical journey today with unlimited access to millions of songs
                            </p>
                            <button
                                onClick={() => navigate('/music')}
                                className="px-10 py-5 bg-gradient-to-r from-orange-600 to-orange-700 rounded-full font-bold text-lg hover:from-orange-500 hover:to-orange-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 flex items-center gap-3 mx-auto"
                            >
                                <Music className="w-6 h-6" />
                                <span>Explore Music Library</span>
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
