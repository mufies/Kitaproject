using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading;

namespace Kita.Service.Models
{
    public class MusicBot
    {
        public string ChannelId { get; set; } = string.Empty;
        public int UserCount { get; set; }
        public CancellationTokenSource? LeaveCancellationTokenSource { get; set; }
        public DateTime? ScheduledLeaveTime { get; set; }
        public Guid? CurrentSongId { get; set; }
        public string? CurrentSongStreamUrl { get; set; }
        public DateTime? PlaybackStartedAt { get; set; }
        public bool IsPlaying { get; set; }
        public ConcurrentQueue<Guid> SongQueue { get; set; } = new ConcurrentQueue<Guid>();
        public int Volume { get; set; } = 100;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
