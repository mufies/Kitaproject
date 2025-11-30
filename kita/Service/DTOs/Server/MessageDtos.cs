using System;

namespace Kita.Service.DTOs.Server
{
    public class MessageDto
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
        public Guid SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public Guid ChannelId { get; set; }
    }

    public class CreateMessageDto
    {
        public string Content { get; set; } = string.Empty;
        public Guid ChannelId { get; set; }
    }
}
