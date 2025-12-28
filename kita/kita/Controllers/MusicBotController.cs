using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Kita.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MusicBotController : ControllerBase
    {
        private readonly IMusicBotService _musicBotService;
        private readonly ILogger<MusicBotController> _logger;

        public MusicBotController(IMusicBotService musicBotService, ILogger<MusicBotController> logger)
        {
            _musicBotService = musicBotService;
            _logger = logger;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("User not authenticated");
            }
            return userId;
        }

        [HttpPost("join/{channelId}")]
        public async Task<IActionResult> JoinChannel(string channelId, [FromBody] JoinChannelRequest? request = null)
        {
            try
            {
                var response = await _musicBotService.JoinChannelAsync(
                    channelId,
                    request?.PlaylistId,
                    request?.SongIds
                );
                
                return response.Success ? Ok(response) : BadRequest(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining bot to channel {ChannelId}", channelId);
                return StatusCode(500, new { message = "Failed to join channel" });
            }
        }

        [HttpPost("leave/{channelId}")]
        public async Task<IActionResult> LeaveChannel(string channelId)
        {
            try
            {
                var response = await _musicBotService.LeaveChannelAsync(channelId);
                return response.Success ? Ok(response) : BadRequest(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error leaving channel {ChannelId}", channelId);
                return StatusCode(500, new { message = "Failed to leave channel" });
            }
        }

        [HttpPost("play/{channelId}/{songId}")]
        public async Task<IActionResult> PlaySong(string channelId, Guid songId)
        {
            try
            {
                var response = await _musicBotService.PlaySongAsync(channelId, songId);
                return response.Success ? Ok(response) : BadRequest(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error playing song {SongId} in channel {ChannelId}", songId, channelId);
                return StatusCode(500, new { message = "Failed to play song" });
            }
        }

        [HttpPost("queue/{channelId}/{songId}")]
        public async Task<IActionResult> AddToQueue(string channelId, Guid songId)
        {
            try
            {
                var response = await _musicBotService.AddSongToQueueAsync(channelId, songId);
                return response.Success ? Ok(response) : BadRequest(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding song {SongId} to queue in channel {ChannelId}", songId, channelId);
                return StatusCode(500, new { message = "Failed to add song to queue" });
            }
        }

        [HttpPost("pause/{channelId}")]
        public async Task<IActionResult> Pause(string channelId)
        {
            try
            {
                var response = await _musicBotService.PauseAsync(channelId);
                return response.Success ? Ok(response) : BadRequest(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error pausing in channel {ChannelId}", channelId);
                return StatusCode(500, new { message = "Failed to pause" });
            }
        }

        [HttpPost("resume/{channelId}")]
        public async Task<IActionResult> Resume(string channelId)
        {
            try
            {
                var response = await _musicBotService.ResumeAsync(channelId);
                return response.Success ? Ok(response) : BadRequest(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resuming in channel {ChannelId}", channelId);
                return StatusCode(500, new { message = "Failed to resume" });
            }
        }

        [HttpPost("skip/{channelId}")]
        public async Task<IActionResult> Skip(string channelId)
        {
            try
            {
                var response = await _musicBotService.SkipAsync(channelId);
                return response.Success ? Ok(response) : BadRequest(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error skipping song in channel {ChannelId}", channelId);
                return StatusCode(500, new { message = "Failed to skip song" });
            }
        }

        [HttpPost("volume/{channelId}")]
        public async Task<IActionResult> SetVolume(string channelId, [FromBody] SetVolumeRequest request)
        {
            try
            {
                var response = await _musicBotService.SetVolumeAsync(channelId, request.Volume);
                return response.Success ? Ok(response) : BadRequest(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting volume in channel {ChannelId}", channelId);
                return StatusCode(500, new { message = "Failed to set volume" });
            }
        }

        [HttpGet("status/{channelId}")]
        public async Task<IActionResult> GetStatus(string channelId)
        {
            try
            {
                var response = await _musicBotService.GetBotStatusAsync(channelId);
                return response.Success ? Ok(response) : BadRequest(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting status for channel {ChannelId}", channelId);
                return StatusCode(500, new { message = "Failed to get status" });
            }
        }
    }

    public class JoinChannelRequest
    {
        public Guid? PlaylistId { get; set; }
        public List<Guid>? SongIds { get; set; }
    }

    public class SetVolumeRequest
    {
        public int Volume { get; set; }
    }
}
