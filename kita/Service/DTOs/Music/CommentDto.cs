namespace Service.DTOs.Music
{
    public class CommentDto
    {
        public Guid Id { get; set; }
        public Guid SongId { get; set; }
        public Guid UserId { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties (optional)
        public string? UserName { get; set; }
        public string? UserAvatar { get; set; }
    }
}
