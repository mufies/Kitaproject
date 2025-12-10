import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Music, Star, Edit, Loader2, Camera, Check, X, Lock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { fetchGetProfile, fetchUploadAvatar, fetchUpdateUsername, fetchUpdatePassword, BASE_URL } from '../utils/fetchAPI';

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

    useEffect(() => {
        loadUserProfile();
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

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        try {
            setUploading(true);
            setError('');

            const result = await fetchUploadAvatar(file);

            if (result.success) {
                // Reload profile to get updated avatar URL
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
                // Update local state with new username
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

    const handleOpenPasswordModal = () => {
        setShowPasswordModal(true);
        setPasswordData({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setError('');
    };

    const handleClosePasswordModal = () => {
        setShowPasswordModal(false);
        setPasswordData({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setError('');
    };

    const handleUpdatePassword = async () => {
        // Validation
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
                // Success - close modal and show success message
                handleClosePasswordModal();
                // You might want to show a success toast here
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
            <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error && !userData) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={loadUserProfile}
                        className="px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!userData) return null;

    // Mock additional data for now - these would come from other API endpoints
    const joinDate = new Date().toISOString(); // Would come from API
    const favoriteGenres = ['J-Pop', 'Anime', 'City Pop'];
    const totalPlaylists = 12;
    const totalSongs = 342;
    const listeningTime = '156 hours';

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white pt-20 pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Profile Header */}
                <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-3xl border border-orange-500/30 overflow-hidden mb-8">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative p-8">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            {/* Avatar */}
                            <div className="relative group">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                                <div
                                    onClick={handleAvatarClick}
                                    className="relative cursor-pointer"
                                >
                                    <div className="w-32 h-32 bg-gradient-to-br from-orange-600 to-orange-700 rounded-full flex items-center justify-center border-4 border-orange-500/50 shadow-2xl shadow-orange-500/40 overflow-hidden">
                                        {userData.avatarUrl ? (
                                            <img
                                                src={`${userData.avatarUrl}`}
                                                alt={userData.userName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-16 h-16 text-white" />
                                        )}
                                    </div>
                                    {/* Upload Overlay */}
                                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        {uploading ? (
                                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                                        ) : (
                                            <Camera className="w-8 h-8 text-white" />
                                        )}
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center border-2 border-gray-900">
                                    <Star className="w-5 h-5 text-white" fill="white" />
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 text-center md:text-left">
                                {error && (
                                    <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Username Section - Editable */}
                                {isEditing ? (
                                    <div className="mb-4">
                                        <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                                            <input
                                                type="text"
                                                value={newUsername}
                                                onChange={(e) => setNewUsername(e.target.value)}
                                                placeholder={userData.userName}
                                                className="px-4 py-2 bg-black/50 border border-orange-500/50 rounded-lg text-white text-2xl font-bold focus:outline-none focus:border-orange-500 transition-colors"
                                                maxLength={30}
                                                disabled={updatingUsername}
                                            />
                                            <button
                                                onClick={handleUpdateUsername}
                                                disabled={updatingUsername}
                                                className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition-colors"
                                                title="Save"
                                            >
                                                {updatingUsername ? (
                                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                                ) : (
                                                    <Check className="w-5 h-5 text-white" />
                                                )}
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                disabled={updatingUsername}
                                                className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg transition-colors"
                                                title="Cancel"
                                            >
                                                <X className="w-5 h-5 text-white" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 text-center md:text-left">
                                            Username must be 3-30 characters
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                                        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
                                            {userData.userName}
                                        </h1>
                                        <button
                                            onClick={() => {
                                                setIsEditing(true);
                                                setNewUsername(userData.userName);
                                            }}
                                            className="p-2 hover:bg-orange-500/20 rounded-lg transition-colors"
                                            title="Edit Username"
                                        >
                                            <Edit className="w-5 h-5 text-orange-400" />
                                        </button>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row items-center gap-4 text-gray-400 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        <span className="text-sm">{userData.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm">Joined {new Date(joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                    </div>
                                </div>

                                {/* Stats */}

                            </div>
                        </div>
                    </div>
                </div>



                {/* Account Settings */}
                <div className="mt-6 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                    <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
                    <div className="space-y-4">
                        <button
                            onClick={handleOpenPasswordModal}
                            className="w-full text-left p-4 bg-black/30 hover:bg-black/50 rounded-lg transition-colors flex items-center justify-between"
                        >
                            <span className="text-gray-300">Change Password</span>
                            <span className="text-orange-400">→</span>
                        </button>
                        <button className="w-full text-left p-4 bg-black/30 hover:bg-black/50 rounded-lg transition-colors flex items-center justify-between">
                            <span className="text-gray-300">Privacy Settings</span>
                            <span className="text-orange-400">→</span>
                        </button>
                        <button className="w-full text-left p-4 bg-black/30 hover:bg-black/50 rounded-lg transition-colors flex items-center justify-between">
                            <span className="text-gray-300">Notification Preferences</span>
                            <span className="text-orange-400">→</span>
                        </button>
                        <button
                            onClick={logout}
                            className="w-full text-left p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors flex items-center justify-between"
                        >
                            <span className="text-red-400">Logout</span>
                            <span className="text-red-400">→</span>
                        </button>
                    </div>
                </div>

                {/* Password Change Modal */}
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-orange-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-600/20 rounded-full flex items-center justify-center">
                                        <Lock className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Change Password</h3>
                                </div>
                                <button
                                    onClick={handleClosePasswordModal}
                                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                    disabled={updatingPassword}
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Old Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.oldPassword}
                                        onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                                        className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        placeholder="Enter current password"
                                        disabled={updatingPassword}
                                    />
                                </div>

                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                        className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        placeholder="Enter new password (min 6 characters)"
                                        disabled={updatingPassword}
                                    />
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                        className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        placeholder="Confirm new password"
                                        disabled={updatingPassword}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleClosePasswordModal}
                                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                                    disabled={updatingPassword}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdatePassword}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    disabled={updatingPassword}
                                >
                                    {updatingPassword ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Password'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
