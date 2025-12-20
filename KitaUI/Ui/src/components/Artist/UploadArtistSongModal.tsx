import React, { useState } from 'react';
import { uploadArtistSong } from '../../utils/musicAPI';
import type { ArtistAlbum } from '../../services/artistService';

interface UploadArtistSongModalProps {
    artistId: string;
    artistName: string;
    albums: ArtistAlbum[];
    onClose: () => void;
    onSuccess: () => void;
}

export const UploadArtistSongModal: React.FC<UploadArtistSongModalProps> = ({
    artistId,
    artistName,
    albums,
    onClose,
    onSuccess
}) => {
    const [title, setTitle] = useState('');
    const [albumId, setAlbumId] = useState('');
    const [songFile, setSongFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const handleSongFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type.startsWith('audio/')) {
                setSongFile(file);
                setError('');
            } else {
                setError('Please select a valid audio file');
            }
        }
    };

    const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type.startsWith('image/')) {
                setCoverFile(file);
                setError('');
            } else {
                setError('Please select a valid image file');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            setError('Please enter a song title');
            return;
        }

        if (!songFile) {
            setError('Please select a song file');
            return;
        }

        try {
            setIsUploading(true);
            setError('');

            await uploadArtistSong(
                {
                    artistId: artistId,
                    title: title.trim(),
                    albumId: albumId || undefined,
                },
                songFile,
                coverFile || undefined
            );

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload song');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000] p-5 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#282828] rounded-lg w-full max-w-[500px] max-h-[90vh] overflow-y-auto animate-slideUp" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-[#404040]">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Upload Song</h2>
                        <p className="text-[#a7a7a7] text-sm mt-1">for {artistName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#b3b3b3] hover:text-white transition-colors flex items-center justify-center">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded text-red-500 text-sm">
                            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Artist Info Display */}
                    <div className="mb-5 p-3 bg-[#1db954]/10 border border-[#1db954]/30 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[#a7a7a7] text-xs uppercase tracking-wider">Artist</p>
                                <p className="text-white font-bold">{artistName}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-5">
                        <label htmlFor="title" className="block text-sm font-bold text-white mb-2">Song Title *</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter song title"
                            disabled={isUploading}
                            required
                            className="w-full px-4 py-3 bg-[#3e3e3e] border border-[#535353] rounded text-white text-sm placeholder-[#b3b3b3] focus:outline-none focus:border-[#1db954] focus:bg-[#4a4a4a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    {albums.length > 0 && (
                        <div className="mb-5">
                            <label htmlFor="album" className="block text-sm font-bold text-white mb-2">Album (Optional)</label>
                            <select
                                id="album"
                                value={albumId}
                                onChange={(e) => setAlbumId(e.target.value)}
                                disabled={isUploading}
                                className="w-full px-4 py-3 bg-[#3e3e3e] border border-[#535353] rounded text-white text-sm focus:outline-none focus:border-[#1db954] focus:bg-[#4a4a4a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">No Album (Single)</option>
                                {albums.map(album => (
                                    <option key={album.id} value={album.id}>{album.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="mb-5">
                        <label htmlFor="songFile" className="block text-sm font-bold text-white mb-2">Audio File *</label>
                        <div
                            className="relative border-2 border-dashed border-[#535353] rounded-lg p-6 hover:border-[#1db954] transition-all cursor-pointer bg-[#3e3e3e]/30 hover:bg-[#3e3e3e]/50"
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('border-[#1db954]', 'bg-[#3e3e3e]/50');
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove('border-[#1db954]', 'bg-[#3e3e3e]/50');
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('border-[#1db954]', 'bg-[#3e3e3e]/50');
                                const file = e.dataTransfer.files[0];
                                if (file && file.type.startsWith('audio/')) {
                                    setSongFile(file);
                                    setError('');
                                } else {
                                    setError('Please drop a valid audio file');
                                }
                            }}
                        >
                            <input
                                id="songFile"
                                type="file"
                                accept="audio/*"
                                onChange={handleSongFileChange}
                                disabled={isUploading}
                                required
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="flex flex-col items-center justify-center text-center">
                                <svg className="w-12 h-12 text-[#1db954] mb-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                                </svg>
                                {songFile ? (
                                    <>
                                        <p className="text-white font-medium mb-1">{songFile.name}</p>
                                        <p className="text-[#b3b3b3] text-sm">{(songFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-white font-medium mb-1">Click or drag audio file here</p>
                                        <p className="text-[#b3b3b3] text-sm">Supports MP3, WAV, FLAC, and more</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mb-5">
                        <label htmlFor="coverFile" className="block text-sm font-bold text-white mb-2">Cover Image (Optional)</label>
                        <div
                            className="relative border-2 border-dashed border-[#535353] rounded-lg p-6 hover:border-[#1db954] transition-all cursor-pointer bg-[#3e3e3e]/30 hover:bg-[#3e3e3e]/50"
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('border-[#1db954]', 'bg-[#3e3e3e]/50');
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove('border-[#1db954]', 'bg-[#3e3e3e]/50');
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('border-[#1db954]', 'bg-[#3e3e3e]/50');
                                const file = e.dataTransfer.files[0];
                                if (file && file.type.startsWith('image/')) {
                                    setCoverFile(file);
                                    setError('');
                                } else {
                                    setError('Please drop a valid image file');
                                }
                            }}
                        >
                            <input
                                id="coverFile"
                                type="file"
                                accept="image/*"
                                onChange={handleCoverFileChange}
                                disabled={isUploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="flex flex-col items-center justify-center text-center">
                                {coverFile ? (
                                    <div className="w-full">
                                        <div className="w-32 h-32 mx-auto mb-3 rounded-lg overflow-hidden">
                                            <img src={URL.createObjectURL(coverFile)} alt="Cover preview" className="w-full h-full object-cover" />
                                        </div>
                                        <p className="text-white font-medium mb-1">{coverFile.name}</p>
                                        <p className="text-[#b3b3b3] text-sm">{(coverFile.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                ) : (
                                    <>
                                        <svg className="w-12 h-12 text-[#1db954] mb-3" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                                        </svg>
                                        <p className="text-white font-medium mb-1">Click or drag image here</p>
                                        <p className="text-[#b3b3b3] text-sm">PNG, JPG, WEBP up to 10MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#404040]">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isUploading}
                            className="px-6 py-3 bg-transparent text-white border border-[#535353] rounded-full text-sm font-bold hover:border-white hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUploading}
                            className="flex items-center gap-2 px-6 py-3 bg-[#1db954] text-white rounded-full text-sm font-bold hover:bg-[#1ed760] hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Uploading...
                                </>
                            ) : (
                                'Upload Song'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadArtistSongModal;
