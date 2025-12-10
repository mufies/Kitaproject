namespace Service.DTOs.Music
{
    public class ListenWrappedDto
    {
        public Guid Id { get; set; }
        public Guid SongId { get; set; }
        public Guid UserId { get; set; }
        public int Year { get; set; }
        public int? MsPlayed { get; set; }
        public int PlayCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties (optional)
        public string? SongTitle { get; set; }
        public string? ArtistName { get; set; }
        public string? UserName { get; set; }
    }
}
