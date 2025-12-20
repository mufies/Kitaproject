using System;
using System.Collections.Generic;
using Kita.Domain.Entities;

namespace Kita.Service.DTOs.Artist
{
    public class ArtistDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string Role { get; set; } = "Artist";
        public int SongCount { get; set; }
        public int AlbumCount { get; set; }
        public int FollowedByCount { get; set; }
    }

    public class ArtistDetailDto : ArtistDto
    {
        public List<ArtistSongDto> Songs { get; set; } = new List<ArtistSongDto>();
        public List<ArtistAlbumDto> Albums { get; set; } = new List<ArtistAlbumDto>();

    }

    public class ArtistSongDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? CoverUrl { get; set; }
        public double Duration { get; set; }
    }

    public class ArtistAlbumDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public int SongCount { get; set; }
    }
}
