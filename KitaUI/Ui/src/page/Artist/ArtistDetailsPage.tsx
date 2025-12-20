import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Plus, Music, Heart } from 'lucide-react';
import { artistService, type ArtistDetail } from '../../services/artistService';
import CreateAlbumModal from '../../components/Artist/CreateAlbumModal';
import UploadArtistSongModal from '../../components/Artist/UploadArtistSongModal';
import { getSongStats } from '../../utils/songStaticsAPI';

const ArtistDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [artist, setArtist] = useState<ArtistDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
    const [isSongModalOpen, setIsSongModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [songPlayCounts, setSongPlayCounts] = useState<Record<string, number>>({});

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

    const fetchSongPlayCounts = async (songs: { id: string }[]) => {
        const counts: Record<string, number> = {};
        await Promise.all(
            songs.map(async (song) => {
                try {
                    const response = await getSongStats(song.id);
                    if (response.success && response.data) {
                        counts[song.id] = response.data.playCount;
                    } else {
                        counts[song.id] = 0;
                    }
                } catch (error) {
                    counts[song.id] = 0;
                }
            })
        );
        setSongPlayCounts(counts);
    };

    useEffect(() => {
        fetchArtistDetails();
        checkFollowStatus();
        checkManagerStatus();
    }, [id]);

    useEffect(() => {
        if (artist && artist.songs.length > 0) {
            fetchSongPlayCounts(artist.songs);
        }
    }, [artist?.songs]);

    const checkFollowStatus = async () => {
        if (!id) return;
        try {
            const following = await artistService.isFollowingArtist(id);
            setIsFollowing(following);
        } catch (error) {
            console.error('Failed to check follow status:', error);
        }
    };

    const checkManagerStatus = async () => {
        if (!id) return;
        try {
            const myArtists = await artistService.getMyArtists();
            setIsManager(myArtists.some(a => a.id === id));
        } catch (error) {
            console.error('Failed to check manager status:', error);
            setIsManager(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!id || isFollowLoading) return;
        setIsFollowLoading(true);
        try {
            if (isFollowing) {
                await artistService.unfollowArtist(id);
                setIsFollowing(false);
            } else {
                await artistService.followArtist(id);
                setIsFollowing(true);
            }
        } catch (error) {
            console.error('Failed to toggle follow:', error);
        } finally {
            setIsFollowLoading(false);
        }
    };

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
            {/* Hero Section */}
            <div className="relative w-full h-[40vh] min-h-[340px] max-h-[500px]">
                {/* Dynamic Background */}
                <div className="absolute inset-0 z-0">
                    {artist.imageUrl ? (
                        <>
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url(${artist.imageUrl})` }}
                            ></div>
                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#121212]/60 to-[#121212]"></div>
                        </>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-b from-[#ff7a3c]/40 to-[#121212]"></div>
                    )}
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 w-full p-8 z-10 flex items-end gap-6">
                    {/* Avatar with Upload Overlay */}
                    <div className="relative group shrink-0">
                        <div className="w-[180px] h-[180px] sm:w-[232px] sm:h-[232px] rounded-full overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)] bg-[#282828] border-0">
                            <img
                                src={artist.imageUrl || "/assets/images/default-avatar.svg"}
                                alt={artist.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = "/assets/images/default-avatar.svg";
                                }}
                            />
                        </div>
                        {/* Only show upload for generic usage, but for now we follow the existing logic which allows image upload via this input. Keeping it. */}
                        <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-all duration-300 backdrop-blur-sm">
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                            />
                            <Upload size={32} className="text-white mb-2" />
                            <span className="text-white font-bold text-sm">Change Photo</span>
                        </label>
                    </div>

                    <div className="flex-1 min-w-0 mb-4">
                        {/* Verified Badge */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className="flex items-center gap-1 bg-[#2e77d0] text-white px-3 py-1 rounded-full text-[14px] font-bold tracking-wide uppercase shadow-lg">
                                <svg className="fill-current w-4 h-4" viewBox="0 0 24 24">
                                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"></path>
                                </svg>
                                Verified Artist
                            </span>
                        </div>

                        {/* Artist Name */}
                        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white mb-6 drop-shadow-2xl tracking-tight leading-none">
                            {artist.name}
                        </h1>

                        <div className="flex flex-col gap-4">
                            <p className="text-white/80 text-lg sm:text-xl font-medium drop-shadow-md line-clamp-1">
                                {artist.description || "No description provided."}
                            </p>

                            <div className="flex items-center gap-6 text-white text-sm font-medium">
                                <span className="text-white/90 drop-shadow-md">
                                    <span className="font-bold">{artist.followedByCount?.toLocaleString() || 0}</span> Followers
                                </span>
                                <span className="w-1.5 h-1.5 bg-white/60 rounded-full"></span>
                                <span className="text-white/90 drop-shadow-md">
                                    <span className="font-bold">{artist.songs.length}</span> Songs
                                </span>
                                <span className="w-1.5 h-1.5 bg-white/60 rounded-full"></span>
                                <span className="text-white/90 drop-shadow-md">
                                    <span className="font-bold">{artist.albums.length}</span> Albums
                                </span>
                            </div>

                            <div className="flex items-center gap-4 mt-2">
                                {!isManager && (
                                    <button
                                        onClick={handleFollowToggle}
                                        disabled={isFollowLoading}
                                        className={`flex items-center gap-2 px-8 py-3 rounded-full font-extrabold text-sm transition-all duration-200 uppercase tracking-wider transform hover:scale-105 ${isFollowing
                                            ? 'bg-transparent border-2 border-white/30 text-white hover:border-white'
                                            : 'bg-white text-black hover:bg-gray-200'
                                            }`}
                                    >
                                        <Heart size={20} className={isFollowing ? 'fill-current text-[#ff7a3c]' : ''} />
                                        {isFollowLoading ? 'Wait...' : isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Background */}
            <div className="bg-gradient-to-b from-[#121212] to-black min-h-[500px]">
                <div className="p-8 pb-32 max-w-[1920px] mx-auto">

                    {/* Popular Songs Section */}
                    <section className="mb-12">
                        <div className="flex items-center justify-between mb-6 sticky top-0 z-20 bg-[#121212]/95 backdrop-blur-xl py-4 -mx-8 px-8 border-b border-white/5">
                            <h2 className="text-2xl font-bold text-white">Popular</h2>
                            {isManager && (
                                <button
                                    onClick={() => setIsSongModalOpen(true)}
                                    className="text-white/70 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-2 hover:scale-105 transform duration-200"
                                >
                                    <span className="bg-white/10 p-2 rounded-full"><Music size={16} /></span>
                                    Upload Song
                                </button>
                            )}
                        </div>

                        {artist.songs.length === 0 ? (
                            <div className="bg-gradient-to-r from-[#1e1e1e] to-[#252525] rounded-xl p-12 text-center border border-white/5 shadow-2xl">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Music size={40} className="text-white/20" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Start your discography</h3>
                                <p className="text-[#a7a7a7] mb-8 max-w-md mx-auto">Upload your first track to get started with your artist profile on Kita Music.</p>
                                {isManager && (
                                    <button
                                        onClick={() => setIsSongModalOpen(true)}
                                        className="bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform shadow-lg shadow-white/10"
                                    >
                                        Upload First Song
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col w-full">
                                {artist.songs.map((song, index) => (
                                    <div
                                        key={song.id}
                                        className="group flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                                    >
                                        <div className="w-8 text-center text-[#a7a7a7] font-medium group-hover:hidden">{index + 1}</div>
                                        <div className="w-8 hidden group-hover:flex justify-center items-center text-white">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        </div>

                                        <div className="w-12 h-12 relative flex-shrink-0 mr-4 shadow-lg group-hover:shadow-xl transition-all">
                                            <img
                                                src={song.coverUrl || "/assets/images/default-album.svg"}
                                                alt={song.title}
                                                className="w-full h-full object-cover rounded"
                                                onError={(e) => {
                                                    e.currentTarget.src = "/assets/images/default-album.svg";
                                                }}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="text-white font-semibold truncate text-[16px] mb-0.5 group-hover:text-green-400 transition-colors">{song.title}</div>
                                            <div className="text-[#a7a7a7] text-xs font-medium">
                                                {(songPlayCounts[song.id] ?? 0).toLocaleString('en-US')} plays
                                            </div>
                                        </div>

                                        <div className="hidden sm:block text-[#a7a7a7] font-medium text-sm mr-8">
                                            {/* Date added placeholder */}
                                            Dec 19, 2025
                                        </div>

                                        <div className="text-[#a7a7a7] font-mono text-sm group-hover:text-white w-12 text-right">
                                            {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Discography (Albums) Section */}
                    <section>
                        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                            <h2 className="text-2xl font-bold text-white">Discography</h2>
                            {isManager && (
                                <button
                                    onClick={() => setIsAlbumModalOpen(true)}
                                    className="text-white/70 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-2 hover:scale-105 transform duration-200"
                                >
                                    <span className="bg-white/10 p-2 rounded-full"><Plus size={16} /></span>
                                    Add Album
                                </button>
                            )}
                        </div>

                        {artist.albums.length === 0 ? (
                            <div className="text-[#a7a7a7] bg-[#1a1a1a] p-8 rounded-lg border border-dashed border-[#333] flex flex-col items-center justify-center gap-4">
                                <p>No albums released yet.</p>
                                {isManager && (
                                    <button
                                        onClick={() => setIsAlbumModalOpen(true)}
                                        className="text-white font-bold hover:underline"
                                    >
                                        Create your first album
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {artist.albums.map(album => (
                                    <div
                                        key={album.id}
                                        onClick={() => navigate(`/album/${album.id}`)}
                                        className="bg-[#181818] p-4 rounded-xl hover:bg-[#282828] transition-all duration-300 group cursor-pointer hover:shadow-2xl hover:-translate-y-2 border border-transparent hover:border-white/5"
                                    >
                                        <div className="aspect-square bg-[#333] mb-4 rounded-lg overflow-hidden relative shadow-lg group-hover:shadow-2xl">
                                            <img
                                                src={album.imageUrl || "/assets/images/default-album.svg"}
                                                alt={album.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                onError={(e) => {
                                                    e.currentTarget.src = "/assets/images/default-album.svg";
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                    <svg className="w-6 h-6 fill-black pl-1" viewBox="0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="text-white font-bold truncate mb-1 group-hover:text-green-400 transition-colors">{album.name}</h3>
                                        <div className="flex items-center text-[#a7a7a7] text-sm font-medium">
                                            <span className="capitalize">Album</span>
                                            <span className="mx-1">•</span>
                                            <span>{album.songCount} Songs</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <CreateAlbumModal
                isOpen={isAlbumModalOpen}
                onClose={() => setIsAlbumModalOpen(false)}
                artistId={id || ''}
                onAlbumCreated={fetchArtistDetails}
            />

            {isSongModalOpen && (
                <UploadArtistSongModal
                    artistId={id || ''}
                    artistName={artist.name}
                    albums={artist.albums}
                    onClose={() => setIsSongModalOpen(false)}
                    onSuccess={fetchArtistDetails}
                />
            )}
        </div>
    );
};

export default ArtistDetailsPage;
