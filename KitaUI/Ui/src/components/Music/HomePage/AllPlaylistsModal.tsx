import React from "react";
import { useNavigate } from "react-router-dom";
import { type Playlist } from "../../../services/musicService";

interface AllPlaylistsModalProps {
    isOpen: boolean;
    onClose: () => void;
    playlists: Playlist[];
}

const AllPlaylistsModal: React.FC<AllPlaylistsModalProps> = ({ isOpen, onClose, playlists }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const formatDuration = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fadeIn"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fadeIn">
                <div className="bg-[#1a141a] rounded-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden shadow-2xl border border-white/10 animate-slideUp">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1a141a] z-10">
                        <div>
                            <h2 className="text-xl font-semibold text-white">All Playlists</h2>
                            <p className="text-sm text-white/50 mt-1">
                                {playlists.length} playlist{playlists.length !== 1 ? "s" : ""} total
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-white/70 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(85vh-5rem)]">
                        {playlists.length === 0 ? (
                            <div className="text-center py-12 text-white/50">
                                No playlists found. Create your first playlist!
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {playlists.map((playlist) => {
                                    const totalDuration = playlist.songs.reduce(
                                        (acc, song) => acc + song.duration,
                                        0
                                    );
                                    const trackCount = playlist.songs.length;

                                    return (
                                        <div
                                            key={playlist.id}
                                            onClick={() => {
                                                navigate(`/music/playlist/${playlist.id}`);
                                                onClose();
                                            }}
                                            className="bg-[#221a22] rounded-xl p-4 hover:bg-[#2a1f2a] transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-start gap-3 mb-3">
                                                {playlist.coverUrl ? (
                                                    <img
                                                        src={playlist.coverUrl}
                                                        alt={playlist.name}
                                                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0 group-hover:shadow-lg group-hover:scale-105 transition-transform"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#ff7a3c] to-[#ff4d6d] flex items-center justify-center text-lg font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                                                        {playlist.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-white truncate mb-1">
                                                        {playlist.name}
                                                    </h3>
                                                    <p className="text-xs text-white/50">
                                                        {trackCount} track{trackCount !== 1 ? "s" : ""} •{" "}
                                                        {formatDuration(totalDuration)}
                                                    </p>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${playlist.isPublic
                                                                ? "bg-green-500/20 text-green-400"
                                                                : "bg-orange-500/20 text-orange-400"
                                                                }`}
                                                        >
                                                            {playlist.isPublic ? "Public" : "Private"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {playlist.description && (
                                                <p className="text-xs text-white/40 line-clamp-2 mt-2 leading-relaxed">
                                                    {playlist.description}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AllPlaylistsModal;
