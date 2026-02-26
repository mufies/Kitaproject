using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Kita.Hubs;
using Kita.Service.DTOs.Server;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace Kita.Controllers
{
    [Authorize]
    public class ServerInviteController : BaseApiController
    {
        private readonly IServerInviteService _serverInviteService;
        private readonly IHubContext<ChatHub> _hubContext;

        public ServerInviteController(IServerInviteService serverInviteService, IHubContext<ChatHub> hubContext)
        {
            _serverInviteService = serverInviteService;
            _hubContext = hubContext;
        }

        [HttpPost("{serverId}")]
        public async Task<IActionResult> CreateInvite(Guid serverId, CreateServerInviteDto createInviteDto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _serverInviteService.CreateInviteAsync(serverId, createInviteDto, userId);
            return HandleResult(result);
        }

        [AllowAnonymous]
        [HttpGet("{code}")]
        public async Task<IActionResult> GetInviteByCode(string code)
        {
            var result = await _serverInviteService.GetInviteByCodeAsync(code);
            return HandleResult(result);
        }

        [HttpPost("use")]
        public async Task<IActionResult> UseInvite(UseInviteDto useInviteDto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _serverInviteService.UseInviteAsync(useInviteDto.Code, userId);
            
            // Broadcast MemberJoined event if this was a new member
            if (result.Success && result.Data?.IsNewMember == true)
            {
                await _hubContext.Clients.All.SendAsync("MemberJoined", result.Data.ServerId.ToString(), userId.ToString());
            }
            
            return HandleResult(result);
        }

        [HttpDelete("{inviteId}")]
        public async Task<IActionResult> RevokeInvite(Guid inviteId)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _serverInviteService.RevokeInviteAsync(inviteId, userId);
            return HandleResult(result);
        }

        [HttpGet("server/{serverId}")]
        public async Task<IActionResult> GetServerInvites(Guid serverId)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _serverInviteService.GetServerInvitesAsync(serverId, userId);
            return HandleResult(result);
        }
    }
}
