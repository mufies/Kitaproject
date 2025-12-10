using Kita.Domain.Entities;
using Kita.Domain.Entities.Music;

namespace Domain.Entities.Music
{
    public class ListenWrapped : BaseEntity
    {
        public Guid SongId { get; set; }
        public Guid UserId { get; set; }
        public int Year { get; set; }
        public int? MsPlayed { get; set; }
        public int PlayCount { get; set; }
        public virtual Song Song { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
}