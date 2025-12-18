export interface Song {
    id: string;
    title: string;
    artist: string;
    album?: string;
    artistId?: string;
    albumId?: string;
    userId?: string;
    duration: number; // in seconds
    coverUrl?: string;
    audioUrl?: string;
}

export interface Playlist {
    id: string;
    name: string;
    description: string;
    coverUrl: string;
    songs: Song[];
    createdAt: Date;
    updatedAt: Date;
}
