using Domain.Entities.Music;
using Kita.Infrastructure.Data;
using Kita.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class CommentRepository : BaseRepository<Comment>, ICommentRepository
    {
        public CommentRepository(KitaDbContext context) : base(context)
        {
        }

        public async Task<Comment> CreateCommentAsync(Comment comment)
        {
            await _dbSet.AddAsync(comment);
            await _context.SaveChangesAsync();
            return comment;
        }

        public async Task<Comment> UpdateCommentAsync(Guid commentId, Comment comment)
        {
            var existing = await _dbSet.FindAsync(commentId);
            if (existing == null)
            {
                throw new InvalidOperationException($"Comment {commentId} not found");
            }

            existing.Content = comment.Content;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<Comment> DeleteCommentAsync(Guid commentId)
        {
            var comment = await _dbSet.FindAsync(commentId);
            if (comment == null)
            {
                throw new InvalidOperationException($"Comment {commentId} not found");
            }

            _dbSet.Remove(comment);
            await _context.SaveChangesAsync();
            return comment;
        }
    }
}
