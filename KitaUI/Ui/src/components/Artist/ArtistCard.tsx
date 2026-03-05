import React, { useState } from 'react';
import type { Artist } from '../../services/artistService';
import { useNavigate } from 'react-router-dom';
import { Play, Disc, Music, Trash2 } from 'lucide-react';

interface ArtistCardProps {
    artist: Artist;
    onDelete?: (artistId: string) => void;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onDelete }) => {
    const navigate = useNavigate();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent navigation
        if (window.confirm(`Bạn có chắc muốn xóa artist "${artist.name}"?`)) {
            setIsDeleting(true);
            try {
                if (onDelete) {
                    await onDelete(artist.id);
                }
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <div
            onClick={() => navigate(`/artist/${artist.id}`)}
            className="group relative bg-white border-4 border-black p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all duration-200 cursor-pointer w-full flex flex-col"
        >
            {/* Delete button - only show if onDelete is provided */}
            {onDelete && (
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="absolute top-2 right-2 z-20 p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-black hover:text-white text-black opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50"
                    title="Xóa artist"
                >
                    <Trash2 size={16} strokeWidth={3} />
                </button>
            )}

            <div className="relative border-b-4 border-black bg-gray-100">
                <div className="w-full aspect-square overflow-hidden bg-gray-200">
                    <img
                        src={artist.imageUrl || "/assets/images/default-avatar.svg"}
                        alt={artist.name}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
                        onError={(e) => {
                            e.currentTarget.onerror = null; // Prevent infinite loop
                            e.currentTarget.src = "/assets/images/default-avatar.svg";
                        }}
                    />
                </div>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white border-2 border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <Play className="fill-current translate-x-0.5" size={24} />
                    </div>
                </div>
            </div>

            <div className="p-4 flex flex-col flex-1">
                <h3 className="text-black font-black uppercase tracking-tight text-lg truncate mb-1">{artist.name}</h3>
                <p className="text-gray-600 font-bold text-xs uppercase tracking-widest truncate mb-4">{artist.role}</p>

                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-black mt-auto">
                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Music size={12} />
                        <span>{artist.songCount} TRK</span>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Disc size={12} />
                        <span>{artist.albumCount} ALB</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArtistCard;
