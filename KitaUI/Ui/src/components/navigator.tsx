import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Music, MessageCircle, LogOut, User, Mic2, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import { fetchGetProfile } from '../utils/fetchAPI';
import umaLogo from '../assets/uma.png';

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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
        setIsMobileMenuOpen(false);
    };

    const handleSwitchToLogin = () => {
        setShowRegisterModal(false);
        setShowLoginModal(true);
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            <nav className="fixed inset-x-0 top-0 z-50 bg-white border-b-2 border-black shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo Area */}
                        <div className="flex-shrink-0 flex items-center gap-6">
                            <Link to="/" className="flex items-center gap-2 group">
                                <div className="h-16 w-auto overflow-hidden flex items-center">
                                    <img
                                        src={umaLogo}
                                        alt="Running Uma"
                                        className="h-10 object-contain origin-right transform group-hover:-translate-x-1.5 transition-all duration-500 ease-out invert dark-exclude"
                                    />
                                </div>
                                <h4 className="text-xl font-black tracking-tighter uppercase">
                                    <span className="text-black group-hover:text-black transition-colors border-2 border-transparent group-hover:bg-black group-hover:text-white px-1">KITA</span>
                                    <span className="text-gray-500 font-bold ml-1">PROJECT</span>
                                </h4>
                            </Link>

                            {/* Desktop Nav Items */}
                            <div className="hidden md:flex items-center space-x-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.path);
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`relative group flex items-center space-x-2 px-4 py-2 text-xs font-black uppercase tracking-widest transition-all duration-300 border-2 border-black ${active
                                                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(150,150,150,1)]'
                                                : 'bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
                                                }`}
                                            style={{ color: active ? 'white' : 'black' }}
                                        >
                                            <Icon strokeWidth={3} className={`w-4 h-4`} />
                                            <span>{item.name}</span>

                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            >
                                {isMobileMenuOpen ? <X size={20} strokeWidth={3} /> : <Menu size={20} strokeWidth={3} />}
                            </button>
                        </div>

                        {/* Right Side Actions (Desktop) */}
                        <div className="hidden md:flex flex-shrink-0 items-center gap-4">
                            {/* Theme Toggle Button */}
                            <button
                                onClick={() => {
                                    if (document.documentElement.classList.contains('dark')) {
                                        document.documentElement.classList.remove('dark');
                                        localStorage.theme = 'light';
                                    } else {
                                        document.documentElement.classList.add('dark');
                                        localStorage.theme = 'dark';
                                    }
                                }}
                                className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                title="Toggle Theme"
                            >
                                <span className="font-black">☽</span>
                            </button>

                            {isAuthenticated ? (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="flex items-center gap-3 transition-all duration-200 outline-none group bg-white border-2 border-black p-1 pl-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                                    >
                                        <div className="text-right hidden sm:block">
                                            <p className="text-sm font-black text-black group-hover:text-black uppercase tracking-tight transition-colors">
                                                {userProfile?.userName || 'USER'}
                                            </p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                {userProfile?.role || 'MEMBER'}
                                            </p>
                                        </div>

                                        <div className="relative">
                                            {userProfile?.avatarUrl ? (
                                                <img
                                                    src={userProfile.avatarUrl}
                                                    alt={userProfile.userName}
                                                    className="w-10 h-10 object-cover border-2 border-black bg-gray-100"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center text-black font-black">
                                                    <User size={20} strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showDropdown && (
                                        <div className="absolute right-0 mt-4 w-56 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50 transition-all animate-in fade-in zoom-in-95 duration-200">
                                            <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-10 text-center">SESSION_ACTIVE</div>
                                            <div className="px-4 py-4 pt-8 border-b-4 border-black">
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">SIGNED IN AS</p>
                                                <p className="text-xs font-black text-black truncate mt-1">{userProfile?.email}</p>
                                            </div>

                                            <div className="p-2 space-y-2 relative">
                                                {/* Noise overlay */}
                                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

                                                <button
                                                    onClick={() => {
                                                        navigate('/artists/my');
                                                        setShowDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-xs font-black uppercase tracking-widest text-black border-2 border-transparent hover:border-black hover:bg-black hover:text-white transition-all flex items-center gap-3 group relative z-10"
                                                >
                                                    <Mic2 strokeWidth={3} size={16} />
                                                    <span>MY ARTISTS</span>
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        navigate('/profile');
                                                        setShowDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-xs font-black uppercase tracking-widest text-black border-2 border-transparent hover:border-black hover:bg-black hover:text-white transition-all flex items-center gap-3 group relative z-10"
                                                >
                                                    <User strokeWidth={3} size={16} />
                                                    <span>PROFILE</span>
                                                </button>

                                                <div className="h-1 bg-gray-200 my-2 mx-2"></div>

                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-4 py-2 text-xs font-black uppercase tracking-widest border-2 border-black bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-3 relative z-10 mt-2"
                                                >
                                                    <LogOut strokeWidth={3} size={16} />
                                                    <span>LOGOUT</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowLoginModal(true)}
                                        className="px-5 py-2 text-sm font-black uppercase tracking-widest text-black border-2 border-transparent hover:border-black hover:bg-black hover:text-white transition-all"
                                    >
                                        LOG IN
                                    </button>
                                    <button
                                        onClick={() => setShowRegisterModal(true)}
                                        className="px-5 py-2 bg-black text-white border-2 border-black text-sm font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] hover:bg-white hover:text-black transition-all"
                                    >
                                        SIGN UP
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t-2 border-black bg-white">
                        <div className="px-4 py-4 space-y-4">
                            {/* Navigation Links */}
                            <div className="space-y-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.path);
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center space-x-3 px-4 py-3 text-sm font-black uppercase tracking-widest transition-all border-2 border-black ${active
                                                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(150,150,150,1)]'
                                                : 'bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
                                                }`}
                                        >
                                            <Icon strokeWidth={3} className="w-5 h-5" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Theme & User Actions */}
                            <div className="pt-4 border-t-2 border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-black uppercase tracking-widest text-gray-500">Theme</span>
                                    <button
                                        onClick={() => {
                                            if (document.documentElement.classList.contains('dark')) {
                                                document.documentElement.classList.remove('dark');
                                                localStorage.theme = 'light';
                                            } else {
                                                document.documentElement.classList.add('dark');
                                                localStorage.theme = 'dark';
                                            }
                                        }}
                                        className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                                    >
                                        <span className="font-black">☽</span>
                                    </button>
                                </div>

                                {isAuthenticated ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-black mb-4">
                                            {userProfile?.avatarUrl ? (
                                                <img src={userProfile.avatarUrl} alt={userProfile.userName} className="w-10 h-10 object-cover border-2 border-black bg-white" />
                                            ) : (
                                                <div className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center text-black font-black">
                                                    <User size={20} strokeWidth={3} />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-black uppercase">{userProfile?.userName}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{userProfile?.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}
                                            className="w-full text-left px-4 py-3 text-sm font-black uppercase tracking-widest text-black border-2 border-black bg-white hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3"
                                        >
                                            <User strokeWidth={3} size={18} />
                                            <span>Profile</span>
                                        </button>
                                        <button
                                            onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                            className="w-full text-left px-4 py-3 text-sm font-black uppercase tracking-widest text-black border-2 border-black bg-white hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3"
                                        >
                                            <LogOut strokeWidth={3} size={18} />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => { setShowLoginModal(true); setIsMobileMenuOpen(false); }}
                                            className="w-full py-3 text-sm font-black uppercase tracking-widest text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                        >
                                            Log In
                                        </button>
                                        <button
                                            onClick={() => { setShowRegisterModal(true); setIsMobileMenuOpen(false); }}
                                            className="w-full py-3 bg-black text-white border-2 border-black text-sm font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                        >
                                            Sign Up
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
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
