import { useEffect, useState, useRef } from 'react';
import { User, Music, X, Crown, Shield, ExternalLink } from 'lucide-react';
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
            const width = 288;
            const height = 360;
            const padding = 16;

            let top = anchorRect.top;
            let left = anchorRect.right + padding;

            if (anchorRect.left > window.innerWidth / 2) {
                left = anchorRect.left - width - padding;
            }

            if (top + height > window.innerHeight) {
                top = window.innerHeight - height - padding;
                if (top < padding) top = padding;
            }

            setStyle({ top: `${top}px`, left: `${left}px`, maxHeight: `calc(100vh - 32px)` });
        }
    }, [anchorRect]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        const handleScroll = () => onClose();

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [onClose]);

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'Owner': return <Crown size={12} className="text-black" />;
            case 'Admin': return <Shield size={12} className="text-black" />;
            default: return null;
        }
    };

    const isOnline = status?.isOnline || false;
    const currentSong = status?.currentlyPlayingSong;

    return (
        <div
            ref={popoverRef}
            className="fixed z-[10000] w-72 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] animate-fadeIn"
            style={style}
        >
            {/* Badge */}
            <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 tracking-widest z-10">USER_DATA</div>

            {/* Header */}
            <div className="p-4 border-b-4 border-black bg-gray-50">
                <div className="flex items-start justify-between">
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => window.open(`/profile/${member.userId}`, '_blank')}
                    >
                        <div className="relative w-14 h-14 flex-shrink-0 border-2 border-black bg-gray-100 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all">
                            {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <User size={24} className="text-black/50" />
                                </div>
                            )}
                            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 font-black text-black uppercase tracking-tight text-sm">
                                {member.nickname || member.username}
                                {getRoleIcon(member.role)}
                                <ExternalLink size={10} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-0.5">{member.role}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className={`w-2 h-2 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
                                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 border-2 border-transparent hover:border-black text-black hover:bg-black hover:text-white flex items-center justify-center transition-all flex-shrink-0"
                    >
                        <X size={14} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Activity */}
            <div className="p-4 bg-white">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 border-l-4 border-black pl-2">ACTIVITY_LOG</h4>
                {currentSong ? (
                    <div
                        className="border-2 border-black p-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer group transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                        onClick={() => window.open(`music/song/${currentSong.songId}`, '_blank')}
                    >
                        <div className="w-10 h-10 border-2 border-black flex-shrink-0 bg-gray-100 overflow-hidden">
                            {currentSong.coverUrl ? (
                                <img src={currentSong.coverUrl} alt={currentSong.songTitle} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Music size={16} className="text-black" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-black font-black text-xs uppercase tracking-tight truncate">{currentSong.songTitle}</p>
                            <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest truncate">by {currentSong.artistName}</p>
                        </div>
                        <Music size={14} className="text-black animate-pulse flex-shrink-0" strokeWidth={3} />
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-gray-300 p-4 text-center bg-gray-50">
                        <Music size={18} className="mx-auto mb-1.5 text-gray-300" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">NO ACTIVE PLAYBACK</p>
                    </div>
                )}
            </div>
        </div>
    );
}
