import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import ServerList from './ServerList';
import ServerSidebar from './ServerSidebar';
import ChatChannel from './ChatChannel';
import VoiceChannel from './VoiceChannel';
import MembersList from './MembersList';
import UserProfileModal from './UserProfileModal';
import type { ServerDto, ChannelDto, ServerMemberDto } from '../../types/api';
import Navigator from '../../components/navigator';

export default function KitaChatPage() {
    const [currentServer, setCurrentServer] = useState<ServerDto | null>(null);
    const [currentChannel, setCurrentChannel] = useState<ChannelDto | null>(null);
    const [selectedMember, setSelectedMember] = useState<ServerMemberDto | null>(null);

    return (
        <>
            <Navigator />
            <div className="flex h-screen pt-20 bg-[#120c12]">
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

                <div className="flex-1 flex flex-col min-w-0 bg-[#0d080f] relative">
                    {!currentServer ? (
                        <div className="flex items-center justify-center h-full flex-col gap-6 p-8">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff7a3c]/20 to-[#ff4d4d]/10 flex items-center justify-center animate-pulse">
                                    <MessageCircle size={40} className="text-[#ff7a3c]" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h2 className="text-white text-xl font-bold mb-2">Welcome to Kita Chat!</h2>
                                <p className="text-white/50 text-sm max-w-md">
                                    Connect with friends, share music, and discuss your favorite tracks.
                                    Select a server from the left or create a new one to get started.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 mt-4">
                                <Link
                                    to="/music"
                                    className="px-5 py-2.5 bg-[#1a141a] text-white/70 rounded-xl text-sm font-medium hover:bg-[#251d25] hover:text-white transition-all border border-[#ffffff0d]"
                                >
                                    Go to Music
                                </Link>
                            </div>
                        </div>
                    ) : !currentChannel ? (
                        <div className="flex items-center justify-center h-full text-center flex-col gap-4 p-8">
                            <div className="w-16 h-16 rounded-full bg-[#ffffff05] flex items-center justify-center">
                                <span className="text-3xl">💬</span>
                            </div>
                            <h3 className="text-white text-lg font-semibold">No channel selected</h3>
                            <p className="text-white/40 text-sm">Pick a text or voice channel from the sidebar</p>
                        </div>
                    ) : (
                        currentChannel.type === 'text' ? (
                            <ChatChannel channel={currentChannel} onMemberClick={(senderId, senderName, senderAvatar) => {
                                // Create a minimal ServerMemberDto for profile modal
                                setSelectedMember({
                                    id: senderId,
                                    userId: senderId,
                                    username: senderName,
                                    avatarUrl: senderAvatar,
                                    role: 'Member',
                                    joinedAt: new Date().toISOString()
                                });
                            }} />
                        ) : (
                            <VoiceChannel channel={currentChannel} />
                        )
                    )}
                </div>

                {/* Members List - Right sidebar */}
                {currentServer && currentChannel && (
                    <MembersList
                        serverId={currentServer.id}
                        onMemberClick={setSelectedMember}
                    />
                )}
            </div>

            {/* User Profile Modal */}
            {selectedMember && (
                <UserProfileModal
                    member={selectedMember}
                    onClose={() => setSelectedMember(null)}
                />
            )}
        </>
    );
}
