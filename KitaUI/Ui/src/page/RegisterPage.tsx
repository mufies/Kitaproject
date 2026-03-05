import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Music } from 'lucide-react';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

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

            // Using the endpoint from AuthController: POST /api/auth/register
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userName: username,
                    email,
                    password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Determine success based on typical API response, handle explicit success flag if present
                // Assuming data structure based on typical practices, but respecting potential 'success' field
                if (data.success === false) {
                    setError(data.message || 'Registration failed');
                } else {
                    navigate('/login');
                }
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 selection:bg-black selection:text-white relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}>
            </div>
            <div className="absolute -right-20 bottom-1/4 w-[120vw] h-40 bg-black opacity-[0.02] rotate-12 pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="inline-flex items-center gap-3 px-6 py-2 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
                        <span className="w-2 h-2 bg-black animate-pulse"></span>
                        <span className="text-black text-xs font-black tracking-[0.3em] uppercase">New Arrival</span>
                    </div>
                    <h1 className="text-4xl font-black text-black mb-2 uppercase tracking-tighter">
                        USER REGISTRY
                    </h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Create credentials to access archive</p>
                </div>

                <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)] relative">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 bg-black"></div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-black"></div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-gray-100 border-l-4 border-black text-black font-bold uppercase text-xs tracking-wider">
                                [ERROR]: {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="username" className="block text-xs font-black text-black mb-2 uppercase tracking-[0.2em]">
                                Callsign
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="DESIGNATE CALLSIGN..."
                                disabled={isLoading}
                                className="w-full px-4 py-3 bg-white border-2 border-black text-black placeholder-gray-400 focus:outline-none focus:ring-0 rounded-none transition-all disabled:opacity-50 font-bold uppercase"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-xs font-black text-black mb-2 uppercase tracking-[0.2em]">
                                Contact ID (Email)
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ENTER CONTACT ID..."
                                disabled={isLoading}
                                className="w-full px-4 py-3 bg-white border-2 border-black text-black placeholder-gray-400 focus:outline-none focus:ring-0 rounded-none transition-all disabled:opacity-50 font-bold uppercase"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-black text-black mb-2 uppercase tracking-[0.2em]">
                                Security Key (Password)
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="SET SECURITY KEY..."
                                disabled={isLoading}
                                className="w-full px-4 py-3 bg-white border-2 border-black text-black placeholder-gray-400 focus:outline-none focus:ring-0 rounded-none transition-all disabled:opacity-50 font-bold uppercase tracking-widest"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-xs font-black text-black mb-2 uppercase tracking-[0.2em]">
                                Verify Security Key
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="VERIFY SECURITY KEY..."
                                disabled={isLoading}
                                className="w-full px-4 py-3 bg-white border-2 border-black text-black placeholder-gray-400 focus:outline-none focus:ring-0 rounded-none transition-all disabled:opacity-50 font-bold uppercase tracking-widest"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-black text-white font-black rounded-none shadow-[6px_6px_0px_0px_rgba(156,163,175,1)] hover:shadow-[2px_2px_0px_0px_rgba(156,163,175,1)] hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-[0.2em] border border-black mt-4"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                                    <span>Initializing...</span>
                                </>
                            ) : (
                                'Execute Registration'
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-8">
                    <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">
                        CREDENTIALS EXIST?{' '}
                        <Link to="/login" className="text-black hover:text-gray-600 font-black border-b-2 border-black hover:border-transparent transition-colors ml-2 pb-1">
                            ACCESS LOGIN
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
