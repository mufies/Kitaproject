using Domain.Entities.Music;
using Infrastructure.Repositories;
using Kita.Infrastructure.Repositories;
using Kita.Service.Common;
using Kita.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Service.DTOs.Music;

namespace Kita.Service.Services
{
    public class CommentService : ICommentService
    {
        private readonly ICommentRepository _commentRepository;
        private readonly ISongRepository _songRepository;

        public CommentService(ICommentRepository commentRepository, ISongRepository songRepository)
        {
            _commentRepository = commentRepository;
            _songRepository = songRepository;
        }

        public async Task<ApiResponse<CommentDto>> CreateCommentAsync(Guid userId, CreateCommentDto createCommentDto)
        {
            // Verify song exists
            var song = await _songRepository.GetByIdAsync(createCommentDto.SongId);
            if (song == null)
            {
                return ApiResponse<CommentDto>.Fail("Song not found", null, 404);
            }

            var comment = new Comment
            {
                SongId = createCommentDto.SongId,
                UserId = userId,
                Content = createCommentDto.Content,
                CreatedAt = DateTime.UtcNow
            };

            var createdComment = await _commentRepository.CreateCommentAsync(comment);
            
            var dto = new CommentDto
            {
                Id = createdComment.Id,
                SongId = createdComment.SongId,
                UserId = createdComment.UserId,
                Content = createdComment.Content,
                UserName = createdComment.User?.UserName,
                UserAvatar = createdComment.User?.AvatarUrl,
                CreatedAt = createdComment.CreatedAt,
                UpdatedAt = createdComment.UpdatedAt
            };

            return new ApiResponse<CommentDto>(dto, "Comment created successfully");
        }

        public async Task<ApiResponse<CommentDto>> UpdateCommentAsync(Guid userId, Guid commentId, string content)
        {
            var comment = await _commentRepository.GetCommentWithUserAsync(commentId);
            if (comment == null)
            {
                return ApiResponse<CommentDto>.Fail("Comment not found", null, 404);
            }

            // Check authorization - only comment owner can update
            if (comment.UserId != userId)
            {
                return ApiResponse<CommentDto>.Fail("You are not authorized to update this comment", null, 403);
            }

            comment.Content = content;
            var updatedComment = await _commentRepository.UpdateCommentAsync(commentId, comment);

            var dto = new CommentDto
            {
                Id = updatedComment.Id,
                SongId = updatedComment.SongId,
                UserId = updatedComment.UserId,
                Content = updatedComment.Content,
                UserName = updatedComment.User?.UserName,
                UserAvatar = updatedComment.User?.AvatarUrl,
                CreatedAt = updatedComment.CreatedAt,
                UpdatedAt = updatedComment.UpdatedAt
            };

            return new ApiResponse<CommentDto>(dto, "Comment updated successfully");
        }

        public async Task<ApiResponse<string>> DeleteCommentAsync(Guid userId, Guid commentId)
        {
            var comment = await _commentRepository.GetCommentWithUserAsync(commentId);
            if (comment == null)
            {
                return ApiResponse<string>.Fail("Comment not found", null, 404);
            }

            // Check authorization - only comment owner can delete
            if (comment.UserId != userId)
            {
                return ApiResponse<string>.Fail("You are not authorized to delete this comment", null, 403);
            }

            await _commentRepository.DeleteCommentAsync(commentId);
            return new ApiResponse<string>("Comment deleted successfully");
        }

        public async Task<ApiResponse<List<CommentDto>>> GetCommentsBySongIdAsync(Guid songId)
        {
            var comments = await _commentRepository.GetAllAsync();
            var songComments = comments.Where(c => c.SongId == songId).ToList();

            var dtos = songComments.Select(c => new CommentDto
            {
                Id = c.Id,
                SongId = c.SongId,
                UserId = c.UserId,
                Content = c.Content,
                UserName = c.User?.UserName,
                UserAvatar = c.User?.AvatarUrl,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }).ToList();

            return new ApiResponse<List<CommentDto>>(dtos);
        }
    }
}
