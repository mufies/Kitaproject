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

        public MusicController(IMusicService musicService)
        {
            _musicService = musicService;
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

        [HttpGet("songs/{id}")]
        public async Task<IActionResult> GetSongById(Guid id)
        {
            var result = await _musicService.GetSongByIdAsync(id);
            return HandleResult(result);
        }

        [HttpPut("songs/{id}")]
        public async Task<IActionResult> UpdateSong(Guid id, SongDto updateSongDto)
        {
            var result = await _musicService.UpdateSongAsync(id, updateSongDto);
            return HandleResult(result);
        }

        [HttpPatch("songs/{id}/status")]
        public async Task<IActionResult> ChangeSongStatus(Guid id, [FromBody] string status)
        {
            var result = await _musicService.ChangeSongStatusAsync(id, status);
            return HandleResult(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("songs/all")]
        public async Task<IActionResult> DeleteAllSongs()
        {
            var result = await _musicService.DeleteAllSongsAsync();
            return HandleResult(result);
        }

        [HttpGet("songs/filterByName/{name}")]
        public async Task<IActionResult> FilterSongByName(string name)
        {
            var result = await _musicService.FilterSongByName(name);
            return HandleResult(result);
        }
        
        [HttpGet("songs/filterByArtist/{artist}")]
        public async Task<IActionResult> FilterSongByArtist(string artist)
        {
            var result = await _musicService.FilterSongByArtist(artist);
            return HandleResult(result);
        }

        [HttpGet("songs/filterByAlbum/{album}")]
        public async Task<IActionResult> FilterSongByAlbum(string album)
        {
            var result = await _musicService.FilterSongByAlbum(album);
            return HandleResult(result);
        }

        [HttpGet("songs/filterByGenre/{genre}")]
        public async Task<IActionResult> FilterSongByGenre(string genre)
        {
            var result = await _musicService.FilterSongByGenre(genre);
            return HandleResult(result);
        }

        [HttpGet("songs/filterByAudioQuality/{audioQuality}")]
        public async Task<IActionResult> FilterSongByAudioQuality(string audioQuality)
        {
            var result = await _musicService.FilterSongByAudioQuality(audioQuality);
            return HandleResult(result);
        }
    }
}
