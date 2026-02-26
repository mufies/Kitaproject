import { useState } from 'react';
import { Crown, Shield, User, Music, UserX } from 'lucide-react';
import type { ServerMemberDto, UserStatus } from '../../types/api';

interface MembersListProps {
    members: ServerMemberDto[];
    userStatuses: Map<string, UserStatus>;
    onMemberClick?: (event: React.MouseEvent, member: ServerMemberDto) => void;
    currentUserRole?: string;
    serverId?: string;
    onKickMember?: (member: ServerMemberDto) => void;
}

export default function MembersList({ members, userStatuses, onMemberClick, currentUserRole, onKickMember }: MembersListProps) {
    const [kickingId, setKickingId] = useState<string | null>(null);
    const isOwner = currentUserRole === 'Owner';

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
            case 'Owner': return 'text-[#FFD700]';
            case 'Admin': return 'text-[#FF8C00]';
            default: return 'text-white/80';
        }
    };

    const handleKick = async (e: React.MouseEvent, member: ServerMemberDto) => {
        e.stopPropagation();
        if (!confirm(`Kick ${member.nickname || member.username} khỏi server?`)) return;
        setKickingId(member.userId);
        try {
            await onKickMember?.(member);
        } finally {
            setKickingId(null);
        }
    };

    const renderMemberGroup = (title: string, groupMembers: ServerMemberDto[], canKick: boolean) => {
        if (groupMembers.length === 0) return null;
        return (
            <div className="mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#a0a0a0] px-3 mb-1.5 font-['Lexend']">
                    {title} — {groupMembers.length}
                </h3>
                <div className="space-y-0.5">
                    {groupMembers.map(member => {
                        const status = userStatuses.get(member.userId);
                        const isOnline = status?.isOnline || false;
                        const hasCurrentSong = !!status?.currentlyPlayingSong;

                        return (
                            <div key={member.id} className="group relative">
                                <button
                                    onClick={(e) => onMemberClick?.(e, member)}
                                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-[#ffffff05]"
                                >
                                    <div className="relative w-8 h-8 flex-shrink-0">
                                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-transparent transition-colors">
                                            {member.avatarUrl ? (
                                                <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                                                    <User size={14} className="text-white/40" />
                                                </div>
                                            )}
                                        </div>
                                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] ${isOnline
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

                                {/* Kick button - only for owner, only on non-owner members */}
                                {isOwner && canKick && (
                                    <button
                                        onClick={(e) => handleKick(e, member)}
                                        disabled={kickingId === member.userId}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all disabled:opacity-50"
                                        title={`Kick ${member.nickname || member.username}`}
                                    >
                                        {kickingId === member.userId ? (
                                            <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <UserX size={14} />
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="w-60 bg-[#0a0a0a] border-l border-white/5 flex flex-col h-full flex-shrink-0 hidden lg:block overflow-hidden relative">
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 w-full h-40 bg-gradient-to-b from-[#FF8C00]/5 to-transparent pointer-events-none" />

            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar relative z-10">
                {renderMemberGroup('Owner', owners, false)}
                {renderMemberGroup('Admins', admins, true)}
                {renderMemberGroup('Members', regularMembers, true)}

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
