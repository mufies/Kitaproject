import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pause } from "lucide-react";
import { getUserPlaylists, type Playlist } from "../../../services/musicService";
import { usePlay } from "../../../context/PlayContext";
import AllPlaylistsModal from "./AllPlaylistsModal";

const PlaylistList: React.FC = () => {
    const navigate = useNavigate();
    const { playSong, isPlaying, currentSong, togglePlayPause, playlist } = usePlay();
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

    // Check if a playlist is currently playing
    const isPlaylistPlaying = (playlistSongs: Playlist['songs']): boolean => {
        if (!currentSong || playlist.length === 0 || playlistSongs.length === 0) return false;
        const playlistSongIds = playlistSongs.map(s => s.id);
        return playlistSongIds.includes(currentSong.id) && isPlaying;
    };

    // Handle play button click on a playlist
    const handlePlayPlaylist = (e: React.MouseEvent, playlistData: Playlist) => {
        e.stopPropagation();

        if (!playlistData.songs || playlistData.songs.length === 0) return;

        if (isPlaylistPlaying(playlistData.songs)) {
            togglePlayPause();
            return;
        }

        // If currently paused on same playlist, resume
        const playlistSongIds = playlistData.songs.map(s => s.id);
        if (currentSong && playlistSongIds.includes(currentSong.id) && !isPlaying) {
            togglePlayPause();
            return;
        }

        // Start playing the playlist from the beginning
        // @ts-ignore - Assuming song structures are compatible
        playSong(playlistData.songs[0], playlistData.songs);
    };

    if (loading) {
        return (
            <div className="mb-6">
                <div className="flex gap-4 overflow-x-auto pb-3 playlist-scrollbar">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i}
                            className="min-w-[280px] bg-white border-4 border-gray-200 rounded-none p-3 animate-pulse">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-none bg-gray-200 border-2 border-gray-300" />
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded-none mb-2" />
                                    <div className="h-3 bg-gray-200 rounded-none w-2/3" />
                                </div>
                            </div>
                            <div className="h-3 bg-gray-200 rounded-none w-1/2 mt-2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mb-6">
                <div className="bg-white border-4 border-black p-4 text-black text-center text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    [ERROR] {error}
                </div>
            </div>
        );
    }

    if (playlists.length === 0) {
        return (
            <div className="mb-6">
                <div className="bg-gray-50 border-4 border-dashed border-gray-300 p-6 text-gray-500 text-center text-xs font-bold uppercase tracking-widest">
                    NO PLAYLISTS DETECTED. INITIALIZE NEW ARCHIVE.
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mb-6">
                {/* Header with Show All button */}
                <div className="flex items-center justify-between mb-4 border-b-4 border-black pb-2">
                    <h3 className="text-xl font-black text-black uppercase tracking-tighter">Your Playlists</h3>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-xs font-black text-black uppercase tracking-widest hover:bg-black hover:text-white px-3 py-1 border-2 border-transparent hover:border-black transition-all"
                    >
                        ACCESS ALL DIR →
                    </button>
                </div>

                {/* Horizontal scroll container */}
                <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-2 -mx-2 playlist-scrollbar">
                    {playlists.map((playlist) => {
                        const totalDuration = playlist.songs.reduce(
                            (acc, song) => acc + song.duration,
                            0
                        );
                        const trackCount = playlist.songs.length;
                        const hasSongs = playlist.songs && playlist.songs.length > 0;

                        return (
                            <div
                                key={playlist.id}
                                className="min-w-[280px] bg-white border-4 border-black p-3 hover:bg-gray-50 transition-colors cursor-pointer flex-shrink-0 group relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 overflow-hidden"
                                onClick={() => {
                                    console.log("Navigating to playlist:", playlist.id);
                                    navigate(`/music/playlist/${playlist.id}`);
                                }}
                            >
                                <div className="absolute top-0 right-0 w-6 h-6 bg-gray-200 border-b-2 border-l-2 border-black -mr-3 -mt-3 rotate-45"></div>
                                <div className="flex items-center gap-3 mb-2">
                                    {playlist.coverUrl ? (
                                        <div className="w-12 h-12 border-2 border-black rounded-none overflow-hidden bg-gray-100 flex-shrink-0">
                                            <img
                                                src={playlist.coverUrl}
                                                alt={playlist.name}
                                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 border-2 border-black rounded-none bg-white flex items-center justify-center font-black text-black text-lg uppercase flex-shrink-0">
                                            {playlist.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-black truncate text-sm text-black uppercase tracking-tight group-hover:translate-x-1 transition-transform">{playlist.name}</div>
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                                            [{trackCount} TRK] {formatDuration(totalDuration)}
                                        </div>
                                    </div>

                                    {/* Play Button */}
                                    {hasSongs && (
                                        <button
                                            className={`w-10 h-10 rounded-none bg-black border-2 border-black flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_rgba(150,150,150,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 ${isPlaylistPlaying(playlist.songs) || (currentSong && playlist.songs.some(s => s.id === currentSong.id))
                                                ? 'opacity-100 translate-x-0'
                                                : 'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0'
                                                }`}
                                            onClick={(e) => handlePlayPlaylist(e, playlist)}
                                            title={isPlaylistPlaying(playlist.songs) ? "Pause" : "Play Playlist"}
                                        >
                                            {isPlaylistPlaying(playlist.songs) ? (
                                                <Pause size={16} strokeWidth={3} className="text-white" />
                                            ) : (
                                                <Play size={16} strokeWidth={3} className="text-white ml-1" />
                                            )}
                                        </button>
                                    )}
                                </div>
                                {playlist.description && (
                                    <div className="text-[10px] font-bold text-gray-400 line-clamp-2 mb-2 uppercase tracking-widest">
                                        {playlist.description}
                                    </div>
                                )}
                                <div className="mt-2">
                                    <span className="text-[10px] font-black text-black uppercase tracking-widest bg-gray-100 px-2 py-0.5 border-2 border-black">
                                        {playlist.isPublic ? "PUBLIC_DATA" : "PRIVATE_DATA"}
                                    </span>
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
