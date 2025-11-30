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
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServer(Guid id)
        {
            var result = await _serverService.DeleteServerAsync(id);
            return HandleResult(result);
        }
    }
}
