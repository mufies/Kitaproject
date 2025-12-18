import api from './api';

export interface Artist {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    role: string;
    songCount: number;
    albumCount: number;
}

export interface ArtistDetail extends Artist {
    songs: ArtistSong[];
    albums: ArtistAlbum[];
}

export interface ArtistSong {
    id: string;
    title: string;
    coverUrl?: string;
    duration: number;
}

export interface ArtistAlbum {
    id: string;
    name: string;
    imageUrl?: string;
    songCount: number;
}

export interface CreateArtistDto {
    name: string;
    description?: string;
}

export interface UpdateArtistDto {
    name?: string;
    description?: string;
}

export const artistService = {
    getAllArtists: async () => {
        const response = await api.get<any>('/artist');
        return response.data.data as Artist[];
    },
    getArtistById: async (id: string) => {
        const response = await api.get<any>(`/artist/${id}`);
        return response.data.data as ArtistDetail;
    },
    searchArtists: async (query: string) => {
        const response = await api.get<any>(`/artist/search?query=${query}`);
        return response.data.data as Artist[];
    },
    getMyArtists: async () => {
        const response = await api.get<any>('/artist/my-artists');
        return response.data.data as Artist[];
    },
    createArtist: async (data: CreateArtistDto) => {
        const response = await api.post<any>('/artist', data);
        return response.data.data as Artist;
    },
    updateArtist: async (id: string, data: UpdateArtistDto) => {
        const response = await api.put<any>(`/artist/${id}`, data);
        return response.data.data as Artist;
    },
    deleteArtist: async (id: string) => {
        const response = await api.delete<any>(`/artist/${id}`);
        return response.data.data as boolean;
    },
    uploadArtistImage: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<any>(`/artist/${id}/image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data as string;
    }
};
