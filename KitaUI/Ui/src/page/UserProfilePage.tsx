import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Calendar, Music, Loader2, Disc, ArrowLeft, ListMusic } from 'lucide-react';
import { fetchGetUserById, fetchPublicPlaylistsByUserId } from '../utils/fetchAPI';

interface UserProfile {
    id: string;
    userName: string;
    email: string;
    avatarUrl: string;
    role: string;
    subscription: number;
    createdAt: string;
}

interface PlaylistDto {
    id: string;
    name: string;
    description?: string;
    coverUrl?: string;
    songCount?: number;
}

const UserProfilePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [playlists, setPlaylists] = useState<PlaylistDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadUserProfile = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const [userResult, playlistsResult] = await Promise.all([
                    fetchGetUserById(id),
                    fetchPublicPlaylistsByUserId(id)
                ]);

                if (userResult.success && userResult.data) {
                    setUserData(userResult.data);
                } else {
                    setError('User not found');
                }

                if (playlistsResult.success && playlistsResult.data) {
                    setPlaylists(playlistsResult.data);
                }
            } catch (err) {
                console.error('Error loading user profile:', err);
                setError('Failed to load user profile');
            } finally {
                setLoading(false);
            }
        };

        loadUserProfile();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
                </div>
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-black animate-spin" />
                    <span className="text-black font-black uppercase tracking-[0.3em] text-xs">LOADING_DATA</span>
                </div>
            </div>
        );
    }

    if (error || !userData) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center text-black relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
                </div>
                <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center max-w-md w-full relative z-10">
                    <div className="absolute top-0 right-0 bg-black text-white px-2 font-black uppercase tracking-widest text-xs">ERR_404</div>
                    <div className="w-16 h-16 bg-gray-100 border-2 border-black flex items-center justify-center mx-auto mb-6 transform -rotate-12">
                        <span className="text-black font-black text-2xl">?</span>
                    </div>
                    <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter">Target Not Found</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-8">{error || 'Entity does not exist in archive.'}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 w-full py-4 bg-black text-white border-2 border-black font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_0px_rgba(200,200,200,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Return to Previous Log
                    </button>
                </div>
            </div>
        );
    }

    const joinDate = new Date(userData.createdAt);

    return (
        <div className="min-h-screen bg-white text-black pt-24 pb-12 font-sans selection:bg-black selection:text-white relative overflow-hidden">
            {/* Background Texture */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}>
            </div>
            {/* Diagonal overlay */}
            <div className="fixed -left-20 top-1/4 w-[120vw] h-40 bg-black opacity-[0.02] -rotate-12 pointer-events-none z-0"></div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-black hover:bg-black hover:text-white px-4 py-2 mb-6 transition-colors border-2 border-black font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                {/* Profile Header Banner */}
                <div className="relative h-48 rounded-none overflow-hidden mb-20 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)]">
                    {userData.avatarUrl ? (
                        <img
                            src={userData.avatarUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover blur-md scale-125"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gray-200"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-gray-400/80"></div>
                    <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,#000_20px,#000_40px)]"></div>

                    <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 font-black text-xs uppercase tracking-[0.2em] z-10">ARCHIVE_FILE: {userData.id.substring(0, 8)}</div>
                </div>

                {/* User Card */}
                <div className="bg-white border-4 border-black p-8 -mt-28 relative z-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] group">
                    <div className="absolute top-0 left-0 w-full h-3 background-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)] border-b-4 border-black"></div>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mt-4">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-32 h-32 rounded-none border-4 border-black overflow-hidden bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] group-hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                                {userData.avatarUrl ? (
                                    <img src={userData.avatarUrl} alt={userData.userName} className="w-full h-full object-cover transition-all duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-black">
                                        {userData.userName?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            {/* Online indicator */}
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-black rounded-none border-2 border-white flex items-center justify-center animate-pulse">
                                <div className="w-2 h-2 bg-white"></div>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-4xl font-black text-black mb-2 uppercase tracking-tighter">{userData.userName}</h1>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">
                                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 border border-gray-300 shadow-[2px_2px_0px_0px_rgba(200,200,200,1)]">
                                    <Calendar className="w-4 h-4 text-black" />
                                    <span>INIT: {joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(150,150,150,1)]">
                                    <Music className="w-4 h-4" />
                                    <span>{userData.subscription === 1 ? 'PREMIUM' : 'STANDARD'} LICENSE</span>
                                </div>
                            </div>

                            {/* Role Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-1 border-2 border-black text-black font-black uppercase text-xs tracking-widest bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <Disc className="w-4 h-4" />
                                <span>{userData.role || 'Member'} // ROLE</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Public Playlists Section */}
                <div className="mt-12 bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] relative">
                    <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1">PUBLIC_DATA</div>

                    <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-black uppercase tracking-tighter">
                        <ListMusic className="w-6 h-6 text-black" />
                        Accessible Playlists
                        <span className="text-sm font-bold text-gray-400">[{playlists.length}]</span>
                    </h3>

                    {playlists.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 bg-gray-50">
                            <Music className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-black font-bold uppercase tracking-widest text-sm">No public data detected.</p>
                            <p className="text-gray-400 text-xs mt-2 uppercase">Subject has no shared collections.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {playlists.map((playlist) => (
                                <div
                                    key={playlist.id}
                                    onClick={() => navigate(`/music/playlist/${playlist.id}`)}
                                    className="group cursor-pointer flex flex-col items-center border-2 border-transparent hover:border-black p-2 transition-colors relative"
                                >
                                    <div className="absolute top-0 right-0 w-4 h-4 bg-gray-100 border-b-2 border-l-2 border-black -mr-2 -mt-2 rotate-45 transform origin-center transition-transform group-hover:bg-black opacity-0 group-hover:opacity-100 z-10"></div>

                                    <div className="relative aspect-square w-full rounded-none overflow-hidden bg-gray-200 mb-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
                                        {playlist.coverUrl ? (
                                            <img
                                                src={playlist.coverUrl}
                                                alt={playlist.name}
                                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                <Music className="w-12 h-12 text-gray-400" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <div className="px-4 py-2 border-2 border-white text-white font-black uppercase text-xs tracking-widest">
                                                ACCESS DATA
                                            </div>
                                        </div>
                                    </div>
                                    <h4 className="font-black text-black uppercase tracking-tight text-center w-full truncate mb-1">
                                        {playlist.name}
                                    </h4>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        [{playlist.songCount || 0} TRACKS]
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
