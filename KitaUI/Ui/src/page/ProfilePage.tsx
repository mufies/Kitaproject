import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Music, Star, Edit, Loader2, Camera, Check, X, Lock, Disc, Activity, Zap, TrendingUp, Settings, LogOut, Upload } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { fetchGetProfile, fetchUploadAvatar, fetchUpdateUsername, fetchUpdatePassword } from '../utils/fetchAPI';
import { getMySongs } from '../utils/musicAPI';
import type { SongDto } from '../types/api';

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
    const [updatingUsername, setUpdatingUsername] = useState(false);
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

    useEffect(() => {
        loadUserProfile();
        loadMySongs();
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

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            setUpdatingUsername(true);
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
        } finally {
            setUpdatingUsername(false);
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

    // Mock Data for UI
    const joinDate = new Date();
    const stats = [
        { label: 'Songs Played', value: '1,248', icon: Disc, color: 'text-blue-400' },
        { label: 'Listening Time', value: '86h', icon: Calendar, color: 'text-green-400' },
        { label: 'Playlists', value: '12', icon: Music, color: 'text-purple-400' },
        { label: 'Rank', value: '#42', icon: TrendingUp, color: 'text-orange-400' },
    ];

    const recentActivity = [
        { song: 'Midnight Rain', artist: 'Kitasan Black', time: '2 mins ago', image: '/src/assets/kitasan_playlist_1_1765341146682.png' },
        { song: 'Victory Lap', artist: 'Satono Diamond', time: '15 mins ago', image: '/src/assets/kitasan_playlist_2_1765341165904.png' },
        { song: 'Speed of Sound', artist: 'Duramente', time: '1 hour ago', image: '/src/assets/kitasan_trending_1765341183668.png' },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Profile Header Banner */}
                <div className="relative h-64 rounded-3xl overflow-hidden mb-24 border border-gray-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-900 to-black"></div>
                    <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}
                    ></div>
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/20 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3"></div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 -mt-32 relative z-10">
                    {/* Left Column: Identity Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#111] border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                            {/* Card Decorative Elements */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-orange-500 to-red-600"></div>

                            <div className="flex flex-col items-center text-center">
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
                                        className="w-40 h-40 rounded-full p-2 border-2 border-dashed border-gray-700 bg-gray-900 cursor-pointer overflow-hidden relative"
                                    >
                                        <img
                                            src={userData.avatarUrl || 'https://via.placeholder.com/150'}
                                            alt={userData.userName}
                                            className="w-full h-full rounded-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                            {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" />}
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 right-2 flex items-center justify-center w-10 h-10 bg-red-600 rounded-full border-4 border-[#111]">
                                        <Star className="w-4 h-4 text-white fill-white" />
                                    </div>
                                </div>

                                {/* Identity Info */}
                                <div className="space-y-2 mb-8 w-full">
                                    {isEditing ? (
                                        <div className="flex gap-2 justify-center">
                                            <input
                                                value={newUsername}
                                                onChange={(e) => setNewUsername(e.target.value)}
                                                className="bg-black/50 border border-gray-700 rounded px-3 py-1 text-white text-center w-full"
                                                placeholder="Username"
                                            />
                                            <button onClick={handleUpdateUsername} className="text-green-500 hover:text-green-400"><Check size={20} /></button>
                                            <button onClick={handleCancelEdit} className="text-red-500 hover:text-red-400"><X size={20} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 group/edit cursor-pointer" onClick={() => { setIsEditing(true); setNewUsername(userData.userName); }}>
                                            <h1 className="text-3xl font-black text-white">{userData.userName}</h1>
                                            <Edit className="w-4 h-4 text-gray-600 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-center gap-2">
                                        <span className="px-3 py-1 bg-red-900/30 text-red-500 text-xs font-bold rounded-full uppercase tracking-wider border border-red-900/50">
                                            {userData.role}
                                        </span>

                                    </div>

                                    <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mt-4">
                                        <Mail className="w-3 h-3" />
                                        <span>{userData.email}</span>
                                    </div>

                                    <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                                        <Calendar className="w-3 h-3" />
                                        <span>Joined {joinDate.toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Settings Actions */}
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <button
                                        onClick={() => setShowPasswordModal(true)}
                                        className="flex items-center justify-center gap-2 p-3 bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors text-sm font-medium text-gray-300"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span>Password</span>
                                    </button>
                                    <button
                                        onClick={logout}
                                        className="flex items-center justify-center gap-2 p-3 bg-red-900/20 hover:bg-red-900/30 rounded-xl transition-colors text-sm font-medium text-red-400 border border-red-900/30"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Stats & Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {stats.map((stat, index) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={index} className="bg-[#111] border border-gray-800 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-red-900/50 transition-colors group">
                                        <div className={`p-3 rounded-full bg-gray-900 group-hover:bg-gray-800 transition-colors ${stat.color}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-2xl font-black text-white">{stat.value}</span>
                                        <span className="text-xs text-gray-500 uppercase tracking-widest">{stat.label}</span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-[#111] border border-gray-800 rounded-3xl p-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                                <Activity className="w-5 h-5 text-red-500" />
                                Recent Activity
                            </h2>
                            <div className="space-y-4">
                                {recentActivity.map((item, index) => (
                                    <div key={index} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/10">
                                        <img src={item.image} alt={item.song} className="w-12 h-12 rounded-lg object-cover" />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-white group-hover:text-red-500 transition-colors">{item.song}</h4>
                                            <p className="text-sm text-gray-500">{item.artist}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 mb-1">{item.time}</p>
                                            <div className="flex gap-1 justify-end">
                                                {[1, 2, 3, 4].map(i => <div key={i} className={`w-1 h-3 rounded-full ${Math.random() > 0.5 ? 'bg-red-600' : 'bg-gray-800'}`}></div>)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* My Uploaded Songs */}
                        <div className="bg-[#111] border border-gray-800 rounded-3xl p-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                                <Upload className="w-5 h-5 text-red-500" />
                                My Uploaded Songs
                                <span className="text-sm font-normal text-gray-500">({mySongs.length})</span>
                            </h2>
                            {loadingSongs ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                                </div>
                            ) : mySongs.length === 0 ? (
                                <div className="text-center py-8">
                                    <Music className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                                    <p className="text-gray-500">You haven't uploaded any songs yet.</p>
                                    <p className="text-gray-600 text-sm mt-1">Go to Music page to upload your first song!</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {mySongs.map((song) => (
                                        <div key={song.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/10">
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center overflow-hidden">
                                                {song.coverUrl ? (
                                                    <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Music className="w-6 h-6 text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-white truncate group-hover:text-red-500 transition-colors">{song.title}</h4>
                                                <p className="text-sm text-gray-500 truncate">{song.artist || 'Unknown Artist'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">{formatDuration(song.duration)}</p>
                                                <p className="text-xs text-gray-600 mt-1">{song.status || 'Active'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Favorite Genres (Visual Only) */}
                        <div className="bg-gradient-to-r from-red-900/20 to-black border border-red-900/30 rounded-3xl p-8 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black italic mb-2">KITA CLUB MEMBER</h3>
                                <p className="text-gray-400 text-sm max-w-sm">
                                    You are part of the detailed music analysis program. Keep listening to unlock more stats.
                                </p>
                            </div>
                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                                <Zap className="w-8 h-8 text-white fill-white" />
                            </div>
                        </div>

                    </div>

                </div>

                {/* Password Change Modal */}
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-[#111] border border-red-900/50 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500"></div>

                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Lock className="w-6 h-6 text-red-500" />
                                Security Settings
                            </h3>

                            {error && (
                                <div className="mb-6 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
                                    <X size={16} /> {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.oldPassword}
                                        onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                                        className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white focus:outline-none focus:border-red-600 transition-colors"
                                        disabled={updatingPassword}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                        className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white focus:outline-none focus:border-red-600 transition-colors"
                                        disabled={updatingPassword}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                        className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white focus:outline-none focus:border-red-600 transition-colors"
                                        disabled={updatingPassword}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowPasswordModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-900 hover:bg-gray-800 rounded-xl text-white font-bold transition-colors"
                                    disabled={updatingPassword}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdatePassword}
                                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2"
                                    disabled={updatingPassword}
                                >
                                    {updatingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
