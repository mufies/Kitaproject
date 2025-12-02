using Microsoft.AspNetCore.Mvc;
using Kita.Service.Interfaces;

namespace Kita.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class SpotifyController : ControllerBase
    {
        private readonly ISpotifyService _spotifyService;

        public SpotifyController(ISpotifyService spotifyService)
        {
            _spotifyService = spotifyService;
        }


        [HttpGet("{playlistId}/tracks")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetPlaylistTracks(string playlistId)
        {
            if (string.IsNullOrWhiteSpace(playlistId))
            {
                return BadRequest(new { message = "Playlist ID is required." });
            }

            try
            {
                var tracks = await _spotifyService.GetPlaylistTracksAsync(playlistId);
                return Ok(tracks);
            }
            catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return NotFound(new { message = "Playlist not found." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching playlist tracks.", error = ex.Message });
            }
        }
    }
}
