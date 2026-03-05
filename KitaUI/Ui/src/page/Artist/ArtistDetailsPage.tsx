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
        return (
            <div className="min-h-screen bg-white text-black flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
                </div>
                <div className="text-center relative z-10">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-black font-black uppercase tracking-[0.2em] text-xs">Accessing Data...</p>
                </div>
            </div>
        );
    }

    if (!artist) return null;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-white text-black font-sans selection:bg-black selection:text-white relative">
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}>
            </div>

            {/* Hero Section */}
            <div className="relative w-full border-b-4 border-black bg-gray-50 z-10 p-8 pt-20 flex flex-col md:flex-row items-end gap-8 mb-8 overflow-hidden">
                <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-20">AUTHOR_ENTITY</div>
                <div className="absolute -left-20 -top-20 w-64 h-64 bg-black opacity-5 rotate-45 pointer-events-none"></div>

                {/* Back Button */}
                <div className="absolute top-6 left-8 z-20">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-black hover:bg-black hover:text-white transition-colors bg-white border-2 border-black px-4 py-2 uppercase tracking-widest text-xs font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                    >
                        <span className="font-black">← RETURN</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-col md:flex-row items-end gap-8 w-full z-10 block w-full mt-4">
                    {/* Avatar with Upload Overlay */}
                    <div className="relative group shrink-0">
                        <div className="w-[180px] h-[180px] sm:w-[232px] sm:h-[232px] rounded-none overflow-hidden bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all">
                            <img
                                src={artist.imageUrl || "/assets/images/default-avatar.svg"}
                                alt={artist.name}
                                className={`w-full h-full object-cover transition-all duration-500 ${!isManager ? 'grayscale hover:grayscale-0' : 'group-hover:grayscale'}`}
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = "/assets/images/default-avatar.svg";
                                }}
                            />
                        </div>
                        {isManager && (
                            <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 opacity-0 group-hover:opacity-100 rounded-none border-4 border-black border-dashed m-1 cursor-pointer transition-all duration-300">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                />
                                <Upload size={32} className="text-white mb-2" strokeWidth={2} />
                                <span className="text-white font-black text-xs uppercase tracking-widest">UPDATE_VISUAL</span>
                            </label>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 mb-2 w-full">
                        {/* Verified Badge */}
                        <div className="flex items-center gap-2 mb-4 mt-2 md:mt-0">
                            <span className="flex items-center gap-2 bg-black text-white px-3 py-1 border-2 border-black text-[10px] font-black tracking-[0.2em] uppercase shadow-[2px_2px_0px_0px_rgba(150,150,150,1)]">
                                <svg className="fill-current w-3 h-3" viewBox="0 0 24 24">
                                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"></path>
                                </svg>
                                AUTHORIZED_ENTITY
                            </span>
                        </div>

                        {/* Artist Name */}
                        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-black mb-6 uppercase tracking-tighter leading-none break-words line-clamp-2">
                            {artist.name}
                        </h1>

                        <div className="flex flex-col gap-4">
                            <p className="text-gray-700 text-sm sm:text-base font-bold uppercase tracking-wide line-clamp-2 max-w-3xl border-l-4 border-black pl-4">
                                {artist.description || "NO DATA"}
                            </p>

                            <div className="flex items-center gap-3 text-black text-[10px] font-black uppercase tracking-widest flex-wrap mt-2">
                                <span className="bg-gray-200 px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    FOLLOWERS: {artist.followedByCount?.toLocaleString() || 0}
                                </span>
                                <span className="w-1.5 h-1.5 bg-black rounded-none mx-1"></span>
                                <span className="bg-white px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    TRACKS: {artist.songs.length}
                                </span>
                                <span className="w-1.5 h-1.5 bg-black rounded-none mx-1"></span>
                                <span className="bg-gray-200 px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    ALBUMS: {artist.albums.length}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 mt-4">
                                {!isManager && (
                                    <button
                                        onClick={handleFollowToggle}
                                        disabled={isFollowLoading}
                                        className={`flex items-center gap-2 px-6 py-3 font-black text-xs transition-all uppercase tracking-widest border-2 border-black ${isFollowing
                                            ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] translate-x-1 translate-y-1'
                                            : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:shadow-[4px_4px_0px_0px_rgba(150,150,150,1)]'
                                            }`}
                                    >
                                        <Heart size={16} className={isFollowing ? 'fill-current' : ''} strokeWidth={isFollowing ? 2 : 3} />
                                        {isFollowLoading ? 'PROCESSING...' : isFollowing ? 'TRACKING' : 'TRACK ENTITY'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Background */}
            <div className="min-h-[500px] relative z-10">
                <div className="p-4 sm:p-8 pb-32 max-w-[1400px] mx-auto">

                    {/* Popular Songs Section */}
                    <section className="mb-12 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
                        <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-10">TOP_TRACKS</div>
                        <div className="flex items-center justify-between p-6 border-b-4 border-black bg-gray-50">
                            <h2 className="text-2xl font-black text-black tracking-tight uppercase">POPULAR</h2>
                            {isManager && (
                                <button
                                    onClick={() => setIsSongModalOpen(true)}
                                    className="text-black hover:bg-black hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                                >
                                    <Plus size={14} strokeWidth={3} />
                                    UPLOAD_TRACK
                                </button>
                            )}
                        </div>

                        {artist.songs.length === 0 ? (
                            <div className="p-16 text-center bg-gray-50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-200 rotate-45 translate-x-16 -translate-y-16 opacity-50"></div>
                                <div className="w-20 h-20 bg-white border-4 border-black flex items-center justify-center mx-auto mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                    <Music size={40} className="text-black" strokeWidth={2} />
                                </div>
                                <h3 className="text-2xl font-black text-black mb-2 uppercase tracking-tight">NO LOGS FOUND</h3>
                                <p className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-8 max-w-md mx-auto">Upload initial data to establish entity presence.</p>
                                {isManager && (
                                    <button
                                        onClick={() => setIsSongModalOpen(true)}
                                        className="bg-black text-white font-black uppercase tracking-widest text-sm py-3 px-8 border-2 border-black hover:bg-white hover:text-black transition-colors shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative z-10"
                                    >
                                        INITIALIZE UPLOAD
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="w-full">
                                {/* Header Row */}
                                <div className="grid grid-cols-[16px_1fr_60px] md:grid-cols-[16px_3fr_120px_60px] gap-4 px-6 py-4 border-b-4 border-black text-black text-[10px] font-black uppercase tracking-widest bg-gray-100 sticky top-0 z-10">
                                    <div className="text-center">#</div>
                                    <div>TITLE</div>
                                    <div className="hidden md:block text-right">TIMESTAMP</div>
                                    <div className="text-right">DUR</div>
                                </div>
                                <div className="divide-y-2 divide-gray-100">
                                    {artist.songs.slice(0, 5).map((song, index) => (
                                        <div
                                            key={song.id}
                                            onClick={() => navigate(`/music/song/${song.id}`)}
                                            className="grid grid-cols-[16px_1fr_60px] md:grid-cols-[16px_3fr_120px_60px] gap-4 px-6 py-4 hover:bg-gray-100 group transition-colors items-center cursor-pointer border-l-4 border-transparent hover:border-black"
                                        >
                                            <div className="text-center text-gray-500 font-bold w-4 flex justify-center text-xs">
                                                <span className="group-hover:hidden">{String(index + 1).padStart(2, '0')}</span>
                                                <span className="hidden group-hover:block text-black">
                                                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                </span>
                                            </div>

                                            <div className="flex items-center min-w-0 pr-4">
                                                <div className="w-10 h-10 relative flex-shrink-0 mr-4 border-2 border-black bg-gray-200">
                                                    <img
                                                        src={song.coverUrl || "/assets/images/default-album.svg"}
                                                        alt={song.title}
                                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                                                        onError={(e) => {
                                                            e.currentTarget.src = "/assets/images/default-album.svg";
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-black font-black uppercase text-sm truncate group-hover:underline transition-all">{song.title}</div>
                                                    <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                                        PLAYS: {(songPlayCounts[song.id] ?? 0).toLocaleString('en-US')}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="hidden md:block text-gray-400 font-bold text-[10px] uppercase text-right tracking-widest">
                                                [DATA_ENTRY]
                                            </div>

                                            <div className="text-black font-black text-xs text-right">
                                                {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {artist.songs.length > 5 && (
                                    <div className="p-4 border-t-4 border-black bg-gray-50 text-center">
                                        <button className="text-black font-black uppercase text-xs tracking-widest hover:underline hover:bg-black hover:text-white px-4 py-2 transition-colors border-2 border-transparent">
                                            VIEW_ALL_TRACKS ({artist.songs.length})
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Discography (Albums) Section */}
                    <section className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
                        <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest z-10">DISCOGRAPHY</div>
                        <div className="flex items-center justify-between p-6 border-b-4 border-black bg-gray-50">
                            <h2 className="text-2xl font-black text-black tracking-tight uppercase">ALBUMS</h2>
                            {isManager && (
                                <button
                                    onClick={() => setIsAlbumModalOpen(true)}
                                    className="text-black hover:bg-black hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                                >
                                    <Plus size={14} strokeWidth={3} />
                                    ADD_ALBUM
                                </button>
                            )}
                        </div>

                        {artist.albums.length === 0 ? (
                            <div className="text-gray-500 bg-white p-12 border-b-4 border-black flex flex-col items-center justify-center gap-4 text-center">
                                <p className="font-bold uppercase tracking-widest text-xs">NO COLLECTIONS FOUND.</p>
                                {isManager && (
                                    <button
                                        onClick={() => setIsAlbumModalOpen(true)}
                                        className="text-black font-black uppercase underline hover:bg-black hover:text-white px-2 transition-colors text-sm"
                                    >
                                        INITIALIZE FIRST COLLECTION
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 bg-white">
                                {artist.albums.map(album => (
                                    <div
                                        key={album.id}
                                        onClick={() => navigate(`/album/${album.id}`)}
                                        className="bg-white p-4 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1.5 hover:translate-y-1.5 transition-all group cursor-pointer flex flex-col"
                                    >
                                        <div className="aspect-square bg-gray-200 mb-4 border-2 border-black overflow-hidden relative">
                                            <img
                                                src={album.imageUrl || "/assets/images/default-album.svg"}
                                                alt={album.name}
                                                className="w-full h-full object-cover grayscale transition-transform duration-500 group-hover:scale-110 group-hover:grayscale-0"
                                                onError={(e) => {
                                                    e.currentTarget.src = "/assets/images/default-album.svg";
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                                                <div className="w-12 h-12 bg-white border-2 border-black text-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                    <svg className="w-6 h-6 fill-current pl-1" viewBox="0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="text-black font-black uppercase tracking-tight truncate mb-1 text-sm group-hover:underline">{album.name}</h3>
                                        <div className="flex text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-auto">
                                            <span className="truncate">ALBUM</span>
                                            <span className="mx-1 text-black font-black">/</span>
                                            <span className="truncate">{album.songCount} ITEMS</span>
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
