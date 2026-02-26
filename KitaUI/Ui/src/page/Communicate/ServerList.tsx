import { useState, useEffect } from 'react';
import { Plus, X, LogIn, Sparkles } from 'lucide-react';
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

        // Connect to ChatHub if not connected
        if (!chatService.isConnected()) {
            chatService.connect(token).catch(err => {
                console.error('Failed to connect to ChatHub in ServerList:', err);
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

        chatService.onServerLeft(handleServerLeft);

        return () => {
            chatService.offServerLeft(handleServerLeft);
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
        <div className="w-[72px] bg-[#0d080f] flex flex-col items-center py-4 gap-3 border-r border-[#ffffff0d] overflow-y-auto h-full flex-shrink-0">
            {/* Servers */}
            {servers.map(server => (
                <div key={server.id} className="relative group w-full flex justify-center">
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-lg bg-[#ff7a3c] transition-all duration-200 ${currentServerId === server.id ? 'h-10' : 'h-0 group-hover:h-5'}`} />

                    <button
                        onClick={() => onServerSelect(server)}
                        className={`w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 flex items-center justify-center overflow-hidden shadow-lg ${currentServerId === server.id
                            ? 'bg-[#ff7a3c] text-white'
                            : 'bg-[#1a141a] text-white/70 hover:bg-[#ff7a3c] hover:text-white'
                            }`}
                        title={server.name}
                    >
                        {server.iconUrl ? (
                            <img src={server.iconUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold text-sm">
                                {server.name.substring(0, 2).toUpperCase()}
                            </span>
                        )}
                    </button>
                </div>
            ))}

            {/* Separator */}
            <div className="w-8 h-[2px] bg-[#ffffff1a] rounded-lg my-1" />

            {/* Add Server Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-12 h-12 rounded-[24px] bg-[#1a141a] text-[#ff7a3c] hover:bg-[#ff7a3c] hover:text-white transition-all duration-200 flex items-center justify-center group"
                title="Add a Server"
            >
                <Plus size={24} className="group-hover:rotate-90 transition-transform" />
            </button>

            {/* Create/Join Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={closeModal}>
                    <div className="bg-[#1a141a] rounded-2xl w-full max-w-md overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-white/10">
                            <h3 className="text-white font-bold">Add a Server</h3>
                            <button onClick={closeModal} className="text-white/50 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10">
                            <button
                                onClick={() => { setModalTab('create'); setError(""); }}
                                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${modalTab === 'create'
                                    ? 'text-[#ff7a3c] border-b-2 border-[#ff7a3c]'
                                    : 'text-white/50 hover:text-white/70'
                                    }`}
                            >
                                <Sparkles size={16} /> Create Server
                            </button>
                            <button
                                onClick={() => { setModalTab('join'); setError(""); }}
                                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${modalTab === 'join'
                                    ? 'text-[#ff7a3c] border-b-2 border-[#ff7a3c]'
                                    : 'text-white/50 hover:text-white/70'
                                    }`}
                            >
                                <LogIn size={16} /> Join Server
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            {modalTab === 'create' ? (
                                <div className="space-y-4">
                                    <div className="text-center mb-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-[#ff7a3c] to-[#ff4d4d] rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Sparkles size={28} className="text-white" />
                                        </div>
                                        <p className="text-white/60 text-sm">Create your own server and invite your friends!</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-white/70 mb-2">SERVER NAME</label>
                                        <input
                                            type="text"
                                            value={newServerName}
                                            onChange={(e) => setNewServerName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateServer()}
                                            className="w-full bg-[#0d080f] text-white text-sm rounded-lg border border-white/20 p-3 outline-none focus:border-[#ff7a3c]"
                                            placeholder="My Awesome Server"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-center mb-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-[#5865F2] to-[#7289da] rounded-full flex items-center justify-center mx-auto mb-3">
                                            <LogIn size={28} className="text-white" />
                                        </div>
                                        <p className="text-white/60 text-sm">Enter an invite code or paste a link to join a server</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-white/70 mb-2">INVITE LINK OR CODE</label>
                                        <input
                                            type="text"
                                            value={inviteCode}
                                            onChange={(e) => setInviteCode(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleJoinServer()}
                                            className="w-full bg-[#0d080f] text-white text-sm rounded-lg border border-white/20 p-3 outline-none focus:border-[#ff7a3c] font-mono"
                                            placeholder="abc123 or https://app.com/join/abc123"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="text-xs text-white/40">
                                        <p className="font-medium text-white/50 mb-1">Invites should look like:</p>
                                        <ul className="space-y-0.5 ml-3">
                                            <li>• abc123</li>
                                            <li>• https://kita.app/join/abc123</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-[#0d080f] flex justify-end gap-2 text-sm">
                            <button onClick={closeModal} className="px-4 py-2.5 hover:underline text-white/70">
                                Cancel
                            </button>
                            {modalTab === 'create' ? (
                                <button
                                    onClick={handleCreateServer}
                                    disabled={isCreating || !newServerName.trim()}
                                    className="px-5 py-2.5 bg-[#ff7a3c] text-white font-medium rounded-lg hover:bg-[#ff8c52] disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isCreating ? 'Creating...' : 'Create Server'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleJoinServer}
                                    disabled={isJoining || !inviteCode.trim()}
                                    className="px-5 py-2.5 bg-[#5865F2] text-white font-medium rounded-lg hover:bg-[#6b78f5] disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isJoining ? 'Joining...' : 'Join Server'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
