import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Music } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Please enter both username and password');
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch('http://localhost:5064/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                login(data.data.token);
                navigate('/music');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#120c12] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ff7a3c]/10 rounded-full mb-4 ring-1 ring-[#ff7a3c]/30">
                        <Music className="w-8 h-8 text-[#ff7a3c]" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-white/50">Sign in to access your library</p>
                </div>

                <div className="bg-[#1a141a] border border-white/5 rounded-2xl p-8 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-xs font-medium text-white/70 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                disabled={isLoading}
                                className="w-full px-4 py-3 bg-[#0d080f] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#ff7a3c] focus:ring-1 focus:ring-[#ff7a3c] transition-all disabled:opacity-50 text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-medium text-white/70 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                disabled={isLoading}
                                className="w-full px-4 py-3 bg-[#0d080f] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#ff7a3c] focus:ring-1 focus:ring-[#ff7a3c] transition-all disabled:opacity-50 text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-[#ff7a3c] hover:bg-[#ff8c52] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[#ff7a3c]/20 hover:shadow-[#ff7a3c]/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-6">
                    <p className="text-white/50 text-sm">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-[#ff7a3c] hover:text-[#ff8c52] font-medium transition-colors">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
