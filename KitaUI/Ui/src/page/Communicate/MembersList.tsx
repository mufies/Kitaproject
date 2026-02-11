import { Crown, Shield, User, Music } from 'lucide-react';
import type { ServerMemberDto, UserStatus } from '../../types/api';

interface MembersListProps {
    members: ServerMemberDto[];
    userStatuses: Map<string, UserStatus>;
    onMemberClick?: (event: React.MouseEvent, member: ServerMemberDto) => void;
}

export default function MembersList({ members, userStatuses, onMemberClick }: MembersListProps) {
    // Group members by role
    const owners = members.filter(m => m.role === 'Owner');
    const admins = members.filter(m => m.role === 'Admin');
    const regularMembers = members.filter(m => m.role === 'Member');

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'Owner':
                return <Crown size={12} className="text-[#FFD700] drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" />;
            case 'Admin':
                return <Shield size={12} className="text-[#FF8C00] drop-shadow-[0_0_5px_rgba(255,140,0,0.5)]" />;
            default:
                return null;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'Owner':
                return 'text-[#FFD700]';
            case 'Admin':
                return 'text-[#FF8C00]';
            default:
                return 'text-white/80';
        }
    };

    const renderMemberGroup = (title: string, groupMembers: ServerMemberDto[]) => {
        if (groupMembers.length === 0) return null;
        return (
            <div className="mb-6">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#a0a0a0] px-3 mb-2 font-['Lexend']">
                    {title} — {groupMembers.length}
                </h3>
                <div className="space-y-1">
                    {groupMembers.map(member => {
                        const status = userStatuses.get(member.userId);
                        const isOnline = status?.isOnline || false;
                        const hasCurrentSong = !!status?.currentlyPlayingSong;

                        return (
                            <button
                                key={member.id}
                                onClick={(e) => onMemberClick?.(e, member)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative hover:bg-[#ffffff05]"
                            >
                                <div className="relative w-9 h-9 flex-shrink-0">
                                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-transparent transition-colors">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                                                <User size={16} className="text-white/40" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Online indicator */}
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a0a0a] ${isOnline
                                        ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]'
                                        : 'bg-gray-500'
                                        }`} />
                                </div>

                                <div className="flex-1 min-w-0 text-left">
                                    <div className={`text-sm font-medium truncate flex items-center gap-1.5 transition-colors ${getRoleColor(member.role)}`}>
                                        {member.nickname || member.username}
                                        {getRoleIcon(member.role)}
                                    </div>
                                    {hasCurrentSong && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-[#FF8C00]/80 mt-0.5 animate-pulse">
                                            <Music size={10} />
                                            <span className="truncate font-medium">Listening to music</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="w-64 bg-[#0a0a0a] border-l border-white/5 flex flex-col h-full flex-shrink-0 hidden lg:block overflow-hidden relative">
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 w-full h-40 bg-gradient-to-b from-[#FF8C00]/5 to-transparent pointer-events-none" />

            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar relative z-10">
                {renderMemberGroup('Owner', owners)}
                {renderMemberGroup('Admins', admins)}
                {renderMemberGroup('Members', regularMembers)}

                {members.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-white/30 text-center">
                        <User size={32} className="mb-2 opacity-50" />
                        <p className="text-sm">No members yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}

