import { useNavigate } from 'react-router-dom';
import type { Playlist } from '../types/music';
import { Music } from 'lucide-react';

interface PlaylistCardProps {
    playlist: Playlist;
}

export default function PlaylistCard({ playlist }: PlaylistCardProps) {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/music/playlist/${playlist.id}`)}
            className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20"
        >
            {/* Cover Image */}
            <div className="relative aspect-square overflow-hidden">
                <img
                    src={playlist.coverUrl}
                    alt={playlist.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                        <Music className="text-white " size={28} />
                    </div>
                </div>
            </div>

            {/* Playlist Info */}
            <div className="p-4">
                <h3 className="text-white font-bold text-lg mb-1 truncate group-hover:text-red-400 transition-colors duration-300">
                    {playlist.name}
                </h3>
                <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                    {playlist.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-red-400">
                        View →
                    </span>
                </div>
            </div>

            {/* Accent Border */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-red-500/30 rounded-xl transition-colors duration-300 pointer-events-none" />
        </div>
    );
}
