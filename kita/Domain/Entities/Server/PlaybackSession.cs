using System;
using Kita.Domain.Entities.Music;

namespace Kita.Domain.Entities.Server
{
    public class PlaybackSession : BaseEntity
    {
        public Guid ChannelId { get; set; }
        public virtual Channel Channel { get; set; } = null!;

        public Guid? CurrentSongId { get; set; }
        public virtual Song? CurrentSong { get; set; }

        public double Position { get; set; } // Current position in seconds
        public bool IsPlaying { get; set; }

        // Simple queue implementation: JSON string of SongIds or similar. 
        // For a more complex queue, we might want a separate entity, but this suffices for basic.
        public string QueueJson { get; set; } = "[]"; 
    }
}
