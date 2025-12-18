import React, { useState } from 'react';
import { X } from 'lucide-react';
import { type CreateAlbumDto, albumService } from '../../services/albumService';

interface CreateAlbumModalProps {
    isOpen: boolean;
    onClose: () => void;
    artistId: string;
    onAlbumCreated: () => void;
}

const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({ isOpen, onClose, artistId, onAlbumCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const data: CreateAlbumDto = { name, description, artistId };
            await albumService.createAlbum(data);
            onAlbumCreated();
            onClose();
            setName('');
            setDescription('');
        } catch (err: any) {
            console.error('Failed to create album:', err);
            setError(err.response?.data?.message || "Failed to create album. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[#1e1e1e] rounded-xl w-full max-w-md border border-[#333] shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#a7a7a7] hover:text-white transition-colors p-1"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Create New Album</h2>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#a7a7a7] mb-1">Album Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[#2a2a2a] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
                                placeholder="Enter album name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#a7a7a7] mb-1">Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-[#2a2a2a] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-green-500 transition-colors min-h-[100px]"
                                placeholder="Describe the album..."
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-full transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Creating...' : 'Create Album'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateAlbumModal;
