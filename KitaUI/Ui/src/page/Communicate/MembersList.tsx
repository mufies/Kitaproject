import { useState, useEffect } from 'react';
import { Crown, Shield, User } from 'lucide-react';
import { serverService } from '../../services/serverService';
import type { ServerMemberDto } from '../../types/api';

interface MembersListProps {
    serverId: string;
    onMemberClick?: (member: ServerMemberDto) => void;
}

export default function MembersList({ serverId, onMemberClick }: MembersListProps) {
    const [members, setMembers] = useState<ServerMemberDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (serverId) {
            loadMembers();
        }
    }, [serverId]);

    const loadMembers = async () => {
        setIsLoading(true);
        try {
            const data = await serverService.getServerMembers(serverId);
            setMembers(data);
        } catch (error) {
            console.error("Failed to load members", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'Owner':
                return <Crown size={12} className="text-yellow-500" />;
            case 'Admin':
                return <Shield size={12} className="text-blue-400" />;
            default:
                return null;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'Owner':
                return 'text-yellow-500';
            case 'Admin':
                return 'text-blue-400';
            default:
                return 'text-white/70';
        }
    };

    // Group members by role
    const owners = members.filter(m => m.role === 'Owner');
    const admins = members.filter(m => m.role === 'Admin');
    const regularMembers = members.filter(m => m.role === 'Member');

    const renderMemberGroup = (title: string, groupMembers: ServerMemberDto[]) => {
        if (groupMembers.length === 0) return null;
        return (
            <div className="mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/50 px-2 mb-2">
                    {title} — {groupMembers.length}
                </h3>
                <div className="space-y-0.5">
                    {groupMembers.map(member => (
                        <button
                            key={member.id}
                            onClick={() => onMemberClick?.(member)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#ffffff08] transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-full bg-[#1a141a] flex items-center justify-center overflow-hidden flex-shrink-0">
                                {member.avatarUrl ? (
                                    <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={14} className="text-white/50" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <div className={`text-sm font-medium truncate flex items-center gap-1 ${getRoleColor(member.role)}`}>
                                    {/* {getRoleIcon(member.role)} */}
                                    {member.nickname || member.username}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="w-60 bg-[#120c12] border-l border-[#ffffff0d] p-4">
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/10" />
                            <div className="h-4 bg-white/10 rounded flex-1" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-60 bg-[#120c12] border-l border-[#ffffff0d] flex flex-col h-full flex-shrink-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3">
                {renderMemberGroup('Owner', owners)}
                {renderMemberGroup('Admins', admins)}
                {renderMemberGroup('Members', regularMembers)}

                {members.length === 0 && (
                    <p className="text-white/40 text-sm text-center py-4">No members</p>
                )}
            </div>
        </div>
    );
}
