import { useState } from 'react';
import { X } from 'lucide-react';

interface CreatePlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreatePlaylist: (name: string, description: string, coverFile?: File) => void;
}

export default function CreatePlaylistModal({ isOpen, onClose, onCreatePlaylist }: CreatePlaylistModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type.startsWith('image/')) {
                setCoverFile(file);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            setIsCreating(true);
            onCreatePlaylist(name, description, coverFile || undefined);
            setName('');
            setDescription('');
            setCoverFile(null);
            setIsCreating(false);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[#282828] rounded-lg max-w-md w-full p-6 animate-slideUp" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Create Playlist</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-[#b3b3b3] hover:text-white transition-colors flex items-center justify-center"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-bold text-white mb-2">
                            Playlist Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-[#3e3e3e] border border-[#535353] rounded text-white text-sm placeholder-[#b3b3b3] focus:outline-none focus:border-[#1db954] focus:bg-[#4a4a4a] transition-all"
                            placeholder="My Awesome Playlist"
                            required
                            disabled={isCreating}
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-bold text-white mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-[#3e3e3e] border border-[#535353] rounded text-white text-sm placeholder-[#b3b3b3] focus:outline-none focus:border-[#1db954] focus:bg-[#4a4a4a] transition-all resize-none"
                            placeholder="Describe your playlist..."
                            disabled={isCreating}
                        />
                    </div>

                    <div>
                        <label htmlFor="coverFile" className="block text-sm font-bold text-white mb-2">
                            Cover Image (Optional)
                        </label>
                        <div
                            className="relative border-2 border-dashed border-[#535353] rounded-lg p-6 hover:border-[#1db954] transition-all cursor-pointer bg-[#3e3e3e]/30 hover:bg-[#3e3e3e]/50"
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('border-[#1db954]', 'bg-[#3e3e3e]/50');
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove('border-[#1db954]', 'bg-[#3e3e3e]/50');
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('border-[#1db954]', 'bg-[#3e3e3e]/50');
                                const file = e.dataTransfer.files[0];
                                if (file && file.type.startsWith('image/')) {
                                    setCoverFile(file);
                                }
                            }}
                        >
                            <input
                                id="coverFile"
                                type="file"
                                accept="image/*"
                                onChange={handleCoverFileChange}
                                disabled={isCreating}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="flex flex-col items-center justify-center text-center">
                                {coverFile ? (
                                    <div className="w-full">
                                        <div className="w-32 h-32 mx-auto mb-3 rounded-lg overflow-hidden">
                                            <img src={URL.createObjectURL(coverFile)} alt="Cover preview" className="w-full h-full object-cover" />
                                        </div>
                                        <p className="text-white font-medium mb-1">{coverFile.name}</p>
                                        <p className="text-[#b3b3b3] text-sm">{(coverFile.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                ) : (
                                    <>
                                        <svg className="w-12 h-12 text-[#1db954] mb-3" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                                        </svg>
                                        <p className="text-white font-medium mb-1">Click or drag image here</p>
                                        <p className="text-[#b3b3b3] text-sm">PNG, JPG, WEBP up to 10MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isCreating}
                            className="flex-1 px-4 py-3 bg-transparent text-white border border-[#535353] rounded-full text-sm font-bold hover:border-white hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="flex-1 px-4 py-3 bg-[#1db954] text-white rounded-full text-sm font-bold hover:bg-[#1ed760] hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isCreating ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
