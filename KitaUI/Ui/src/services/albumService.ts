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

export const albumService = {
    getAllAlbums: async () => {
        const response = await api.get<Album[]>('/album');
        return response.data;
    },
    getAlbumById: async (id: string) => {
        const response = await api.get<AlbumDetail>(`/album/${id}`);
        return response.data;
    },
    getAlbumsByArtist: async (artistId: string) => {
        const response = await api.get<Album[]>(`/album/artist/${artistId}`);
        return response.data;
    },
    searchAlbums: async (query: string) => {
        const response = await api.get<Album[]>(`/album/search?query=${query}`);
        return response.data;
    },
    createAlbum: async (data: CreateAlbumDto) => {
        const response = await api.post<Album>('/album', data);
        return response.data;
    },
    updateAlbum: async (id: string, data: UpdateAlbumDto) => {
        const response = await api.put<Album>(`/album/${id}`, data);
        return response.data;
    },
    deleteAlbum: async (id: string) => {
        const response = await api.delete<boolean>(`/album/${id}`);
        return response.data;
    },
    uploadAlbumImage: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<string>(`/album/${id}/image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};
