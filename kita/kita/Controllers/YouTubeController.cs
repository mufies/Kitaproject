using Microsoft.AspNetCore.Mvc;
using Kita.Service.Interfaces;
using System.Threading.Tasks;

namespace Kita.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class YouTubeController : ControllerBase
    {
        private readonly IYouTubeService _youTubeService;

        public YouTubeController(IYouTubeService youTubeService)
        {
            _youTubeService = youTubeService;
        }

        [HttpGet("playlist/{playlistId}")]
        public async Task<IActionResult> GetPlaylistVideos(string playlistId)
        {
            if (string.IsNullOrWhiteSpace(playlistId))
            {
                return BadRequest(new { message = "Playlist ID is required." });
            }

            var result = await _youTubeService.GetPlaylistVideosAsync(playlistId);

            if (!result.Success)
            {
                return StatusCode(result.Code, new { message = result.Message });
            }

            return Ok(result);
        }

        [HttpGet("video/info")]
        public async Task<IActionResult> GetVideoInfo([FromQuery] string url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return BadRequest(new { message = "Video URL is required." });
            }

            var result = await _youTubeService.GetVideoInfoAsync(url);

            if (!result.Success)
            {
                return StatusCode(result.Code, new { message = result.Message });
            }

            return Ok(result);
        }

        [HttpGet("video/download")]
        public async Task<IActionResult> DownloadVideo([FromQuery] string url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return BadRequest(new { message = "Video URL is required." });
            }

            var result = await _youTubeService.DownloadVideoAsync(url);

            if (!result.Success)
            {
                return StatusCode(result.Code, new { message = result.Message });
            }

            return Ok(result);
        }

        [HttpGet("video/geturlsinfo")]
        public async Task<IActionResult> GetVideoUrlsBaseOnNameAndArtist([FromQuery] string name, [FromQuery] string artist)
        {
            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(artist))
            {
                return BadRequest(new { message = "Song name and artist are required." });
            }

            var result = await _youTubeService.GetVideoUrlsBaseOnNameAndArtist(name, artist);

            if (result == null)
            {
                return NotFound(new { message = $"No video found for '{artist} - {name}'." });
            }

            return Ok(result);
        }

    }
}
