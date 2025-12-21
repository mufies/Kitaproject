import api from './api';
import type { ChannelDto, CreateChannelDto, UpdateChannelDto, ApiResponse } from '../types/api';

export const channelService = {
    async getServerChannels(serverId: string): Promise<ChannelDto[]> {
        const response = await api.get<ApiResponse<ChannelDto[]>>(`/channel/server/${serverId}`);
        return response.data.data || [];
    },

    async getChannel(channelId: string): Promise<ChannelDto> {
        const response = await api.get<ApiResponse<ChannelDto>>(`/channel/${channelId}`);
        return response.data.data;
    },

    async createChannel(data: CreateChannelDto): Promise<ChannelDto> {
        const response = await api.post<ApiResponse<ChannelDto>>('/channel', data);
        return response.data.data;
    },

    async updateChannel(channelId: string, data: UpdateChannelDto): Promise<ChannelDto> {
        const response = await api.put<ApiResponse<ChannelDto>>(`/channel/${channelId}`, data);
        return response.data.data;
    },

    async deleteChannel(channelId: string): Promise<boolean> {
        const response = await api.delete<ApiResponse<boolean>>(`/channel/${channelId}`);
        return response.data.success;
    }
};
