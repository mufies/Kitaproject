import { useState, useEffect } from 'react';
import { Plus, Hash, Volume2, Settings, MicOff, Headphones, ChevronDown, Pencil, Trash2, MoreVertical, X, Check, Copy, Link, Users, LogOut, AlertTriangle } from 'lucide-react';
import { channelService } from '../../services/channelService';
import { serverService } from '../../services/serverService';
import { serverInviteService } from '../../services/serverInviteService';
import { fetchGetProfile } from '../../utils/fetchAPI';
import type { ServerDto, ChannelDto, ServerInviteDto } from '../../types/api';
import { useVoice } from '../../contexts/VoiceContext';

interface ServerSidebarProps {
    server: ServerDto;
    currentChannelId: string | null;
    onChannelSelect: (channel: ChannelDto) => void;
    onServerUpdate?: (server: ServerDto) => void;
    voiceParticipantsByChannel: Map<string, Array<{ identity: string; name: string; isSpeaking: boolean; isMicrophoneEnabled: boolean }>>;
}

export default function ServerSidebar({ server, currentChannelId, onChannelSelect, onServerUpdate, voiceParticipantsByChannel }: ServerSidebarProps) {
    const [channels, setChannels] = useState<ChannelDto[]>([]);
    const { connection, leaveVoice } = useVoice();
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

    if (!server) return <div className="w-64 bg-gray-50 border-r-4 border-black"></div>;

    const textChannels = channels.filter(c => c.type === 'text');
    const voiceChannels = channels.filter(c => c.type === 'voice');

    const renderChannel = (channel: ChannelDto, isVoice: boolean = false) => {
        const isEditing = editingChannelId === channel.id;
        const Icon = isVoice ? Volume2 : Hash;

        return (
            <div
                key={channel.id}
                className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-all border-l-4 ${currentChannelId === channel.id
                    ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)]'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-black border-transparent'
                    }`}
                onClick={() => !isEditing && onChannelSelect(channel)}
            >
                <Icon size={16} className={currentChannelId === channel.id ? 'text-white' : 'text-current'} strokeWidth={currentChannelId === channel.id ? 3 : 2} />

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
                            className="flex-1 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-none px-2 py-1 outline-none border-2 border-black focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            autoFocus
                        />
                        <button
                            onClick={(e) => { e.stopPropagation(); saveChannelEdit(channel.id); }}
                            className="p-1 text-black hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-colors"
                        >
                            <Check size={14} strokeWidth={3} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setEditingChannelId(null); }}
                            className="p-1 text-black hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-colors"
                        >
                            <X size={14} strokeWidth={3} />
                        </button>
                    </div>
                ) : (
                    <>
                        <span className="font-bold uppercase tracking-wider text-xs flex-1 truncate">{channel.name}</span>

                        {isOwner && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setContextMenuChannelId(contextMenuChannelId === channel.id ? null : channel.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black hover:text-white text-gray-500 transition-colors"
                            >
                                <MoreVertical size={14} strokeWidth={3} />
                            </button>
                        )}

                        {contextMenuChannelId === channel.id && (
                            <div
                                className="absolute right-2 top-full mt-1 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-1 min-w-[140px] z-30 flex flex-col"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => startEditingChannel(channel)}
                                    className="px-4 py-2 text-left text-xs font-black uppercase tracking-widest text-black hover:bg-black hover:text-white flex items-center gap-2 transition-colors"
                                >
                                    <Pencil size={14} strokeWidth={3} /> RECONFIGURE
                                </button>
                                <button
                                    onClick={() => deleteChannel(channel.id)}
                                    className="px-4 py-2 text-left text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white flex items-center gap-2 transition-colors"
                                >
                                    <Trash2 size={14} strokeWidth={3} /> DELETE
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <>
            <div className="w-64 bg-gray-50 flex flex-col border-r-4 border-black h-full flex-shrink-0 z-10" onClick={() => { setContextMenuChannelId(null); setIsServerDropdownOpen(false); }}>
                {/* Server Header - Clickable dropdown */}
                <div className="relative flex-shrink-0">
                    <div
                        onClick={(e) => { e.stopPropagation(); setIsServerDropdownOpen(!isServerDropdownOpen); }}
                        className="h-14 px-4 flex items-center justify-between border-b-4 border-black hover:bg-gray-100 cursor-pointer transition-colors bg-white shadow-sm z-20 relative select-none"
                    >
                        <h1 className="font-black text-black uppercase tracking-tight text-lg truncate flex-1">{server.name}</h1>
                        <ChevronDown size={20} strokeWidth={3} className={`text-black transition-transform duration-200 flex-shrink-0 ${isServerDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isServerDropdownOpen && (
                        <div
                            className="absolute top-full left-0 right-0 bg-white border-x-4 border-b-4 border-black shadow-[4px_8px_0px_0px_rgba(0,0,0,1)] z-30 flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {isOwner && (
                                <button
                                    onClick={() => { setIsServerDropdownOpen(false); openServerSettings(); }}
                                    className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-black hover:bg-black hover:text-white flex items-center justify-between transition-colors border-b-2 border-gray-100"
                                >
                                    <span>SERVER PARAMETERS</span>
                                    <Settings size={16} strokeWidth={3} />
                                </button>
                            )}
                            {isOwner ? (
                                <button
                                    onClick={() => { setIsServerDropdownOpen(false); deleteServer(); }}
                                    className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-between transition-colors"
                                >
                                    <span>TERMINATE SERVER</span>
                                    <Trash2 size={16} strokeWidth={3} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => { setIsServerDropdownOpen(false); leaveServer(); }}
                                    className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-between transition-colors"
                                >
                                    <span>ABANDON SERVER</span>
                                    <LogOut size={16} strokeWidth={3} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Channels */}
                <div className="flex-1 overflow-y-auto p-4 space-y-8">
                    {/* Text Channels */}
                    <div>
                        <div className="flex items-center justify-between px-2 mb-3 group">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 border-l-4 border-gray-400 pl-2">TEXT CHANNELS</span>
                            {isOwner && (
                                <button onClick={() => { setNewChannelType('text'); setIsCreateModalOpen(true); }} className="text-gray-400 hover:text-black hover:bg-gray-200 p-1 transition-colors">
                                    <Plus size={14} strokeWidth={3} />
                                </button>
                            )}
                        </div>
                        <div className="space-y-1">
                            {textChannels.map(channel => renderChannel(channel, false))}
                        </div>
                    </div>

                    {/* Voice Channels */}
                    <div>
                        <div className="flex items-center justify-between px-2 mb-3 group">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 border-l-4 border-gray-400 pl-2">VOICE CHANNELS</span>
                            {isOwner && (
                                <button onClick={() => { setNewChannelType('voice'); setIsCreateModalOpen(true); }} className="text-gray-400 hover:text-black hover:bg-gray-200 p-1 transition-colors">
                                    <Plus size={14} strokeWidth={3} />
                                </button>
                            )}
                        </div>
                        <div className="space-y-1">
                            {voiceChannels.map((channel) => {
                                const participants = voiceParticipantsByChannel.get(channel.id) || [];
                                return (
                                    <div key={channel.id}>
                                        <button
                                            onClick={() => onChannelSelect(channel)}
                                            className={`flex items-center gap-2 px-3 py-2 w-full text-left transition-all border-l-4 group ${currentChannelId === channel.id
                                                ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)]'
                                                : 'text-gray-600 hover:bg-gray-200 hover:text-black border-transparent'
                                                }`}
                                        >
                                            <Volume2 size={16} strokeWidth={currentChannelId === channel.id ? 3 : 2} className={currentChannelId === channel.id ? 'text-white' : 'text-current'} />
                                            <span className="flex-1 font-bold uppercase tracking-wider text-xs truncate">{channel.name}</span>
                                            {participants.length > 0 && (
                                                <span className="text-[10px] font-black bg-white text-black border-2 border-black px-2 py-0.5 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                    {participants.length}
                                                </span>
                                            )}
                                        </button>

                                        {/* Participants in this channel */}
                                        {participants.length > 0 && (
                                            <div className="ml-6 mt-2 mb-4 space-y-1 border-l-2 border-gray-300 pl-2">
                                                {participants.map((participant) => (
                                                    <div
                                                        key={participant.identity}
                                                        className="flex items-center gap-2 p-1.5 text-black hover:bg-gray-200 transition-colors group/participant"
                                                    >
                                                        <div className={`w-6 h-6 rounded-none flex items-center justify-center text-[10px] font-black border-2 border-black ${participant.isMicrophoneEnabled ? 'bg-white text-black' : 'bg-red-100 text-red-600 border-red-600'
                                                            }`}>
                                                            {participant.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="flex-1 text-xs font-bold uppercase tracking-wider truncate">{participant.name}</span>
                                                        {participant.isSpeaking && (
                                                            <div className="flex gap-1 items-center">
                                                                <div className="w-1 h-3 bg-black transform -skew-x-12 animate-pulse" />
                                                                <div className="w-1 h-4 bg-black transform -skew-x-12 animate-pulse" style={{ animationDelay: '75ms' }} />
                                                                <div className="w-1 h-3 bg-black transform -skew-x-12 animate-pulse" style={{ animationDelay: '150ms' }} />
                                                            </div>
                                                        )}
                                                        {!participant.isMicrophoneEnabled && (
                                                            <MicOff size={14} className="text-red-500" strokeWidth={3} />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Voice Status Bar - when connected */}
                {connection && (
                    <div className="px-4 py-3 bg-white border-y-4 border-black relative overflow-hidden group/status">
                        <div className="absolute top-0 right-0 w-8 h-8 bg-black transform rotate-45 translate-x-4 -translate-y-4"></div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-8 h-8 bg-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(150,150,150,1)]">
                                <Volume2 size={16} strokeWidth={3} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black tracking-widest uppercase text-black">LINK ACTIVE</p>
                                <p className="text-xs font-bold uppercase text-gray-500 truncate">{connection.channelName}</p>
                            </div>
                            <button
                                onClick={leaveVoice}
                                className="p-2 border-2 border-red-500 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(239,68,68,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                                title="SEVER CONNECTION"
                            >
                                <X size={16} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                )}

                {/* User Panel */}
                <div className="bg-gray-100 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center text-sm font-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative group/avatar">
                        {currentUserAvatarUrl ? (
                            <img src={currentUserAvatarUrl} alt={currentUserName} className="w-full h-full object-cover transition-all duration-300" />
                        ) : (
                            currentUserName.substring(0, 1).toUpperCase()
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-black uppercase text-black tracking-tight truncate">{currentUserName}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-black flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-none bg-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                                <span className="absolute inset-0 bg-white animate-pulse opacity-50"></span>
                            </span>
                            SYS_ONLINE
                        </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-0.5">
                        <button className="p-1.5 text-gray-600 hover:bg-black hover:text-white transition-colors" title="Mute Microphone">
                            <MicOff size={16} strokeWidth={2.5} />
                        </button>
                        <button className="p-1.5 text-gray-600 hover:bg-black hover:text-white transition-colors border-x-2 border-transparent" title="Deafen">
                            <Headphones size={16} strokeWidth={2.5} />
                        </button>
                        <button className="p-1.5 text-gray-600 hover:bg-black hover:text-white transition-colors" title="User Settings">
                            <Settings size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Channel Create Modal — rendered outside sidebar */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="fixed inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
                    </div>
                    <div className="bg-white w-full max-w-sm border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative z-10 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-10">CHANNEL_INIT</div>
                        <div className="absolute -left-16 -top-16 w-32 h-32 bg-gray-200 rotate-45 pointer-events-none opacity-50"></div>
                        <div className="p-4 border-b-4 border-black bg-gray-50 relative z-10">
                            <h3 className="text-black font-black uppercase tracking-tight text-xl">CREATE {newChannelType === 'text' ? 'TEXT' : 'VOICE'} CHANNEL</h3>
                        </div>
                        <div className="p-6 space-y-4 bg-white relative z-10">
                            <div>
                                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2 border-l-4 border-black pl-2">CHANNEL DESIGNATION</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black border-r-2 border-black pr-2">
                                        {newChannelType === 'text' ? <Hash size={18} strokeWidth={3} /> : <Volume2 size={18} strokeWidth={3} />}
                                    </span>
                                    <input
                                        type="text"
                                        value={newChannelName}
                                        onChange={(e) => setNewChannelName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateChannel()}
                                        className="w-full bg-gray-50 border-2 border-black py-3 pl-14 pr-4 text-black font-bold focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:text-gray-400"
                                        placeholder="new-channel"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t-4 border-black flex justify-end gap-4 relative z-10">
                            <button onClick={() => setIsCreateModalOpen(false)} className="px-6 py-2.5 font-black text-xs transition-all uppercase tracking-widest bg-transparent border-2 border-transparent hover:border-black text-gray-600 hover:text-black">ABORT</button>
                            <button
                                onClick={handleCreateChannel}
                                disabled={isCreating || !newChannelName.trim()}
                                className="px-6 py-2.5 font-black text-xs transition-all uppercase tracking-widest border-2 border-black bg-black text-white hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isCreating ? 'PROCESSING...' : 'INITIALIZE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Server Settings Modal — rendered outside sidebar */}
            {isServerSettingsOpen && (
                <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-[9999] p-6 backdrop-blur-sm" onClick={() => setIsServerSettingsOpen(false)}>
                    <div className="fixed inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
                    </div>
                    <div className="flex w-full max-w-5xl h-[85vh] border-4 border-black shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] bg-white relative z-10" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-30">CONFIG_PORTAL</div>

                        <div className="w-56 bg-gray-50 border-r-4 border-black p-6 flex flex-col gap-2 z-20 relative flex-shrink-0">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 border-b-2 border-gray-300 pb-2">PARAMETERS</h3>
                            <button onClick={() => setSettingsTab('overview')}
                                className={`px-4 py-3 text-left text-xs font-black uppercase tracking-widest transition-all border-2 ${settingsTab === 'overview' ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] translate-x-1' : 'bg-white text-black border-transparent hover:border-black'}`}
                            >OVERVIEW</button>
                            <button onClick={() => setSettingsTab('invites')}
                                className={`px-4 py-3 text-left text-xs font-black uppercase tracking-widest transition-all border-2 flex items-center gap-3 ${settingsTab === 'invites' ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] translate-x-1' : 'bg-white text-black border-transparent hover:border-black'}`}
                            ><Link size={16} strokeWidth={3} /> INVITES</button>
                        </div>

                        <div className="flex-1 bg-white p-10 overflow-y-auto relative z-20">
                            <div className="absolute -right-32 -top-32 w-64 h-64 bg-gray-100 rotate-45 pointer-events-none z-0"></div>
                            <div className="flex justify-between items-center mb-8 pb-4 border-b-4 border-black relative z-10">
                                <h2 className="text-4xl font-black text-black uppercase tracking-tighter">
                                    {settingsTab === 'overview' ? 'SERVER OVERVIEW' : 'INVITES'}
                                </h2>
                                <button onClick={() => setIsServerSettingsOpen(false)} className="p-2 border-2 border-transparent hover:border-black text-black hover:bg-black hover:text-white transition-all">
                                    <X size={24} strokeWidth={3} />
                                </button>
                            </div>

                            {settingsTab === 'overview' && (
                                <div className="space-y-10 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isOwner ? 'bg-black text-white' : 'bg-white text-black'}`}>
                                            {isOwner ? '👑 SYSTEM_ADMIN' : '👤 STANDARD_USER'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-4 border-l-4 border-black pl-2">SERVER ICON</label>
                                        <div className="flex items-center gap-8">
                                            <div className="w-32 h-32 bg-gray-100 border-4 border-black flex items-center justify-center overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                                {server.iconUrl ? (
                                                    <img src={server.iconUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-4xl font-black text-black">{server.name.substring(0, 2).toUpperCase()}</span>
                                                )}
                                            </div>
                                            {isOwner && (
                                                <div className="flex flex-col gap-3">
                                                    <input type="file" id="server-icon-upload" accept="image/*" className="hidden"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                try {
                                                                    const iconUrl = await serverService.uploadServerIcon(server.id, file);
                                                                    onServerUpdate?.({ ...server, iconUrl });
                                                                } catch (err) { console.error("Failed to upload icon", err); }
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor="server-icon-upload" className="px-6 py-3 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white cursor-pointer border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all text-center inline-block">
                                                        UPLOAD IMAGE
                                                    </label>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">RECOMMENDED: 512x512 OR LARGER</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-4 border-l-4 border-black pl-2">SERVER NAME</label>
                                        {isOwner ? (
                                            <input type="text" value={serverName} onChange={(e) => setServerName(e.target.value)}
                                                className="w-full max-w-md bg-gray-50 text-black text-sm font-bold uppercase border-2 border-black py-4 px-4 outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                                            />
                                        ) : (
                                            <div className="w-full max-w-md bg-gray-100 text-black font-bold text-sm uppercase border-2 border-black py-4 px-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{server.name}</div>
                                        )}
                                    </div>
                                    {isOwner ? (
                                        <button onClick={saveServerSettings} disabled={isSaving || !serverName.trim() || serverName === server.name}
                                            className="px-8 py-4 bg-black text-white font-black text-xs uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            {isSaving ? 'UPDATING...' : 'SAVE CHANGES'}
                                        </button>
                                    ) : (
                                        <div className="bg-gray-100 border-l-4 border-gray-400 p-4">
                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">ONLY SYSTEM_ADMIN CAN MODIFY PARAMETERS.</p>
                                        </div>
                                    )}
                                    {isOwner && (
                                        <div className="mt-12 pt-8 border-t-4 border-black relative">
                                            <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest">DANGER_ZONE</div>
                                            <div className="bg-red-50 border-4 border-red-600 p-6 shadow-[8px_8px_0px_0px_rgba(220,38,38,1)]">
                                                <div className="flex items-start gap-4">
                                                    <AlertTriangle size={32} strokeWidth={2} className="text-red-600 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <h4 className="text-red-700 font-black text-xl uppercase tracking-tight mb-2">TERMINATE SERVER</h4>
                                                        <p className="text-red-900 font-bold text-xs uppercase tracking-wider mb-6 leading-relaxed">DELETING THIS SERVER WILL PERMANENTLY REMOVE ALL CHANNELS, MESSAGES, AND MEMBERS. THIS ACTION CANNOT BE UNDONE.</p>
                                                        <button onClick={deleteServer} className="px-6 py-3 bg-red-600 text-white text-xs font-black uppercase tracking-widest border-2 border-red-700 hover:bg-red-700 transition-colors shadow-[4px_4px_0px_0px_rgba(153,27,27,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 flex items-center gap-3">
                                                            <Trash2 size={16} strokeWidth={3} /> INITIATE REMOVAL
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {settingsTab === 'invites' && (
                                <div className="space-y-6">
                                    <div className="border-4 border-black">
                                        <button onClick={() => setShowInviteOptions(!showInviteOptions)}
                                            className="w-full px-4 py-3 flex items-center justify-between text-black hover:bg-gray-100 transition-colors font-black text-xs uppercase tracking-widest"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Plus size={16} strokeWidth={3} className={`transform transition-transform ${showInviteOptions ? 'rotate-45' : ''}`} />
                                                CREATE INVITE LINK
                                            </span>
                                        </button>
                                        {showInviteOptions && (
                                            <div className="px-4 pb-4 pt-2 border-t-4 border-black space-y-4 bg-gray-50">
                                                <div>
                                                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2 border-l-4 border-black pl-2">EXPIRE AFTER</label>
                                                    <select value={inviteExpiration} onChange={(e) => setInviteExpiration(e.target.value)}
                                                        className="w-full bg-white text-black text-xs font-bold uppercase border-2 border-black p-2.5 outline-none"
                                                    >
                                                        <option value="1">1 HOUR</option>
                                                        <option value="6">6 HOURS</option>
                                                        <option value="12">12 HOURS</option>
                                                        <option value="24">1 DAY</option>
                                                        <option value="168">7 DAYS</option>
                                                        <option value="720">30 DAYS</option>
                                                        <option value="0">NEVER</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2 border-l-4 border-black pl-2">MAX USES</label>
                                                    <select value={inviteMaxUses} onChange={(e) => setInviteMaxUses(e.target.value)}
                                                        className="w-full bg-white text-black text-xs font-bold uppercase border-2 border-black p-2.5 outline-none"
                                                    >
                                                        <option value="0">NO LIMIT</option>
                                                        <option value="1">1 USE</option>
                                                        <option value="5">5 USES</option>
                                                        <option value="10">10 USES</option>
                                                        <option value="25">25 USES</option>
                                                        <option value="50">50 USES</option>
                                                        <option value="100">100 USES</option>
                                                    </select>
                                                </div>
                                                <button onClick={createInvite} disabled={isCreatingInvite}
                                                    className="w-full px-4 py-3 bg-black text-white font-black text-xs uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                                                >
                                                    {isCreatingInvite ? 'GENERATING...' : 'GENERATE INVITE LINK'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        {invites.length === 0 ? (
                                            <div className="text-center py-10 text-gray-500 font-bold text-xs uppercase tracking-widest border-4 border-dashed border-gray-300 bg-gray-50">
                                                NO INVITES GENERATED YET.
                                            </div>
                                        ) : (
                                            invites.map(invite => (
                                                <div key={invite.id} className={`border-4 p-4 flex items-center justify-between gap-4 ${invite.isValid ? 'border-black bg-white' : 'border-gray-300 bg-gray-50 opacity-60'}`}>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <code className="text-black font-black font-mono text-sm">{invite.code}</code>
                                                            {!invite.isValid && (
                                                                <span className="text-[10px] font-black uppercase tracking-widest bg-gray-200 text-gray-600 px-2 py-0.5 border-2 border-gray-400">
                                                                    {invite.isRevoked ? 'REVOKED' : 'EXPIRED'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                                            <span className="flex items-center gap-1"><Users size={12} strokeWidth={3} /> {invite.uses}{invite.maxUses ? `/${invite.maxUses}` : ''} USES</span>
                                                            {invite.expiresAt && (<span>EXP: {new Date(invite.expiresAt).toLocaleDateString()}</span>)}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {invite.isValid && (
                                                            <button onClick={() => copyInviteLink(invite)} className="p-2 border-2 border-transparent hover:border-black hover:bg-black hover:text-white text-black transition-all" title="Copy invite link">
                                                                {copiedInviteId === invite.id ? <Check size={16} strokeWidth={3} className="text-green-600" /> : <Copy size={16} strokeWidth={3} />}
                                                            </button>
                                                        )}
                                                        {isOwner && invite.isValid && (
                                                            <button onClick={() => revokeInvite(invite.id)} className="p-2 border-2 border-transparent hover:border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all" title="Revoke invite">
                                                                <Trash2 size={16} strokeWidth={3} />
                                                            </button>
                                                        )}
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
            )}
        </>
    );
}

