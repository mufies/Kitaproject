using System;

namespace Kita.Domain.Entities.Music
{
    public class PlaylistSong : BaseEntity
    {
        public Guid PlaylistId { get; set; }
        public virtual Playlist Playlist { get; set; } = null!;

        public Guid SongId { get; set; }
        public virtual Song Song { get; set; } = null!;

        public int OrderIndex { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}
