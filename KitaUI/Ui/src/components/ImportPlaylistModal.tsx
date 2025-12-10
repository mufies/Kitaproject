import React, { useState } from 'react';
import { importPlaylist } from '../utils/musicAPI';
import type { ImportPlaylistResponseDto } from '../types/api';

interface ImportPlaylistModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const ImportPlaylistModal: React.FC<ImportPlaylistModalProps> = ({ onClose, onSuccess }) => {
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<ImportPlaylistResponseDto | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!playlistUrl.trim()) {
            setError('Please enter a playlist URL');
            return;
        }

        try {
            setIsImporting(true);
            setError('');
            setResult(null);

            const response = await importPlaylist(playlistUrl.trim());

            if (response.success) {
                setResult(response.data);
            } else {
                setError(response.message || 'Failed to import playlist');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to import playlist');
        } finally {
            setIsImporting(false);
        }
    };

    const handleDone = () => {
        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000] p-5 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#282828] rounded-lg w-full max-w-[600px] max-h-[90vh] overflow-y-auto animate-slideUp" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-[#404040]">
                    <h2 className="text-2xl font-bold text-white">Import Playlist</h2>
                    <button onClick={onClose} className="p-2 text-[#b3b3b3] hover:text-white transition-colors flex items-center justify-center">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {!result ? (
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded text-red-500 text-sm">
                                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <div className="mb-5">
                                <label htmlFor="playlistUrl" className="block text-sm font-bold text-white mb-2">
                                    Playlist URL
                                </label>
                                <input
                                    id="playlistUrl"
                                    type="text"
                                    value={playlistUrl}
                                    onChange={(e) => setPlaylistUrl(e.target.value)}
                                    placeholder="https://open.spotify.com/playlist/... or YouTube playlist URL"
                                    disabled={isImporting}
                                    required
                                    className="w-full px-4 py-3 bg-[#3e3e3e] border border-[#535353] rounded text-white text-sm placeholder-[#b3b3b3] focus:outline-none focus:border-[#1db954] focus:bg-[#4a4a4a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <p className="text-[#b3b3b3] text-xs mt-2">
                                    Supports Spotify and YouTube playlist URLs
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#404040]">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isImporting}
                                    className="px-6 py-3 bg-transparent text-white border border-[#535353] rounded-full text-sm font-bold hover:border-white hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isImporting}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#1db954] text-white rounded-full text-sm font-bold hover:bg-[#1ed760] hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isImporting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                                            </svg>
                                            Import Playlist
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div>
                            <div className="flex items-center gap-3 mb-6 p-4 bg-[#1db954]/10 border border-[#1db954]/30 rounded-lg">
                                <svg className="w-8 h-8 text-[#1db954]" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                                <div>
                                    <h3 className="text-white font-bold text-lg">{result.playlistName}</h3>
                                    <p className="text-[#b3b3b3] text-sm">{result.message}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-3 mb-6">
                                <div className="bg-[#3e3e3e] rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-white">{result.totalTracks}</div>
                                    <div className="text-xs text-[#b3b3b3]">Total</div>
                                </div>
                                <div className="bg-[#1db954]/20 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-[#1db954]">{result.downloaded}</div>
                                    <div className="text-xs text-[#b3b3b3]">Downloaded</div>
                                </div>
                                <div className="bg-yellow-500/20 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-yellow-500">{result.skipped}</div>
                                    <div className="text-xs text-[#b3b3b3]">Skipped</div>
                                </div>
                                <div className="bg-red-500/20 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-red-500">{result.failed}</div>
                                    <div className="text-xs text-[#b3b3b3]">Failed</div>
                                </div>
                            </div>

                            {result.importedSongs.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-white font-bold mb-3">Imported Songs</h4>
                                    <div className="max-h-[200px] overflow-y-auto space-y-2">
                                        {result.importedSongs.map((song, index) => (
                                            <div key={index} className="flex items-center gap-3 p-2 rounded bg-[#3e3e3e]/50">
                                                <div className={`w-2 h-2 rounded-full ${song.wasDownloaded ? 'bg-[#1db954]' : song.alreadyExisted ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-white text-sm truncate">{song.title}</div>
                                                    <div className="text-[#b3b3b3] text-xs truncate">{song.artist}</div>
                                                </div>
                                                {song.alreadyExisted && (
                                                    <span className="text-xs text-yellow-500">Already exists</span>
                                                )}
                                                {song.errorMessage && (
                                                    <span className="text-xs text-red-500 truncate max-w-[100px]" title={song.errorMessage}>
                                                        {song.errorMessage}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-[#404040]">
                                <button
                                    onClick={handleDone}
                                    className="px-8 py-3 bg-[#1db954] text-white rounded-full text-sm font-bold hover:bg-[#1ed760] hover:scale-105 transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportPlaylistModal;
