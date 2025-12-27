import api from './api';

export interface LiveKitTokenResponse {
    token: string;
    serverUrl: string;
}

/**
 * Fetches a LiveKit access token for joining a voice channel
 * @param channelId - The ID of the voice channel to join
 * @returns LiveKit token and server URL
 */
export async function getVoiceToken(channelId: string): Promise<LiveKitTokenResponse> {
    const response = await api.get<LiveKitTokenResponse>(
        `/voice/token`,
        {
            params: { channelId }
        }
    );

    return response.data;
}
