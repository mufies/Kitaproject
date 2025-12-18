import React, { useEffect, useState } from "react";
import { artistService, type Artist } from "../../../services/artistService";
import ArtistCard from "../../Artist/ArtistCard";

const HomeArtistList: React.FC = () => {
    const [artists, setArtists] = useState<Artist[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArtists = async () => {
            try {
                setLoading(true);
                const data = await artistService.getAllArtists();
                setArtists(data);
            } catch (err) {
                setError("Failed to load artists");
                console.error("Error fetching artists:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchArtists();
    }, []);

    if (loading) {
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

    if (error) {
        return (
            <div className="mb-6">
                <div className="bg-red-900/20 rounded-xl p-4 text-red-400 text-center text-sm">
                    {error}
                </div>
            </div>
        );
    }

    if (artists.length === 0) {
        return (
            <div className="mb-6">
                <div className="bg-[#1a141a] rounded-xl p-4 text-white/50 text-center text-sm">
                    No artists found.
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {artists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
            ))}
        </div>
    );
};

export default HomeArtistList;
