import { useEffect, useState, useRef } from 'react';
import { User, Music, X, Crown, Shield } from 'lucide-react';
import type { ServerMemberDto, UserStatus } from '../../types/api';

interface UserStatusPopoverProps {
    member: ServerMemberDto;
    status?: UserStatus;
    anchorRect: DOMRect | null;
    onClose: () => void;
}

export default function UserStatusPopover({ member, status, anchorRect, onClose }: UserStatusPopoverProps) {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        if (anchorRect) {
            const width = 320; // w-80
            const height = 400; // approx max height
            const padding = 16;

            let top = anchorRect.top;
            let left = anchorRect.right + padding; // Default: to the right

            // If anchor is on the right half of screen, show on left
            if (anchorRect.left > window.innerWidth / 2) {
                left = anchorRect.left - width - padding;
            }

            // Adjust vertical position to not go off-screen
            if (top + height > window.innerHeight) {
                top = window.innerHeight - height - padding;
                if (top < padding) top = padding;
            }

            setStyle({
                top: `${top}px`,
                left: `${left}px`,
                maxHeight: `calc(100vh - 32px)`,
            });
        }
    }, [anchorRect]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleScroll = () => {
            onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('scroll', handleScroll, true); // true = capture phase

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [onClose]);


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

    const isOnline = status?.isOnline || false;
    const currentSong = status?.currentlyPlayingSong;

    return (
        <div
            ref={popoverRef}
            className="fixed z-50 w-80 bg-[#0a0a0a]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200"
            style={style}
        >
            {/* Header with member info */}
            <div className="relative p-5 border-b border-white/5 overflow-hidden">
                {/* Header bg gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF8C00]/10 to-transparent pointer-events-none" />

                <div className="relative z-10 flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-[#FF8C00] to-purple-600 flex-shrink-0 shadow-lg">
                            <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                                {member.avatarUrl ? (
                                    <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={28} className="text-white/50" />
                                )}
                            </div>
                            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#0a0a0a] ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-gray-500'
                                }`} />
                        </div>
                        <div>
                            <div className={`text-lg font-bold flex items-center gap-2 ${getRoleColor(member.role)}`}>
                                {member.nickname || member.username}
                                {getRoleIcon(member.role)}
                            </div>
                            <p className="text-[#a0a0a0] text-sm">{member.role}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                                <p className="text-white/40 text-xs font-medium uppercase tracking-wide">
                                    {isOnline ? 'Online' : 'Offline'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/30 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#FF8C00] mb-3 font-['Lexend']">
                    Activity
                </h4>
                {currentSong ? (
                    <div className="bg-[#1a1a1a]/80 backdrop-blur-md rounded-xl p-4 flex items-center gap-4 border border-white/5 shadow-inner group hover:shadow-[0_0_20px_rgba(255,140,0,0.1)] transition-all">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#FF8C00] to-[#FF4D00] rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
                            {currentSong.coverUrl ? (
                                <img src={currentSong.coverUrl} alt={currentSong.songTitle} className="w-full h-full object-cover" />
                            ) : (
                                <Music size={20} className="text-white" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-bold truncate">
                                {currentSong.songTitle}
                            </p>
                            <p className="text-[#a0a0a0] text-sm truncate">
                                by {currentSong.artistName}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-white/20 bg-[#ffffff03] rounded-xl border border-white/5 dashed">
                        <Music size={24} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Not listening to anything</p>
                    </div>
                )}
            </div>
        </div>
    );
}
