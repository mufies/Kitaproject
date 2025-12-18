using System;
using System.Collections.Generic;

namespace Kita.Service.DTOs.Album
{
    public class AlbumDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public Guid ArtistId { get; set; }
        public string? ArtistName { get; set; }
        public int SongCount { get; set; }
    }

    public class AlbumDetailDto : AlbumDto
    {
        public List<AlbumSongDto> Songs { get; set; } = new List<AlbumSongDto>();
    }

    public class AlbumSongDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? CoverUrl { get; set; }
        public double Duration { get; set; }
        public int TrackNumber { get; set; }
    }
}
