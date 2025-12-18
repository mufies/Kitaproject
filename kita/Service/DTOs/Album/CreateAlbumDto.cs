using System;

namespace Kita.Service.DTOs.Album
{
    public class CreateAlbumDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid ArtistId { get; set; }
    }
}
