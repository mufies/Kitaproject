using System;

namespace Kita.Domain.Entities.Server
{
    public class MessageReaction : BaseEntity
    {
        public Guid MessageId { get; set; }
        public virtual Message Message { get; set; } = null!;

        public Guid UserId { get; set; }
        public virtual User User { get; set; } = null!;

        public string Emoji { get; set; } = string.Empty;
    }
}
