import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ChevronLeft, ChevronRight, Users, Server } from 'lucide-react';
import ServerList from './ServerList';
import ServerSidebar from './ServerSidebar';
import ChatChannel from './ChatChannel';
import VoiceChannel from './VoiceChannel';
import MembersList from './MembersList';
import UserStatusPopover from './UserStatusPopover';
import type { ServerDto, ChannelDto, ServerMemberDto, UserStatus } from '../../types/api';
import { userStatusService } from '../../services/userStatusService';
import { serverService } from '../../services/serverService';
import { chatService } from '../../services/chatService';
import Navigator from '../../components/navigator';
import { useVoice } from '../../contexts/VoiceContext';

export default function KitaChatPage() {
    const [currentServer, setCurrentServer] = useState<ServerDto | null>(null);
    const [currentChannel, setCurrentChannel] = useState<ChannelDto | null>(null);
    const connectAttemptedRef = useRef(false);
    const { voiceParticipantsByChannel } = useVoice();

    // Mobile sidebar visibility state
    const [showServerPanel, setShowServerPanel] = useState(false);
    const [showMembersPanel, setShowMembersPanel] = useState(false);

    // Global State for Popover
    const [selectedMember, setSelectedMember] = useState<ServerMemberDto | null>(null);
    const [popoverAnchor, setPopoverAnchor] = useState<DOMRect | null>(null);

    // Hoisted State
    const [members, setMembers] = useState<ServerMemberDto[]>([]);
    const [userStatuses, setUserStatuses] = useState<Map<string, UserStatus>>(new Map());

    // Current user id (from JWT)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Connect to ChatHub on mount to receive server-level events
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token && !connectAttemptedRef.current) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(window.atob(base64));
                const nameIdentifierClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
                setCurrentUserId(payload[nameIdentifierClaim] || payload.sub || payload.nameid);

                if (!chatService.isConnected()) {
                    connectAttemptedRef.current = true;
                    chatService.connect(token).then(() => {
                        console.log('🟢 ChatHub connected in KitaChatPage');
                    }).catch(err => {
                        console.error('🔴 Failed to connect to ChatHub:', err);
                        connectAttemptedRef.current = false;
                    });
                }
            } catch (e) {
                console.error('🔴 Failed to parse token:', e);
            }
        }

        return () => {
        };
    }, []);

    // Load members when server changes
    useEffect(() => {
        if (currentServer?.id) {
            serverService.getServerMembers(currentServer.id)
                .then(data => setMembers(data))
                .catch(err => console.error("Failed to load members", err));
        } else {
            setMembers([]);
        }
    }, [currentServer?.id]);

    // Setup User Status Listener
    useEffect(() => {
        console.log('🟡 Setting up UserStatus listener in KitaChatPage');
        const unsubscribe = userStatusService.onStatusChanged((status) => {
            console.log('🟡 UserStatus changed:', status.userId, 'online:', status.isOnline);
            setUserStatuses(prev => {
                const next = new Map(prev);
                next.set(status.userId, status);
                return next;
            });
        });

        return () => {
            console.log('🟡 Cleaning up UserStatus listener in KitaChatPage');
            unsubscribe();
        };
    }, []);

    // Setup Server Left Listener with proper dependencies
    useEffect(() => {
        const handleServerLeft = (serverId: string, userId: string) => {
            console.log('🔴 ServerLeft event:', { serverId, userId, currentUserId, currentServerId: currentServer?.id });

            // Normalize IDs for comparison
            const normalizedUserId = userId.toLowerCase();
            const normalizedCurrentUserId = currentUserId?.toLowerCase();

            // If I was kicked/left
            if (normalizedCurrentUserId && normalizedUserId === normalizedCurrentUserId) {
                if (currentServer?.id === serverId) {
                    console.log('🔴 I was kicked/left from current server');
                    setCurrentServer(null);
                    setCurrentChannel(null);
                    setMembers([]);
                }
            }
            // If someone else left/was kicked from my current server
            else if (currentServer?.id === serverId) {
                console.log('🔴 Removing member from list:', userId);
                setMembers(prev => {
                    const filtered = prev.filter(m => m.userId.toLowerCase() !== normalizedUserId);
                    console.log('🔴 Members after removal:', filtered.length);
                    return filtered;
                });
                // Also remove their status
                setUserStatuses(prev => {
                    const next = new Map(prev);
                    next.delete(userId);
                    return next;
                });
            }
        };

        chatService.onServerLeft(handleServerLeft);

        return () => {
            chatService.offServerLeft(handleServerLeft);
        };
    }, [currentServer?.id, currentUserId]);

    // Setup Member Joined Listener
    useEffect(() => {
        const handleMemberJoined = (serverId: string, userId: string) => {
            console.log('🟢 MemberJoined event:', { serverId, userId, currentServerId: currentServer?.id });

            // If someone joined my current server, reload members
            if (currentServer?.id === serverId) {
                console.log('🟢 Reloading members after new member joined');
                serverService.getServerMembers(serverId)
                    .then(data => {
                        setMembers(data);
                        console.log('🟢 Members updated:', data.length);
                    })
                    .catch(err => console.error('Failed to reload members', err));
            }
        };

        chatService.onMemberJoined(handleMemberJoined);

        return () => {
            chatService.offMemberJoined(handleMemberJoined);
        };
    }, [currentServer?.id]);

    // Initial Status Fetch for current members
    useEffect(() => {
        if (members.length > 0) {
            console.log('🟢 Fetching statuses for', members.length, 'members');
            const userIds = members.map(m => m.userId);

            // Retry logic to ensure UserStatusHub is connected
            const fetchStatuses = async () => {
                let attempts = 0;
                const maxAttempts = 3;

                while (attempts < maxAttempts) {
                    try {
                        const statuses = await userStatusService.getUsersStatus(userIds);
                        if (statuses.length > 0) {
                            console.log('🟢 Received', statuses.length, 'statuses');
                            setUserStatuses(prev => {
                                const next = new Map(prev);
                                statuses.forEach(s => {
                                    console.log(`🟢 Status for ${s.userId}: online=${s.isOnline}`);
                                    next.set(s.userId, s);
                                });
                                return next;
                            });
                            break;
                        } else {
                            console.log('🟡 No statuses received, retrying...', attempts + 1);
                            attempts++;
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    } catch (err) {
                        console.error('🔴 Failed to fetch user statuses, attempt', attempts + 1, err);
                        attempts++;
                        if (attempts < maxAttempts) {
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    }
                }
            };

            fetchStatuses();
        } else {
            // Clear statuses when no members
            setUserStatuses(new Map());
        }
    }, [members]); // Re-fetch when members array changes

    // Derive current user's role in this server
    const currentUserRole = members.find(m => m.userId === currentUserId)?.role;

    const handleMemberClick = (
        target: EventTarget,
        memberInfo: { id?: string | null, userId?: string, username?: string, avatarUrl?: string }
    ) => {
        const rect = (target as HTMLElement).getBoundingClientRect();
        setPopoverAnchor(rect);

        const existingMember = members.find(m => m.userId === memberInfo.userId);
        if (existingMember) {
            setSelectedMember(existingMember);
        } else if (memberInfo.userId && memberInfo.username) {
            setSelectedMember({
                id: memberInfo.id || memberInfo.userId,
                userId: memberInfo.userId,
                username: memberInfo.username,
                avatarUrl: memberInfo.avatarUrl,
                role: 'Member',
                joinedAt: new Date().toISOString()
            });
        }
    };

    const closePopover = () => {
        setSelectedMember(null);
        setPopoverAnchor(null);
    };

    const handleKickMember = async (member: ServerMemberDto) => {
        if (!currentServer) return;
        try {
            console.log('🟡 Kicking member:', member.userId, member.username);
            await serverService.kickMember(currentServer.id, member.userId);
            // Remove from local state immediately (will also be removed by ServerLeft event)
            setMembers(prev => {
                const filtered = prev.filter(m => m.userId !== member.userId);
                console.log('🟡 Members after kick:', filtered.length);
                return filtered;
            });
            // Remove their status
            setUserStatuses(prev => {
                const next = new Map(prev);
                next.delete(member.userId);
                return next;
            });
        } catch (err) {
            console.error("🔴 Failed to kick member", err);
            alert('Failed to kick member: ' + (err as Error).message);
        }
    };

    return (
        <>
            <Navigator />
            <div className="flex h-screen pt-20 bg-white overflow-hidden font-sans selection:bg-black selection:text-white relative">
                <div className="fixed inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
                </div>

                {/* === DESKTOP: Always-visible left sidebars === */}
                <div className="hidden md:flex flex-shrink-0">
                    <ServerList
                        currentServerId={currentServer?.id || null}
                        onServerSelect={(server) => {
                            setCurrentServer(server);
                            setCurrentChannel(null);
                        }}
                    />
                </div>

                {currentServer && (
                    <div className="hidden md:flex flex-shrink-0">
                        <ServerSidebar
                            server={currentServer}
                            currentChannelId={currentChannel?.id || null}
                            onChannelSelect={setCurrentChannel}
                            onServerUpdate={(updated) => setCurrentServer(updated)}
                            voiceParticipantsByChannel={voiceParticipantsByChannel}
                        />
                    </div>
                )}

                {/* === MOBILE: Left overlay (server list + sidebar) === */}
                {showServerPanel && (
                    <div className="md:hidden fixed inset-0 z-40 flex">
                        <div className="flex flex-row h-full shadow-2xl overflow-y-auto">
                            <ServerList
                                currentServerId={currentServer?.id || null}
                                onServerSelect={(server) => {
                                    setCurrentServer(server);
                                    setCurrentChannel(null);
                                    setShowServerPanel(false);
                                }}
                            />
                            {currentServer && (
                                <ServerSidebar
                                    server={currentServer}
                                    currentChannelId={currentChannel?.id || null}
                                    onChannelSelect={(ch) => {
                                        setCurrentChannel(ch);
                                        setShowServerPanel(false);
                                    }}
                                    onServerUpdate={(updated) => setCurrentServer(updated)}
                                    voiceParticipantsByChannel={voiceParticipantsByChannel}
                                />
                            )}
                        </div>
                        {/* Tap-outside to close */}
                        <div className="flex-1 bg-black/50" onClick={() => setShowServerPanel(false)} />
                    </div>
                )}

                {/* === MOBILE: Right overlay (members list) === */}
                {showMembersPanel && currentServer && currentChannel && (
                    <div className="md:hidden fixed inset-0 z-40 flex justify-end">
                        {/* Tap-outside to close */}
                        <div className="flex-1 bg-black/50" onClick={() => setShowMembersPanel(false)} />
                        <div className="h-full shadow-2xl overflow-y-auto">
                            <MembersList
                                members={members}
                                userStatuses={userStatuses}
                                onMemberClick={(e, member) => {
                                    handleMemberClick(e.target, member);
                                    setShowMembersPanel(false);
                                }}
                                currentUserRole={currentUserRole}
                                serverId={currentServer.id}
                                onKickMember={handleKickMember}
                            />
                        </div>
                    </div>
                )}

                {/* === Main content area === */}
                <div className="flex-1 flex flex-col min-w-0 bg-white relative rounded-none overflow-hidden border-x-4 border-black shadow-[16px_0_0_0_rgba(0,0,0,1)] z-10 m-2 md:m-4 mb-4 md:mb-8">

                    {/* Mobile toolbar: toggle sidebars */}
                    <div className="md:hidden flex items-center justify-between px-3 py-2 border-b-2 border-black bg-white flex-shrink-0">
                        <button
                            onClick={() => { setShowServerPanel(v => !v); setShowMembersPanel(false); }}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-black uppercase tracking-widest border-2 border-black bg-white hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
                        >
                            <Server size={14} strokeWidth={3} />
                            <span className="max-w-[120px] truncate">{currentServer ? currentServer.name : 'Servers'}</span>
                            <ChevronRight size={14} strokeWidth={3} />
                        </button>

                        {currentServer && currentChannel && (
                            <button
                                onClick={() => { setShowMembersPanel(v => !v); setShowServerPanel(false); }}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-black uppercase tracking-widest border-2 border-black bg-white hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
                            >
                                <ChevronLeft size={14} strokeWidth={3} />
                                <Users size={14} strokeWidth={3} />
                                <span>{members.length}</span>
                            </button>
                        )}
                    </div>

                    {!currentServer ? (
                        <div className="flex items-center justify-center h-full flex-col gap-6 p-8 relative overflow-hidden bg-white">
                            <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-20">NO_CONNECTION</div>
                            <div className="absolute -left-20 -top-20 w-64 h-64 bg-gray-200 rotate-45 pointer-events-none opacity-50"></div>

                            <div className="relative z-10">
                                <div className="w-24 h-24 rounded-none bg-white border-4 border-black flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                    <MessageCircle size={40} className="text-black" strokeWidth={2} />
                                </div>
                            </div>
                            <div className="text-center z-10 mt-4 border-l-4 border-black pl-4">
                                <h2 className="text-black text-3xl sm:text-5xl font-black mb-2 uppercase tracking-tighter leading-none">AWAITING CONNECTION</h2>
                                <p className="text-gray-600 font-bold uppercase tracking-wider text-xs max-w-md leading-relaxed">
                                    ESTABLISH LINK WITH A SERVER FROM THE LEFT PANEL OR INITIALIZE A NEW CREATION TO BEGIN COMMUNICATION.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 z-10">
                                <button
                                    onClick={() => setShowServerPanel(true)}
                                    className="md:hidden px-8 py-3 bg-black text-white font-black text-xs uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                                >
                                    OPEN SERVERS
                                </button>
                                <Link
                                    to="/music"
                                    className="px-8 py-3 bg-black text-white font-black text-xs uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                                >
                                    ACCESS DATABASE
                                </Link>
                            </div>
                        </div>
                    ) : !currentChannel ? (
                        <div className="flex items-center justify-center h-full text-center flex-col gap-4 p-8 bg-gray-50 relative">
                            <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-20">IDLE_STATE</div>
                            <div className="w-20 h-20 rounded-none bg-white border-4 border-black flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                <span className="text-4xl grayscale">💬</span>
                            </div>
                            <h3 className="text-black text-2xl font-black uppercase tracking-tight mt-4">NO FREQUENCY SELECTED</h3>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] border-b-2 border-black pb-1">TUNE INTO A CHANNEL TO PROCEED</p>
                        </div>
                    ) : (
                        currentChannel.type === 'text' ? (
                            <ChatChannel
                                channel={currentChannel}
                                onMemberClick={(e, senderId, senderName, senderAvatar) => {
                                    handleMemberClick(e.target, { userId: senderId, username: senderName, avatarUrl: senderAvatar });
                                }}
                            />
                        ) : (
                            <VoiceChannel channel={currentChannel} />
                        )
                    )}
                </div>

                {/* Members List - Desktop right sidebar */}
                {currentServer && currentChannel && (
                    <div className="hidden md:block flex-shrink-0">
                        <MembersList
                            members={members}
                            userStatuses={userStatuses}
                            onMemberClick={(e, member) => handleMemberClick(e.target, member)}
                            currentUserRole={currentUserRole}
                            serverId={currentServer.id}
                            onKickMember={handleKickMember}
                        />
                    </div>
                )}
            </div>

            {/* Global User Status Popover */}
            {selectedMember && popoverAnchor && (
                <UserStatusPopover
                    member={selectedMember}
                    status={userStatuses.get(selectedMember.userId)}
                    anchorRect={popoverAnchor}
                    onClose={closePopover}
                />
            )}
        </>
    );
}
