using System;
using System.Collections.Generic;

namespace Kita.Domain.Entities.Server
{
    public enum ChannelType
    {
        Text,
        Voice
    }

    public class Channel : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public ChannelType Type { get; set; }

        public Guid ServerId { get; set; }
        public virtual Server Server { get; set; } = null!;

        // For Text Channels
        public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

        // For Voice Channels
        public virtual PlaybackSession? PlaybackSession { get; set; }
    }
}
