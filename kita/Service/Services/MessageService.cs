using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Kita.Domain.Entities.Server;
using Kita.Infrastructure.Repositories;
using Kita.Service.Common;
using Kita.Service.DTOs.Server;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Kita.Service.Services
{
    public class MessageService : IMessageService
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IBaseRepository<MessageReaction> _reactionRepository;
        private readonly IConfiguration _configuration;

        public MessageService(IMessageRepository messageRepository, IBaseRepository<MessageReaction> reactionRepository, IConfiguration configuration)
        {
            _messageRepository = messageRepository;
            _reactionRepository = reactionRepository;
            _configuration = configuration;
        }

        public async Task<ApiResponse<MessageDto>> SendMessageAsync(CreateMessageDto createMessageDto, Guid senderId)
        {
            var message = new Message
            {
                Content = createMessageDto.Content,
                ChannelId = createMessageDto.ChannelId,
                SenderId = senderId,
                SentAt = DateTime.UtcNow,
                ReplyToId = createMessageDto.ReplyToId,
                ReplyToContent = createMessageDto.ReplyToContent,
                ReplyToSenderName = createMessageDto.ReplyToSenderName
            };

            await _messageRepository.AddAsync(message);
            await _messageRepository.SaveChangesAsync();

            // Fetch with sender to get sender info
            var savedMessage = await _messageRepository.GetMessageWithSenderAsync(message.Id);

            return new ApiResponse<MessageDto>(MapToDto(savedMessage!));
        }

        public async Task<ApiResponse<MessageDto>> SendImageMessageAsync(CreateImageMessageDto createImageMessageDto, IFormFile imageFile, Guid senderId)
        {
            if (imageFile == null || imageFile.Length == 0)
            {
                return ApiResponse<MessageDto>.Fail("No image file uploaded.");
            }

            var storagePath = _configuration["FileStorage:BasePath"];
            var baseUrl = _configuration["FileStorage:BaseUrl"];

            if (string.IsNullOrEmpty(storagePath) || string.IsNullOrEmpty(baseUrl))
            {
                return ApiResponse<MessageDto>.Fail("File storage is not configured.");
            }

            var messagesPath = Path.Combine(storagePath, "messages");
            if (!Directory.Exists(messagesPath))
            {
                Directory.CreateDirectory(messagesPath);
            }

            var fileExtension = Path.GetExtension(imageFile.FileName);
            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(messagesPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await imageFile.CopyToAsync(stream);
            }

            var imageUrl = $"{baseUrl}/messages/{fileName}";

            var message = new Message
            {
                Content = createImageMessageDto.Caption ?? string.Empty,
                ImageUrl = imageUrl,
                ChannelId = createImageMessageDto.ChannelId,
                SenderId = senderId,
                SentAt = DateTime.UtcNow
            };

            await _messageRepository.AddAsync(message);
            await _messageRepository.SaveChangesAsync();

            var savedMessage = await _messageRepository.GetMessageWithSenderAsync(message.Id);

            return new ApiResponse<MessageDto>(MapToDto(savedMessage!), "Image message sent successfully.");
        }

        public async Task<ApiResponse<List<MessageDto>>> GetChannelMessagesAsync(Guid channelId, int take = 50, int skip = 0)
        {
            var messages = await _messageRepository.GetMessagesByChannelIdAsync(channelId, take, skip);
            var messageDtos = messages.Select(MapToDto).ToList();

            return new ApiResponse<List<MessageDto>>(messageDtos);
        }

        public async Task<ApiResponse<MessageDto>> GetMessageByIdAsync(Guid messageId)
        {
            var message = await _messageRepository.GetMessageWithSenderAsync(messageId);
            if (message == null)
                return ApiResponse<MessageDto>.Fail("Message not found.");

            return new ApiResponse<MessageDto>(MapToDto(message));
        }

        public async Task<ApiResponse<MessageDto>> UpdateMessageAsync(Guid messageId, UpdateMessageDto updateMessageDto, Guid userId)
        {
            var message = await _messageRepository.GetMessageWithSenderAsync(messageId);
            if (message == null)
                return ApiResponse<MessageDto>.Fail("Message not found.");

            // Only the sender can edit their own message
            if (message.SenderId != userId)
                return ApiResponse<MessageDto>.Fail("You can only edit your own messages.");

            message.Content = updateMessageDto.Content;
            message.IsEdited = true;

            await _messageRepository.UpdateAsync(message);
            await _messageRepository.SaveChangesAsync();

            return new ApiResponse<MessageDto>(MapToDto(message));
        }

        public async Task<ApiResponse<bool>> DeleteMessageAsync(Guid messageId, Guid userId)
        {
            var message = await _messageRepository.GetByIdAsync(messageId);
            if (message == null)
                return ApiResponse<bool>.Fail("Message not found.");

            if (message.SenderId != userId)
                return ApiResponse<bool>.Fail("You can only delete your own messages.");

            await _messageRepository.DeleteAsync(messageId);
            await _messageRepository.SaveChangesAsync();

            return new ApiResponse<bool>(true, "Message deleted successfully.");
        }

        public async Task<ApiResponse<MessageDto>> ToggleReactionAsync(Guid messageId, string emoji, Guid userId)
        {
            var message = await _messageRepository.GetByIdAsync(messageId);
            if (message == null)
                return ApiResponse<MessageDto>.Fail("Message not found.", code: 404);

            var existingReactions = await _reactionRepository.FindAsync(r => r.MessageId == messageId && r.UserId == userId && r.Emoji == emoji);
            var reaction = existingReactions.FirstOrDefault();

            if (reaction != null)
            {
                // Remove reaction
                await _reactionRepository.DeleteAsync(reaction.Id);
            }
            else
            {
                // Add reaction
                var newReaction = new MessageReaction
                {
                    MessageId = messageId,
                    UserId = userId,
                    Emoji = emoji
                };
                await _reactionRepository.AddAsync(newReaction);
            }

            await _reactionRepository.SaveChangesAsync();

            // Refetch message with sender & reactions
            var updatedMessage = await _messageRepository.GetMessageWithSenderAsync(messageId);
            return new ApiResponse<MessageDto>(MapToDto(updatedMessage!), "Reaction toggled successfully.");
        }

        private static MessageDto MapToDto(Message message)
        {
            var reactions = message.MessageReactions?.Select(r => new MessageReactionDto { UserId = r.UserId, Emoji = r.Emoji }).ToList() ?? new List<MessageReactionDto>();
            return new MessageDto
            {
                Id = message.Id,
                Content = message.Content,
                ImageUrl = message.ImageUrl,
                SentAt = message.SentAt,
                SenderId = message.SenderId,
                SenderName = message.Sender?.UserName ?? "Unknown",
                SenderAvatarUrl = message.Sender?.AvatarUrl,
                ChannelId = message.ChannelId,
                IsEdited = message.IsEdited,
                ReplyToId = message.ReplyToId,
                ReplyToContent = message.ReplyToContent,
                ReplyToSenderName = message.ReplyToSenderName,
                Reactions = reactions
            };
        }

        public async Task<ApiResponse<bool>> DeleteAllMessagesAsync(Guid channelId)
        {
            await _messageRepository.DeleteAllMessagesAsync(channelId);
            await _messageRepository.SaveChangesAsync();

            return new ApiResponse<bool>(true, "All messages deleted successfully.");
        }

        
        
    }
}
