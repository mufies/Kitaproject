using System;

namespace Kita.Domain.Entities.Server
{
    public enum ServerRole
    {
        Member,
        Admin,
        Owner
    }

    public class ServerMember : BaseEntity
    {
        public Guid ServerId { get; set; }
        public virtual Server Server { get; set; } = null!;

        public Guid UserId { get; set; }
        public virtual User User { get; set; } = null!;

        public string? Nickname { get; set; }
        public ServerRole Role { get; set; } = ServerRole.Member;
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}
