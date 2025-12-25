using Domain.Entities.Music;
using Kita.Infrastructure.Repositories;

namespace Infrastructure.Repositories
{
    public interface ICommentRepository : IBaseRepository<Comment>
    {
        Task<List<Comment>> GetAllAsync();
        Task<Comment?> GetCommentWithUserAsync(Guid commentId);
        Task<Comment> CreateCommentAsync(Comment comment);
        Task<Comment> UpdateCommentAsync(Guid commentId, Comment comment);
        Task<Comment> DeleteCommentAsync(Guid commentId);
    }
}