using System.Security.Claims;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kita.Controllers
{
    [Authorize]
    public class ListenWrappedController : BaseApiController
    {
        private readonly IListenWrappedService _wrappedService;

        public ListenWrappedController(IListenWrappedService wrappedService)
        {
            _wrappedService = wrappedService;
        }

        /// <summary>
        /// Get user's wrapped data for a specific year
        /// </summary>
        [HttpGet("{year}")]
        public async Task<IActionResult> GetWrappedByYear(int year)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");

            var wrapped = await _wrappedService.GetUserWrappedByYearAsync(userId, year);
            return Ok(wrapped);
        }

        /// <summary>
        /// Get user's top songs for a specific year
        /// </summary>
        [HttpGet("{year}/top-songs")]
        public async Task<IActionResult> GetTopSongs(int year, [FromQuery] int limit = 5)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");

            var topSongs = await _wrappedService.GetTopSongsByYearAsync(userId, year, limit);
            return Ok(topSongs);
        }

        /// <summary>
        /// Get user's top artists for a specific year
        /// </summary>
        [HttpGet("{year}/top-artists")]
        public async Task<IActionResult> GetTopArtists(int year, [FromQuery] int limit = 5)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");

            var topArtists = await _wrappedService.GetTopArtistsByYearAsync(userId, year, limit);
            return Ok(topArtists);
        }

        /// <summary>
        /// Get user's top genres for a specific year
        /// </summary>
        [HttpGet("{year}/top-genres")]
        public async Task<IActionResult> GetTopGenres(int year, [FromQuery] int limit = 5)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");

            var topGenres = await _wrappedService.GetTopGenresByYearAsync(userId, year, limit);
            return Ok(topGenres);
        }

        /// <summary>
        /// Get user's total listen time for a specific year (in milliseconds)
        /// </summary>
        [HttpGet("{year}/total-time")]
        public async Task<IActionResult> GetTotalListenTime(int year)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");

            var totalTimeMs = await _wrappedService.GetTotalListenTimeByYearAsync(userId, year);
            var timeSpan = TimeSpan.FromMilliseconds(totalTimeMs);
            
            return Ok(new
            {
                TotalTimeMs = totalTimeMs,
                TotalMinutes = (int)timeSpan.TotalMinutes,
                TotalHours = Math.Round(timeSpan.TotalHours, 1),
                Formatted = timeSpan.TotalHours >= 1
                    ? $"{(int)timeSpan.TotalHours}h {timeSpan.Minutes}m"
                    : $"{timeSpan.Minutes}m {timeSpan.Seconds}s"
            });
        }

        /// <summary>
        /// Get user's total songs played for a specific year
        /// </summary>
        [HttpGet("{year}/total-songs")]
        public async Task<IActionResult> GetTotalSongsPlayed(int year)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");

            var totalSongs = await _wrappedService.GetTotalSongsPlayedByYearAsync(userId, year);
            return Ok(new { TotalSongsPlayed = totalSongs });
        }

        /// <summary>
        /// Get complete wrapped summary for a specific year
        /// </summary>
        [HttpGet("{year}/summary")]
        public async Task<IActionResult> GetWrappedSummary(int year)
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User ID not found in token");

            var topSongs = await _wrappedService.GetTopSongsByYearAsync(userId, year, 10);
            var topArtists = await _wrappedService.GetTopArtistsByYearAsync(userId, year, 5);
            var topGenres = await _wrappedService.GetTopGenresByYearAsync(userId, year, 5);
            var totalTimeMs = await _wrappedService.GetTotalListenTimeByYearAsync(userId, year);
            var totalSongs = await _wrappedService.GetTotalSongsPlayedByYearAsync(userId, year);

            var timeSpan = TimeSpan.FromMilliseconds(totalTimeMs);

            return Ok(new
            {
                Year = year,
                TopSongs = topSongs.Select(s => new
                {
                    s.SongId,
                    SongTitle = s.Song?.Title,
                    Artist = s.Song?.Artist,
                    CoverUrl = s.Song?.CoverUrl,
                    s.PlayCount
                }),
                TopArtists = topArtists,
                TopGenres = topGenres,
                TotalListenTime = new
                {
                    Ms = totalTimeMs,
                    Minutes = (int)timeSpan.TotalMinutes,
                    Hours = Math.Round(timeSpan.TotalHours, 1),
                    Formatted = timeSpan.TotalHours >= 1
                        ? $"{(int)timeSpan.TotalHours}h {timeSpan.Minutes}m"
                        : $"{timeSpan.Minutes}m {timeSpan.Seconds}s"
                },
                TotalSongsPlayed = totalSongs
            });
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
