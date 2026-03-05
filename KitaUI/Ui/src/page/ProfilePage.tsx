import { useAuth } from '../context/AuthContext';
import { Mail, Calendar, Music, Star, Edit, Loader2, Camera, Check, X, Lock, Disc, Activity, Zap, Settings, LogOut, Upload } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { fetchGetProfile, fetchUploadAvatar, fetchUpdateUsername, fetchUpdatePassword, fetchRecentlyPlayed, fetchListenStats } from '../utils/fetchAPI';
import { getMySongs } from '../utils/musicAPI';
import type { SongDto, ListenHistoryDto, ListenHistoryStatsDto } from '../types/api';

interface UserProfile {
    id: string;
    userName: string;
    email: string;
    avatarUrl?: string;
    role: string;
}

export default function ProfilePage() {
    const { logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [newUsername, setNewUsername] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Password change states
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // My Songs state
    const [mySongs, setMySongs] = useState<SongDto[]>([]);
    const [loadingSongs, setLoadingSongs] = useState(true);

    // Listen History state
    const [recentActivity, setRecentActivity] = useState<ListenHistoryDto[]>([]);
    const [listenStats, setListenStats] = useState<ListenHistoryStatsDto | null>(null);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        loadUserProfile();
        loadMySongs();
        loadListenHistory();
        loadListenStats();
    }, []);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            setError('');
            const result = await fetchGetProfile();
            if (result.success) {
                setUserData(result.data);
            } else {
                setError(result.message || 'Failed to load profile');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const loadMySongs = async () => {
        try {
            setLoadingSongs(true);
            const result = await getMySongs();
            if (result.success) {
                setMySongs(result.data || []);
            }
        } catch (err) {
            console.error('Error loading songs:', err);
        } finally {
            setLoadingSongs(false);
        }
    };

    const loadListenHistory = async () => {
        try {
            setLoadingHistory(true);
            const result = await fetchRecentlyPlayed(10);
            if (result.success) {
                const limit = 5;
                const truncatedData = result.data.slice(0, limit);
                setRecentActivity(truncatedData);
            }
        } catch (err) {
            console.error('Error loading listen history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const loadListenStats = async () => {
        try {
            const result = await fetchListenStats();
            if (result.success) {
                setListenStats(result.data);
            }
        } catch (err) {
            console.error('Error loading listen stats:', err);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} mins ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')} `;
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        try {
            setUploading(true);
            setError('');
            const result = await fetchUploadAvatar(file);
            if (result.success) {
                await loadUserProfile();
            } else {
                setError(result.message || 'Failed to upload avatar');
            }
        } catch (err) {
            setError('Failed to upload avatar');
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateUsername = async () => {
        if (!newUsername.trim()) {
            setError('Username cannot be empty');
            return;
        }
        if (newUsername.trim().length < 3 || newUsername.trim().length > 30) {
            setError('Username must be between 3 and 30 characters');
            return;
        }

        try {
            setError('');
            const result = await fetchUpdateUsername(newUsername.trim());
            if (result.success) {
                setUserData(result.data);
                setIsEditing(false);
                setNewUsername('');
            } else {
                setError(result.message || 'Failed to update username');
            }
        } catch (err: any) {
            if (err.response?.status === 409) {
                setError('Username already exists');
            } else {
                setError(err.response?.data?.message || 'Failed to update username');
            }
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setNewUsername('');
        setError('');
    };

    const handlePasswordChange = (field: string, value: string) => {
        setPasswordData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleUpdatePassword = async () => {
        if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setError('All password fields are required');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        try {
            setUpdatingPassword(true);
            setError('');
            const result = await fetchUpdatePassword(passwordData.oldPassword, passwordData.newPassword);
            if (result.success) {
                setShowPasswordModal(false);
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                alert('Password updated successfully!');
            } else {
                setError(result.message || 'Failed to update password');
            }
        } catch (err: any) {
            if (err.response?.status === 400) {
                setError('Current password is incorrect');
            } else {
                setError(err.response?.data?.message || 'Failed to update password');
            }
        } finally {
            setUpdatingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
            </div>
        );
    }

    if (!userData) return null;

    // Dynamic stats based on real data
    const joinDate = new Date();
    const stats = [
        { label: 'Songs Played', value: listenStats?.totalListenCount?.toLocaleString() || '0', icon: Disc, color: 'text-blue-400' },
        { label: 'Listening Time', value: listenStats?.totalListenTimeFormatted || '0m', icon: Calendar, color: 'text-green-400' },
        { label: 'Unique Songs', value: listenStats?.uniqueSongsListened?.toString() || '0', icon: Music, color: 'text-purple-400' },
        { label: 'My Songs', value: mySongs.length.toString(), icon: Upload, color: 'text-orange-400' },
    ];

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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Profile Header Banner */}
                <div className="relative h-64 rounded-none overflow-hidden mb-24 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)]">
                    {/* Avatar as blurred background or fallback gradient */}
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

                    <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 font-black text-xs uppercase tracking-[0.2em] z-10">KITA // ARCHIVE</div>
                    <div className="absolute bottom-4 right-4 bg-white border-2 border-black px-3 py-1 font-black text-black text-xs uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10">USER DECK</div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 -mt-36 relative z-10">
                    {/* Left Column: Identity Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                            {/* Card Decorative Elements */}
                            <div className="absolute top-0 left-0 w-full h-3 background-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)] border-b-4 border-black"></div>
                            <div className="absolute bottom-0 right-0 w-16 h-16 border-t-4 border-l-4 border-black -mb-8 -mr-8 rotate-45"></div>

                            <div className="flex flex-col items-center text-center mt-4">
                                {/* Avatar */}
                                <div className="relative mb-6 group/avatar">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                    <div
                                        onClick={handleAvatarClick}
                                        className="w-40 h-40 rounded-none p-1 border-4 border-black bg-white cursor-pointer overflow-hidden relative shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                        <img
                                            src={userData.avatarUrl || 'https://via.placeholder.com/150'}
                                            alt={userData.userName}
                                            className="w-full h-full rounded-none object-cover transition-all duration-500 group-hover/avatar:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-sm">
                                            {uploading ? <Loader2 className="animate-spin text-black w-8 h-8" /> : <Camera className="text-black w-8 h-8" />}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 flex items-center justify-center w-12 h-12 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <Star className="w-5 h-5 text-black fill-black" />
                                    </div>
                                </div>

                                {/* Identity Info */}
                                <div className="space-y-4 mb-8 w-full">
                                    {isEditing ? (
                                        <div className="flex gap-2 justify-center">
                                            <input
                                                value={newUsername}
                                                onChange={(e) => setNewUsername(e.target.value)}
                                                className="bg-white border-2 border-black rounded-none px-3 py-2 text-black text-center w-full font-bold uppercase"
                                                placeholder="USERNAME"
                                            />
                                            <button onClick={handleUpdateUsername} className="bg-black text-white px-3 border border-black hover:bg-white hover:text-black transition-colors"><Check size={20} /></button>
                                            <button onClick={handleCancelEdit} className="bg-white text-black px-3 border-2 border-black hover:bg-gray-100 transition-colors"><X size={20} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 group/edit cursor-pointer border-b-2 border-transparent hover:border-black transition-colors pb-1 inline-flex mx-auto" onClick={() => { setIsEditing(true); setNewUsername(userData.userName); }}>
                                            <h1 className="text-3xl font-black text-black uppercase tracking-tighter">{userData.userName}</h1>
                                            <Edit className="w-4 h-4 text-black opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <span className="px-4 py-1 bg-black text-white text-xs font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(200,200,200,1)]">
                                            {userData.role} // RANK
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-center gap-3 text-gray-800 font-bold text-xs uppercase tracking-widest mt-6 bg-gray-100 p-2 border border-gray-300">
                                        <Mail className="w-4 h-4" />
                                        <span>{userData.email}</span>
                                    </div>

                                    <div className="flex items-center justify-center gap-3 text-gray-500 text-xs font-bold uppercase tracking-widest">
                                        <Calendar className="w-4 h-4" />
                                        <span>SYS.INIT: {joinDate.toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Settings Actions */}
                                <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t-2 border-gray-200">
                                    <button
                                        onClick={() => setShowPasswordModal(true)}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-white border-2 border-black hover:bg-gray-100 transition-colors text-xs font-black text-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] group/btn"
                                    >
                                        <Settings className="w-6 h-6 group-hover/btn:rotate-90 transition-transform duration-500" />
                                        <span>Security</span>
                                    </button>
                                    <button
                                        onClick={logout}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-black border-2 border-black hover:bg-white hover:text-black transition-colors text-xs font-black text-white uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(200,200,200,1)] group/logout"
                                    >
                                        <LogOut className="w-6 h-6 group-hover/logout:-translate-x-1 transition-transform" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Stats & Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.map((stat, index) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={index} className="bg-white border-2 border-black p-6 flex flex-col items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-8 h-8 bg-gray-100 border-b-2 border-l-2 border-black -mr-4 -mt-4 rotate-45 transform origin-center transition-transform group-hover:bg-black"></div>
                                        <div className="p-3 bg-gray-100 group-hover:bg-black group-hover:text-white transition-colors border border-gray-200 group-hover:border-black rounded-none">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-3xl font-black text-black z-10">{stat.value}</span>
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] text-center z-10">{stat.label}</span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] relative">
                            <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1">SYS.LOG</div>
                            <h2 className="text-2xl font-black mb-8 flex items-center gap-4 uppercase tracking-tighter text-black">
                                <Activity className="w-8 h-8 text-black" />
                                Activity Log
                            </h2>
                            {loadingHistory ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-black animate-spin" />
                                </div>
                            ) : recentActivity.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-300">
                                    <Music className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-black font-bold uppercase tracking-widest text-sm">No activity detected.</p>
                                    <p className="text-gray-400 text-xs mt-2 uppercase">Initiate playback sequence.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentActivity.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4 p-4 hover:bg-gray-100 transition-all group cursor-pointer border-2 border-transparent hover:border-black relative hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                            <div className="w-12 h-12 bg-gray-200 flex items-center justify-center overflow-hidden border border-black grayscale group-hover:grayscale-0">
                                                {item.coverUrl ? (
                                                    <img src={item.coverUrl} alt={item.songTitle || ''} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Music className="w-6 h-6 text-gray-500" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-black text-black text-lg leading-tight uppercase tracking-tight group-hover:translate-x-1 transition-transform">{item.songTitle || 'Unknown File'}</h4>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{item.artistName || 'Unknown Entity'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">{formatTimeAgo(item.createdAt)}</p>
                                                <div className="flex gap-1 justify-end">
                                                    {[1, 2, 3, 4].map(i => <div key={i} className={`w-1 h-3 ${i <= 2 ? 'bg-black' : 'bg-gray-200'}`}></div>)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* My Uploaded Songs */}
                        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] relative">
                            <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1">DATA.UPLOAD</div>
                            <h2 className="text-2xl font-black mb-8 flex items-center gap-4 uppercase tracking-tighter text-black">
                                <Upload className="w-8 h-8 text-black" />
                                Upload Archive
                                <span className="text-sm font-bold text-gray-400 -ml-2">[{mySongs.length}]</span>
                            </h2>
                            {loadingSongs ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-black animate-spin" />
                                </div>
                            ) : mySongs.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-300">
                                    <Music className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-black font-bold uppercase tracking-widest text-sm">Archive empty.</p>
                                    <p className="text-gray-400 text-xs mt-2 uppercase">Awaiting file input.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    {mySongs.map((song) => (
                                        <div key={song.id} className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 transition-all group cursor-pointer border-2 border-transparent hover:border-black relative hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">

                                            <div className="w-12 h-12 bg-gray-200 flex items-center justify-center overflow-hidden border border-black grayscale group-hover:grayscale-0">
                                                {song.coverUrl ? (
                                                    <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Music className="w-6 h-6 text-gray-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-black text-lg leading-tight truncate uppercase tracking-tight group-hover:translate-x-1 transition-transform">{song.title}</h4>
                                                <p className="text-xs font-bold text-gray-500 truncate uppercase tracking-widest">{song.artist || 'Unknown Entity'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-black bg-white px-2 py-1 border-2 border-black inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{formatDuration(song.duration)}</p>
                                                <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest flex items-center justify-end gap-1">
                                                    <span className={`w-2 h-2 rounded-full ${song.status === 'Active' ? 'bg-black' : 'bg-gray-400'}`}></span>
                                                    {song.status || 'Active'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Favorite Genres (Visual Only) */}
                        <div className="bg-black border-[6px] border-double border-gray-600 p-8 flex items-center justify-between relative overflow-hidden group">
                            {/* Inner stripes */}
                            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#333_10px,#333_20px)] pointer-events-none"></div>

                            <div className="relative z-10 bg-black p-4 inline-block">
                                <h3 className="text-3xl font-black italic mb-2 text-white uppercase tracking-tighter">KITA // PROTOCOL</h3>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest max-w-sm">
                                    Authorized access granted. System monitoring active.
                                </p>
                            </div>
                            <div className="w-20 h-20 bg-white border-4 border-gray-400 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:rotate-12 transition-transform duration-500 relative z-10 z-10">
                                <Zap className="w-10 h-10 text-black fill-black" />
                            </div>
                        </div>

                    </div>

                </div>

                {/* Password Change Modal */}
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white border-4 border-black p-8 max-w-md w-full shadow-[16px_16px_0px_0px_rgba(255,255,255,0.2)] relative">
                            <div className="absolute top-0 left-0 w-full h-2 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)] border-b-2 border-black"></div>

                            {/* Corner Accents */}
                            <div className="absolute -top-2 -left-2 w-4 h-4 bg-black"></div>
                            <div className="absolute -bottom-2 -root-2 w-4 h-4 bg-black right-[-8px]"></div>

                            <h3 className="text-3xl font-black text-black mb-6 flex items-center gap-3 uppercase tracking-tighter mt-2">
                                <Lock className="w-8 h-8 text-black" />
                                SYS.SECURITY
                            </h3>

                            {error && (
                                <div className="mb-6 p-3 bg-gray-100 border-l-4 border-black text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                    <X size={16} className="text-black" /> [ERROR]: {error}
                                </div>
                            )}

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Current Passcode</label>
                                    <input
                                        type="password"
                                        value={passwordData.oldPassword}
                                        onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                                        className="w-full px-4 py-3 bg-white border-2 border-black rounded-none text-black placeholder-gray-300 focus:outline-none focus:ring-0 font-bold tracking-widest uppercase transition-all"
                                        disabled={updatingPassword}
                                        placeholder="ENTER CURRENT"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black uppercase tracking-[0.2em]">New Passcode</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                        className="w-full px-4 py-3 bg-white border-2 border-black rounded-none text-black placeholder-gray-300 focus:outline-none focus:ring-0 font-bold tracking-widest uppercase transition-all"
                                        disabled={updatingPassword}
                                        placeholder="ENTER NEW"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Confirm Passcode</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                        className="w-full px-4 py-3 bg-white border-2 border-black rounded-none text-black placeholder-gray-300 focus:outline-none focus:ring-0 font-bold tracking-widest uppercase transition-all"
                                        disabled={updatingPassword}
                                        placeholder="CONFIRM NEW"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => setShowPasswordModal(false)}
                                    className="flex-1 px-4 py-3 bg-white border-2 border-black hover:bg-gray-100 text-black font-black uppercase tracking-widest transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                                    disabled={updatingPassword}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdatePassword}
                                    className="flex-1 px-4 py-3 bg-black hover:bg-gray-800 border-2 border-black text-white font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                                    disabled={updatingPassword}
                                >
                                    {updatingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
