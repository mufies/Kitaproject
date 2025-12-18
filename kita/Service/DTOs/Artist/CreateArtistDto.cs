using System;
using Microsoft.AspNetCore.Http;

namespace Kita.Service.DTOs.Artist
{
    public class CreateArtistDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public IFormFile? Image { get; set; }
    }
}
