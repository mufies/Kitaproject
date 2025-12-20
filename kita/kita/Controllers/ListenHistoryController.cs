using System.Security.Claims;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kita.Controllers
{
    [Authorize]
    public class ListenHistoryController : BaseApiController
    {
        private readonly IListenHistoryService _listenHistoryService;

        public ListenHistoryController(IListenHistoryService listenHistoryService)
        {
            _listenHistoryService = listenHistoryService;
        }


        [HttpPost("songs/{songId}/listen")]
        public async Task<IActionResult> AddToHistory(Guid songId, [FromQuery] int? msPlayed = null)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");

            var result = await _listenHistoryService.AddToHistoryAsync(userId, songId, msPlayed);
            return HandleResult(result);
        }

        /// <summary>
        /// Get user's listen history
        /// </summary>
        [HttpGet("history")]
        public async Task<IActionResult> GetHistory([FromQuery] int limit = 50)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");

            var result = await _listenHistoryService.GetUserHistoryAsync(userId, limit);
            return HandleResult(result);
        }

        /// <summary>
        /// Get recently played songs (unique songs only)
        /// </summary>
        [HttpGet("history/recent")]
        public async Task<IActionResult> GetRecentlyPlayed([FromQuery] int limit = 20)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");

            var result = await _listenHistoryService.GetRecentlyPlayedAsync(userId, limit);
            return HandleResult(result);
        }

        /// <summary>
        /// Get user's listening statistics
        /// </summary>
        [HttpGet("history/stats")]
        public async Task<IActionResult> GetListenStats()
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");

            var result = await _listenHistoryService.GetUserListenStatsAsync(userId);
            return HandleResult(result);
        }

        /// <summary>
        /// Clear user's listen history
        /// </summary>
        [HttpDelete("history")]
        public async Task<IActionResult> ClearHistory()
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");

            var result = await _listenHistoryService.ClearHistoryAsync(userId);
            return HandleResult(result);
        }

        /// <summary>
        /// Get history by date range
        /// </summary>
        [HttpGet("history/range")]
        public async Task<IActionResult> GetHistoryByDateRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");

            var result = await _listenHistoryService.GetHistoryByDateRangeAsync(userId, startDate, endDate);
            return HandleResult(result);
        }

        /// <summary>
        /// Update listen duration for a history record
        /// </summary>
        [HttpPatch("history/{historyId}/duration")]
        public async Task<IActionResult> UpdateListenDuration(Guid historyId, [FromQuery] int msPlayed)
        {
            var result = await _listenHistoryService.UpdateListenDurationAsync(historyId, msPlayed);
            return HandleResult(result);
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
