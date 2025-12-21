using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Kita.Service.DTOs;
using Kita.Service.DTOs.Server;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kita.Controllers
{
    [Authorize]
    public class ServerController : BaseApiController
    {
        private readonly IServerService _serverService;

        public ServerController(IServerService serverService)
        {
            _serverService = serverService;
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
    }
}
