using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Kita.Service.DTOs.Server;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kita.Controllers
{
    // [Authorize]
    public class MessageController : BaseApiController
    {
        private readonly IMessageService _messageService;

        public MessageController(IMessageService messageService)
        {
            _messageService = messageService;
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage(CreateMessageDto createMessageDto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _messageService.SendMessageAsync(createMessageDto, userId);
            return HandleResult(result);
        }

        [HttpGet("channel/{channelId}")]
        public async Task<IActionResult> GetChannelMessages(Guid channelId)
        {
            var result = await _messageService.GetChannelMessagesAsync(channelId);
            return HandleResult(result);
        }
    }
}
