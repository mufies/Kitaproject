using Kita.Service.DTOs.Voice;
using Kita.Service.Interfaces;
using Livekit.Server.Sdk.Dotnet;
using Microsoft.Extensions.Configuration;

namespace Kita.Service.Services;

public class LiveKitService : ILiveKitService
{
    private readonly string _apiKey;
    private readonly string _apiSecret;
    private readonly string _serverUrl;

    public LiveKitService(IConfiguration configuration)
    {
        _apiKey = configuration["LiveKit:ApiKey"] ?? throw new InvalidOperationException("LiveKit ApiKey is not configured");
        _apiSecret = configuration["LiveKit:ApiSecret"] ?? throw new InvalidOperationException("LiveKit ApiSecret is not configured");
        _serverUrl = configuration["LiveKit:ServerUrl"] ?? throw new InvalidOperationException("LiveKit ServerUrl is not configured");
    }

    public async Task<LiveKitTokenResponse> GenerateTokenAsync(string userId, string roomName, string participantName)
    {
        var token = new AccessToken(_apiKey, _apiSecret)
            .WithIdentity(userId)
            .WithName(participantName)
            .WithGrants(new VideoGrants
            {
                RoomJoin = true,
                Room = roomName,
                CanPublish = true,
                CanSubscribe = true,
                CanPublishData = true
            })
            .WithTtl(TimeSpan.FromHours(6));

        var jwt = token.ToJwt();

        return await Task.FromResult(new LiveKitTokenResponse
        {
            Token = jwt,
            ServerUrl = _serverUrl
        });
    }
}
