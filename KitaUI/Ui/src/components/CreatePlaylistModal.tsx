import { useState } from 'react';
import { X } from 'lucide-react';

interface CreatePlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreatePlaylist: (name: string, description: string, coverUrl: string) => void;
}

export default function CreatePlaylistModal({ isOpen, onClose, onCreatePlaylist }: CreatePlaylistModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [coverUrl, setCoverUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreatePlaylist(
                name,
                description,
                coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop'
            );
            setName('');
            setDescription('');
            setCoverUrl('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-red-500/20 animate-slideUp">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Create Playlist</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
                    >
                        <X className="text-gray-400 hover:text-white" size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                            Playlist Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                            placeholder="My Awesome Playlist"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200 resize-none"
                            placeholder="Describe your playlist..."
                        />
                    </div>

                    <div>
                        <label htmlFor="coverUrl" className="block text-sm font-medium text-gray-300 mb-2">
                            Cover Image URL
                        </label>
                        <input
                            type="url"
                            id="coverUrl"
                            value={coverUrl}
                            onChange={(e) => setCoverUrl(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                            placeholder="https://example.com/image.jpg (optional)"
                        />
                        <p className="mt-1 text-xs text-gray-500">Leave empty for default cover</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
