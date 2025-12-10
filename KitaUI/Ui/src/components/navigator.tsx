import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Music, MessageCircle, LogOut, User, ChevronDown } from 'lucide-react';
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
            <nav className="fixed inset-x-0 top-0 z-50 bg-white backdrop-blur-sm border-b border-gray-800">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex-shrink-0 flex items-center space-x-4">
                            <h4 className="text-xl font-bold">
                                <span className="text-red-500">Kita</span>
                                <span className="text-black">project</span>
                            </h4>
                            <div className="flex items-center space-x-1 text-white">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(item.path)
                                                ? 'text-red-400 bg-orange-500/10'
                                                : 'text-red-400 hover:text-orange-400 hover:bg-red-500/10'
                                                }`}
                                        >
                                            <Icon className="text-red-400" size={18} />
                                            <span className="text-red-400">{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex-shrink-0 flex items-center gap-3">
                            {isAuthenticated ? (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="flex items-center transition-all duration-200 hover:opacity-80
                                                outline-none focus:outline-none focus:ring-0 border-none focus:border-none
                                                bg-transparent p-0"
                                    >
                                        {userProfile?.avatarUrl ? (
                                            <img
                                                src={userProfile.avatarUrl}
                                                alt={userProfile.userName}
                                                className="w-10 h-10 rounded-full object-cover cursor-pointer"
                                            />
                                        ) : (
                                            <User size={40} className="text-orange-400 cursor-pointer" />
                                        )}
                                    </button>


                                    {/* Dropdown Menu */}
                                    {showDropdown && (
                                        <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-red-500/30 rounded-lg shadow-2xl shadow-red-500/20 overflow-hidden z-50">
                                            <button
                                                onClick={() => {
                                                    navigate('/profile');
                                                    setShowDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-orange-500/10 hover:text-orange-400 transition-all duration-200 flex items-center gap-2"
                                            >
                                                <User size={16} />
                                                <span>Profile</span>
                                            </button>
                                            <div className="border-t border-gray-700"></div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 flex items-center gap-2"
                                            >
                                                <LogOut size={16} />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setShowLoginModal(true)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-orange-400 hover:bg-gray-800 transition-all duration-200"
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={() => setShowRegisterModal(true)}
                                        className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40"
                                    >
                                        Register
                                    </button>
                                </>
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
