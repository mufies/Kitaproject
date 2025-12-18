// API Response wrapper
export interface ApiResponse<T> {
    success: boolean;
    code: number;
    message: string;
    data: T;
}

// Auth DTOs
export interface RegisterDto {
    username: string;
    email: string;
    password: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        username: string;
        email: string;
    };
}

// User DTOs
export interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    createdAt: string;
}

export interface FileUploadDto {
    file: File;
}

// Music DTOs
export interface CreateSongDto {
    title: string;
    artist: string;
    album?: string;
    duration?: number;
    streamUrl?: string;
    coverUrl?: string;
    status?: string; // SongStatus enum: Active, Inactive, etc.
    type?: string; // SongType enum: Single, Album, etc.
    genres?: string[]; // MusicGenre enum array
    audioQuality?: string; // AudioQuality enum: Normal, High, Lossless
}

export interface SongDto {
    id: string;
    title: string;
    artist: string; // Artist name for display
    album?: string; // Album name for display
    artistId?: string; // Artist entity ID
    albumId?: string; // Album entity ID
    userId?: string; // Uploader ID
    uploader?: string; // Uploader username for display
    duration?: number;
    streamUrl: string;
    coverUrl?: string;
    status?: string;
    type?: string;
    genres?: string[];
    audioQuality?: string;
    createdAt?: string;
}

export interface CreatePlaylistDto {
    name: string;
    description?: string;
    isPublic?: boolean;
}

export interface PlaylistDto {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    coverUrl?: string;
    isPublic?: boolean;
    songs: SongDto[];
}

// Server DTOs
export interface CreateServerDto {
    name: string;
    description?: string;
}

export interface ServerDto {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    createdAt: string;
}

// Channel DTOs
export interface CreateChannelDto {
    name: string;
    serverId: string;
    type?: number;
}

export interface ChannelDto {
    id: string;
    name: string;
    serverId: string;
    type: string;
    createdAt: string;
}

// Message DTOs
export interface CreateMessageDto {
    content: string;
    channelId: string;
}

export interface MessageDto {
    id: string;
    content: string;
    channelId: string;
    userId: string;
    username: string;
    createdAt: string;
}

// Server Invite DTOs
export interface CreateServerInviteDto {
    maxUses?: number;
    expiresInHours?: number;
}

export interface ServerInviteDto {
    id: string;
    code: string;
    serverId: string;
    serverName: string;
    createdById: string;
    createdByUsername: string;
    createdAt: string;
    expiresAt?: string;
    maxUses?: number;
    uses: number;
    isRevoked: boolean;
    isExpired: boolean;
    isValid: boolean;
}

export interface UseInviteDto {
    code: string;
}

// Song Statistics DTOs
export interface SongStaticsDto {
    id: string;
    songId: string;
    playCount: number;
    likeCount: number;
    dislikeCount: number;
    favoriteCount: number;
    shareCount: number;
    comments: CommentDto[];
    createdAt: string;
    updatedAt?: string;
    songTitle?: string;
    artistName?: string;
}

export interface CommentDto {
    id: string;
    content: string;
    userId: string;
    username: string;
    createdAt: string;
}

// Import Playlist DTOs
export interface ImportPlaylistRequestDto {
    playlistUrl: string;
}

export interface ImportPlaylistResponseDto {
    playlistId: string;
    playlistName: string;
    totalTracks: number;
    downloaded: number;
    skipped: number;
    failed: number;
    importedSongs: ImportedSongDto[];
    message: string;
}

export interface ImportedSongDto {
    title: string;
    artist: string;
    wasDownloaded: boolean;
    alreadyExisted: boolean;
    errorMessage?: string;
}

// User interaction status
export interface UserInteractionStatus {
    hasLiked: boolean;
    hasDisliked: boolean;
    hasFavorited: boolean;
}

