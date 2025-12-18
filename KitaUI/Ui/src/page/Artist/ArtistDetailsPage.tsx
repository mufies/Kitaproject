import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Plus } from 'lucide-react';
import { artistService, type ArtistDetail } from '../../services/artistService';
import CreateAlbumModal from '../../components/Artist/CreateAlbumModal';

const ArtistDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [artist, setArtist] = useState<ArtistDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const fetchArtistDetails = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const data = await artistService.getArtistById(id);
            setArtist(data);
        } catch (error) {
            console.error('Failed to fetch artist details:', error);
            navigate('/artists/my');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchArtistDetails();
    }, [id]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !id) return;

        setIsUploading(true);
        try {
            const file = e.target.files[0];
            await artistService.uploadArtistImage(id, file);
            await fetchArtistDetails(); // Refresh to show new image
        } catch (error) {
            console.error('Failed to upload image:', error);
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-white">Loading...</div>;
    }

    if (!artist) return null;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            {/* Header Section */}
            <div className="relative h-[300px] w-full">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#121212] z-10"></div>

                <div className="absolute inset-0 z-0">
                    {artist.imageUrl ? (
                        <div
                            className="w-full h-full bg-cover bg-center blur-sm opacity-30"
                            style={{ backgroundImage: `url(${artist.imageUrl})` }}
                        ></div>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900"></div>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 p-8 z-20 flex items-end gap-6 w-full">
                    <div className="relative group">
                        <div className="w-48 h-48 rounded-full overflow-hidden shadow-2xl border-4 border-[#121212]">
                            <img
                                src={artist.imageUrl || "/assets/images/default-avatar.png"}
                                alt={artist.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = "/assets/images/default-avatar.png";
                                }}
                            />
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity duration-200">
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                            />
                            <div className="text-white text-center">
                                <Upload size={24} className="mx-auto mb-1" />
                                <span className="text-xs font-bold">{isUploading ? 'Uploading...' : 'Change Photo'}</span>
                            </div>
                        </label>
                    </div>

                    <div className="flex-1 mb-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                            <span className="bg-blue-600 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">Verified Artist</span>
                        </div>
                        <h1 className="text-6xl font-black text-white mb-4 drop-shadow-lg">{artist.name}</h1>
                        <p className="text-[#a7a7a7] text-lg max-w-2xl line-clamp-2 mb-4">
                            {artist.description || "No description provided."}
                        </p>
                        <div className="flex items-center gap-4 text-white text-sm">
                            <span>{artist.albums.length} Albums</span>
                            <span className="w-1 h-1 bg-[#a7a7a7] rounded-full"></span>
                            <span>{artist.songs.length} Songs</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-8 pb-24">
                {/* Albums Section */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Albums</h2>
                        <button
                            onClick={() => setIsAlbumModalOpen(true)}
                            className="text-[#a7a7a7] hover:text-white font-semibold text-sm transition-colors flex items-center gap-1"
                        >
                            <Plus size={16} />
                            Add Album
                        </button>
                    </div>

                    {artist.albums.length === 0 ? (
                        <div className="bg-[#181818] rounded-xl p-8 text-center">
                            <p className="text-[#a7a7a7] mb-4">No albums yet.</p>
                            <button
                                onClick={() => setIsAlbumModalOpen(true)}
                                className="bg-white text-black font-bold py-2 px-6 rounded-full hover:scale-105 transition-transform"
                            >
                                Create First Album
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {artist.albums.map(album => (
                                <div key={album.id} className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-all group cursor-pointer">
                                    <div className="aspect-square bg-[#333] mb-4 rounded-md overflow-hidden relative shadow-lg">
                                        <img
                                            src={album.imageUrl || "/assets/images/default-album.png"}
                                            alt={album.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.currentTarget.src = "/assets/images/default-album.png";
                                            }}
                                        />
                                    </div>
                                    <h3 className="text-white font-bold truncate">{album.name}</h3>
                                    <p className="text-[#a7a7a7] text-sm">{album.songCount} Songs</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Songs Section */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-6">Popular Songs</h2>
                    {artist.songs.length === 0 ? (
                        <div className="text-[#a7a7a7] italic">No songs released yet.</div>
                    ) : (
                        <div className="flex flex-col">
                            {artist.songs.map((song, index) => (
                                <div key={song.id} className="flex items-center p-2 rounded-md hover:bg-[#ffffff10] group transition-colors">
                                    <span className="w-8 text-center text-[#a7a7a7] font-mono">{index + 1}</span>
                                    <div className="w-10 h-10 bg-[#333] rounded mr-4 overflow-hidden">
                                        <img
                                            src={song.coverUrl || "/assets/images/default-album.png"}
                                            alt={song.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = "/assets/images/default-album.png";
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-medium">{song.title}</div>
                                    </div>
                                    <div className="text-[#a7a7a7] font-mono text-sm">
                                        {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CreateAlbumModal
                isOpen={isAlbumModalOpen}
                onClose={() => setIsAlbumModalOpen(false)}
                artistId={id || ''}
                onAlbumCreated={fetchArtistDetails}
            />
        </div>
    );
};

export default ArtistDetailsPage;
