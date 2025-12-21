import api from './api';
import type { ApiResponse, ServerInviteDto, CreateServerInviteDto, UseInviteDto } from '../types/api';

export const serverInviteService = {
    async createInvite(serverId: string, data?: CreateServerInviteDto): Promise<ServerInviteDto> {
        const response = await api.post<ApiResponse<ServerInviteDto>>(
            `/serverinvite/${serverId}`,
            data || {}
        );
        return response.data.data;
    },

    async getInviteByCode(code: string): Promise<ServerInviteDto> {
        const response = await api.get<ApiResponse<ServerInviteDto>>(`/serverinvite/${code}`);
        return response.data.data;
    },

    async useInvite(data: UseInviteDto): Promise<ServerInviteDto> {
        const response = await api.post<ApiResponse<ServerInviteDto>>('/serverinvite/use', data);
        return response.data.data;
    },

    async getServerInvites(serverId: string): Promise<ServerInviteDto[]> {
        const response = await api.get<ApiResponse<ServerInviteDto[]>>(`/serverinvite/server/${serverId}`);
        return response.data.data || [];
    },

    async revokeInvite(inviteId: string): Promise<boolean> {
        const response = await api.delete<ApiResponse<boolean>>(`/serverinvite/${inviteId}`);
        return response.data.success;
    }
};
