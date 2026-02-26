import { useState, useEffect } from 'react';
import { Plus, Hash, Volume2, Settings, MicOff, Headphones, ChevronDown, Pencil, Trash2, MoreVertical, X, Check, Copy, Link, Users, LogOut } from 'lucide-react';
import { channelService } from '../../services/channelService';
import { serverService } from '../../services/serverService';
import { serverInviteService } from '../../services/serverInviteService';
import { fetchGetProfile } from '../../utils/fetchAPI';
import type { ServerDto, ChannelDto, ServerInviteDto } from '../../types/api';

interface ServerSidebarProps {
    server: ServerDto;
    currentChannelId: string | null;
    onChannelSelect: (channel: ChannelDto) => void;
    onServerUpdate?: (server: ServerDto) => void;
}

export default function ServerSidebar({ server, currentChannelId, onChannelSelect, onServerUpdate }: ServerSidebarProps) {
    const [channels, setChannels] = useState<ChannelDto[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newChannelName, setNewChannelName] = useState("");
    const [newChannelType, setNewChannelType] = useState<'text' | 'voice'>('text');
    const [isCreating, setIsCreating] = useState(false);
    const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
    const [editChannelName, setEditChannelName] = useState("");
    const [contextMenuChannelId, setContextMenuChannelId] = useState<string | null>(null);

    // Server Settings Modal State
    const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
    const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'overview' | 'invites'>('overview');
    const [serverName, setServerName] = useState(server.name);
    const [isSaving, setIsSaving] = useState(false);
    const [invites, setInvites] = useState<ServerInviteDto[]>([]);
    const [isCreatingInvite, setIsCreatingInvite] = useState(false);
    const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUserName, setCurrentUserName] = useState<string>('User');
    const [currentUserAvatarUrl, setCurrentUserAvatarUrl] = useState<string | null>(null);

    // Invite creation options
    const [showInviteOptions, setShowInviteOptions] = useState(false);
    const [inviteExpiration, setInviteExpiration] = useState<string>("24");
    const [inviteMaxUses, setInviteMaxUses] = useState<string>("0");

    useEffect(() => {
        const loadUserProfile = async () => {
            try {
                const result = await fetchGetProfile();
                if (result.success && result.data) {
                    setCurrentUserId(result.data.id);
                    setCurrentUserName(result.data.userName || result.data.username || 'User');
                    setCurrentUserAvatarUrl(result.data.avatarUrl || null);
                }
            } catch (error) {
                console.error('Failed to load user profile:', error);
                // Fallback to JWT decode if API fails
                const token = localStorage.getItem('auth_token');
                if (token) {
                    try {
                        const payload = token.split('.')[1];
                        const decoded = JSON.parse(atob(payload));
                        setCurrentUserId(decoded.userId || decoded.sub);
                        setCurrentUserName(decoded.unique_name || decoded.name || 'User');
                    } catch { }
                }
            }
        };
        loadUserProfile();
    }, []);

    useEffect(() => {
        if (server) {
            loadChannels();
            setServerName(server.name);
        }
    }, [server]);

    const loadChannels = async () => {
        try {
            const data = await channelService.getServerChannels(server.id);
            const normalizedChannels = data.map(ch => ({
                ...ch,
                type: ch.type === 0 || ch.type === 'text' ? 'text' : 'voice'
            })) as ChannelDto[];
            setChannels(normalizedChannels);
            if (!currentChannelId && normalizedChannels.length > 0) {
                onChannelSelect(normalizedChannels[0]);
            }
        } catch (error) {
            console.error("Failed to load channels", error);
        }
    };

    const handleCreateChannel = async () => {
        if (!newChannelName.trim()) return;
        setIsCreating(true);
        try {
            const newChannel = await channelService.createChannel({
                name: newChannelName,
                serverId: server.id,
                type: newChannelType === 'text' ? 0 : 1
            });
            const newChannelClient: ChannelDto = {
                ...newChannel,
                type: newChannelType
            };
            setChannels([...channels, newChannelClient]);
            setIsCreateModalOpen(false);
            setNewChannelName("");
            onChannelSelect(newChannelClient);
        } catch (error) {
            console.error("Failed to create channel", error);
        } finally {
            setIsCreating(false);
        }
    };

    const startEditingChannel = (channel: ChannelDto) => {
        setEditingChannelId(channel.id);
        setEditChannelName(channel.name);
        setContextMenuChannelId(null);
    };

    const saveChannelEdit = async (channelId: string) => {
        if (!editChannelName.trim()) return;
        try {
            const updated = await channelService.updateChannel(channelId, { name: editChannelName });
            setChannels(channels.map(ch => ch.id === channelId ? { ...ch, name: updated.name } : ch));
            setEditingChannelId(null);
            setEditChannelName("");
        } catch (error) {
            console.error("Failed to update channel", error);
        }
    };

    const deleteChannel = async (channelId: string) => {
        if (!confirm("Are you sure you want to delete this channel?")) return;
        try {
            await channelService.deleteChannel(channelId);
            setChannels(channels.filter(ch => ch.id !== channelId));
            setContextMenuChannelId(null);
            if (currentChannelId === channelId && channels.length > 1) {
                const remaining = channels.filter(ch => ch.id !== channelId);
                if (remaining.length > 0) {
                    onChannelSelect(remaining[0]);
                }
            }
        } catch (error) {
            console.error("Failed to delete channel", error);
        }
    };

    // Server Settings Functions
    const openServerSettings = () => {
        setIsServerSettingsOpen(true);
        setSettingsTab('overview');
        setServerName(server.name);
    };

    const saveServerSettings = async () => {
        if (!serverName.trim()) return;
        setIsSaving(true);
        try {
            const updated = await serverService.updateServer(server.id, { name: serverName });
            onServerUpdate?.(updated);
            setIsServerSettingsOpen(false);
        } catch (error) {
            console.error("Failed to update server", error);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteServer = async () => {
        if (!confirm("Are you sure you want to delete this server? This action cannot be undone.")) return;
        try {
            await serverService.deleteServer(server.id);
            window.location.reload();
        } catch (error) {
            console.error("Failed to delete server", error);
        }
    };

    const leaveServer = async () => {
        if (!confirm("Are you sure you want to leave this server?")) return;
        try {
            await serverService.leaveServer(server.id);
            window.location.reload();
        } catch (error) {
            console.error("Failed to leave server", error);
        }
    };

    const loadInvites = async () => {
        try {
            const data = await serverInviteService.getServerInvites(server.id);
            setInvites(data);
        } catch (error) {
            console.error("Failed to load invites", error);
        }
    };

    const createInvite = async () => {
        setIsCreatingInvite(true);
        try {
            const expHours = inviteExpiration === "0" ? undefined : parseInt(inviteExpiration);
            const maxUses = inviteMaxUses === "0" ? undefined : parseInt(inviteMaxUses);

            const newInvite = await serverInviteService.createInvite(server.id, {
                expiresInHours: expHours,
                maxUses: maxUses
            });
            setInvites([newInvite, ...invites]);
            setShowInviteOptions(false);
            setInviteExpiration("24");
            setInviteMaxUses("0");
        } catch (error) {
            console.error("Failed to create invite", error);
        } finally {
            setIsCreatingInvite(false);
        }
    };

    const copyInviteLink = (invite: ServerInviteDto) => {
        const link = `${window.location.origin}/join/${invite.code}`;
        navigator.clipboard.writeText(link);
        setCopiedInviteId(invite.id);
        setTimeout(() => setCopiedInviteId(null), 2000);
    };

    const revokeInvite = async (inviteId: string) => {
        try {
            await serverInviteService.revokeInvite(inviteId);
            setInvites(invites.filter(inv => inv.id !== inviteId));
        } catch (error) {
            console.error("Failed to revoke invite", error);
        }
    };

    useEffect(() => {
        if (isServerSettingsOpen && settingsTab === 'invites') {
            loadInvites();
        }
    }, [isServerSettingsOpen, settingsTab]);

    const isOwner = currentUserId === server.ownerId;

    if (!server) return <div className="w-60 bg-[#120c12] border-r border-[#ffffff0d]"></div>;

    const textChannels = channels.filter(c => c.type === 'text');
    const voiceChannels = channels.filter(c => c.type === 'voice');

    const renderChannel = (channel: ChannelDto, isVoice: boolean = false) => {
        const isEditing = editingChannelId === channel.id;
        const Icon = isVoice ? Volume2 : Hash;

        return (
            <div
                key={channel.id}
                className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all relative ${currentChannelId === channel.id
                    ? 'bg-[#ffffff10] text-white'
                    : 'text-[#ffffff70] hover:bg-[#ffffff08] hover:text-[#ffffff90]'
                    }`}
                onClick={() => !isEditing && onChannelSelect(channel)}
            >
                <Icon size={16} className={currentChannelId === channel.id ? 'text-[#ff7a3c]' : 'text-current'} />

                {isEditing ? (
                    <div className="flex-1 flex items-center gap-1">
                        <input
                            type="text"
                            value={editChannelName}
                            onChange={(e) => setEditChannelName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveChannelEdit(channel.id);
                                if (e.key === 'Escape') setEditingChannelId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 bg-[#0d080f] text-white text-sm rounded px-2 py-0.5 outline-none border border-white/20 focus:border-[#ff7a3c]"
                            autoFocus
                        />
                        <button
                            onClick={(e) => { e.stopPropagation(); saveChannelEdit(channel.id); }}
                            className="p-1 text-green-500 hover:text-green-400"
                        >
                            <Check size={12} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setEditingChannelId(null); }}
                            className="p-1 text-[#ffffff50] hover:text-white"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ) : (
                    <>
                        <span className="font-medium truncate text-sm flex-1">{channel.name}</span>

                        {isOwner && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setContextMenuChannelId(contextMenuChannelId === channel.id ? null : channel.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#ffffff10] rounded text-[#ffffff50] hover:text-white transition-opacity"
                            >
                                <MoreVertical size={14} />
                            </button>
                        )}

                        {contextMenuChannelId === channel.id && (
                            <div
                                className="absolute right-0 top-full mt-1 bg-[#1a141a] rounded-lg shadow-xl border border-[#ffffff15] py-1 min-w-[120px] z-20"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => startEditingChannel(channel)}
                                    className="w-full px-3 py-2 text-left text-sm text-white hover:bg-[#ffffff10] flex items-center gap-2"
                                >
                                    <Pencil size={14} /> Edit
                                </button>
                                <button
                                    onClick={() => deleteChannel(channel.id)}
                                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-[#ffffff10] flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="w-60 bg-[#120c12] flex flex-col border-r border-[#ffffff0d] h-full flex-shrink-0" onClick={() => { setContextMenuChannelId(null); setIsServerDropdownOpen(false); }}>
            {/* Server Header */}
            <div className="relative">
                <div
                    onClick={(e) => { e.stopPropagation(); setIsServerDropdownOpen(!isServerDropdownOpen); }}
                    className="h-12 px-4 flex items-center justify-between border-b border-[#ffffff0d] hover:bg-[#ffffff05] cursor-pointer transition-colors shadow-sm"
                >
                    <h1 className="font-bold text-white truncate text-sm tracking-wide">{server.name}</h1>
                    <ChevronDown size={14} className={`text-white/70 transition-transform ${isServerDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isServerDropdownOpen && (
                    <div
                        className="absolute top-12 left-2 right-2 bg-[#1a141a] rounded-lg shadow-xl border border-[#ffffff15] py-1.5 z-[100]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => { setIsServerDropdownOpen(false); openServerSettings(); }}
                            className="w-full px-3 py-2 text-left text-sm text-[#ffffff90] hover:text-white hover:bg-[#ffffff10] flex items-center justify-between transition-colors"
                        >
                            <span className="font-medium">Server Settings</span>
                            <Settings size={14} />
                        </button>

                        <div className="my-1 border-t border-[#ffffff0a]" />

                        {isOwner ? (
                            <button
                                onClick={() => { setIsServerDropdownOpen(false); deleteServer(); }}
                                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-between transition-colors"
                            >
                                <span className="font-medium">Delete Server</span>
                                <Trash2 size={14} />
                            </button>
                        ) : (
                            <button
                                onClick={() => { setIsServerDropdownOpen(false); leaveServer(); }}
                                className="w-full px-3 py-2 text-left text-sm text-[#ef444490] hover:text-[#ef4444] hover:bg-[#ef444415] flex items-center justify-between transition-colors"
                            >
                                <span className="font-medium">Leave Server</span>
                                <LogOut size={14} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Channels */}
            <div className="flex-1 overflow-y-auto p-3 space-y-6">
                {/* Text Channels */}
                <div>
                    <div className="flex items-center justify-between px-2 mb-1 group text-[#ffffff70] hover:text-[#ffffff90]">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Text Channels</span>
                        {isOwner && (
                            <button onClick={() => { setNewChannelType('text'); setIsCreateModalOpen(true); }} className="hover:text-white transition-colors">
                                <Plus size={14} />
                            </button>
                        )}
                    </div>
                    <div className="space-y-0.5">
                        {textChannels.map(channel => renderChannel(channel, false))}
                    </div>
                </div>

                {/* Voice Channels */}
                <div>
                    <div className="flex items-center justify-between px-2 mb-1 group text-[#ffffff70] hover:text-[#ffffff90]">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Voice Channels</span>
                        {isOwner && (
                            <button onClick={() => { setNewChannelType('voice'); setIsCreateModalOpen(true); }} className="hover:text-white transition-colors">
                                <Plus size={14} />
                            </button>
                        )}
                    </div>
                    <div className="space-y-0.5">
                        {voiceChannels.map(channel => renderChannel(channel, true))}
                    </div>
                </div>
            </div>

            {/* User Panel */}
            <div className="bg-[#0f0a0f] p-3 flex items-center gap-3 border-t border-[#ffffff0d]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff7a3c] to-[#ff4d4d] flex items-center justify-center text-xs font-bold text-white shadow-lg overflow-hidden">
                    {currentUserAvatarUrl ? (
                        <img src={currentUserAvatarUrl} alt={currentUserName} className="w-full h-full object-cover" />
                    ) : (
                        currentUserName.substring(0, 1).toUpperCase()
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{currentUserName}</div>
                    <div className="text-[10px] text-white/50 truncate flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Online
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-[#ffffff10] rounded text-white/70 hover:text-white transition-colors">
                        <MicOff size={14} />
                    </button>
                    <button className="p-1.5 hover:bg-[#ffffff10] rounded text-white/70 hover:text-white transition-colors">
                        <Headphones size={14} />
                    </button>
                    <button className="p-1.5 hover:bg-[#ffffff10] rounded text-white/70 hover:text-white transition-colors">
                        <Settings size={14} />
                    </button>
                </div>
            </div>

            {/* Create Channel Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="bg-[#1a141a] rounded-2xl w-full max-w-sm overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-white/10">
                            <h3 className="text-white font-bold">Create {newChannelType === 'text' ? 'Text' : 'Voice'} Channel</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-2">CHANNEL NAME</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                                        {newChannelType === 'text' ? '#' : <Volume2 size={14} />}
                                    </span>
                                    <input
                                        type="text"
                                        value={newChannelName}
                                        onChange={(e) => setNewChannelName(e.target.value)}
                                        className="w-full bg-[#0d080f] text-white text-sm rounded-lg border border-white/20 py-2.5 pl-8 pr-3 outline-none focus:border-[#ff7a3c]"
                                        placeholder="new-channel"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-[#0d080f] flex justify-end gap-2 text-sm">
                            <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 hover:underline text-white/70">Cancel</button>
                            <button
                                onClick={handleCreateChannel}
                                disabled={isCreating || !newChannelName.trim()}
                                className="px-5 py-2 bg-[#ff7a3c] text-white font-medium rounded-lg hover:bg-[#ff8c52] disabled:opacity-50"
                            >
                                {isCreating ? 'Creating...' : 'Create Channel'}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Server Settings Modal */}
            {
                isServerSettingsOpen && (
                    <div className="fixed inset-0 bg-black/90 flex z-50" onClick={() => setIsServerSettingsOpen(false)}>
                        <div className="flex w-full max-w-4xl mx-auto my-8" onClick={e => e.stopPropagation()}>
                            {/* Sidebar */}
                            <div className="w-48 bg-[#120c12] rounded-l-2xl p-4 flex flex-col gap-1">
                                <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider px-2 mb-2">Server Settings</h3>
                                <button
                                    onClick={() => setSettingsTab('overview')}
                                    className={`px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors ${settingsTab === 'overview' ? 'bg-[#ffffff10] text-white' : 'text-white/70 hover:bg-[#ffffff08] hover:text-white'}`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setSettingsTab('invites')}
                                    className={`px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors flex items-center gap-2 ${settingsTab === 'invites' ? 'bg-[#ffffff10] text-white' : 'text-white/70 hover:bg-[#ffffff08] hover:text-white'}`}
                                >
                                    <Link size={14} /> Invites
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 bg-[#1a141a] rounded-r-2xl p-6 overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white">
                                        {settingsTab === 'overview' ? 'Server Overview' : 'Invites'}
                                    </h2>
                                    <button onClick={() => setIsServerSettingsOpen(false)} className="text-white/50 hover:text-white p-1">
                                        <X size={20} />
                                    </button>
                                </div>

                                {settingsTab === 'overview' && (
                                    <div className="space-y-6">
                                        {/* Owner Badge */}
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${isOwner ? 'bg-[#ff7a3c]/20 text-[#ff7a3c]' : 'bg-white/10 text-white/50'}`}>
                                                {isOwner ? '👑 You are the Owner' : '👤 Member'}
                                            </span>
                                        </div>

                                        {/* Server Icon */}
                                        <div>
                                            <label className="block text-xs font-medium text-white/70 mb-2">SERVER ICON</label>
                                            <div className="flex items-center gap-4">
                                                <div className="w-20 h-20 rounded-2xl bg-[#0d080f] border border-white/10 flex items-center justify-center overflow-hidden">
                                                    {server.iconUrl ? (
                                                        <img src={server.iconUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-2xl font-bold text-white/50">
                                                            {server.name.substring(0, 2).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                {isOwner && (
                                                    <div className="flex flex-col gap-2">
                                                        <input
                                                            type="file"
                                                            id="server-icon-upload"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    try {
                                                                        const iconUrl = await serverService.uploadServerIcon(server.id, file);
                                                                        onServerUpdate?.({ ...server, iconUrl });
                                                                    } catch (err) {
                                                                        console.error("Failed to upload icon", err);
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <label
                                                            htmlFor="server-icon-upload"
                                                            className="px-4 py-2 bg-[#1a141a] text-white text-sm font-medium rounded-lg hover:bg-[#251d25] cursor-pointer border border-white/10"
                                                        >
                                                            Upload Image
                                                        </label>
                                                        <p className="text-xs text-white/40">Recommended: 512x512 or larger</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Server Name */}
                                        <div>
                                            <label className="block text-xs font-medium text-white/70 mb-2">SERVER NAME</label>
                                            {isOwner ? (
                                                <input
                                                    type="text"
                                                    value={serverName}
                                                    onChange={(e) => setServerName(e.target.value)}
                                                    className="w-full max-w-md bg-[#0d080f] text-white text-sm rounded-lg border border-white/20 p-3 outline-none focus:border-[#ff7a3c]"
                                                />
                                            ) : (
                                                <div className="w-full max-w-md bg-[#0d080f] text-white/70 text-sm rounded-lg border border-white/10 p-3">
                                                    {server.name}
                                                </div>
                                            )}
                                        </div>

                                        {/* Save Button - Owner only */}
                                        {isOwner ? (
                                            <button
                                                onClick={saveServerSettings}
                                                disabled={isSaving || !serverName.trim() || serverName === server.name}
                                                className="px-5 py-2.5 bg-[#ff7a3c] text-white font-medium rounded-lg hover:bg-[#ff8c52] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        ) : (
                                            <p className="text-sm text-white/40 italic">
                                                Only the server owner can edit server settings.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {settingsTab === 'invites' && (
                                    <div className="space-y-4">
                                        {/* Create Invite Section */}
                                        <div className="bg-[#0d080f] rounded-lg border border-white/10 overflow-hidden">
                                            <button
                                                onClick={() => setShowInviteOptions(!showInviteOptions)}
                                                className="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-white/5 transition-colors"
                                            >
                                                <span className="flex items-center gap-2 font-medium">
                                                    <Plus size={16} className={`transform transition-transform ${showInviteOptions ? 'rotate-45' : ''}`} />
                                                    Create Invite Link
                                                </span>
                                            </button>

                                            {showInviteOptions && (
                                                <div className="px-4 pb-4 pt-2 border-t border-white/10 space-y-4">
                                                    {/* Expiration */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-white/70 mb-2">EXPIRE AFTER</label>
                                                        <select
                                                            value={inviteExpiration}
                                                            onChange={(e) => setInviteExpiration(e.target.value)}
                                                            className="w-full bg-[#1a141a] text-white text-sm rounded-lg border border-white/20 p-2.5 outline-none focus:border-[#ff7a3c]"
                                                        >
                                                            <option value="1">1 hour</option>
                                                            <option value="6">6 hours</option>
                                                            <option value="12">12 hours</option>
                                                            <option value="24">1 day</option>
                                                            <option value="168">7 days</option>
                                                            <option value="720">30 days</option>
                                                            <option value="0">Never</option>
                                                        </select>
                                                    </div>

                                                    {/* Max Uses */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-white/70 mb-2">MAX USES</label>
                                                        <select
                                                            value={inviteMaxUses}
                                                            onChange={(e) => setInviteMaxUses(e.target.value)}
                                                            className="w-full bg-[#1a141a] text-white text-sm rounded-lg border border-white/20 p-2.5 outline-none focus:border-[#ff7a3c]"
                                                        >
                                                            <option value="0">No limit</option>
                                                            <option value="1">1 use</option>
                                                            <option value="5">5 uses</option>
                                                            <option value="10">10 uses</option>
                                                            <option value="25">25 uses</option>
                                                            <option value="50">50 uses</option>
                                                            <option value="100">100 uses</option>
                                                        </select>
                                                    </div>

                                                    {/* Create Button */}
                                                    <button
                                                        onClick={createInvite}
                                                        disabled={isCreatingInvite}
                                                        className="w-full px-4 py-2.5 bg-[#ff7a3c] text-white font-medium rounded-lg hover:bg-[#ff8c52] disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        {isCreatingInvite ? 'Creating...' : 'Generate Invite Link'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Invite List */}
                                        <div className="space-y-2">
                                            {invites.length === 0 ? (
                                                <p className="text-white/50 text-sm py-4">No invites yet. Create one to share with friends!</p>
                                            ) : (
                                                invites.map(invite => (
                                                    <div
                                                        key={invite.id}
                                                        className={`bg-[#0d080f] rounded-lg p-4 border ${invite.isValid ? 'border-white/10' : 'border-red-500/30 opacity-50'}`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <code className="text-[#ff7a3c] font-mono text-sm">{invite.code}</code>
                                                                    {!invite.isValid && (
                                                                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                                                            {invite.isRevoked ? 'Revoked' : 'Expired'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-4 text-xs text-white/50">
                                                                    <span className="flex items-center gap-1">
                                                                        <Users size={12} /> {invite.uses}{invite.maxUses ? `/${invite.maxUses}` : ''} uses
                                                                    </span>
                                                                    {invite.expiresAt && (
                                                                        <span>Expires: {new Date(invite.expiresAt).toLocaleDateString()}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {invite.isValid && (
                                                                    <button
                                                                        onClick={() => copyInviteLink(invite)}
                                                                        className="p-2 hover:bg-[#ffffff10] rounded-lg text-white/70 hover:text-white transition-colors"
                                                                        title="Copy invite link"
                                                                    >
                                                                        {copiedInviteId === invite.id ? (
                                                                            <Check size={16} className="text-green-500" />
                                                                        ) : (
                                                                            <Copy size={16} />
                                                                        )}
                                                                    </button>
                                                                )}
                                                                {isOwner && invite.isValid && (
                                                                    <button
                                                                        onClick={() => revokeInvite(invite.id)}
                                                                        className="p-2 hover:bg-[#ffffff10] rounded-lg text-red-400 hover:text-red-300 transition-colors"
                                                                        title="Revoke invite"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
