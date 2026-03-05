import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Music, X } from 'lucide-react';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToRegister: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password');
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5064'}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                login(data.data.token);
                console.log(data.data.user.userAgent);
                onClose();
                setEmail('');
                setPassword('');
            } else {
                setError(data.message || 'Login failed');
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
                <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-10 text-center">AUTH_REQUIRED</div>
                <div className="absolute -left-12 -top-12 w-24 h-24 bg-gray-200 rotate-45 pointer-events-none opacity-50 z-0"></div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-black hover:bg-black hover:text-white transition-all p-1 z-20"
                >
                    <X size={20} strokeWidth={3} />
                </button>

                {/* Header */}
                <div className="text-center mb-8 relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
                        <Music className="w-8 h-8 text-black" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-3xl font-black text-black mb-2 uppercase tracking-tighter">
                        SYSTEM LOGIN
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Provide credentials to access</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    {error && (
                        <div className="p-3 bg-gray-50 border-l-4 border-black text-black font-bold uppercase text-xs tracking-wider">
                            [ERROR]: {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-xs font-black text-black mb-2 uppercase tracking-[0.2em] border-l-4 border-black pl-2">
                            EMAIL ID
                        </label>
                        <input
                            id="email"
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ENTER EMAIL..."
                            disabled={isLoading}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-black text-black placeholder-gray-400 focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 font-bold uppercase"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-xs font-black text-black mb-2 uppercase tracking-[0.2em] border-l-4 border-black pl-2">
                            PASSCODE
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="ENTER PASSCODE..."
                            disabled={isLoading}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-black text-black placeholder-gray-400 focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 font-bold uppercase tracking-widest"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-black text-white font-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_0px_rgba(150,150,150,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-[0.2em] border-2 border-black mt-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-none animate-spin"></div>
                                <span>VERIFYING...</span>
                            </>
                        ) : (
                            'INITIATE LOGIN'
                        )}
                    </button>
                </form>

                {/* Switch to Register */}
                <div className="text-center mt-8 relative z-10 pt-6 border-t-2 border-gray-100">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        UNAUTHORIZED?{' '}
                        <button
                            onClick={onSwitchToRegister}
                            className="text-black hover:text-gray-600 font-black border-b-2 border-black hover:border-transparent transition-colors ml-2 pb-0.5"
                        >
                            REQUEST ACCESS
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
