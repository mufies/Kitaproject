import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Music, MessageCircle, LogOut, User, Disc, Mic2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import { fetchGetProfile } from '../utils/fetchAPI';

interface UserProfile {
    id: string;
    userName: string;
    email: string;
    avatarUrl?: string;
    role: string;
}

export default function Navigator() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const navItems = [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Music', path: '/music', icon: Music },
        { name: 'Chat', path: '/chat', icon: MessageCircle },
    ];

    const isActive = (path: string) => location.pathname === path;

    // Fetch user profile when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            loadUserProfile();
        } else {
            setUserProfile(null);
        }
    }, [isAuthenticated]);

    const loadUserProfile = async () => {
        try {
            const result = await fetchGetProfile();
            if (result.success) {
                setUserProfile(result.data);
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    const handleLogout = () => {
        logout();
        setShowDropdown(false);
    };

    const handleSwitchToRegister = () => {
        setShowLoginModal(false);
        setShowRegisterModal(true);
    };

    const handleSwitchToLogin = () => {
        setShowRegisterModal(false);
        setShowLoginModal(true);
    };

    return (
        <>
            <nav className="fixed inset-x-0 top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-red-900/30 shadow-lg shadow-black/50">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo Area */}
                        <div className="flex-shrink-0 flex items-center gap-6">
                            <Link to="/" className="flex items-center gap-2 group">
                                <div className="relative w-8 h-8 flex items-center justify-center">
                                    <Disc className="w-full h-full text-red-600 animate-spin-slow group-hover:text-amber-500 transition-colors" />
                                    <div className="absolute w-2 h-2 bg-black rounded-full mb-[1px]"></div>
                                </div>
                                <h4 className="text-xl font-black tracking-tighter">
                                    <span className="text-white group-hover:text-red-500 transition-colors">KITA</span>
                                    <span className="text-red-600 font-light">PROJECT</span>
                                </h4>
                            </Link>

                            {/* Desktop Nav Items */}
                            <div className="hidden md:flex items-center space-x-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.path);
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`relative group flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${active
                                                ? '!text-white bg-red-600 shadow-[0_0_15px_-3px_rgba(220,20,60,0.6)]'
                                                : '!text-gray-300 hover:!text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <Icon className={`w-4 h-4 ${active ? '!text-white' : '!text-gray-300 group-hover:!text-white'}`} />
                                            <span>{item.name}</span>

                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex-shrink-0 flex items-center gap-4">
                            {isAuthenticated ? (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="flex items-center gap-3 transition-all duration-200 outline-none group"
                                    >
                                        <div className="text-right hidden sm:block">
                                            <p className="text-sm font-bold text-white group-hover:text-red-500 transition-colors">
                                                {userProfile?.userName || 'User'}
                                            </p>
                                            <p className="text-xs text-red-500 font-medium tracking-wider">
                                                {userProfile?.role || 'MEMBER'}
                                            </p>
                                        </div>

                                        <div className="relative">
                                            {userProfile?.avatarUrl ? (
                                                <img
                                                    src={userProfile.avatarUrl}
                                                    alt={userProfile.userName}
                                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-800 group-hover:ring-red-600 transition-all"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center ring-2 ring-gray-700 group-hover:ring-red-600 transition-all">
                                                    <User size={20} className="text-gray-300 group-hover:text-white" />
                                                </div>
                                            )}
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
                                        </div>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showDropdown && (
                                        <div className="absolute right-0 mt-4 w-56 bg-[#0f0f0f] border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
                                            <div className="px-4 py-3 bg-red-900/10 border-b border-red-900/20">
                                                <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Signed in as</p>
                                                <p className="text-sm font-medium text-white truncate">{userProfile?.email}</p>
                                            </div>

                                            <div className="p-1">
                                                <button
                                                    onClick={() => {
                                                        navigate('/artists/my');
                                                        setShowDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors flex items-center gap-3 group"
                                                >
                                                    <Mic2 size={16} className="text-gray-500 group-hover:text-red-500" />
                                                    <span>My Artists</span>
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        navigate('/profile');
                                                        setShowDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors flex items-center gap-3 group"
                                                >
                                                    <User size={16} className="text-gray-500 group-hover:text-red-500" />
                                                    <span>Profile</span>
                                                </button>

                                                <div className="h-px bg-gray-800 my-1 mx-2"></div>

                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors flex items-center gap-3 group"
                                                >
                                                    <LogOut size={16} className="text-gray-500 group-hover:text-red-500" />
                                                    <span>Logout</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowLoginModal(true)}
                                        className="px-5 py-2 rounded-full text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Log In
                                    </button>
                                    <button
                                        onClick={() => setShowRegisterModal(true)}
                                        className="px-5 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-red-600 hover:text-white transition-all transform hover:scale-105 shadow-lg shadow-white/10 hover:shadow-red-600/30"
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Modals */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSwitchToRegister={handleSwitchToRegister}
            />
            <RegisterModal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                onSwitchToLogin={handleSwitchToLogin}
            />
        </>
    );
}
