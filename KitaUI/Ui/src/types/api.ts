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
    songUrl?: string;
    coverUrl?: string;
}

export interface SongDto {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration?: number;
    songUrl: string;
    coverUrl?: string;
    createdAt: string;
}

export interface CreatePlaylistDto {
    name: string;
    description?: string;
}

export interface PlaylistDto {
    id: string;
    name: string;
    description?: string;
    userId: string;
    songs: SongDto[];
    createdAt: string;
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
