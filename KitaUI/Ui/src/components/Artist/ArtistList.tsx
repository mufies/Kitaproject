import React from 'react';
import type { Artist } from '../../services/artistService';
import ArtistCard from './ArtistCard';

interface ArtistListProps {
    artists: Artist[];
    isLoading?: boolean;
    onDelete?: (artistId: string) => void;
}

const ArtistList: React.FC<ArtistListProps> = ({ artists, isLoading, onDelete }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-[#181818] p-4 rounded-md animate-pulse">
                        <div className="w-full aspect-square bg-[#282828] rounded-full mb-4"></div>
                        <div className="h-4 bg-[#282828] rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-[#282828] rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (artists.length === 0) {
        return (
            <div className="text-center text-[#a7a7a7] py-10">
                <p>No artists found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {artists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} onDelete={onDelete} />
            ))}
        </div>
    );
};

export default ArtistList;
