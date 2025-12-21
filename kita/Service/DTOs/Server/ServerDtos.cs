using System;

namespace Kita.Service.DTOs.Server
{
    public class ServerDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? IconUrl { get; set; }
        public Guid OwnerId { get; set; }
    }

    public class CreateServerDto
    {
        public string Name { get; set; } = string.Empty;
        public string? IconUrl { get; set; }
    }

    public class UpdateServerDto
    {
        public string Name { get; set; } = string.Empty;
        public string? IconUrl { get; set; }
    }

    public class ServerMemberDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string? Nickname { get; set; }
        public string Role { get; set; } = "Member";
        public DateTime JoinedAt { get; set; }
    }
}
