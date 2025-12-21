using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Kita.Service.DTOs.Server;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kita.Controllers
{
    [Authorize]
    public class ChannelController : BaseApiController
    {
        private readonly IChannelService _channelService;
        private readonly IMessageService _messageService;

        public ChannelController(IChannelService channelService, IMessageService messageService)
        {
            _channelService = channelService;
            _messageService = messageService;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        #region Channel Endpoints

        [HttpPost]
        public async Task<IActionResult> CreateChannel(CreateChannelDto createChannelDto)
        {
            var result = await _channelService.CreateChannelAsync(createChannelDto);
            return HandleResult(result);
        }

        [HttpGet("server/{serverId}")]
        public async Task<IActionResult> GetServerChannels(Guid serverId)
        {
            var result = await _channelService.GetServerChannelsAsync(serverId);
            return HandleResult(result);
        }

        [HttpGet("{channelId}")]
        public async Task<IActionResult> GetChannel(Guid channelId)
        {
            var result = await _channelService.GetChannelByIdAsync(channelId);
            return HandleResult(result);
        }

        [HttpPut("{channelId}")]
        public async Task<IActionResult> UpdateChannel(Guid channelId, UpdateChannelDto updateChannelDto)
        {
            var result = await _channelService.UpdateChannelAsync(channelId, updateChannelDto);
            return HandleResult(result);
        }

        [HttpDelete("{channelId}")]
        public async Task<IActionResult> DeleteChannel(Guid channelId)
        {
            var result = await _channelService.DeleteChannelAsync(channelId);
            return HandleResult(result);
        }

        #endregion

        #region Message Endpoints

        [HttpGet("{channelId}/messages")]
        public async Task<IActionResult> GetChannelMessages(Guid channelId, [FromQuery] int take = 50, [FromQuery] int skip = 0)
        {
            var result = await _messageService.GetChannelMessagesAsync(channelId, take, skip);
            return HandleResult(result);
        }

        [HttpPost("{channelId}/messages")]
        public async Task<IActionResult> SendMessage(Guid channelId, CreateMessageDto createMessageDto)
        {
            // Ensure the channelId in route matches the DTO
            createMessageDto.ChannelId = channelId;
            var result = await _messageService.SendMessageAsync(createMessageDto, GetUserId());
            return HandleResult(result);
        }

        [HttpGet("{channelId}/messages/{messageId}")]
        public async Task<IActionResult> GetMessage(Guid channelId, Guid messageId)
        {
            var result = await _messageService.GetMessageByIdAsync(messageId);
            return HandleResult(result);
        }

        [HttpPut("{channelId}/messages/{messageId}")]
        public async Task<IActionResult> UpdateMessage(Guid channelId, Guid messageId, UpdateMessageDto updateMessageDto)
        {
            var result = await _messageService.UpdateMessageAsync(messageId, updateMessageDto, GetUserId());
            return HandleResult(result);
        }

        [HttpDelete("{channelId}/messages/{messageId}")]
        public async Task<IActionResult> DeleteMessage(Guid channelId, Guid messageId)
        {
            var result = await _messageService.DeleteMessageAsync(messageId, GetUserId());
            return HandleResult(result);
        }

        #endregion
    }
}

