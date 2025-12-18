import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserPlaylists, type Playlist } from "../../../services/musicService";
import AllPlaylistsModal from "./AllPlaylistsModal";

const PlaylistList: React.FC = () => {
    const navigate = useNavigate();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    useEffect(() => {
        const fetchPlaylists = async () => {
            try {
                setLoading(true);
                const data = await getUserPlaylists();
                setPlaylists(data);
            } catch (err) {
                setError("Failed to load playlists");
                console.error("Error fetching playlists:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlaylists();
    }, []);

    const formatDuration = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    if (loading) {
        return (
            <div className="mb-6">
                <div className="flex gap-4 overflow-x-auto pb-3 playlist-scrollbar">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i}
                            className="min-w-[280px] bg-[#1a141a] rounded-xl p-3 animate-pulse">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-lg bg-white/10" />
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

    if (playlists.length === 0) {
        return (
            <div className="mb-6">
                <div className="bg-[#1a141a] rounded-xl p-4 text-white/50 text-center text-sm">
                    No playlists found. Create your first playlist!
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mb-6">
                {/* Header with Show All button */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white/70">Your Playlists</h3>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-xs text-[#ff7a3c] hover:text-[#ff8c52] transition-colors font-medium"
                    >
                        Show All →
                    </button>
                </div>

                {/* Horizontal scroll container */}
                <div className="flex gap-4 overflow-x-auto pb-3 playlist-scrollbar">
                    {playlists.map((playlist) => {
                        const totalDuration = playlist.songs.reduce(
                            (acc, song) => acc + song.duration,
                            0
                        );
                        const trackCount = playlist.songs.length;

                        return (
                            <div
                                key={playlist.id}
                                className="min-w-[280px] bg-[#1a141a] rounded-xl p-3 hover:bg-[#221a22] transition-colors cursor-pointer flex-shrink-0"
                                onClick={() => {
                                    console.log("Navigating to playlist:", playlist.id);
                                    navigate(`/music/playlist/${playlist.id}`);
                                }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    {playlist.coverUrl ? (
                                        <img
                                            src={playlist.coverUrl}
                                            alt={playlist.name}
                                            className="w-10 h-10 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff7a3c] to-[#ff4d6d] flex items-center justify-center text-xs font-bold">
                                            {playlist.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate text-sm">{playlist.name}</div>
                                        <div className="text-[11px] text-white/50">
                                            {trackCount} tracks | {formatDuration(totalDuration)}
                                        </div>
                                    </div>
                                </div>
                                {playlist.description && (
                                    <div className="text-[11px] text-white/40 line-clamp-2 mb-1">
                                        {playlist.description}
                                    </div>
                                )}
                                <div className="text-[11px] text-white/40 flex justify-between items-center">
                                    <span>{playlist.isPublic ? "Public" : "Private"}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal */}
            <AllPlaylistsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                playlists={playlists}
            />
        </>
    );
};

export default PlaylistList;
