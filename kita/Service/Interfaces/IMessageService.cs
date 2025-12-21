using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Service.Common;
using Kita.Service.DTOs.Server;
using Microsoft.AspNetCore.Http;

namespace Kita.Service.Interfaces
{
    public interface IMessageService
    {
        Task<ApiResponse<MessageDto>> SendMessageAsync(CreateMessageDto createMessageDto, Guid senderId);
        Task<ApiResponse<MessageDto>> SendImageMessageAsync(CreateImageMessageDto createImageMessageDto, IFormFile imageFile, Guid senderId);
        Task<ApiResponse<List<MessageDto>>> GetChannelMessagesAsync(Guid channelId, int take = 50, int skip = 0);
        Task<ApiResponse<MessageDto>> GetMessageByIdAsync(Guid messageId);
        Task<ApiResponse<MessageDto>> UpdateMessageAsync(Guid messageId, UpdateMessageDto updateMessageDto, Guid userId);
        Task<ApiResponse<bool>> DeleteMessageAsync(Guid messageId, Guid userId);
    }
}
