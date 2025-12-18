using System;
using Domain.Entities.Music;
using Domain.Enums;
using Kita.Domain.Enums;

namespace Kita.Domain.Entities.Music
{
    public class Song : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public Guid? ArtistId { get; set; } 
        public Guid? AlbumId { get; set; }
        public double Duration { get; set; } // In seconds
        public string StreamUrl { get; set; } = string.Empty;
        public string? CoverUrl { get; set; }
        public List<MusicGenre> Genres { get; set; } = new List<MusicGenre>();
        public SongType Type { get; set; } = SongType.Single;
        public AudioQuality AudioQuality { get; set; } = AudioQuality.Normal;
        public SongStatus Status { get; set; } = SongStatus.Active;
        public Guid? UserId { get; set; }
        public virtual User? User { get; set; }   
        public virtual Artist? Artist { get; set; }
        public virtual Album? Album { get; set; }
        public virtual SongStatics? SongStatics { get; set; }
    }
}
