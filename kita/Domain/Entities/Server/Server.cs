using System;
using System.Collections.Generic;

namespace Kita.Domain.Entities.Server
{
    public class Server : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? IconUrl { get; set; }

        public Guid OwnerId { get; set; }
        public virtual User Owner { get; set; } = null!;

        public virtual ICollection<ServerMember> Members { get; set; } = new List<ServerMember>();
        public virtual ICollection<Channel> Channels { get; set; } = new List<Channel>();
        public virtual ICollection<ServerInvite> Invites { get; set; } = new List<ServerInvite>();
    }
}
