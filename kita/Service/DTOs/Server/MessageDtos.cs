using System;

namespace Kita.Service.DTOs.Server
{
    public class MessageDto
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public DateTime SentAt { get; set; }
        public Guid SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string? SenderAvatarUrl { get; set; }
        public Guid ChannelId { get; set; }
        public bool IsEdited { get; set; }
    }

    public class CreateMessageDto
    {
        public string Content { get; set; } = string.Empty;
        public Guid ChannelId { get; set; }
    }

    public class CreateImageMessageDto
    {
        public Guid ChannelId { get; set; }
        public string? Caption { get; set; }
    }

    public class UpdateMessageDto
    {
        public string Content { get; set; } = string.Empty;
    }
}
