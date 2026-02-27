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
        public int? Volume { get; set; } // Volume level (0-100)
        public string QueueJson { get; set; } = "[]"; 
    }
}
