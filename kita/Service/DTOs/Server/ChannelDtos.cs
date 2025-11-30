using System;
using Kita.Domain.Entities.Server;

namespace Kita.Service.DTOs.Server
{
    public class ChannelDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public ChannelType Type { get; set; }
        public Guid ServerId { get; set; }
    }

    public class CreateChannelDto
    {
        public string Name { get; set; } = string.Empty;
        public ChannelType Type { get; set; }
        public Guid ServerId { get; set; }
    }
    
}
