namespace Kita.Domain
{
    public class PlaybackState
    {
        public string? CurrentSongId { get; set; }
        public bool IsPlaying { get; set; }
        public double CurrentTime { get; set; }  // seconds (float from JS)
        public double Volume { get; set; } = 100;
        public string? PlaylistId { get; set; }
        public List<string> Queue { get; set; } = new();
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}
