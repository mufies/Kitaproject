using Kita.Service.DTOs.Voice;

namespace Kita.Service.Interfaces;

public interface ILiveKitService
{
    /// <summary>
    /// Generates a LiveKit access token for a user to join a voice room
    /// </summary>
    /// <param name="userId">The ID of the user requesting access</param>
    /// <param name="roomName">The name of the room/channel to join</param>
    /// <param name="participantName">Display name for the participant</param>
    /// <returns>LiveKit token response with access token and server URL</returns>
    Task<LiveKitTokenResponse> GenerateTokenAsync(string userId, string roomName, string participantName);
}
