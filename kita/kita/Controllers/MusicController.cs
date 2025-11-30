using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Kita.Service.DTOs.Music;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kita.Controllers
{
    [Authorize]
    public class MusicController : BaseApiController
    {
        private readonly IMusicService _musicService;
        private readonly IPlaylistService _playlistService;

        public MusicController(IMusicService musicService, IPlaylistService playlistService)
        {
            _musicService = musicService;
            _playlistService = playlistService;
        }

        [HttpPost("songs")]
        public async Task<IActionResult> CreateSong(CreateSongDto createSongDto)
        {
            var result = await _musicService.CreateSongAsync(createSongDto);
            return HandleResult(result);
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadSong([FromForm] CreateSongDto createSongDto, [FromForm] IFormFile songFile, [FromForm] IFormFile? coverFile)
        {
            var result = await _musicService.UploadSongAsync(createSongDto, songFile, coverFile);
            return HandleResult(result);
        }

        [HttpGet("songs")]
        public async Task<IActionResult> GetAllSongs()
        {
            var result = await _musicService.GetAllSongsAsync();
            return HandleResult(result);
        }

        [HttpPost("playlists")]
        public async Task<IActionResult> CreatePlaylist(CreatePlaylistDto createPlaylistDto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _playlistService.CreatePlaylistAsync(createPlaylistDto, userId);
            return HandleResult(result);
        }

        [HttpPost("playlists/{playlistId}/songs/{songId}")]
        public async Task<IActionResult> AddSongToPlaylist(Guid playlistId, Guid songId)
        {
            var result = await _playlistService.AddSongToPlaylistAsync(playlistId, songId);
            return HandleResult(result);
        }

        [HttpGet("playlists")]
        public async Task<IActionResult> GetUserPlaylists()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _playlistService.GetUserPlaylistsAsync(userId);
            return HandleResult(result);
        }
    }
}
