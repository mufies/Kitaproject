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
            <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#FF8C00] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center p-4">
                <div className="bg-[#1a141a] p-8 rounded-2xl border border-white/10 max-w-md w-full text-center shadow-xl">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-red-500 text-2xl">!</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Invite Invalid</h2>
                    <p className="text-[#a0a0a0] mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/chat')}
                        className="px-6 py-2.5 bg-[#FF8C00] text-white font-medium rounded-lg hover:bg-[#FF4D00] transition-colors"
                    >
                        Back to Chat
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="bg-[#1a141a] p-8 rounded-3xl border border-white/10 max-w-sm w-full text-center shadow-2xl">
                {/* <div className="w-24 h-24 bg-gradient-to-br from-[#FF8C00] to-[#FF4D00] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 shadow-[#FF8C00]/20">
                    <span className="text-white font-bold text-4xl">K</span>
                </div> */}

                <h1 className="text-white/60 mb-2 font-medium">You have been invited to join</h1>
                <h2 className="text-3xl font-bold text-white mb-6 font-['Lexend']">{invite?.serverName || 'a server'}</h2>

                {invite?.maxUses && invite.uses !== undefined && (
                    <div className="flex items-center justify-center gap-2 text-white/40 text-sm mb-8 bg-white/5 py-1.5 px-3 rounded-full w-max mx-auto">
                        <Users size={14} />
                        <span>{invite.maxUses - invite.uses} uses left</span>
                    </div>
                )}

                <button
                    onClick={handleJoin}
                    disabled={isJoining}
                    className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none"
                >
                    {isJoining ? 'Joining...' : 'Accept Invite'}
                </button>

                <button
                    onClick={() => navigate('/chat')}
                    className="mt-4 text-[#a0a0a0] text-sm hover:text-white transition-colors"
                >
                    No thanks
                </button>
            </div>
        </div>
    );
}
