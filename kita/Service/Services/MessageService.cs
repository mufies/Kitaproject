using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kita.Domain.Entities;
using Kita.Domain.Entities.Server;
using Kita.Infrastructure.Repositories;
using Kita.Service.Common;
using Kita.Service.DTOs.Server;
using Kita.Service.Interfaces;

namespace Kita.Service.Services
{
    public class MessageService : IMessageService
    {
        private readonly IBaseRepository<Message> _messageRepository;
        private readonly IBaseRepository<User> _userRepository;

        public MessageService(IBaseRepository<Message> messageRepository, IBaseRepository<User> userRepository)
        {
            _messageRepository = messageRepository;
            _userRepository = userRepository;
        }

        public async Task<ApiResponse<MessageDto>> SendMessageAsync(CreateMessageDto createMessageDto, Guid senderId)
        {
            var message = new Message
            {
                Content = createMessageDto.Content,
                ChannelId = createMessageDto.ChannelId,
                SenderId = senderId,
                SentAt = DateTime.UtcNow
            };

            await _messageRepository.AddAsync(message);
            await _messageRepository.SaveChangesAsync();

            var sender = await _userRepository.GetByIdAsync(senderId);

            return new ApiResponse<MessageDto>(new MessageDto
            {
                Id = message.Id,
                Content = message.Content,
                SentAt = message.SentAt,
                SenderId = message.SenderId,
                SenderName = sender?.UserName ?? "Unknown",
                ChannelId = message.ChannelId
            });
        }

        public async Task<ApiResponse<List<MessageDto>>> GetChannelMessagesAsync(Guid channelId)
        {
            var messages = await _messageRepository.FindAsync(m => m.ChannelId == channelId);
            

            var messageDtos = new List<MessageDto>();
            foreach (var m in messages)
            {
                var sender = await _userRepository.GetByIdAsync(m.SenderId);
                messageDtos.Add(new MessageDto
                {
                    Id = m.Id,
                    Content = m.Content,
                    SentAt = m.SentAt,
                    SenderId = m.SenderId,
                    SenderName = sender?.UserName ?? "Unknown",
                    ChannelId = m.ChannelId
                });
            }

            return new ApiResponse<List<MessageDto>>(messageDtos.OrderBy(m => m.SentAt).ToList());
        }
    }
}
