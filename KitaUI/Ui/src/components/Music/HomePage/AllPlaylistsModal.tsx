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
                <div className="bg-white rounded-none w-full max-w-5xl max-h-[85vh] overflow-hidden shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] border-4 border-black animate-slideUp relative">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

                    {/* Header */}
                    <div className="px-6 py-4 border-b-4 border-black bg-gray-50 flex items-center justify-between sticky top-0 z-10">
                        <div>
                            <h2 className="text-2xl font-black text-black uppercase tracking-tighter">ALL_PLAYLISTS</h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                                [{playlists.length} PLAYLIST{playlists.length !== 1 ? "S" : ""} DETECTED]
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 border-2 border-transparent hover:border-black transition-all flex items-center justify-center text-black hover:bg-black hover:text-white"
                        >
                            <span className="font-black">✕</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(85vh-6rem)] relative z-10 bg-white">
                        {playlists.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 font-bold text-xs uppercase tracking-widest border-4 border-dashed border-gray-300 bg-gray-50">
                                NO PLAYLISTS DETECTED. INITIALIZE NEW ARCHIVE.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                            className="bg-white border-4 border-black p-4 hover:bg-gray-50 transition-all cursor-pointer group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-8 h-8 bg-gray-200 border-b-2 border-l-2 border-black -mr-4 -mt-4 rotate-45"></div>

                                            <div className="flex items-start gap-4 mb-3 relative z-10">
                                                {playlist.coverUrl ? (
                                                    <div className="w-16 h-16 border-2 border-black flex-shrink-0 bg-gray-100 overflow-hidden">
                                                        <img
                                                            src={playlist.coverUrl}
                                                            alt={playlist.name}
                                                            className="w-full h-full object-cover transition-all"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-16 border-2 border-black bg-white flex items-center justify-center text-2xl font-black text-black flex-shrink-0">
                                                        {playlist.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0 pt-1">
                                                    <h3 className="font-black text-black uppercase tracking-tight truncate mb-1 text-lg group-hover:translate-x-1 transition-transform">
                                                        {playlist.name}
                                                    </h3>
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                        [{trackCount} TRK] {formatDuration(totalDuration)}
                                                    </p>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-black uppercase tracking-widest bg-gray-100 px-2 py-0.5 border-2 border-black">
                                                            {playlist.isPublic ? "PUBLIC_DATA" : "PRIVATE_DATA"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {playlist.description && (
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest line-clamp-2 mt-3 pt-3 border-t-2 border-dashed border-gray-200 relative z-10">
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
