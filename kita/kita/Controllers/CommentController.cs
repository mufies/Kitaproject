using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Service.DTOs.Music;

namespace Kita.Controllers
{
    [Authorize]
    public class CommentController : BaseApiController
    {
        private readonly ICommentService _commentService;

        public CommentController(ICommentService commentService)
        {
            _commentService = commentService;
        }

        [HttpGet("songs/{songId}/comments")]
        public async Task<IActionResult> GetCommentsBySongId(Guid songId)
        {
            var result = await _commentService.GetCommentsBySongIdAsync(songId);
            return HandleResult(result);
        }

        [HttpPost("comments")]
        public async Task<IActionResult> CreateComment([FromBody] CreateCommentDto createCommentDto)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _commentService.CreateCommentAsync(userId, createCommentDto);
            return HandleResult(result);
        }

        [HttpPut("comments/{commentId}")]
        public async Task<IActionResult> UpdateComment(Guid commentId, [FromBody] string content)
        {
            var result = await _commentService.UpdateCommentAsync(commentId, content);
            return HandleResult(result);
        }

        [HttpDelete("comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(Guid commentId)
        {
            var result = await _commentService.DeleteCommentAsync(commentId);
            return HandleResult(result);
        }
    }
}
