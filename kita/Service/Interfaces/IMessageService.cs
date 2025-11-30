using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Service.Common;
using Kita.Service.DTOs.Server;

namespace Kita.Service.Interfaces
{
    public interface IMessageService
    {
        Task<ApiResponse<MessageDto>> SendMessageAsync(CreateMessageDto createMessageDto, Guid senderId);
        Task<ApiResponse<List<MessageDto>>> GetChannelMessagesAsync(Guid channelId);
    }
}
