export interface ServerDto {
    id: string;
    name: string;
    ownerId: string;
    // Add other fields as per backend, e.g. iconUrl?
}

export interface CreateServerDto {
    name: string;
}

export interface ChannelDto {
    id: string;
    name: string;
    type: 'text' | 'voice';
    serverId: string;
}

export interface CreateChannelDto {
    name: string;
    serverId: string;
    type: 'text' | 'voice';
}
