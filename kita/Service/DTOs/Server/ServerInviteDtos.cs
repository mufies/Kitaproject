using System;

namespace Kita.Service.DTOs.Server
{
    public class ServerInviteDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public Guid ServerId { get; set; }
        public string ServerName { get; set; } = string.Empty;
        public Guid CreatedById { get; set; }
        public string CreatedByUsername { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public int? MaxUses { get; set; }
        public int Uses { get; set; }
        public bool IsRevoked { get; set; }
        public bool IsExpired { get; set; }
        public bool IsValid { get; set; }
    }

    public class CreateServerInviteDto
    {
        public int? MaxUses { get; set; }
        public int? ExpiresInHours { get; set; }
    }

    public class UseInviteDto
    {
        public string Code { get; set; } = string.Empty;
    }
}
