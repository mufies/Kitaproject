using Kita.Service.Interfaces;
using Kita.Domain.Entities.Server;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Kita.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class VoiceController : ControllerBase
{
    private readonly ILiveKitService _liveKitService;
    private readonly IChannelService _channelService;
    private readonly IUserService _userService;

    public VoiceController(
        ILiveKitService liveKitService,
        IChannelService channelService,
        IUserService userService)
    {
        _liveKitService = liveKitService;
        _channelService = channelService;
        _userService = userService;
    }

    [HttpGet("token")]
    public async Task<IActionResult> GetToken([FromQuery] string channelId)
    {
        // Get the current user ID from JWT claims
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        // Verify the channel exists
        var channelResponse = await _channelService.GetChannelByIdAsync(Guid.Parse(channelId));
        if (channelResponse == null || channelResponse.Data == null)
        {
            return NotFound(new { message = "Channel not found" });
        }

        var channel = channelResponse.Data;

        // Verify it's a voice channel
        if (channel.Type != ChannelType.Voice)
        {
            return BadRequest(new { message = "Channel is not a voice channel" });
        }

        // Get user information
        var userResponse = await _userService.GetUserProfileAsync(Guid.Parse(userIdClaim));
        if (userResponse == null || userResponse.Data == null)
        {
            return NotFound(new { message = "User not found" });
        }

        var user = userResponse.Data;

        // Generate the LiveKit token
        var roomName = $"voice-channel-{channelId}";
        var participantName = user.UserName ?? $"User-{userIdClaim}";
        
        var tokenResponse = await _liveKitService.GenerateTokenAsync(
            userIdClaim,
            roomName,
            participantName
        );

        return Ok(tokenResponse);
    }
}
