using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Kita.Service.DTOs.Music;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kita.Controllers
{
    [Authorize]
    public class PlaylistController : BaseApiController
    {
        private readonly IPlaylistService _playlistService;

        public PlaylistController(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
        }

        // CRUD Operations

        [HttpPost]
        public async Task<IActionResult> CreatePlaylist([FromForm] CreatePlaylistDto createPlaylistDto, [FromForm] IFormFile? coverFile)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _playlistService.CreatePlaylistAsync(createPlaylistDto, userId, coverFile);
            return HandleResult(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetUserPlaylists()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _playlistService.GetUserPlaylistsAsync(userId);
            return HandleResult(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPlaylistById(Guid id)
        {
            var result = await _playlistService.GetPlaylistByIdAsync(id);
            return HandleResult(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePlaylist(Guid id, [FromForm] PlaylistDto updatePlaylistDto, [FromForm] IFormFile? coverFile)
        {
            var result = await _playlistService.UpdatePlaylistAsync(id, updatePlaylistDto, coverFile);
            return HandleResult(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePlaylist(Guid id)
        {
            var result = await _playlistService.DeletePlaylistAsync(id);
            return HandleResult(result);
        }

        // Song Management

        [HttpPost("{playlistId}/songs/{songId}")]
        public async Task<IActionResult> AddSongToPlaylist(Guid playlistId, Guid songId)
        {
            var result = await _playlistService.AddSongToPlaylistAsync(playlistId, songId);
            return HandleResult(result);
        }

        [HttpDelete("{playlistId}/songs/{songId}")]
        public async Task<IActionResult> RemoveSongFromPlaylist(Guid playlistId, Guid songId)
        {
            var result = await _playlistService.RemoveSongFromPlaylistAsync(playlistId, songId);
            return HandleResult(result);
        }

        [HttpGet("{id}/songs")]
        public async Task<IActionResult> GetSongsInPlaylist(Guid id)
        {
            var result = await _playlistService.GetSongInPlaylist(id);
            return HandleResult(result);
        }

        // Discovery & Search

        [HttpGet("all")]
        public async Task<IActionResult> GetAllPlaylists()
        {
            var result = await _playlistService.GetAllPlaylistsAsync();
            return HandleResult(result);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchPlaylists([FromQuery] string query)
        {
            var result = await _playlistService.GetPlaylistsBySearchAsync(query);
            return HandleResult(result);
        }

        // Import Playlist

        [HttpPost("importPlaylist")]
        public async Task<IActionResult> ImportPlaylist([FromBody] ImportPlaylistRequestDto request)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _playlistService.ImportPlaylistAsync(request, userId);
            return HandleResult(result);
        }

        // Get playlists containing a specific song
        [HttpGet("song/{songId}")]
        public async Task<IActionResult> GetPlaylistsBySongId(Guid songId)
        {
            var result = await _playlistService.GetPlaylistsBySongIdAsync(songId);
            return HandleResult(result);
        }

        // Get public playlists
        [HttpGet("public")]
        public async Task<IActionResult> GetPublicPlaylists()
        {
            var result = await _playlistService.GetPlaylistsByIsPublicAsync(true);
            return HandleResult(result);
        }

        // Get private playlists (user's own)
        [HttpGet("private")]
        public async Task<IActionResult> GetPrivatePlaylists()
        {
            var result = await _playlistService.GetPlaylistsByIsPrivateAsync(true);
            return HandleResult(result);
        }

        // Get playlists by user ID and song ID
        [HttpGet("user/{userId}/song/{songId}")]
        public async Task<IActionResult> GetPlaylistsByUserIdAndSongId(Guid userId, Guid songId)
        {
            var result = await _playlistService.GetPlaylistsByUserIdAndSongIdAsync(userId, songId);
            return HandleResult(result);
        }

        // Get public playlists by user ID
        [HttpGet("user/{userId}/public")]
        public async Task<IActionResult> GetPublicPlaylistsByUserId(Guid userId)
        {
            var result = await _playlistService.GetPublicPlaylistsByUserIdAsync(userId);
            return HandleResult(result);
        }
    }
}
