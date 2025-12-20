import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { artistService, type Artist } from "../../../services/artistService";
import { Play, Music, Disc } from "lucide-react";

const HomeArtistList: React.FC = () => {
    const navigate = useNavigate();
    const [artists, setArtists] = useState<Artist[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArtists = async () => {
            try {
                setLoading(true);
                const data = await artistService.getFollowedArtists();
                setArtists(data);
            } catch (err) {
                setError("Failed to load followed artists");
                console.error("Error fetching followed artists:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchArtists();
    }, []);

    if (loading) {
        return (
            <div className="mb-6">
                <div className="flex gap-4 overflow-x-auto pb-3 playlist-scrollbar">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="min-w-[280px] bg-[#1a141a] rounded-xl p-3 animate-pulse">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-white/10" />
                                <div className="flex-1">
                                    <div className="h-4 bg-white/10 rounded mb-2" />
                                    <div className="h-3 bg-white/10 rounded w-2/3" />
                                </div>
                            </div>
                            <div className="h-3 bg-white/10 rounded w-1/2 mt-2" />
                        </div>
                    ))}
                </div>
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
                <div className="bg-[#1a141a] rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#ff7a3c] to-[#ff4d6d] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Music className="text-white" size={32} />
                    </div>
                    <p className="text-white/70 font-medium mb-1">No followed artists yet</p>
                    <p className="text-white/40 text-sm">Search for artists and follow them to see them here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white/70">Followed Artists</h3>
            </div>

            {/* Horizontal scroll container */}
            <div className="flex gap-4 overflow-x-auto pb-3 playlist-scrollbar">
                {artists.map((artist) => (
                    <div
                        key={artist.id}
                        className="min-w-[280px] bg-[#1a141a] rounded-xl p-3 hover:bg-[#221a22] transition-colors cursor-pointer flex-shrink-0 group"
                        onClick={() => navigate(`/artist/${artist.id}`)}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            {artist.imageUrl ? (
                                <img
                                    src={artist.imageUrl}
                                    alt={artist.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                    onError={(e) => { e.currentTarget.src = "/assets/images/default-avatar.svg"; }}
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff7a3c] to-[#ff4d6d] flex items-center justify-center text-xs font-bold">
                                    {artist.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate text-sm group-hover:text-[#ff7a3c] transition-colors">
                                    {artist.name}
                                </div>
                                <div className="text-[11px] text-white/50 capitalize">
                                    {artist.role || "Artist"}
                                </div>
                            </div>
                            {/* Play button */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-8 h-8 bg-[#ff7a3c] rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                                    <Play className="text-black fill-current" size={14} />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-white/40">
                            <span className="flex items-center gap-1">
                                <Music size={10} />
                                {artist.songCount || 0} songs
                            </span>
                            <span className="flex items-center gap-1">
                                <Disc size={10} />
                                {artist.albumCount || 0} albums
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HomeArtistList;
