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
}
