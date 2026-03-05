import { useState, useEffect, useRef } from 'react';
import { Plus, X, LogIn, Sparkles, AlertTriangle } from 'lucide-react';
import { serverService } from '../../services/serverService';
import { serverInviteService } from '../../services/serverInviteService';
import { chatService } from '../../services/chatService';
import type { ServerDto } from '../../types/api';

interface ServerListProps {
    currentServerId: string | null;
    onServerSelect: (server: ServerDto) => void;
}

export default function ServerList({ currentServerId, onServerSelect }: ServerListProps) {
    const [servers, setServers] = useState<ServerDto[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const connectAttemptedRef = useRef(false);
    const [modalTab, setModalTab] = useState<'create' | 'join'>('create');
    const [newServerName, setNewServerName] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadServers();
    }, []);

    // Listen for ServerLeft events to remove servers when user is kicked/left
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        // Get current user ID
        let currentUserId: string | null = null;
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            const nameIdentifierClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
            currentUserId = payload[nameIdentifierClaim] || payload.sub || payload.nameid;
        } catch (e) {
            console.error('Failed to parse token:', e);
            return;
        }

        // Connect to ChatHub if not connected (but only once to prevent race conditions)
        if (!chatService.isConnected() && !connectAttemptedRef.current) {
            connectAttemptedRef.current = true;
            chatService.connect(token).catch(err => {
                console.error('Failed to connect to ChatHub in ServerList:', err);
                connectAttemptedRef.current = false; // Allow retry on failure
            });
        }

        const handleServerLeft = (serverId: string, userId: string) => {
            console.log('🔴 ServerLeft in ServerList:', { serverId, userId, currentUserId });

            // Normalize IDs for comparison
            const normalizedUserId = userId.toLowerCase();
            const normalizedCurrentUserId = currentUserId?.toLowerCase();

            // If I was kicked/left from a server
            if (normalizedCurrentUserId && normalizedUserId === normalizedCurrentUserId) {
                console.log('🔴 Removing server from list:', serverId);
                setServers(prev => {
                    const filtered = prev.filter(s => s.id !== serverId);
                    // If the removed server was selected, clear selection
                    if (currentServerId === serverId) {
                        onServerSelect(filtered[0] || null as any);
                    }
                    return filtered;
                });
            }
        };

        const handleMemberJoined = (serverId: string, userId: string) => {
            console.log('🟢 MemberJoined in ServerList:', { serverId, userId, currentUserId });

            // Normalize IDs for comparison
            const normalizedUserId = userId.toLowerCase();
            const normalizedCurrentUserId = currentUserId?.toLowerCase();

            // If I joined a new server, reload the server list
            if (normalizedCurrentUserId && normalizedUserId === normalizedCurrentUserId) {
                console.log('🟢 Reloading server list after joining new server');
                loadServers();
            }
        };

        chatService.onServerLeft(handleServerLeft);
        chatService.onMemberJoined(handleMemberJoined);

        return () => {
            chatService.offServerLeft(handleServerLeft);
            chatService.offMemberJoined(handleMemberJoined);
        };
    }, [currentServerId, onServerSelect]);

    const loadServers = async () => {
        try {
            const data = await serverService.getUserServers();
            setServers(data);
            if (data.length > 0 && !currentServerId) {
                onServerSelect(data[0]);
            }
        } catch (error) {
            console.error("Failed to load servers", error);
        }
    };

    const handleCreateServer = async () => {
        if (!newServerName.trim()) return;
        setIsCreating(true);
        setError("");
        try {
            const newServer = await serverService.createServer({ name: newServerName });
            setServers([...servers, newServer]);
            closeModal();
            onServerSelect(newServer);
        } catch (error) {
            console.error("Failed to create server", error);
            setError("Failed to create server. Please try again.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinServer = async () => {
        if (!inviteCode.trim()) return;
        setIsJoining(true);
        setError("");
        try {
            // Extract code from URL if pasted full link
            let code = inviteCode.trim();
            if (code.includes('/join/')) {
                code = code.split('/join/').pop() || code;
            }
            if (code.includes('/')) {
                code = code.split('/').pop() || code;
            }

            const invite = await serverInviteService.useInvite({ code });
            // Reload servers to get the new one
            const updatedServers = await serverService.getUserServers();
            setServers(updatedServers);

            // Find and select the joined server
            const joinedServer = updatedServers.find(s => s.id === invite.serverId);
            if (joinedServer) {
                onServerSelect(joinedServer);
            }
            closeModal();
        } catch (error: any) {
            console.error("Failed to join server", error);
            setError(error?.response?.data?.message || "Invalid or expired invite code.");
        } finally {
            setIsJoining(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setNewServerName("");
        setInviteCode("");
        setError("");
        setModalTab('create');
    };

    return (
        <div className="w-[88px] bg-gray-50 flex flex-col items-center py-4 gap-4 border-r-4 border-black overflow-y-auto h-full flex-shrink-0 z-20">
            {/* Servers */}
            {servers.map(server => (
                <div key={server.id} className="relative group w-full flex justify-center">
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 bg-black transition-all duration-200 ${currentServerId === server.id ? 'h-12' : 'h-0 group-hover:h-6'}`} />

                    <button
                        onClick={() => onServerSelect(server)}
                        className={`w-14 h-14 rounded-none border-2 border-black transition-all duration-200 flex items-center justify-center overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 ${currentServerId === server.id
                            ? 'bg-black text-white translate-x-1 translate-y-1 shadow-none'
                            : 'bg-white text-black hover:bg-black hover:text-white'
                            }`}
                        title={server.name}
                    >
                        {server.iconUrl ? (
                            <img src={server.iconUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-black text-lg">
                                {server.name.substring(0, 2).toUpperCase()}
                            </span>
                        )}
                    </button>
                </div>
            ))}

            {/* Separator */}
            <div className="w-10 h-1 bg-black my-2" />

            {/* Add Server Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-14 h-14 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 text-black hover:bg-black hover:text-white transition-all duration-200 flex items-center justify-center group"
                title="Initialize New Server"
            >
                <Plus size={28} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
            </button>

            {/* Create/Join Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={closeModal}>
                    <div className="fixed inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
                    </div>

                    <div className="bg-white rounded-none w-full max-w-md border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative z-10 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-10">INITIALIZATION_PROTOCOL</div>
                        <div className="absolute -left-16 -top-16 w-32 h-32 bg-gray-200 rotate-45 pointer-events-none opacity-50"></div>

                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b-4 border-black bg-gray-50 relative z-10">
                            <h3 className="text-black font-black uppercase tracking-tight text-xl">NETWORK CONFIGURATION</h3>
                            <button onClick={closeModal} className="text-black hover:bg-black hover:text-white transition-colors p-1 border-2 border-transparent hover:border-black">
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b-4 border-black bg-white relative z-10">
                            <button
                                onClick={() => { setModalTab('create'); setError(""); }}
                                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${modalTab === 'create'
                                    ? 'bg-black text-white border-b-4 border-black'
                                    : 'text-gray-500 hover:text-black hover:bg-gray-100 border-b-4 border-transparent'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <Sparkles size={16} strokeWidth={3} /> INITIALIZE HOST
                                </span>
                            </button>
                            <button
                                onClick={() => { setModalTab('join'); setError(""); }}
                                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${modalTab === 'join'
                                    ? 'bg-black text-white border-b-4 border-black'
                                    : 'text-gray-500 hover:text-black hover:bg-gray-100 border-b-4 border-transparent'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <LogIn size={16} strokeWidth={3} /> ESTABLISH LINK
                                </span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 bg-white relative z-10">
                            {modalTab === 'create' ? (
                                <div className="space-y-6">
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none flex items-center justify-center mx-auto mb-4">
                                            <Sparkles size={28} className="text-black" strokeWidth={2} />
                                        </div>
                                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wider">Initialize a new secure communications hub for your network.</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2 border-l-4 border-black pl-2">SERVER DESIGNATION</label>
                                        <input
                                            type="text"
                                            value={newServerName}
                                            onChange={(e) => setNewServerName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateServer()}
                                            className="w-full bg-gray-50 border-2 border-black px-4 py-3 text-black font-bold focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:text-gray-400"
                                            placeholder="Enter classification name..."
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none flex items-center justify-center mx-auto mb-4">
                                            <LogIn size={28} className="text-black" strokeWidth={2} />
                                        </div>
                                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wider">Provide authorization code to establish a link with an existing host.</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2 border-l-4 border-black pl-2">AUTHORIZATION CODE / URI</label>
                                        <input
                                            type="text"
                                            value={inviteCode}
                                            onChange={(e) => setInviteCode(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleJoinServer()}
                                            className="w-full bg-gray-50 border-2 border-black px-4 py-3 text-black font-bold focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-mono placeholder:font-sans placeholder:font-normal placeholder:text-gray-400"
                                            placeholder="abc123 or https://kita.app/join/abc123"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-gray-100 p-3 border-l-4 border-gray-400">
                                        <p className="text-black mb-1">VALID FORMATS:</p>
                                        <ul className="space-y-1 ml-4 list-square">
                                            <li>abc123</li>
                                            <li>https://kita.app/join/abc123</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="mt-6 bg-red-50 border-2 border-red-500 text-red-700 font-bold text-xs uppercase p-3 flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
                                    <AlertTriangle size={16} strokeWidth={3} className="shrink-0" />
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 border-t-4 border-black flex justify-end gap-4 relative z-10">
                            <button onClick={closeModal} className="px-6 py-2.5 font-black text-xs transition-all uppercase tracking-widest bg-transparent border-2 border-transparent hover:border-black text-gray-600 hover:text-black">
                                ABORT
                            </button>
                            {modalTab === 'create' ? (
                                <button
                                    onClick={handleCreateServer}
                                    disabled={isCreating || !newServerName.trim()}
                                    className="px-6 py-2.5 font-black text-xs transition-all uppercase tracking-widest border-2 border-black bg-black text-white hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isCreating ? 'PROCESSING...' : 'INITIALIZE'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleJoinServer}
                                    disabled={isJoining || !inviteCode.trim()}
                                    className="px-6 py-2.5 font-black text-xs transition-all uppercase tracking-widest border-2 border-black bg-black text-white hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isJoining ? 'PROCESSING...' : 'ESTABLISH'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
