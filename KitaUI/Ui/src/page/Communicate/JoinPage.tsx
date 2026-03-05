import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { serverInviteService } from '../../services/serverInviteService';
import type { ServerInviteDto } from '../../types/api';
import { Users } from 'lucide-react';

export default function JoinPage() {
    const { code } = useParams();
    const navigate = useNavigate();
    const [invite, setInvite] = useState<ServerInviteDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        const loadInvite = async () => {
            if (!code) return;
            try {
                const data = await serverInviteService.getInviteByCode(code);
                setInvite(data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Invalid or expired invite link.');
            } finally {
                setIsLoading(false);
            }
        };
        loadInvite();
    }, [code]);

    const handleJoin = async () => {
        if (!code) return;
        setIsJoining(true);
        try {
            await serverInviteService.useInvite({ code });
            navigate('/chat');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to join server.');
            setIsJoining(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen w-screen bg-gray-50 flex items-center justify-center relative">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
                <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-none animate-spin shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10 bg-white"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-screen bg-gray-50 flex items-center justify-center p-4 relative">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
                <div className="bg-white p-8 border-4 border-black max-w-md w-full text-center shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative z-10">
                    <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-10">ERROR_PROTOCOL</div>
                    <div className="w-16 h-16 bg-gray-100 border-4 border-black flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <span className="text-black text-3xl font-black">!</span>
                    </div>
                    <h2 className="text-2xl font-black text-black mb-2 uppercase tracking-tighter">Invite Invalid</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-8">{error}</p>
                    <button
                        onClick={() => navigate('/chat')}
                        className="w-full px-6 py-3 border-2 border-black bg-black text-white font-black text-sm uppercase tracking-widest hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center"
                    >
                        ABORT SEQUENCE
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-gray-50 flex items-center justify-center p-4 relative">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            <div className="bg-white p-10 border-4 border-black max-w-sm w-full text-center shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative z-10 overflow-hidden">
                <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-10">INVITE_PROTOCOL</div>
                <div className="absolute -left-16 -top-16 w-32 h-32 bg-gray-200 rotate-45 pointer-events-none opacity-50 border-b-4 border-black"></div>

                <div className="w-20 h-20 bg-gray-100 border-4 border-black flex items-center justify-center mx-auto mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10">
                    <span className="text-black text-4xl font-black">#</span>
                </div>

                <h1 className="text-gray-500 mb-2 font-bold text-xs uppercase tracking-widest relative z-10">INCOMING TRANSMISSION</h1>
                <h2 className="text-3xl font-black text-black mb-8 uppercase tracking-tighter relative z-10 truncate px-2">{invite?.serverName || 'UNKNOWN_HOST'}</h2>

                {invite?.maxUses && invite.uses !== undefined && (
                    <div className="flex items-center justify-center gap-2 text-black text-xs font-black uppercase tracking-widest mb-8 bg-white border-2 border-black py-2 px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-max mx-auto relative z-10">
                        <Users size={16} strokeWidth={3} />
                        <span>[{invite.maxUses - invite.uses} SLOTS REMAINING]</span>
                    </div>
                )}

                <div className="space-y-4 relative z-10">
                    <button
                        onClick={handleJoin}
                        disabled={isJoining}
                        className="w-full py-4 border-4 border-black bg-black text-white font-black text-sm uppercase tracking-widest hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-black disabled:hover:text-white flex justify-center items-center"
                    >
                        {isJoining ? 'ESTABLISHING LINK...' : 'ACCEPT INVITE'}
                    </button>

                    <button
                        onClick={() => navigate('/chat')}
                        className="w-full py-3 border-4 border-transparent text-gray-400 font-bold text-xs uppercase tracking-widest hover:border-black hover:text-black transition-all bg-gray-50"
                    >
                        REJECT
                    </button>
                </div>
            </div>
        </div>
    );
}
