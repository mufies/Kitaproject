import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Music, X } from 'lucide-react';

interface RegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToLogin: () => void;
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5064'}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Auto login after successful registration
                login(data.data.token);
                onClose();
                setUsername('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-white/90 backdrop-blur-sm"
                onClick={onClose}
            >
                {/* Noise overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
            </div>

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] p-8 z-10 animate-in fade-in zoom-in-95 duration-200">
                <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-10 text-center">NEW_REGISTRATION</div>
                <div className="absolute -left-12 -top-12 w-24 h-24 bg-gray-200 rotate-45 pointer-events-none opacity-50 z-0"></div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-black hover:bg-black hover:text-white transition-all p-1 z-20"
                >
                    <X size={20} strokeWidth={3} />
                </button>

                {/* Header */}
                <div className="text-center mb-6 relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
                        <Music className="w-8 h-8 text-black" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-3xl font-black text-black mb-2 uppercase tracking-tighter">
                        USER REGISTRY
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Create identifying credentials</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                    {error && (
                        <div className="p-3 bg-gray-50 border-l-4 border-black text-black font-bold uppercase text-xs tracking-wider">
                            [ERROR]: {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="username" className="block text-[10px] font-black text-black mb-1 uppercase tracking-widest border-l-4 border-black pl-2">
                            CALLSIGN
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="DESIGNATE CALLSIGN"
                            disabled={isLoading}
                            className="w-full px-4 py-2.5 bg-gray-50 border-2 border-black text-black placeholder-gray-400 focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 font-bold uppercase text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="reg-email" className="block text-[10px] font-black text-black mb-1 uppercase tracking-widest border-l-4 border-black pl-2">
                            CONTACT ID (EMAIL)
                        </label>
                        <input
                            id="reg-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="INPUT CONTACT ID"
                            disabled={isLoading}
                            className="w-full px-4 py-2.5 bg-gray-50 border-2 border-black text-black placeholder-gray-400 focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 font-bold uppercase text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="reg-password" className="block text-[10px] font-black text-black mb-1 uppercase tracking-widest border-l-4 border-black pl-2">
                            SECURITY KEY (PASSWORD)
                        </label>
                        <input
                            id="reg-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="SET SECURITY KEY"
                            disabled={isLoading}
                            className="w-full px-4 py-2.5 bg-gray-50 border-2 border-black text-black placeholder-gray-400 focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 font-bold uppercase tracking-widest text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirm-password" className="block text-[10px] font-black text-black mb-1 uppercase tracking-widest border-l-4 border-black pl-2">
                            VERIFY SECURITY KEY
                        </label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="VERIFY SECURITY KEY"
                            disabled={isLoading}
                            className="w-full px-4 py-2.5 bg-gray-50 border-2 border-black text-black placeholder-gray-400 focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 font-bold uppercase tracking-widest text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 bg-black text-white font-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_0px_rgba(150,150,150,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-[0.2em] border-2 border-black mt-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-none animate-spin"></div>
                                <span>INITIALIZING...</span>
                            </>
                        ) : (
                            'EXECUTE REGISTRATION'
                        )}
                    </button>
                </form>

                {/* Switch to Login */}
                <div className="text-center mt-6 relative z-10 pt-4 border-t-2 border-gray-100">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        CREDENTIALS EXIST?{' '}
                        <button
                            onClick={onSwitchToLogin}
                            className="text-black hover:text-gray-600 font-black border-b-2 border-black hover:border-transparent transition-colors ml-2 pb-0.5"
                        >
                            ACCESSS LOGIN
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
