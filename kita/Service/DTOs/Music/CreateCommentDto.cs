namespace Service.DTOs.Music
{
    public class CreateCommentDto
    {
        public Guid SongId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
