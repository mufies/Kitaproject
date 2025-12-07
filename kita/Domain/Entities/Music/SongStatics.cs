using Kita.Domain.Entities;
using Kita.Domain.Entities.Music;

namespace Domain.Entities.Music
{
    public class SongStatics : BaseEntity
    {
        public Guid SongId { get; set; }
        public int PlayCount { get; set; }
        public int LikeCount { get; set; }
        public int DislikeCount { get; set; }
        public int FavoriteCount { get; set; }
        public int ShareCount { get; set; }
        public Guid UserId { get; set; }
        
        // Track which users have interacted
        public List<Guid> LikedByUserIds { get; set; } = new List<Guid>();
        public List<Guid> DislikedByUserIds { get; set; } = new List<Guid>();
        public List<Guid> FavoritedByUserIds { get; set; } = new List<Guid>();
        
        public List<Comment> Comments { get; set; } = new List<Comment>();
        public virtual Song Song { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
}