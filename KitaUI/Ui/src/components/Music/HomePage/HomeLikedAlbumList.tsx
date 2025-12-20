import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { albumService, type Album } from "../../../services/albumService";
import { Heart, Play, Pause, Music } from "lucide-react";
import { usePlay } from "../../../context/PlayContext";
import type { SongDto } from "../../../types/api";

const HomeLikedAlbumList: React.FC = () => {
    const navigate = useNavigate();
    const { playSong, isPlaying, currentSong, togglePlayPause, playlist } = usePlay();
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [playingAlbumId, setPlayingAlbumId] = useState<string | null>(null);

    useEffect(() => {
        const fetchAlbums = async () => {
            try {
                setLoading(true);
                const data = await albumService.getLikedAlbums();
                setAlbums(data);
            } catch (err) {
                setError("Failed to load liked albums");
                console.error("Error fetching liked albums:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAlbums();
    }, []);

    // Check if an album is currently playing
    const isAlbumPlaying = (albumId: string): boolean => {
        if (!currentSong || playlist.length === 0) return false;
        // Check if current song belongs to this album
        return currentSong.albumId === albumId && isPlaying;
    };

    // Handle play button click on an album
    const handlePlayAlbum = async (e: React.MouseEvent, album: Album) => {
        e.stopPropagation();

        if (isAlbumPlaying(album.id)) {
            togglePlayPause();
            return;
        }

        // If currently paused on same album, resume
        if (currentSong?.albumId === album.id && !isPlaying) {
            togglePlayPause();
            return;
        }

        // Need to fetch album details to get songs
        try {
            setPlayingAlbumId(album.id);
            const albumDetail = await albumService.getAlbumById(album.id);
            if (albumDetail.songs && albumDetail.songs.length > 0) {
                const playableSongs: SongDto[] = albumDetail.songs.map(song => ({
                    id: song.id,
                    title: song.title,
                    artist: song.artist || albumDetail.artistName || '',
                    streamUrl: song.streamUrl,
                    coverUrl: song.coverUrl || albumDetail.imageUrl,
                    duration: song.duration,
                    artistId: albumDetail.artistId,
                    albumId: albumDetail.id,
                }));
                playSong(playableSongs[0], playableSongs);
            }
        } catch (err) {
            console.error('Failed to fetch album for playback:', err);
        } finally {
            setPlayingAlbumId(null);
        }
    };

    if (loading) {
        return (
            <div className="mb-6">
                <div className="flex gap-4 overflow-x-auto pb-3 playlist-scrollbar">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="min-w-[280px] bg-[#1a141a] rounded-xl p-3 animate-pulse">
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

    if (albums.length === 0) {
        return (
            <div className="mb-6">
                <div className="bg-[#1a141a] rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#ff7a3c] to-[#ff4d6d] rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Heart className="text-white" size={32} />
                    </div>
                    <p className="text-white/70 font-medium mb-1">No liked albums yet</p>
                    <p className="text-white/40 text-sm">Like albums to see them here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white/70">Liked Albums</h3>
            </div>

            {/* Horizontal scroll container */}
            <div className="flex gap-4 overflow-x-auto pb-3 playlist-scrollbar">
                {albums.map((album) => (
                    <div
                        key={album.id}
                        className="min-w-[280px] bg-[#1a141a] rounded-xl p-3 hover:bg-[#221a22] transition-colors cursor-pointer flex-shrink-0 group"
                        onClick={() => navigate(`/album/${album.id}`)}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            {album.imageUrl ? (
                                <img
                                    src={album.imageUrl}
                                    alt={album.name}
                                    className="w-10 h-10 rounded-lg object-cover"
                                    onError={(e) => { e.currentTarget.src = "/assets/images/default-album.svg"; }}
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff7a3c] to-[#ff4d6d] flex items-center justify-center text-xs font-bold">
                                    {album.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate text-sm group-hover:text-[#ff7a3c] transition-colors">
                                    {album.name}
                                </div>
                                <div className="text-[11px] text-white/50">
                                    {album.artistName || "Unknown Artist"}
                                </div>
                            </div>
                            {/* Play button */}
                            <button
                                onClick={(e) => handlePlayAlbum(e, album)}
                                className={`opacity-0 group-hover:opacity-100 transition-all ${isAlbumPlaying(album.id) || currentSong?.albumId === album.id ? 'opacity-100' : ''}`}
                            >
                                <div className={`w-8 h-8 bg-[#ff7a3c] rounded-full flex items-center justify-center hover:scale-105 transition-transform ${playingAlbumId === album.id ? 'animate-pulse' : ''}`}>
                                    {isAlbumPlaying(album.id) ? (
                                        <Pause className="text-black fill-current" size={14} />
                                    ) : (
                                        <Play className="text-black fill-current ml-0.5" size={14} />
                                    )}
                                </div>
                            </button>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-white/40">
                            <span className="flex items-center gap-1">
                                <Music size={10} />
                                {album.songCount || 0} songs
                            </span>
                            <span className="flex items-center gap-1">
                                <Heart size={10} className="fill-current text-[#ff7a3c]" />
                                Liked
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HomeLikedAlbumList;
