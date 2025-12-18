using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Kita.Service.DTOs;
using Kita.Service.DTOs.Artist;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kita.Controllers
{
    public class ArtistController : BaseApiController
    {
        private readonly IArtistService _artistService;

        public ArtistController(IArtistService artistService)
        {
            _artistService = artistService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllArtists()
        {
            var result = await _artistService.GetAllArtistsAsync();
            return HandleResult(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetArtistById(Guid id)
        {
            var result = await _artistService.GetArtistByIdAsync(id);
            return HandleResult(result);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchArtists([FromQuery] string query)
        {
            var result = await _artistService.SearchArtistsAsync(query);
            return HandleResult(result);
        }

        [Authorize]
        [HttpGet("my-artists")]
        public async Task<IActionResult> GetMyArtists()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _artistService.GetArtistsByUserAsync(userId);
            return HandleResult(result);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateArtist([FromBody] CreateArtistDto createDto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _artistService.CreateArtistAsync(userId, createDto);
            return HandleResult(result);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateArtist(Guid id, [FromBody] UpdateArtistDto updateDto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _artistService.UpdateArtistAsync(userId, id, updateDto);
            return HandleResult(result);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteArtist(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _artistService.DeleteArtistAsync(userId, id);
            return HandleResult(result);
        }

        [Authorize]
        [HttpPost("{id}/image")]
        public async Task<IActionResult> UploadArtistImage(Guid id, [FromForm] FileUploadDto uploadDto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _artistService.UploadArtistImageAsync(userId, id, uploadDto.File);
            return HandleResult(result);
        }
    }
}
