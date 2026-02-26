using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Kita.Service.DTOs;
using Kita.Service.DTOs.Server;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Kita.Hubs;

namespace Kita.Controllers
{
    [Authorize]
    public class ServerController : BaseApiController
    {
        private readonly IServerService _serverService;
        private readonly IHubContext<ChatHub> _hubContext;

        public ServerController(IServerService serverService, IHubContext<ChatHub> hubContext)
        {
            _serverService = serverService;
            _hubContext = hubContext;
        }

        [HttpPost]
        public async Task<IActionResult> CreateServer(CreateServerDto createServerDto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _serverService.CreateServerAsync(createServerDto, userId);
            return HandleResult(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetUserServers()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _serverService.GetUserServersAsync(userId);
            return HandleResult(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetServer(Guid id)
        {
            var result = await _serverService.GetServerByIdAsync(id);
            return HandleResult(result);
        }

        [HttpGet("{id}/members")]
        public async Task<IActionResult> GetServerMembers(Guid id)
        {
            var result = await _serverService.GetServerMembersAsync(id);
            return HandleResult(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateServer(Guid id, UpdateServerDto updateServerDto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _serverService.UpdateServerAsync(id, updateServerDto, userId);
            return HandleResult(result);
        }

        [HttpPost("{id}/icon")]
        public async Task<IActionResult> UploadServerIcon(Guid id, [FromForm] FileUploadDto uploadDto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _serverService.UploadServerIconAsync(id, uploadDto.File!, userId);
            return HandleResult(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServer(Guid id)
        {
            var result = await _serverService.DeleteServerAsync(id);
            return HandleResult(result);
        }

        [HttpDelete("{id}/members/{userId}")]
        public async Task<IActionResult> RemoveMember(Guid id, Guid userId)
        {
            var requesterId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _serverService.RemoveMemberAsync(id, userId, requesterId);
            
            if (result.Success)
            {
                // Note: to properly notify, ideally we broadcast to a server-wide group, but for now we broadcast globally or directly
                await _hubContext.Clients.All.SendAsync("ServerLeft", id.ToString(), userId.ToString());
            }

            return HandleResult(result);
        }

        [HttpPost("{id}/leave")]
        public async Task<IActionResult> LeaveServer(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _serverService.LeaveServerAsync(id, userId);

            if (result.Success)
            {
                await _hubContext.Clients.All.SendAsync("ServerLeft", id.ToString(), userId.ToString());
            }

            return HandleResult(result);
        }
    }
}
