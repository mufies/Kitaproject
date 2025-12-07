using Kita.Domain.Entities.Music;
using Kita.Domain.Entities;

namespace Domain.Entities.Music
{
    public class ListenHistory : BaseEntity
    {
        public Guid SongId { get; set; }
        public Guid UserId { get; set; }
        public int? MsPlayed { get; set; }
        public virtual Song Song { get; set; } = null!;
        public virtual User User { get; set; } = null!;

    }
}