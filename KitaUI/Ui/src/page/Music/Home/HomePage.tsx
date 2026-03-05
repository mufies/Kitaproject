import React, { useState, useEffect, useCallback } from "react";
import { Plus, Upload, X, Download, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PlaylistList from "../../../components/Music/HomePage/PlaylistList";
import HomeArtistList from "../../../components/Music/HomePage/HomeArtistList";
import HomeLikedAlbumList from "../../../components/Music/HomePage/HomeLikedAlbumList";
import { createPlaylist, uploadSong, importPlaylist } from "../../../utils/musicAPI";
import { searchSongs, getRecentlyPlayedSongs, type Song } from "../../../services/musicService";
import { artistService, type Artist } from "../../../services/artistService";


const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'playlists' | 'artists' | 'albums'>('playlists');

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<{ songs: Song[]; artists: Artist[] }>({ songs: [], artists: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);

    // Create Playlist state
    const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
    const [playlistName, setPlaylistName] = useState("");
    const [playlistDescription, setPlaylistDescription] = useState("");
    const [playlistIsPublic, setPlaylistIsPublic] = useState(true);
    const [playlistCoverFile, setPlaylistCoverFile] = useState<File | null>(null);
    const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

    // Upload Song state
    const [isUploadSongOpen, setIsUploadSongOpen] = useState(false);
    const [songTitle, setSongTitle] = useState("");
    const [songFile, setSongFile] = useState<File | null>(null);
    const [songCoverFile, setSongCoverFile] = useState<File | null>(null);
    const [isUploadingSong, setIsUploadingSong] = useState(false);

    // Import Playlist state
    const [isImportPlaylistOpen, setIsImportPlaylistOpen] = useState(false);
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [isImportingPlaylist, setIsImportingPlaylist] = useState(false);

    // Sidebar data
    const [followedArtists, setFollowedArtists] = useState<Artist[]>([]);
    const [recentSongs, setRecentSongs] = useState<Song[]>([]);

    // Fetch sidebar data
    useEffect(() => {
        const fetchSidebarData = async () => {
            try {
                const [artists, songs] = await Promise.all([
                    artistService.getFollowedArtists(),
                    getRecentlyPlayedSongs(5)
                ]);
                setFollowedArtists(artists.slice(0, 5));
                setRecentSongs(songs);
            } catch (error) {
            }
        };
        fetchSidebarData();
    }, []);

    // Debounced search
    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults({ songs: [], artists: [] });
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        setShowSearchResults(true);
        try {
            const [songs, artists] = await Promise.all([
                searchSongs(query),
                artistService.searchArtists(query)
            ]);
            setSearchResults({ songs: songs.slice(0, 5), artists: artists.slice(0, 5) });
        } catch (error) {
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            performSearch(searchQuery);
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, performSearch]);

    // Format duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handlers
    const handleCreatePlaylist = async () => {
        if (!playlistName.trim()) return;

        setIsCreatingPlaylist(true);
        try {
            await createPlaylist(
                { name: playlistName, description: playlistDescription, isPublic: playlistIsPublic },
                playlistCoverFile || undefined
            );
            setPlaylistName("");
            setPlaylistDescription("");
            setPlaylistIsPublic(true);
            setPlaylistCoverFile(null);
            setIsCreatePlaylistOpen(false);
            window.location.reload();
        } catch (error) {
        } finally {
            setIsCreatingPlaylist(false);
        }
    };

    const handleUploadSong = async () => {
        if (!songTitle.trim() || !songFile) return;

        setIsUploadingSong(true);
        try {
            await uploadSong(
                { title: songTitle, artist: '' },
                songFile,
                songCoverFile || undefined
            );
            // Reset form
            setSongTitle("");
            setSongFile(null);
            setSongCoverFile(null);
            setIsUploadSongOpen(false);
            alert("Song uploaded successfully!");
        } catch (error) {
            console.error("Error uploading song:", error);
            alert("Failed to upload song");
        } finally {
            setIsUploadingSong(false);
        }
    };

    const handleImportPlaylist = async () => {
        if (!playlistUrl.trim()) return;

        setIsImportingPlaylist(true);
        try {
            await importPlaylist(playlistUrl);
            // Reset form
            setPlaylistUrl("");
            setIsImportPlaylistOpen(false);
            alert("Playlist import started! This may take a while depending on the playlist size.");
            window.location.reload();
        } catch (error) {
            console.error("Error importing playlist:", error);
            alert("Failed to import playlist. Please check the URL and try again.");
        } finally {
            setIsImportingPlaylist(false);
        }
    };

    return (
        <div className="h-screen bg-white text-black flex flex-col font-sans selection:bg-black selection:text-white relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}>
            </div>

            {/* Main content */}
            <div className="flex flex-1 overflow-hidden pt-4 relative z-10">
                {/* Center content */}
                <main className="flex-1 px-3 py-3 overflow-y-auto ml-4">
                    <div className="mb-6 relative z-40 max-w-xl mx-auto">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery && setShowSearchResults(true)}
                                placeholder="ACCESS ARCHIVE..."
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-black rounded-none text-black placeholder-gray-400 text-sm font-black uppercase tracking-widest focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => { setSearchQuery(""); setShowSearchResults(false); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                        {/* Search Results Dropdown */}
                        {showSearchResults && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden max-h-[60vh] overflow-y-auto z-50">
                                {isSearching ? (
                                    <div className="p-8 text-center text-black font-bold uppercase tracking-widest text-xs">
                                        <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-3"></div>
                                        SCANNING...
                                    </div>
                                ) : searchResults.songs.length === 0 && searchResults.artists.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest text-xs border-dashed border-2 border-gray-300 m-4">
                                        NO MATCH FOUND FOR "{searchQuery}"
                                    </div>
                                ) : (
                                    <>
                                        {/* Songs Section */}
                                        {searchResults.songs.length > 0 && (
                                            <div className="p-4 relative">
                                                <div className="absolute top-0 right-0 bg-black text-white text-[10px] uppercase font-black px-2 py-0.5 tracking-widest">AUDIO_FILES</div>
                                                <h3 className="text-xs font-black uppercase text-black mb-3 tracking-[0.2em] border-b-2 border-black pb-1 inline-block">Songs</h3>
                                                <div className="space-y-2 mt-2">
                                                    {searchResults.songs.map((song) => (
                                                        <div
                                                            key={song.id}
                                                            className="flex items-center gap-3 p-2 border-2 border-transparent hover:border-black cursor-pointer transition-all group bg-gray-50 hover:bg-white relative overflow-hidden hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                                            onClick={() => {
                                                                setShowSearchResults(false);
                                                                navigate(`/music/song/${song.id}`);
                                                            }}
                                                        >
                                                            <div className="w-10 h-10 bg-gray-200 rounded-none overflow-hidden flex-shrink-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                                                                <img
                                                                    src={song.coverUrl || "/assets/images/default-album.svg"}
                                                                    alt={song.title}
                                                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                                                                    onError={(e) => { e.currentTarget.src = "/assets/images/default-album.svg"; }}
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0 ml-1">
                                                                <p className="text-black font-black truncate text-sm uppercase tracking-tight">{song.title}</p>
                                                                <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest truncate">{song.artist || "UNKNOWN ARTIST"}</p>
                                                            </div>
                                                            <span className="text-gray-400 font-black text-xs px-2 py-1 bg-gray-100 border border-gray-200">{formatDuration(song.duration)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Artists Section */}
                                        {searchResults.artists.length > 0 && (
                                            <div className="p-4 border-t-4 border-black relative">
                                                <div className="absolute top-0 right-0 bg-black text-white text-[10px] uppercase font-black px-2 py-0.5 tracking-widest mt-0">ENTITIES</div>
                                                <h3 className="text-xs font-black uppercase text-black mb-3 tracking-[0.2em] border-b-2 border-black pb-1 inline-block">Artists</h3>
                                                <div className="space-y-2 mt-2">
                                                    {searchResults.artists.map((artist) => (
                                                        <div
                                                            key={artist.id}
                                                            className="flex items-center gap-3 p-2 border-2 border-transparent hover:border-black cursor-pointer transition-all group bg-gray-50 hover:bg-white relative overflow-hidden hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                                            onClick={() => {
                                                                setShowSearchResults(false);
                                                                navigate(`/artist/${artist.id}`);
                                                            }}
                                                        >
                                                            <div className="w-10 h-10 bg-gray-200 rounded-none overflow-hidden flex-shrink-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                                                                <img
                                                                    src={artist.imageUrl || "/assets/images/default-avatar.svg"}
                                                                    alt={artist.name}
                                                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                                                                    onError={(e) => { e.currentTarget.src = "/assets/images/default-avatar.svg"; }}
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0 ml-1">
                                                                <p className="text-black font-black truncate text-sm uppercase tracking-tight">{artist.name}</p>
                                                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">OBJ_ID: {artist.id.substring(0, 6)} • {artist.followedByCount?.toLocaleString() || 0} LINKED</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    {showSearchResults && (<div className="fixed inset-0 z-30 bg-black/5 backdrop-blur-sm" onClick={() => setShowSearchResults(false)} />)}

                    {/* top cards */}
                    {/* <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-[#221320] rounded-2xl p-4 flex flex-col justify-between">
                            <div className="text-xs text-white/60 mb-1">
                                86 tracks | 4 hours 37 minutes
                            </div>
                            <h2 className="font-semibold mb-3">Playlist of the day</h2>
                            <div className="w-32 h-32 bg-white/10 rounded-xl" />
                        </div>

                        <div className="bg-[#221320] rounded-2xl overflow-hidden flex flex-col">
                            <div className="p-4">
                                <div className="text-xs text-white/60 mb-1">
                                    Brand of Sacrifice | Aug 2023
                                </div>
                                <h2 className="font-semibold">Between Death and Dreams</h2>
                            </div>
                            <div className="flex-1 bg-black/40 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full border border-white/60" />
                            </div>
                            <div className="p-3 text-[11px] text-white/60 flex justify-between">
                                <span>00:12 / 4:12</span>
                                <span>•••</span>
                            </div>
                        </div>
                    </div> */}

                    {/* Tabs + playlists */}
                    <div className="mb-8 flex items-center justify-between border-b-4 border-black pb-2">
                        <div className="flex items-center gap-6 text-sm font-black uppercase tracking-widest">
                            <button
                                onClick={() => setActiveTab('playlists')}
                                className={`${activeTab === 'playlists' ? 'text-black border-b-4 border-black -mb-[18px]' : 'text-gray-400 hover:text-black'} pb-3 transition-colors cursor-pointer relative`}
                            >
                                Playlists
                                {activeTab === 'playlists' && <span className="absolute -top-2 -right-3 w-2 h-2 bg-black"></span>}
                            </button>
                            <button
                                onClick={() => setActiveTab('artists')}
                                className={`${activeTab === 'artists' ? 'text-black border-b-4 border-black -mb-[18px]' : 'text-gray-400 hover:text-black'} pb-3 transition-colors cursor-pointer relative`}
                            >
                                Artists
                                {activeTab === 'artists' && <span className="absolute -top-2 -right-3 w-2 h-2 bg-black"></span>}
                            </button>
                            <button
                                onClick={() => setActiveTab('albums')}
                                className={`${activeTab === 'albums' ? 'text-black border-b-4 border-black -mb-[18px]' : 'text-gray-400 hover:text-black'} pb-3 transition-colors cursor-pointer relative`}
                            >
                                Albums
                                {activeTab === 'albums' && <span className="absolute -top-2 -right-3 w-2 h-2 bg-black"></span>}
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsCreatePlaylistOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-black font-black text-xs uppercase tracking-widest border-2 border-black transition-all hover:bg-black hover:text-white cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                            >
                                <Plus size={16} strokeWidth={3} />
                                INIT PLAYLIST
                            </button>
                            <button
                                onClick={() => setIsImportPlaylistOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-black font-black text-xs uppercase tracking-widest border-2 border-black transition-all hover:bg-black hover:text-white cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                            >
                                <Download size={16} strokeWidth={3} />
                                IMPORT DATA
                            </button>
                            <button
                                onClick={() => setIsUploadSongOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-black text-white font-black text-xs uppercase tracking-widest border-2 border-black transition-all hover:bg-gray-800 cursor-pointer shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 ml-2"
                            >
                                <Upload size={16} strokeWidth={3} />
                                UPLOAD_FILE
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="min-h-[200px]">
                        {activeTab === 'playlists' ? (
                            <PlaylistList />
                        ) : activeTab === 'artists' ? (
                            <HomeArtistList />
                        ) : (
                            <HomeLikedAlbumList />
                        )}
                    </div>

                    {/* Promo + stats
                    <div className="grid grid-cols-[2fr,1fr] gap-4">
                        <div className="bg-[#2b1725] rounded-2xl p-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold mb-1">
                                    Check the power of Suno
                                </h3>
                                <p className="text-xs text-white/60 mb-3">
                                    Enjoy uninterrupted music streaming with our premium subscription.
                                </p>
                                <button className="px-4 py-1.5 rounded-full bg-[#ff7a3c] text-black text-xs">
                                    Upgrade
                                </button>
                            </div>
                            <div className="w-24 h-24 bg-white/10 rounded-2xl" />
                        </div>

                        <div className="bg-[#1a141a] rounded-2xl p-4 text-xs">
                            <div className="flex items-center justify-between mb-3">
                                <span className="uppercase tracking-wide text-white/40">
                                    Statistics
                                </span>
                                <button className="text-white/40">Explore</button>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Likes</span>
                                    <span className="font-semibold">247</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tracks</span>
                                    <span className="font-semibold">362</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Streams</span>
                                    <span className="font-semibold">29</span>
                                </div>
                            </div>
                        </div>
                    </div> */}
                </main>

                {/* Right sidebar */}
                <aside className="w-80 bg-white border-l-4 border-black px-6 py-8 flex flex-col gap-8 overflow-y-auto relative z-10 shadow-[-8px_0px_0px_0px_rgba(0,0,0,0.05)]">
                    <section>
                        <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2 relative">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black bg-white pr-2">
                                RECENTS_LOG
                            </h3>
                            <div className="w-2 h-2 bg-black animate-pulse"></div>
                        </div>
                        <div className="space-y-3 mt-4">
                            {recentSongs.length > 0 ? (
                                recentSongs.map((song) => (
                                    <div
                                        key={song.id}
                                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 border-2 border-transparent hover:border-black p-2 transition-all group bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1"
                                        onClick={() => navigate(`/music/song/${song.id}`)}
                                    >
                                        <div className="w-10 h-10 bg-gray-200 rounded-none overflow-hidden border-2 border-black">
                                            <img
                                                src={song.coverUrl || "/assets/images/default-album.svg"}
                                                alt={song.title}
                                                className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
                                                onError={(e) => { e.currentTarget.src = "/assets/images/default-album.svg"; }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-black text-black uppercase tracking-tight truncate group-hover:underline">{song.title}</div>
                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">
                                                {song.artist || "UNKNOWN"}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 border-2 border-dashed border-gray-300 bg-gray-50 text-center">
                                    <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">No local logs found</span>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="mb-0">
                        <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black">
                                LINKED_ENTITIES
                            </h3>
                        </div>
                        <div className="space-y-3 mt-4">
                            {followedArtists.length > 0 ? (
                                followedArtists.map((artist) => (
                                    <div
                                        key={artist.id}
                                        onClick={() => navigate(`/artist/${artist.id}`)}
                                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 border-2 border-transparent hover:border-black p-2 transition-all group bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1"
                                    >
                                        <div className="w-10 h-10 bg-gray-200 rounded-none overflow-hidden border-2 border-black">
                                            <img
                                                src={artist.imageUrl || "/assets/images/default-avatar.svg"}
                                                alt={artist.name}
                                                className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
                                                onError={(e) => { e.currentTarget.src = "/assets/images/default-avatar.svg"; }}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-black text-black uppercase truncate group-hover:underline">{artist.name}</div>
                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                                                [{(artist.followedByCount || 0).toString().padStart(3, '0')}] LINKS
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 border-2 border-dashed border-gray-300 bg-gray-50 text-center">
                                    <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">No connections active</span>
                                </div>
                            )}
                        </div>
                    </section>
                </aside>
            </div>

            {/* Create Playlist Modal */}
            {isCreatePlaylistOpen && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsCreatePlaylistOpen(false)}>
                    <div className="bg-white border-4 border-black w-full max-w-md shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative" onClick={(e) => e.stopPropagation()}>
                        <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest">FORM_01</div>
                        <div className="flex justify-between items-center p-6 border-b-4 border-black bg-gray-50">
                            <h2 className="text-2xl font-black text-black uppercase tracking-tighter">INIT_PLAYLIST</h2>
                            <button onClick={() => setIsCreatePlaylistOpen(false)} className="p-2 border-2 border-transparent hover:border-black transition-colors hover:bg-black hover:text-white">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-black text-black mb-2 uppercase tracking-widest">Target Name *</label>
                                <input
                                    type="text"
                                    value={playlistName}
                                    onChange={(e) => setPlaylistName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-black text-black font-bold focus:outline-none rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow placeholder-gray-400 uppercase"
                                    placeholder="ENTER DESIGNATION..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-black mb-2 uppercase tracking-widest">File Details (Optional)</label>
                                <textarea
                                    value={playlistDescription}
                                    onChange={(e) => setPlaylistDescription(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-black text-black font-bold focus:outline-none rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow placeholder-gray-400 uppercase resize-none"
                                    placeholder="ENTER PARAMETERS..."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-black mb-2 uppercase tracking-widest">Visual Cover (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPlaylistCoverFile(e.target.files?.[0] || null)}
                                    className="w-full bg-gray-50 border-2 border-black text-black font-bold text-xs file:mr-4 file:py-3 file:px-4 file:border-0 file:border-r-2 file:border-black file:text-xs file:font-black file:bg-black file:text-white file:uppercase file:tracking-widest file:cursor-pointer hover:file:bg-gray-800"
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-gray-50 border-2 border-black p-4">
                                <input
                                    type="checkbox"
                                    id="playlistIsPublic"
                                    checked={playlistIsPublic}
                                    onChange={(e) => setPlaylistIsPublic(e.target.checked)}
                                    className="w-5 h-5 rounded-none border-2 border-black text-black focus:ring-black accent-black cursor-pointer"
                                />
                                <label htmlFor="playlistIsPublic" className="text-xs font-black text-black uppercase tracking-widest cursor-pointer">
                                    Broadcast to Global Network
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 p-6 border-t-4 border-black bg-gray-50">
                            <button
                                onClick={() => setIsCreatePlaylistOpen(false)}
                                className="px-6 py-3 font-black text-black uppercase tracking-widest text-xs border-2 border-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                                disabled={isCreatingPlaylist}
                            >
                                ABORT
                            </button>
                            <button
                                onClick={handleCreatePlaylist}
                                disabled={!playlistName.trim() || isCreatingPlaylist}
                                className="px-6 py-3 bg-black text-white font-black uppercase tracking-widest text-xs border-2 border-black hover:bg-gray-800 hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] hover:shadow-none"
                            >
                                {isCreatingPlaylist ? "EXECUTING..." : "COMMIT CREATION"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Song Modal */}
            {isUploadSongOpen && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsUploadSongOpen(false)}>
                    <div className="bg-white border-4 border-black w-full max-w-md shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative" onClick={(e) => e.stopPropagation()}>
                        <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest">FORM_02</div>
                        <div className="flex justify-between items-center p-6 border-b-4 border-black bg-gray-50">
                            <h2 className="text-2xl font-black text-black uppercase tracking-tighter">DATA_UPLOAD</h2>
                            <button onClick={() => setIsUploadSongOpen(false)} className="p-2 border-2 border-transparent hover:border-black transition-colors hover:bg-black hover:text-white">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-black text-black mb-2 uppercase tracking-widest">Object Title *</label>
                                <input
                                    type="text"
                                    value={songTitle}
                                    onChange={(e) => setSongTitle(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-black text-black font-bold focus:outline-none rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow placeholder-gray-400 uppercase"
                                    placeholder="ENTER TITLE..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-black mb-2 uppercase tracking-widest">Audio Data *</label>
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) => setSongFile(e.target.files?.[0] || null)}
                                    className="w-full bg-gray-50 border-2 border-black text-black font-bold text-xs file:mr-4 file:py-3 file:px-4 file:border-0 file:border-r-2 file:border-black file:text-xs file:font-black file:bg-black file:text-white file:uppercase file:tracking-widest file:cursor-pointer hover:file:bg-gray-800"
                                />
                                {songFile && (
                                    <p className="mt-2 text-xs font-bold text-black uppercase tracking-widest p-2 bg-gray-100 border border-gray-300">Target: {songFile.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-black text-black mb-2 uppercase tracking-widest">Visual Cover (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setSongCoverFile(e.target.files?.[0] || null)}
                                    className="w-full bg-gray-50 border-2 border-black text-black font-bold text-xs file:mr-4 file:py-3 file:px-4 file:border-0 file:border-r-2 file:border-black file:text-xs file:font-black file:bg-black file:text-white file:uppercase file:tracking-widest file:cursor-pointer hover:file:bg-gray-800"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 p-6 border-t-4 border-black bg-gray-50">
                            <button
                                onClick={() => setIsUploadSongOpen(false)}
                                className="px-6 py-3 font-black text-black uppercase tracking-widest text-xs border-2 border-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                                disabled={isUploadingSong}
                            >
                                ABORT
                            </button>
                            <button
                                onClick={handleUploadSong}
                                disabled={!songTitle.trim() || !songFile || isUploadingSong}
                                className="px-6 py-3 bg-black text-white font-black uppercase tracking-widest text-xs border-2 border-black hover:bg-gray-800 hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] hover:shadow-none"
                            >
                                {isUploadingSong ? "TRANSMITTING..." : "EXECUTE UPLOAD"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Playlist Modal */}
            {isImportPlaylistOpen && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsImportPlaylistOpen(false)}>
                    <div className="bg-white border-4 border-black w-full max-w-md shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative" onClick={(e) => e.stopPropagation()}>
                        <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest">FORM_03</div>
                        <div className="flex justify-between items-center p-6 border-b-4 border-black bg-gray-50">
                            <h2 className="text-2xl font-black text-black uppercase tracking-tighter">EXTERNAL_PULL</h2>
                            <button onClick={() => setIsImportPlaylistOpen(false)} className="p-2 border-2 border-transparent hover:border-black transition-colors hover:bg-black hover:text-white">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-black text-black mb-2 uppercase tracking-widest">Source Target *</label>
                                <input
                                    type="text"
                                    value={playlistUrl}
                                    onChange={(e) => setPlaylistUrl(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-black text-black font-bold focus:outline-none rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow placeholder-gray-400"
                                    placeholder="Enter ext. link (Spotify/YouTube)"
                                />
                            </div>

                            <div className="bg-gray-50 border-2 border-black p-4">
                                <h3 className="text-xs font-black text-black uppercase tracking-widest mb-3 border-b-2 border-black pb-1 inline-block">Valid Sources:</h3>
                                <ul className="text-[10px] font-bold text-gray-600 uppercase tracking-widest space-y-2">
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-black rounded-full"></div> Spotify: https://open.spotify.com/playlist/...</li>
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-black rounded-full"></div> YouTube: https://youtube.com/playlist?list=...</li>
                                </ul>
                            </div>

                            <div className="bg-gray-100 border-l-4 border-black p-4">
                                <p className="text-xs font-bold text-black uppercase tracking-widest leading-relaxed">
                                    <span className="font-black">WARNING:</span> Operation duration varies based on source volume. Data parsing requires active connection.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 p-6 border-t-4 border-black bg-gray-50">
                            <button
                                onClick={() => setIsImportPlaylistOpen(false)}
                                className="px-6 py-3 font-black text-black uppercase tracking-widest text-xs border-2 border-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                                disabled={isImportingPlaylist}
                            >
                                ABORT
                            </button>
                            <button
                                onClick={handleImportPlaylist}
                                disabled={!playlistUrl.trim() || isImportingPlaylist}
                                className="px-6 py-3 bg-black text-white font-black uppercase tracking-widest text-xs border-2 border-black hover:bg-gray-800 hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] hover:shadow-none"
                            >
                                <Download size={14} strokeWidth={3} />
                                {isImportingPlaylist ? "PULLING..." : "PULL DATA"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default HomePage;
