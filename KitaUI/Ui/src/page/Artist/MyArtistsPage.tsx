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
        <div className="p-8 h-full overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Artists</h1>
                    <p className="text-[#a7a7a7]">Manage the artists you control</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-6 rounded-full transition-transform active:scale-95"
                >
                    <Plus size={20} />
                    <span>Create Artist</span>
                </button>
            </div>

            <ArtistList artists={artists} isLoading={isLoading} onDelete={handleDeleteArtist} />

            <CreateArtistModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onArtistCreated={fetchArtists}
            />
        </div>
    );
};

export default MyArtistsPage;
