import type { Song } from '../types/music';
import { Play, Trash2 } from 'lucide-react';
import { formatDuration } from '../data/mockData';

interface SongCardProps {
    song: Song;
    onRemove?: (songId: string) => void;
    showRemove?: boolean;
}

export default function SongCard({ song, onRemove, showRemove = false }: SongCardProps) {
    return (
        <div className="group flex items-center gap-4 p-3 rounded-lg bg-gray-900/50 hover:bg-gray-800/80 transition-all duration-300 border border-transparent hover:border-red-500/30">
            {/* Album Art */}
            <div className="relative flex-shrink-0">
                <img
                    src={song.coverUrl}
                    alt={song.album}
                    className="w-14 h-14 rounded-md object-cover"
                />
                <div className="absolute inset-0 bg-black/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors duration-200 transform hover:scale-110">
                        <Play size={14} fill="white" className="text-white ml-0.5" />
                    </button>
                </div>
            </div>

            {/* Song Info */}
            <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate group-hover:text-red-400 transition-colors duration-300">
                    {song.title}
                </h4>
                <p className="text-gray-400 text-sm truncate">{song.artist}</p>
            </div>

            {/* Album */}
            <div className="hidden md:block flex-1 min-w-0">
                <p className="text-gray-400 text-sm truncate">{song.album}</p>
            </div>

            {/* Duration */}
            <div className="text-gray-400 text-sm font-mono">
                {formatDuration(song.duration)}
            </div>

            {/* Remove Button */}
            {showRemove && onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(song.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 hover:bg-red-600/20 rounded-md"
                    title="Remove from playlist"
                >
                    <Trash2 size={16} className="text-red-400 hover:text-red-300" />
                </button>
            )}
        </div>
    );
}
