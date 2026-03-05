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
            className="group relative bg-white border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 overflow-hidden cursor-pointer transform transition-all duration-300"
        >
            {/* Cover Image */}
            <div className="relative aspect-square overflow-hidden border-b-4 border-black bg-gray-100">
                <img
                    src={playlist.coverUrl}
                    alt={playlist.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 grayscale group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm" />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <Music className="text-black fill-black" size={28} />
                    </div>
                </div>
            </div>

            {/* Playlist Info */}
            <div className="p-4 bg-white relative">
                <div className="absolute top-0 right-0 w-8 h-8 bg-gray-200 border-b-4 border-l-4 border-black -mr-4 -mt-4 rotate-45"></div>
                <h3 className="text-black font-black text-xl mb-1 truncate uppercase tracking-tighter group-hover:translate-x-1 transition-transform">
                    {playlist.name}
                </h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3 line-clamp-2">
                    {playlist.description || 'NO DESCRIPTION'}
                </p>
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-black">
                    <span className="bg-gray-100 px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        [{playlist.songs?.length || 0} TRACK{playlist.songs?.length !== 1 ? 'S' : ''}]
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1 group/btn hover:translate-x-1">
                        ACCESS <span className="text-lg leading-none">→</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
