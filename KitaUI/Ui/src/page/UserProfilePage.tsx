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
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
            </div>
        );
    }

    if (error || !userData) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
                <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
                <p className="text-gray-500 mb-6">{error || 'This user does not exist.'}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                </button>
            </div>
        );
    }

    const joinDate = new Date(userData.createdAt);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 font-sans">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                {/* Profile Header Banner */}
                <div className="relative h-48 rounded-3xl overflow-hidden mb-20 border border-gray-800">
                    {userData.avatarUrl ? (
                        <img
                            src={userData.avatarUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover blur-xl scale-125"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-black"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 to-black/70"></div>
                    <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}
                    ></div>
                </div>

                {/* User Card */}
                <div className="bg-[#111] border border-gray-800 rounded-3xl p-8 -mt-28 relative z-10">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-gray-800 overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500">
                                {userData.avatarUrl ? (
                                    <img src={userData.avatarUrl} alt={userData.userName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">
                                        {userData.userName?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            {/* Online indicator */}
                            <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-[#111]"></div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-white mb-2">{userData.userName}</h1>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-400 mb-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>Joined {joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-purple-600/20 rounded-full text-purple-400">
                                    <Music className="w-4 h-4" />
                                    <span>{userData.subscription === 1 ? 'Premium' : 'Free'} User</span>
                                </div>
                            </div>

                            {/* Role Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full">
                                <Disc className="w-4 h-4 text-purple-400" />
                                <span className="text-gray-300 capitalize">{userData.role || 'Member'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Public Playlists Section */}
                <div className="mt-8">
                    <div className="bg-[#111] border border-gray-800 rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <ListMusic className="w-5 h-5 text-purple-500" />
                            Public Playlists
                            <span className="text-sm font-normal text-gray-500">({playlists.length})</span>
                        </h3>

                        {playlists.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-8">No public playlists yet.</p>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {playlists.map((playlist) => (
                                    <div
                                        key={playlist.id}
                                        onClick={() => navigate(`/music/playlist/${playlist.id}`)}
                                        className="group cursor-pointer"
                                    >
                                        <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-800 mb-3">
                                            {playlist.coverUrl ? (
                                                <img
                                                    src={playlist.coverUrl}
                                                    alt={playlist.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500">
                                                    <Music className="w-12 h-12 text-white/50" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                                                    <Music className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        <h4 className="font-medium text-white truncate group-hover:text-purple-400 transition-colors">
                                            {playlist.name}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            {playlist.songCount || 0} songs
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
