using System;
using System.Collections.Generic;
using Domain.Enums;
using Kita.Domain.Enums;

namespace Kita.Service.DTOs.Music
{
    public class SongDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string? Album { get; set; }
        public double Duration { get; set; }
        public string StreamUrl { get; set; } = string.Empty;
        public string? CoverUrl { get; set; }
        public SongStatus Status { get; set; }
        public SongType Type { get; set; }
        public List<MusicGenre> Genres { get; set; } = new List<MusicGenre>();
        public AudioQuality AudioQuality { get; set; }
        

    }

    public class CreateSongDto
    {
        public string Title { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string? Album { get; set; }
        public double Duration { get; set; }
        public string StreamUrl { get; set; } = string.Empty;
        public string? CoverUrl { get; set; }
        public SongStatus Status { get; set; } = SongStatus.Active;
        public SongType Type { get; set; } = SongType.Single;
        public List<MusicGenre> Genres { get; set; } = new List<MusicGenre>();
        public AudioQuality AudioQuality { get; set; } = AudioQuality.Normal;

    }

    public class PlaylistDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsPublic { get; set; }
        public Guid OwnerId { get; set; }
        public List<SongDto> Songs { get; set; } = new List<SongDto>();
    }

    public class CreatePlaylistDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsPublic { get; set; }
    }
}
