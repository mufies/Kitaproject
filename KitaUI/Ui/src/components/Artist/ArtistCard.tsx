import React from 'react';
import type { Artist } from '../../services/artistService';
import { useNavigate } from 'react-router-dom';
import { Play, Disc, Music } from 'lucide-react';

interface ArtistCardProps {
    artist: Artist;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/artist/${artist.id}`)}
            className="group relative bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-all duration-300 cursor-pointer w-full"
        >
            <div className="relative mb-4">
                <div className="w-full aspect-square rounded-full overflow-hidden shadow-lg mb-4">
                    <img
                        src={artist.imageUrl || "/assets/images/default-avatar.png"}
                        alt={artist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            e.currentTarget.src = "/assets/images/default-avatar.png";
                        }}
                    />
                </div>
                <div className="absolute bottom-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 shadow-xl">
                    <div className="bg-green-500 rounded-full p-3 hover:scale-105 transition-transform">
                        <Play className="text-black fill-current translate-x-0.5" size={24} />
                    </div>
                </div>
            </div>

            <h3 className="text-white font-bold text-base truncate mb-1">{artist.name}</h3>
            <p className="text-[#a7a7a7] text-sm truncate capitalize mb-2">{artist.role}</p>

            <div className="flex items-center gap-4 text-xs text-[#a7a7a7]">
                <div className="flex items-center gap-1">
                    <Music size={12} />
                    <span>{artist.songCount} Songs</span>
                </div>
                <div className="flex items-center gap-1">
                    <Disc size={12} />
                    <span>{artist.albumCount} Albums</span>
                </div>
            </div>
        </div>
    );
};

export default ArtistCard;
