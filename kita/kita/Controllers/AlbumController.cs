using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Kita.Service.DTOs;
using Kita.Service.DTOs.Album;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kita.Controllers
{
    public class AlbumController : BaseApiController
    {
        private readonly IAlbumService _albumService;

        public AlbumController(IAlbumService albumService)
        {
            _albumService = albumService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllAlbums()
        {
            var result = await _albumService.GetAllAlbumsAsync();
            return HandleResult(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAlbumById(Guid id)
        {
            var result = await _albumService.GetAlbumByIdAsync(id);
            return HandleResult(result);
        }

        [HttpGet("artist/{artistId}")]
        public async Task<IActionResult> GetAlbumsByArtist(Guid artistId)
        {
            var result = await _albumService.GetAlbumsByArtistAsync(artistId);
            return HandleResult(result);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchAlbums([FromQuery] string query)
        {
            var result = await _albumService.SearchAlbumsAsync(query);
            return HandleResult(result);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateAlbum([FromBody] CreateAlbumDto createDto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _albumService.CreateAlbumAsync(userId, createDto);
            return HandleResult(result);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAlbum(Guid id, [FromBody] UpdateAlbumDto updateDto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _albumService.UpdateAlbumAsync(userId, id, updateDto);
            return HandleResult(result);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAlbum(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _albumService.DeleteAlbumAsync(userId, id);
            return HandleResult(result);
        }

        [Authorize]
        [HttpPost("{id}/image")]
        public async Task<IActionResult> UploadAlbumImage(Guid id, [FromForm] FileUploadDto uploadDto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _albumService.UploadAlbumImageAsync(userId, id, uploadDto.File);
            return HandleResult(result);
        }

        [Authorize]
        [HttpPost("{id}/songs")]
        public async Task<IActionResult> AddSongsToAlbum(Guid id, [FromBody] AddSongsToAlbumDto dto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _albumService.AddSongsToAlbumAsync(userId, id, dto);
            return HandleResult(result);
        }

        [Authorize]
        [HttpDelete("{id}/songs")]
        public async Task<IActionResult> RemoveSongsFromAlbum(Guid id, [FromBody] RemoveSongsFromAlbumDto dto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _albumService.RemoveSongsFromAlbumAsync(userId, id, dto);
            return HandleResult(result);
        }

        [Authorize]
        [HttpPost("{id}/like")]
        public async Task<IActionResult> LikeAlbum(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _albumService.LikeAlbumAsync(userId, id);
            return HandleResult(result);
        }

        [Authorize]
        [HttpDelete("{id}/like")]
        public async Task<IActionResult> UnlikeAlbum(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _albumService.UnlikeAlbumAsync(userId, id);
            return HandleResult(result);
        }

        [Authorize]
        [HttpGet("liked")]
        public async Task<IActionResult> GetLikedAlbums()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _albumService.GetLikedAlbumsAsync(userId);
            return HandleResult(result);
        }

        [Authorize]
        [HttpGet("{id}/is-liking")]
        public async Task<IActionResult> IsLikingAlbum(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _albumService.IsLikingAlbumAsync(userId, id);
            return HandleResult(result);
        }
    }
}
