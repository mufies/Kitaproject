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
            var result = await _songStaticsService.IncrementLikeCountAsync(songId);
            return HandleResult(result);
        }

        [HttpDelete("songs/{songId}/like")]
        public async Task<IActionResult> DecrementLikeCount(Guid songId)
        {
            var result = await _songStaticsService.DecrementLikeCountAsync(songId);
            return HandleResult(result);
        }

        [HttpPost("songs/{songId}/dislike")]
        public async Task<IActionResult> IncrementDislikeCount(Guid songId)
        {
            var result = await _songStaticsService.IncrementDislikeCountAsync(songId);
            return HandleResult(result);
        }

        [HttpDelete("songs/{songId}/dislike")]
        public async Task<IActionResult> DecrementDislikeCount(Guid songId)
        {
            var result = await _songStaticsService.DecrementDislikeCountAsync(songId);
            return HandleResult(result);
        }

        [HttpPost("songs/{songId}/favorite")]
        public async Task<IActionResult> IncrementFavoriteCount(Guid songId)
        {
            var result = await _songStaticsService.IncrementFavoriteCountAsync(songId);
            return HandleResult(result);
        }

        [HttpDelete("songs/{songId}/favorite")]
        public async Task<IActionResult> DecrementFavoriteCount(Guid songId)
        {
            var result = await _songStaticsService.DecrementFavoriteCountAsync(songId);
            return HandleResult(result);
        }

        [HttpPost("songs/{songId}/share")]
        public async Task<IActionResult> IncrementShareCount(Guid songId)
        {
            var result = await _songStaticsService.IncrementShareCountAsync(songId);
            return HandleResult(result);
        }
    }
}
