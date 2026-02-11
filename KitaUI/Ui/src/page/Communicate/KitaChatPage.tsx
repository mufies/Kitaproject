import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import ServerList from './ServerList';
import ServerSidebar from './ServerSidebar';
import ChatChannel from './ChatChannel';
import VoiceChannel from './VoiceChannel';
import MembersList from './MembersList';
import UserStatusPopover from './UserStatusPopover';
import type { ServerDto, ChannelDto, ServerMemberDto, UserStatus } from '../../types/api';
import { userStatusService } from '../../services/userStatusService';
import { serverService } from '../../services/serverService';
import Navigator from '../../components/navigator';

export default function KitaChatPage() {
    const [currentServer, setCurrentServer] = useState<ServerDto | null>(null);
    const [currentChannel, setCurrentChannel] = useState<ChannelDto | null>(null);

    // Global State for Popover
    const [selectedMember, setSelectedMember] = useState<ServerMemberDto | null>(null);
    const [popoverAnchor, setPopoverAnchor] = useState<DOMRect | null>(null);

    // Hoisted State
    const [members, setMembers] = useState<ServerMemberDto[]>([]);
    const [userStatuses, setUserStatuses] = useState<Map<string, UserStatus>>(new Map());

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
        const unsubscribe = userStatusService.onStatusChanged((status) => {
            setUserStatuses(prev => {
                const next = new Map(prev);
                next.set(status.userId, status);
                return next;
            });
        });
        return () => unsubscribe();
    }, []);

    // Initial Status Fetch for current members
    useEffect(() => {
        if (members.length > 0) {
            const userIds = members.map(m => m.userId);
            userStatusService.getUsersStatus(userIds).then(statuses => {
                const statusMap = new Map<string, UserStatus>();
                statuses.forEach(status => {
                    statusMap.set(status.userId, status);
                });
                setUserStatuses(prev => {
                    const next = new Map(prev);
                    statuses.forEach(s => next.set(s.userId, s));
                    return next;
                });
            });
        }
    }, [members]);

    const handleMemberClick = (
        target: EventTarget,
        memberInfo: { id?: string | null, userId?: string, username?: string, avatarUrl?: string }
    ) => {
        const rect = (target as HTMLElement).getBoundingClientRect();
        setPopoverAnchor(rect);

        // Try to find full member info from the loaded list
        const existingMember = members.find(m => m.userId === memberInfo.userId);

        if (existingMember) {
            setSelectedMember(existingMember);
        } else if (memberInfo.userId && memberInfo.username) {
            // Create temporary member object if not found in list (e.g. not loaded or unexpected)
            setSelectedMember({
                id: memberInfo.id || memberInfo.userId, // fallback
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

    return (
        <>
            <Navigator />
            <div className="flex h-screen pt-20 bg-[#0a0a0a] overflow-hidden">
                <ServerList
                    currentServerId={currentServer?.id || null}
                    onServerSelect={(server) => {
                        setCurrentServer(server);
                        setCurrentChannel(null);
                    }}
                />

                {currentServer && (
                    <ServerSidebar
                        server={currentServer}
                        currentChannelId={currentChannel?.id || null}
                        onChannelSelect={setCurrentChannel}
                        onServerUpdate={(updated) => setCurrentServer(updated)}
                    />
                )}

                <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a] relative rounded-l-[24px] overflow-hidden ml-1 border-l border-white/5 shadow-2xl">
                    {!currentServer ? (
                        <div className="flex items-center justify-center h-full flex-col gap-6 p-8 relative overflow-hidden">
                            {/* Ambient Background Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF8C00]/5 rounded-full blur-[100px] pointer-events-none" />

                            <div className="relative z-10">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF8C00]/20 to-[#FF4D00]/10 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(255,140,0,0.2)]">
                                    <MessageCircle size={40} className="text-[#FF8C00]" />
                                </div>
                            </div>
                            <div className="text-center z-10">
                                <h2 className="text-white text-3xl font-bold mb-2 font-['Lexend'] tracking-tight">Welcome to Kita Chat!</h2>
                                <p className="text-[#a0a0a0] text-sm max-w-md leading-relaxed">
                                    Connect with friends, share music, and discuss your favorite tracks.
                                    Select a server from the left or create a new one to get started.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 mt-4 z-10">
                                <Link
                                    to="/music"
                                    className="px-6 py-3 bg-[#1a1a1a]/80 backdrop-blur-md text-white/90 rounded-full text-sm font-medium hover:bg-[#FF8C00] hover:text-white transition-all border border-white/10 hover:border-[#FF8C00] shadow-lg hover:shadow-[0_0_15px_rgba(255,140,0,0.4)]"
                                >
                                    Go to Music
                                </Link>
                            </div>
                        </div>
                    ) : !currentChannel ? (
                        <div className="flex items-center justify-center h-full text-center flex-col gap-4 p-8 bg-[#0a0a0a]">
                            <div className="w-20 h-20 rounded-full bg-[#1a1a1a] border border-white/5 flex items-center justify-center shadow-inner">
                                <span className="text-4xl opacity-50 grayscale">💬</span>
                            </div>
                            <h3 className="text-white text-xl font-semibold font-['Lexend']">No channel selected</h3>
                            <p className="text-[#a0a0a0] text-sm">Pick a text or voice channel from the sidebar</p>
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

                {/* Members List - Right sidebar */}
                {currentServer && currentChannel && (
                    <MembersList
                        members={members}
                        userStatuses={userStatuses}
                        onMemberClick={(e, member) => handleMemberClick(e.target, member)}
                    />
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
