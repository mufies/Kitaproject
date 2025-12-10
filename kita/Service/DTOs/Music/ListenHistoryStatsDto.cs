using Kita.Service.DTOs.Music;

namespace Service.DTOs.Music
{
    public class ListenHistoryStatsDto
    {
        public Guid UserId { get; set; }
        public int TotalListenCount { get; set; }
        public long TotalListenTimeMs { get; set; }
        public string TotalListenTimeFormatted { get; set; } = string.Empty;
        public int UniqueSongsListened { get; set; }
        public SongDto? MostPlayedSong { get; set; }
        public string? FavoriteArtist { get; set; }
        public string? FavoriteGenre { get; set; }
    }
}
