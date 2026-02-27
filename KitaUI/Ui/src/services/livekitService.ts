import api from './api';

export interface LiveKitTokenResponse {
    token: string;
    serverUrl: string;
}


export async function getVoiceToken(channelId: string): Promise<LiveKitTokenResponse> {
    const response = await api.get<LiveKitTokenResponse>(
        `/voice/token`,
        {
            params: { channelId }
        }
    );

    return response.data;
}
