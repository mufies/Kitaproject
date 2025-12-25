using Kita.Service.Common;
using Service.DTOs.Music;

namespace Kita.Service.Interfaces
{
    public interface ICommentService
    {
        Task<ApiResponse<CommentDto>> CreateCommentAsync(Guid userId, CreateCommentDto createCommentDto);
        Task<ApiResponse<CommentDto>> UpdateCommentAsync(Guid userId, Guid commentId, string content);
        Task<ApiResponse<string>> DeleteCommentAsync(Guid userId, Guid commentId);
        Task<ApiResponse<List<CommentDto>>> GetCommentsBySongIdAsync(Guid songId);
    }
}
