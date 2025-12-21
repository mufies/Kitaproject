import { X, User, Calendar } from 'lucide-react';
import type { ServerMemberDto } from '../../types/api';

interface UserProfileModalProps {
    member: ServerMemberDto;
    onClose: () => void;
}

export default function UserProfileModal({ member, onClose }: UserProfileModalProps) {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-[#1a141a] rounded-2xl w-full max-w-sm overflow-hidden border border-white/10 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Banner */}
                <div className="h-24 bg-gradient-to-br from-[#ff7a3c] to-[#ff4d4d] relative">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 bg-black/30 rounded-full text-white/70 hover:text-white hover:bg-black/50 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Avatar */}
                <div className="relative px-4">
                    <div className="absolute -top-12 w-24 h-24 rounded-full bg-[#1a141a] p-1">
                        <div className="w-full h-full rounded-full bg-[#0d080f] flex items-center justify-center overflow-hidden border-4 border-[#1a141a]">
                            {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User size={32} className="text-white/50" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="pt-14 pb-6 px-4">
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-white">
                            {member.nickname || member.username}
                        </h2>
                    </div>

                    {member.nickname && (
                        <p className="text-white/50 text-sm mb-4">@{member.username}</p>
                    )}

                    <div className="bg-[#0d080f] rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar size={14} className="text-white/40" />
                            <span className="text-white/40">Joined</span>
                            <span className="text-white/70">
                                {new Date(member.joinedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
