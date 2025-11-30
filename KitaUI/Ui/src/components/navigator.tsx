import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Music, MessageCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navigator() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuth();

    const navItems = [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Music', path: '/music', icon: Music },
        { name: 'Chat', path: '/chat', icon: MessageCircle },
    ];

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="fixed inset-x-0 top-0 z-50 bg-black-800/95 bg-white ">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0 flex items-center space-x-4">
                        <h4 className="text-xl font-bold">
                            <span className="text-red-600">Kita</span>
                            <span className="text-gray-900">project</span>
                        </h4>
                        <div className="flex items-center space-x-4 text-red-600">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive(item.path)
                                            ? 'text-red-600 bg-red-50'
                                            : 'text-red-600 hover:text-red-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon size={18} className="text-red-600" />
                                        <span className="text-red-600">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex-shrink-0 bg-transparent flex items-center gap-2">
                        {isAuthenticated && (
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-100 transition-all duration-200 bg-transparent"
                            >
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
