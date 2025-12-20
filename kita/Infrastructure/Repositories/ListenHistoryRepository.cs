using Domain.Entities.Music;
using Kita.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kita.Infrastructure.Repositories
{
    public class ListenHistoryRepository : BaseRepository<ListenHistory>, IListenHistoryRepository
    {
        public ListenHistoryRepository(KitaDbContext context) : base(context)
        {
        }

        public async Task<List<ListenHistory>> GetUserListenHistoryAsync(Guid userId, int limit = 50)
        {
            return await _dbSet
                .Where(lh => lh.UserId == userId)
                .OrderByDescending(lh => lh.CreatedAt)
                .Take(limit)
                .Include(lh => lh.Song)
                    .ThenInclude(s => s.SongStatics)
                .Include(lh => lh.User)
                .ToListAsync();
        }

        public async Task<ListenHistory?> GetLastListenedAsync(Guid userId, Guid songId)
        {
            return await _dbSet
                .Where(lh => lh.UserId == userId && lh.SongId == songId)
                .OrderByDescending(lh => lh.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<List<ListenHistory>> GetRecentlyPlayedAsync(Guid userId, int limit = 20)
        {
            // Get all recent history with includes first, then filter for unique songs client-side
            var allHistory = await _dbSet
                .Where(lh => lh.UserId == userId)
                .Include(lh => lh.Song)
                    .ThenInclude(s => s.Artist)
                .Include(lh => lh.Song)
                    .ThenInclude(s => s.SongStatics)
                .OrderByDescending(lh => lh.CreatedAt)
                .Take(limit * 3) // Get extra to account for duplicates
                .ToListAsync();

            var uniqueHistory = allHistory
                .GroupBy(lh => lh.SongId)
                .Select(g => g.First())
                .Take(limit)
                .ToList();

            return uniqueHistory;
        }

        public async Task<int> GetTotalListenCountAsync(Guid userId)
        {
            return await _dbSet
                .Where(lh => lh.UserId == userId)
                .CountAsync();
        }

        public async Task<long> GetTotalListenTimeAsync(Guid userId)
        {
            return await _dbSet
                .Where(lh => lh.UserId == userId && lh.MsPlayed.HasValue)
                .SumAsync(lh => (long)(lh.MsPlayed ?? 0));
        }

        public async Task ClearUserHistoryAsync(Guid userId)
        {
            var history = await _dbSet
                .Where(lh => lh.UserId == userId)
                .ToListAsync();
            
            _dbSet.RemoveRange(history);
            await _context.SaveChangesAsync();
        }

        public async Task<List<ListenHistory>> GetUserListenHistoryByDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate)
        {
            return await _dbSet
                .Where(lh => lh.UserId == userId && lh.CreatedAt >= startDate && lh.CreatedAt <= endDate)
                .OrderByDescending(lh => lh.CreatedAt)
                .Include(lh => lh.Song)
                    .ThenInclude(s => s.SongStatics)
                .ToListAsync();
        }
    }
}
