import React, { useState } from 'react';
import { X } from 'lucide-react';
import { type CreateArtistDto, artistService } from '../../services/artistService';

interface CreateArtistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onArtistCreated: () => void;
}

const CreateArtistModal: React.FC<CreateArtistModalProps> = ({ isOpen, onClose, onArtistCreated }) => {
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
            const data: CreateArtistDto = { name, description };
            await artistService.createArtist(data);
            onArtistCreated();
            onClose();
            setName('');
            setDescription('');
        } catch (err: any) {
            console.error('Failed to create artist:', err);
            setError(err.response?.data?.message || "Failed to create artist. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            <div className="bg-white rounded-none w-full max-w-md border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative animate-in fade-in zoom-in duration-200 z-10 overflow-hidden">
                <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-10">INITIALIZATION_PORTAL</div>
                <div className="absolute -left-16 -top-16 w-32 h-32 bg-gray-200 rotate-45 pointer-events-none opacity-50"></div>

                <div className="flex justify-between items-center border-b-4 border-black p-4 bg-gray-50 relative z-10">
                    <h2 className="text-2xl font-black text-black uppercase tracking-tight">CREATE ENTITY</h2>
                    <button
                        onClick={onClose}
                        className="text-black hover:bg-black hover:text-white transition-colors p-1 border-2 border-transparent hover:border-black"
                    >
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                <div className="p-6 bg-white relative z-10">
                    {error && (
                        <div className="bg-white border-2 border-black text-black p-3 mb-6 flex gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-black group-hover:w-full transition-all duration-300 z-0 opacity-10"></div>
                            <X size={20} className="shrink-0 text-black relative z-10" strokeWidth={3} />
                            <div className="font-bold text-sm uppercase tracking-wide relative z-10">{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-black uppercase tracking-widest mb-2 border-l-4 border-black pl-2">Entity Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-black px-4 py-3 text-black font-bold focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:text-gray-400"
                                placeholder="Enter designation..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-black uppercase tracking-widest mb-2 border-l-4 border-black pl-2">Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-black px-4 py-3 text-black font-bold focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all min-h-[120px] uppercase placeholder:normal-case placeholder:font-normal placeholder:text-gray-400"
                                placeholder="Provide operational parameters..."
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-4 border-t-2 border-gray-200 mt-6 pt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 font-black text-xs transition-all uppercase tracking-widest border-2 border-black bg-white text-black hover:bg-black hover:text-white"
                            >
                                CANCEL
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-8 py-3 font-black text-xs transition-all uppercase tracking-widest border-2 border-black bg-black text-white hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'INITIALIZING...' : 'INITIALIZE'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateArtistModal;
