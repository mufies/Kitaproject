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
                return <Crown size={12} className="text-black" />;
            case 'Admin':
                return <Shield size={12} className="text-black" />;
            default:
                return null;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'Owner': return 'text-black font-black';
            case 'Admin': return 'text-gray-800 font-bold';
            default: return 'text-gray-600 font-bold';
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
            <div className="mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-2 mb-2 border-b-2 border-gray-200 pb-1 mx-2">
                    {title} — {groupMembers.length}
                </h3>
                <div className="space-y-1 px-2">
                    {groupMembers.map(member => {
                        const status = userStatuses.get(member.userId);
                        const isOnline = status?.isOnline || false;
                        const hasCurrentSong = !!status?.currentlyPlayingSong;

                        return (
                            <div key={member.id} className="group relative">
                                <button
                                    onClick={(e) => onMemberClick?.(e, member)}
                                    className="w-full flex items-center gap-3 p-2 border-2 border-transparent transition-all duration-200 hover:border-black hover:bg-white hover:translate-x-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    <div className="relative w-10 h-10 flex-shrink-0">
                                        <div className="w-full h-full rounded-none overflow-hidden border-2 border-black bg-gray-100 transition-colors">
                                            {member.avatarUrl ? (
                                                <img src={member.avatarUrl} alt="" className="w-full h-full object-cover transition-all" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-black font-black uppercase text-xs">
                                                    {member.nickname?.substring(0, 2) || member.username?.substring(0, 2)}
                                                </div>
                                            )}
                                        </div>
                                        {/* ONLINE INDICATOR - KEEP GREEN AS REQUESTED */}
                                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white rounded-none ${isOnline
                                            ? 'bg-green-500'
                                            : 'bg-gray-400'
                                            }`} />
                                    </div>

                                    <div className="flex-1 min-w-0 text-left">
                                        <div className={`text-sm truncate flex items-center gap-1.5 transition-colors uppercase tracking-tight ${getRoleColor(member.role)}`}>
                                            {member.nickname || member.username}
                                            {getRoleIcon(member.role)}
                                        </div>
                                        {hasCurrentSong && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-widest animate-pulse">
                                                <Music size={10} className="text-black" />
                                                <span className="truncate">LOGGED PLAYBACK</span>
                                            </div>
                                        )}
                                    </div>
                                </button>

                                {/* Kick button */}
                                {isOwner && canKick && (
                                    <button
                                        onClick={(e) => handleKick(e, member)}
                                        disabled={kickingId === member.userId}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 border-2 border-transparent hover:border-black hover:bg-white text-black transition-all disabled:opacity-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                        title={`Kick ${member.nickname || member.username}`}
                                    >
                                        {kickingId === member.userId ? (
                                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <UserX size={14} strokeWidth={3} />
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
        <div className="w-64 bg-gray-50 border-l-4 border-black flex flex-col h-full flex-shrink-0 hidden lg:block overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-black text-white px-2 py-0.5 font-black uppercase tracking-[0.2em] text-[10px] z-20">ROSTER</div>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            <div className="flex-1 overflow-y-auto pt-8 pb-4 custom-scrollbar relative z-10">
                {renderMemberGroup('SYS_ADMIN', owners, false)}
                {renderMemberGroup('MODERATORS', admins, true)}
                {renderMemberGroup('STANDARD_UNITS', regularMembers, true)}

                {members.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-center">
                        <User size={32} className="mb-2 opacity-50 text-black" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">NO UNITS DETECTED</p>
                    </div>
                )}
            </div>
        </div>
    );
}
