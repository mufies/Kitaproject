using System;
using System.Collections.Generic;

namespace Kita.Domain.Entities.Server
{
    public class Message : BaseEntity
    {
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public bool IsEdited { get; set; } = false;

        // Reply threading
        public Guid? ReplyToId { get; set; }
        public string? ReplyToContent { get; set; }
        public string? ReplyToSenderName { get; set; }

        public Guid ChannelId { get; set; }
        public virtual Channel Channel { get; set; } = null!;

        public Guid SenderId { get; set; }
        public virtual User Sender { get; set; } = null!;

        public virtual ICollection<MessageReaction> MessageReactions { get; set; } = new List<MessageReaction>();
    }
}
