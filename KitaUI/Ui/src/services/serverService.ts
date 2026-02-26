import api from './api';
import type { ServerDto, CreateServerDto, ApiResponse } from '../types/api';

export interface UpdateServerDto {
    name: string;
    iconUrl?: string;
}

export const serverService = {
    async getUserServers(): Promise<ServerDto[]> {
        const response = await api.get<ApiResponse<ServerDto[]>>('/server');
        return response.data.data || [];
    },

    async createServer(data: CreateServerDto): Promise<ServerDto> {
        const response = await api.post<ApiResponse<ServerDto>>('/server', data);
        return response.data.data;
    },

    async getServer(id: string): Promise<ServerDto> {
        const response = await api.get<ApiResponse<ServerDto>>(`/server/${id}`);
        return response.data.data;
    },

    async updateServer(id: string, data: UpdateServerDto): Promise<ServerDto> {
        const response = await api.put<ApiResponse<ServerDto>>(`/server/${id}`, data);
        return response.data.data;
    },

    async uploadServerIcon(id: string, file: File): Promise<string> {
        const formData = new FormData();
        formData.append('File', file);
        const response = await api.post<ApiResponse<string>>(`/server/${id}/icon`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.data;
    },

    async getServerMembers(id: string): Promise<import('../types/api').ServerMemberDto[]> {
        const response = await api.get<ApiResponse<import('../types/api').ServerMemberDto[]>>(`/server/${id}/members`);
        return response.data.data || [];
    },

    async deleteServer(id: string): Promise<void> {
        await api.delete<ApiResponse<void>>(`/server/${id}`);
    },

    async kickMember(serverId: string, memberUserId: string): Promise<void> {
        await api.delete<ApiResponse<boolean>>(`/server/${serverId}/members/${memberUserId}`);
    },

    async leaveServer(serverId: string): Promise<void> {
        await api.post<ApiResponse<boolean>>(`/server/${serverId}/leave`);
    }
};
