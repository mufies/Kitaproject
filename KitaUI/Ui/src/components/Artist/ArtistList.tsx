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
                    <div key={i} className="bg-white border-2 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-pulse">
                        <div className="w-full aspect-square bg-gray-200 border-2 border-black mb-4"></div>
                        <div className="h-4 bg-gray-200 w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (artists.length === 0) {
        return (
            <div className="p-16 text-center bg-gray-50 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-200 rotate-45 translate-x-16 -translate-y-16 opacity-50"></div>
                <h3 className="text-2xl font-black text-black uppercase tracking-tight mb-2">NO ENTITIES REGISTERED</h3>
                <p className="text-gray-500 font-bold uppercase tracking-wider text-xs z-10 relative">Initialize a new entity to begin administration.</p>
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
