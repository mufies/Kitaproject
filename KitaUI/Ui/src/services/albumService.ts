import api from './api';

export interface Album {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    artistId: string;
    artistName?: string;
    songCount: number;
}

export interface AlbumDetail extends Album {
    songs: AlbumSong[];
}

export interface AlbumSong {
    id: string;
    title: string;
    coverUrl?: string;
    duration: number;
    trackNumber: number;
}

export interface CreateAlbumDto {
    name: string;
    description?: string;
    artistId: string;
}

export interface UpdateAlbumDto {
    name?: string;
    description?: string;
}

export interface AddSongsToAlbumDto {
    songIds: string[];
}

export interface RemoveSongsFromAlbumDto {
    songIds: string[];
}

export const albumService = {
    getAllAlbums: async () => {
        const response = await api.get<any>('/album');
        return response.data.data as Album[];
    },
    getAlbumById: async (id: string) => {
        const response = await api.get<any>(`/album/${id}`);
        return response.data.data as AlbumDetail;
    },
    getAlbumsByArtist: async (artistId: string) => {
        const response = await api.get<any>(`/album/artist/${artistId}`);
        return response.data.data as Album[];
    },
    searchAlbums: async (query: string) => {
        const response = await api.get<any>(`/album/search?query=${query}`);
        return response.data.data as Album[];
    },
    createAlbum: async (data: CreateAlbumDto) => {
        const response = await api.post<any>('/album', data);
        return response.data.data as Album;
    },
    updateAlbum: async (id: string, data: UpdateAlbumDto) => {
        const response = await api.put<any>(`/album/${id}`, data);
        return response.data.data as Album;
    },
    deleteAlbum: async (id: string) => {
        const response = await api.delete<any>(`/album/${id}`);
        return response.data.data as boolean;
    },
    uploadAlbumImage: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<any>(`/album/${id}/image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data as string;
    },
    addSongsToAlbum: async (albumId: string, songIds: string[]) => {
        const response = await api.post<any>(`/album/${albumId}/songs`, { songIds });
        return response.data.data as AlbumDetail;
    },
    removeSongsFromAlbum: async (albumId: string, songIds: string[]) => {
        const response = await api.delete<any>(`/album/${albumId}/songs`, { data: { songIds } });
        return response.data.data as AlbumDetail;
    },
    likeAlbum: async (id: string) => {
        const response = await api.post<any>(`/album/${id}/like`);
        return response.data.data as boolean;
    },
    unlikeAlbum: async (id: string) => {
        const response = await api.delete<any>(`/album/${id}/like`);
        return response.data.data as boolean;
    },
    getLikedAlbums: async () => {
        const response = await api.get<any>('/album/liked');
        return response.data.data as Album[];
    },
    isLikingAlbum: async (id: string) => {
        const response = await api.get<any>(`/album/${id}/is-liking`);
        return response.data.data as boolean;
    }
};
