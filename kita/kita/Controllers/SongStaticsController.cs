using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kita.Controllers
{
    [Authorize]
    public class SongStaticsController : BaseApiController
    {
        private readonly ISongStaticsService _songStaticsService;

        public SongStaticsController(ISongStaticsService songStaticsService)
        {
            _songStaticsService = songStaticsService;
        }

        [HttpGet("songs/{songId}/stats")]
        public async Task<IActionResult> GetSongStatics(Guid songId)
        {
            var result = await _songStaticsService.GetSongStaticsAsync(songId);
            return HandleResult(result);
        }

        [HttpPost("songs/{songId}/play")]
        public async Task<IActionResult> IncrementPlayCount(Guid songId)
        {
            var result = await _songStaticsService.IncrementPlayCountAsync(songId);
            return HandleResult(result);
        }

        [HttpPost("songs/{songId}/like")]
        public async Task<IActionResult> IncrementLikeCount(Guid songId)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");
            
            var result = await _songStaticsService.IncrementLikeCountAsync(songId, userId);
            return HandleResult(result);
        }

        [HttpDelete("songs/{songId}/like")]
        public async Task<IActionResult> DecrementLikeCount(Guid songId)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");
            
            var result = await _songStaticsService.DecrementLikeCountAsync(songId, userId);
            return HandleResult(result);
        }

        [HttpPost("songs/{songId}/dislike")]
        public async Task<IActionResult> IncrementDislikeCount(Guid songId)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");
            
            var result = await _songStaticsService.IncrementDislikeCountAsync(songId, userId);
            return HandleResult(result);
        }

        [HttpDelete("songs/{songId}/dislike")]
        public async Task<IActionResult> DecrementDislikeCount(Guid songId)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");
            
            var result = await _songStaticsService.DecrementDislikeCountAsync(songId, userId);
            return HandleResult(result);
        }

        [HttpPost("songs/{songId}/favorite")]
        public async Task<IActionResult> IncrementFavoriteCount(Guid songId)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");
            
            var result = await _songStaticsService.IncrementFavoriteCountAsync(songId, userId);
            return HandleResult(result);
        }

        [HttpDelete("songs/{songId}/favorite")]
        public async Task<IActionResult> DecrementFavoriteCount(Guid songId)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");
            
            var result = await _songStaticsService.DecrementFavoriteCountAsync(songId, userId);
            return HandleResult(result);
        }

        [HttpPost("songs/{songId}/share")]
        public async Task<IActionResult> IncrementShareCount(Guid songId)
        {
            var result = await _songStaticsService.IncrementShareCountAsync(songId);
            return HandleResult(result);
        }

        [HttpGet("songs/{songId}/like/status")]
        public async Task<IActionResult> HasUserLikedSong(Guid songId)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");
            
            var result = await _songStaticsService.HasUserLikedSongAsync(songId, userId);
            return Ok(new { HasLiked = result });
        }

        [HttpGet("songs/{songId}/dislike/status")]
        public async Task<IActionResult> HasUserDislikedSong(Guid songId)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");
            
            var result = await _songStaticsService.HasUserDislikedSongAsync(songId, userId);
            return Ok(new { HasDisliked = result });
        }

        [HttpGet("songs/{songId}/favorite/status")]
        public async Task<IActionResult> HasUserFavoritedSong(Guid songId)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");
            
            var result = await _songStaticsService.HasUserFavoritedSongAsync(songId, userId);
            return Ok(new { HasFavorited = result });
        }

        private Guid GetUserIdFromClaims()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Guid.Empty;
            }
            return userId;
        }
    }
}
