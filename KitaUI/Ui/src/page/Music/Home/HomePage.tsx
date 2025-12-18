import React, { useState } from "react";
import { Plus, Upload, X, Download } from "lucide-react";
import PlaylistList from "../../../components/Music/HomePage/PlaylistList";
import HomeArtistList from "../../../components/Music/HomePage/HomeArtistList";
import { createPlaylist, uploadSong, importPlaylist } from "../../../utils/musicAPI";

const HomePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'playlists' | 'artists'>('playlists');

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

    // Handlers
    const handleCreatePlaylist = async () => {
        if (!playlistName.trim()) return;

        setIsCreatingPlaylist(true);
        try {
            await createPlaylist(
                { name: playlistName, description: playlistDescription, isPublic: playlistIsPublic },
                playlistCoverFile || undefined
            );
            // Reset form
            setPlaylistName("");
            setPlaylistDescription("");
            setPlaylistIsPublic(true);
            setPlaylistCoverFile(null);
            setIsCreatePlaylistOpen(false);
            // Refresh page or playlist list
            window.location.reload();
        } catch (error) {
            console.error("Error creating playlist:", error);
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
        <div className="h-screen  bg-[#120c12] text-white flex flex-col">


            {/* Main content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left sidebar */}
                <aside className="w-60 bg-[#0d080f] border-r border-white/5 px-4 py-6 text-sm overflow-y-auto">
                    {/* <section className="mb-6">
                        <div className="uppercase text-[10px] text-white/40 mb-3 tracking-wide">
                            Browse
                        </div>
                        <nav className="space-y-2">
                            <button className="flex items-center gap-2 text-white">
                                <span className="w-4 h-4 bg-red-500/60 rounded-sm" />
                                Feed
                            </button>
                            <button className="flex items-center gap-2 text-white/70">
                                <span className="w-4 h-4 bg-white/20 rounded-sm" />
                                Playlists
                            </button>
                            <button className="flex items-center gap-2 text-white/70">
                                <span className="w-4 h-4 bg-white/20 rounded-sm" />
                                Statistics
                            </button>
                        </nav>
                    </section> */}

                    <section className="mb-6">
                        <div className="uppercase text-[10px] text-white/40 mb-3 tracking-wide">
                            Your music
                        </div>
                        <nav className="space-y-2 text-white/70">
                            <button>Favorites</button>
                            <button>Listen later</button>
                            <button>History</button>
                            <button>Podcasts</button>
                        </nav>
                    </section>

                    <section>
                        <div className="uppercase text-[10px] text-white/40 mb-3 tracking-wide">
                            Your playlists
                        </div>
                        <div className="space-y-2 text-white/80">
                            <button>Metalcore</button>
                            <button>Electro</button>
                            <button>Funk</button>
                            <button>Disco</button>
                        </div>
                        <button
                            onClick={() => setIsCreatePlaylistOpen(true)}
                            className="mt-4 text-xs text-[#ff7a3c] hover:text-[#ff8c52] transition-colors flex items-center gap-1"
                        >
                            <Plus size={14} />
                            Create new playlist
                        </button>
                        <button
                            onClick={() => setIsImportPlaylistOpen(true)}
                            className="mt-2 text-xs text-[#ff7a3c] hover:text-[#ff8c52] transition-colors flex items-center gap-1"
                        >
                            <Download size={14} />
                            Import playlist
                        </button>
                    </section>
                </aside>

                {/* Center content */}
                <main className="flex-1 px-3 py-3 overflow-y-auto">
                    {/* top cards */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
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
                                {/* Video / cover placeholder */}
                                <div className="w-16 h-16 rounded-full border border-white/60" />
                            </div>
                            <div className="p-3 text-[11px] text-white/60 flex justify-between">
                                <span>00:12 / 4:12</span>
                                <span>•••</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs + playlists */}
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-6 text-xs uppercase tracking-wide">
                            <button
                                onClick={() => setActiveTab('playlists')}
                                className={`${activeTab === 'playlists' ? 'text-[#ff7a3c] border-b-2 border-[#ff7a3c]' : 'text-white/50 hover:text-white'} pb-1 transition-colors`}
                            >
                                Playlists
                            </button>
                            <button
                                onClick={() => setActiveTab('artists')}
                                className={`${activeTab === 'artists' ? 'text-[#ff7a3c] border-b-2 border-[#ff7a3c]' : 'text-white/50 hover:text-white'} pb-1 transition-colors`}
                            >
                                Artists
                            </button>
                            <button className="text-white/50 cursor-not-allowed opacity-50">Albums</button>
                            <button className="text-white/50 cursor-not-allowed opacity-50">Streams</button>
                        </div>
                        <button
                            onClick={() => setIsUploadSongOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#ff7a3c] hover:bg-[#ff8c52] rounded-xl text-xs font-medium transition-all hover:scale-105"
                        >
                            <Upload size={14} />
                            Upload Song
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="min-h-[200px]">
                        {activeTab === 'playlists' ? (
                            <PlaylistList />
                        ) : (
                            <HomeArtistList />
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
                <aside className="w-80 bg-[#0d080f] border-l border-white/5 px-5 py-6 text-sm overflow-y-auto">
                    <section className="mb-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs uppercase tracking-wide text-white/40">
                                New releases
                            </h3>
                            <button className="text-xs text-white/60">See all</button>
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/10 rounded-lg" />
                                    <div className="flex-1">
                                        <div className="text-sm">Calamity</div>
                                        <div className="text-[11px] text-white/50">
                                            Track | Calamity | 2023
                                        </div>
                                    </div>
                                    <button className="text-[#ff7a3c] text-lg">♥</button>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="mb-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs uppercase tracking-wide text-white/40">
                                Listen more often
                            </h3>
                            <button className="text-xs text-white/60">See all</button>
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white/10 rounded-lg" />
                                    <div className="flex-1">
                                        <div className="text-sm">Track name</div>
                                        <div className="text-[11px] text-white/50">
                                            Artist | Album
                                        </div>
                                    </div>
                                    <button className="text-[#ff7a3c] text-lg">♥</button>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs uppercase tracking-wide text-white/40">
                                Favourite artists
                            </h3>
                            <button className="text-xs text-white/60">See all</button>
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white/10 rounded-full" />
                                    <div>
                                        <div className="text-sm">Artist name</div>
                                        <div className="text-[11px] text-white/50">
                                            125k Subscribers
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </aside>
            </div>

            {/* Create Playlist Modal */}
            {isCreatePlaylistOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setIsCreatePlaylistOpen(false)}>
                    <div className="bg-[#1a141a] rounded-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-[#221a22]">
                            <h2 className="text-lg font-bold text-white">Create Playlist</h2>
                            <button onClick={() => setIsCreatePlaylistOpen(false)} className="p-1.5 hover:bg-[#221a22] rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-2">Playlist Name *</label>
                                <input
                                    type="text"
                                    value={playlistName}
                                    onChange={(e) => setPlaylistName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#ff7a3c] transition-colors text-sm"
                                    placeholder="Enter playlist name"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-2">Description (Optional)</label>
                                <textarea
                                    value={playlistDescription}
                                    onChange={(e) => setPlaylistDescription(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#ff7a3c] transition-colors text-sm resize-none"
                                    placeholder="Enter description"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-2">Cover Image (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPlaylistCoverFile(e.target.files?.[0] || null)}
                                    className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-white/20 rounded-xl text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-[#ff7a3c] file:text-white file:cursor-pointer"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="playlistIsPublic"
                                    checked={playlistIsPublic}
                                    onChange={(e) => setPlaylistIsPublic(e.target.checked)}
                                    className="w-4 h-4 rounded accent-[#ff7a3c]"
                                />
                                <label htmlFor="playlistIsPublic" className="text-sm text-white cursor-pointer">
                                    Make this playlist public
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-5 border-t border-[#221a22] bg-[#0f0f0f]">
                            <button
                                onClick={() => setIsCreatePlaylistOpen(false)}
                                className="px-6 py-2.5 text-xs font-medium text-white/70 hover:text-white transition-colors border border-white/20 rounded-xl hover:bg-[#1a141a]"
                                disabled={isCreatingPlaylist}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreatePlaylist}
                                disabled={!playlistName.trim() || isCreatingPlaylist}
                                className="px-6 py-2.5 bg-[#ff7a3c] hover:bg-[#ff8c52] text-white rounded-xl text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreatingPlaylist ? "Creating..." : "Create Playlist"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Song Modal */}
            {isUploadSongOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setIsUploadSongOpen(false)}>
                    <div className="bg-[#1a141a] rounded-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-[#221a22]">
                            <h2 className="text-lg font-bold text-white">Upload Song</h2>
                            <button onClick={() => setIsUploadSongOpen(false)} className="p-1.5 hover:bg-[#221a22] rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={songTitle}
                                    onChange={(e) => setSongTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#ff7a3c] transition-colors text-sm"
                                    placeholder="Enter song title"
                                />
                            </div>





                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-2">Song File *</label>
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) => setSongFile(e.target.files?.[0] || null)}
                                    className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-white/20 rounded-xl text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-[#ff7a3c] file:text-white file:cursor-pointer"
                                />
                                {songFile && (
                                    <p className="mt-2 text-xs text-white/50">Selected: {songFile.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-2">Cover Image (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setSongCoverFile(e.target.files?.[0] || null)}
                                    className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-white/20 rounded-xl text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-[#ff7a3c] file:text-white file:cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-5 border-t border-[#221a22] bg-[#0f0f0f]">
                            <button
                                onClick={() => setIsUploadSongOpen(false)}
                                className="px-6 py-2.5 text-xs font-medium text-white/70 hover:text-white transition-colors border border-white/20 rounded-xl hover:bg-[#1a141a]"
                                disabled={isUploadingSong}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUploadSong}
                                disabled={!songTitle.trim() || !songFile || isUploadingSong}
                                className="px-6 py-2.5 bg-[#ff7a3c] hover:bg-[#ff8c52] text-white rounded-xl text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploadingSong ? "Uploading..." : "Upload Song"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Playlist Modal */}
            {isImportPlaylistOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setIsImportPlaylistOpen(false)}>
                    <div className="bg-[#1a141a] rounded-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-[#221a22]">
                            <h2 className="text-lg font-bold text-white">Import Playlist</h2>
                            <button onClick={() => setIsImportPlaylistOpen(false)} className="p-1.5 hover:bg-[#221a22] rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-2">Playlist URL *</label>
                                <input
                                    type="text"
                                    value={playlistUrl}
                                    onChange={(e) => setPlaylistUrl(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[#0f0f0f] border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#ff7a3c] transition-colors text-sm"
                                    placeholder="Enter Spotify or YouTube playlist URL"
                                />
                            </div>

                            <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-4">
                                <h3 className="text-xs font-medium text-white mb-2">Supported Sources:</h3>
                                <ul className="text-xs text-white/60 space-y-1">
                                    <li>• Spotify: https://open.spotify.com/playlist/...</li>
                                    <li>• YouTube: https://youtube.com/playlist?list=...</li>
                                </ul>
                            </div>

                            <div className="bg-[#ff7a3c]/10 border border-[#ff7a3c]/30 rounded-xl p-3">
                                <p className="text-xs text-white/70">
                                    ℹ️ Import may take a while for large playlists. Songs will be downloaded from YouTube if not already in the database.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-5 border-t border-[#221a22] bg-[#0f0f0f]">
                            <button
                                onClick={() => setIsImportPlaylistOpen(false)}
                                className="px-6 py-2.5 text-xs font-medium text-white/70 hover:text-white transition-colors border border-white/20 rounded-xl hover:bg-[#1a141a]"
                                disabled={isImportingPlaylist}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImportPlaylist}
                                disabled={!playlistUrl.trim() || isImportingPlaylist}
                                className="px-6 py-2.5 bg-[#ff7a3c] hover:bg-[#ff8c52] text-white rounded-xl text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Download size={14} />
                                {isImportingPlaylist ? "Importing..." : "Import Playlist"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default HomePage;
