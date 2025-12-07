using Kita.Domain.Entities;
using Kita.Domain.Entities.Music;
namespace Domain.Entities.Music
{
    public class Comment : BaseEntity
    {
        public Guid SongId { get; set; }
        public Guid UserId { get; set; }
        public string Content { get; set; } = string.Empty;
        public virtual Song Song { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
}