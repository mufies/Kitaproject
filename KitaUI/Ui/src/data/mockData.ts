import type { Playlist, Song } from '../types/music';

// Mock songs data
export const mockSongs: Song[] = [
    {
        id: '1',
        title: 'Midnight Dreams',
        artist: 'Luna Eclipse',
        album: 'Nocturnal Vibes',
        duration: 245,
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    },
    {
        id: '2',
        title: 'Electric Pulse',
        artist: 'Neon Waves',
        album: 'Synthwave Dreams',
        duration: 198,
        coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    },
    {
        id: '3',
        title: 'Ocean Breeze',
        artist: 'Coastal Harmony',
        album: 'Seaside Sessions',
        duration: 312,
        coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
    },
    {
        id: '4',
        title: 'Urban Jungle',
        artist: 'City Beats',
        album: 'Metropolitan',
        duration: 267,
        coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop',
    },
    {
        id: '5',
        title: 'Starlight Symphony',
        artist: 'Celestial Orchestra',
        album: 'Cosmic Journey',
        duration: 423,
        coverUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop',
    },
    {
        id: '6',
        title: 'Desert Mirage',
        artist: 'Sahara Sound',
        album: 'Endless Dunes',
        duration: 289,
        coverUrl: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop',
    },
    {
        id: '7',
        title: 'Neon Nights',
        artist: 'Cyber Dreams',
        album: 'Digital Paradise',
        duration: 234,
        coverUrl: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop',
    },
    {
        id: '8',
        title: 'Mountain Echo',
        artist: 'Alpine Acoustics',
        album: 'Peak Performance',
        duration: 356,
        coverUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop',
    },
];

// Mock playlists data
export const mockPlaylists: Playlist[] = [
    {
        id: '1',
        name: 'Chill Vibes',
        description: 'Perfect for relaxing and unwinding',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop',
        songs: [mockSongs[0], mockSongs[2], mockSongs[4]],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
    },
    {
        id: '2',
        name: 'Workout Mix',
        description: 'High energy tracks to fuel your workout',
        coverUrl: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=600&h=600&fit=crop',
        songs: [mockSongs[1], mockSongs[3], mockSongs[6]],
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-05'),
    },
    {
        id: '3',
        name: 'Focus Flow',
        description: 'Instrumental beats for deep concentration',
        coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&h=600&fit=crop',
        songs: [mockSongs[4], mockSongs[7]],
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-12'),
    },
    {
        id: '4',
        name: 'Night Drive',
        description: 'Smooth tunes for late night cruising',
        coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop',
        songs: [mockSongs[0], mockSongs[1], mockSongs[5], mockSongs[6]],
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-18'),
    },
];

// Helper function to format duration
export const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Helper function to get playlist by ID
export const getPlaylistById = (id: string): Playlist | undefined => {
    return mockPlaylists.find(playlist => playlist.id === id);
};

// Helper function to get available songs not in playlist
export const getAvailableSongs = (playlistId: string): Song[] => {
    const playlist = getPlaylistById(playlistId);
    if (!playlist) return mockSongs;

    const playlistSongIds = new Set(playlist.songs.map(song => song.id));
    return mockSongs.filter(song => !playlistSongIds.has(song.id));
};
