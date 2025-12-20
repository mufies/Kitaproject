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
        public string Artist { get; set; } = string.Empty; // Artist name for display
        public string? Album { get; set; } // Album name for display
        public Guid? ArtistId { get; set; } // Artist entity ID
        public Guid? AlbumId { get; set; } // Album entity ID
        public Guid? UserId { get; set; } // Uploader ID (for user uploads)
        public string? Uploader {get; set;} 
        public double Duration { get; set; }
        public string StreamUrl { get; set; } = string.Empty;
        public string? CoverUrl { get; set; }
        public SongStatus Status { get; set; }
        public SongType Type { get; set; }
        public List<MusicGenre> Genres { get; set; } = new List<MusicGenre>();
        public AudioQuality AudioQuality { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
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
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    }

    public class CreateArtistSongDto
    {
        public Guid ArtistId { get; set; }
        public string Title { get; set; } = string.Empty;
        public Guid? AlbumId { get; set; }
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
        public string? CoverUrl { get; set; }
        public bool IsPublic { get; set; }
        public Guid OwnerId { get; set; }
        public List<SongDto> Songs { get; set; } = new List<SongDto>();
        public double TotalDuration { get; set; }
    }

    public class CreatePlaylistDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsPublic { get; set; }
    }

    public class ImportPlaylistRequestDto
    {
        public string PlaylistUrl { get; set; } = string.Empty;
    }

    public class ImportPlaylistResponseDto
    {
        public Guid PlaylistId { get; set; }
        public string PlaylistName { get; set; } = string.Empty;
        public int TotalTracks { get; set; }
        public int Downloaded { get; set; }
        public int Skipped { get; set; }
        public int Failed { get; set; }
        public List<ImportedSongDto> ImportedSongs { get; set; } = new List<ImportedSongDto>();
        public string Message { get; set; } = string.Empty;
    }

    public class ImportedSongDto
    {
        public string Title { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public bool WasDownloaded { get; set; }
        public bool AlreadyExisted { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
