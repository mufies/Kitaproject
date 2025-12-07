using Service.DTOs.Music;

namespace Kita.Service.DTOs.Music
{
    public class SongStaticsDto
    {
        public Guid Id { get; set; }
        public Guid SongId { get; set; }
        public int PlayCount { get; set; }
        public int LikeCount { get; set; }
        public int DislikeCount { get; set; }
        public int FavoriteCount { get; set; }
        public int ShareCount { get; set; }
        public List<CommentDto> Comments { get; set; } = new List<CommentDto>();
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        // Optional navigation properties
        public string? SongTitle { get; set; }
        public string? ArtistName { get; set; }
    }
}