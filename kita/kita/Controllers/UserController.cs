using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Kita.Service.DTOs;
using Kita.Service.DTOs.Request;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kita.Controllers
{
    [Authorize]
    public class UserController : BaseApiController
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _userService.GetUserProfileAsync(userId);
            return HandleResult(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(Guid id)
        {
            var result = await _userService.GetUserProfileAsync(id);
            return HandleResult(result);
        }

        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar([FromForm] FileUploadDto uploadDto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _userService.UploadAvatarAsync(userId, uploadDto.File);
            return HandleResult(result);
        }

        [HttpPut("username")]
        public async Task<IActionResult> UpdateUsername([FromBody] UpdateUsernameDto updateDto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _userService.UpdateUsernameAsync(userId, updateDto.NewUsername);
            return HandleResult(result);
        }
        [HttpPut("password")]
        public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordRequestDto dto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _userService.UpdatePasswordAsync(userId, dto.OldPassword, dto.NewPassword);
            return HandleResult(result);
        }
    }
}
