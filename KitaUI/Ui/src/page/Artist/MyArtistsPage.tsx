import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import ArtistList from '../../components/Artist/ArtistList';
import CreateArtistModal from '../../components/Artist/CreateArtistModal';
import { artistService, type Artist } from '../../services/artistService';

const MyArtistsPage: React.FC = () => {
    const [artists, setArtists] = useState<Artist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchArtists = async () => {
        setIsLoading(true);
        try {
            const data = await artistService.getMyArtists();
            setArtists(data);
        } catch (error) {
            console.error('Failed to fetch artists:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteArtist = async (artistId: string) => {
        try {
            await artistService.deleteArtist(artistId);
            // Refresh the list after deletion
            fetchArtists();
        } catch (error) {
            console.error('Failed to delete artist:', error);
            alert('Xóa artist thất bại. Vui lòng thử lại.');
        }
    };

    useEffect(() => {
        fetchArtists();
    }, []);

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-white text-black font-sans selection:bg-black selection:text-white relative">
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}>
            </div>

            <div className="p-8 max-w-[1400px] mx-auto min-h-screen relative z-10 pt-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b-4 border-black pb-6">
                    <div>
                        <div className="inline-block bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest mb-4">ADMINISTRATION</div>
                        <h1 className="text-5xl md:text-7xl font-black text-black uppercase tracking-tighter leading-none mb-2">My Artists</h1>
                        <p className="text-gray-500 font-bold uppercase tracking-wider text-xs border-l-4 border-black pl-4">Manage the entities you control</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-6 md:mt-0 flex items-center justify-center gap-2 bg-white text-black font-black py-3 px-6 uppercase tracking-widest text-sm border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 hover:bg-black hover:text-white transition-all active:scale-95"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span>INITIALIZE ENTITY</span>
                    </button>
                </div>

                <ArtistList artists={artists} isLoading={isLoading} onDelete={handleDeleteArtist} />

                <CreateArtistModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onArtistCreated={fetchArtists}
                />
            </div>
        </div>
    );
};

export default MyArtistsPage;
