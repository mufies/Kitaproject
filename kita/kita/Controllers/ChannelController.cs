using System;
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

        public ChannelController(IChannelService channelService)
        {
            _channelService = channelService;
        }

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
        
    }
}
