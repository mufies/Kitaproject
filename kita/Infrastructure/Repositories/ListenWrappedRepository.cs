using Domain.Entities.Music;
using Kita.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kita.Infrastructure.Repositories
{
    public class ListenWrappedRepository : BaseRepository<ListenWrapped>, IListenWrappedRepository
    {
        public ListenWrappedRepository(KitaDbContext context) : base(context)
        {
        }

        public async Task<List<ListenWrapped>> GetUserWrappedByYearAsync(Guid userId, int year)
        {
            return await _dbSet
                .Where(w => w.UserId == userId && w.Year == year)
                .Include(w => w.Song)
                .OrderByDescending(w => w.PlayCount)
                .ToListAsync();
        }

        public async Task<List<ListenWrapped>> GetTopSongsByYearAsync(Guid userId, int year, int limit = 5)
        {
            return await _dbSet
                .Where(w => w.UserId == userId && w.Year == year)
                .Include(w => w.Song)
                .OrderByDescending(w => w.PlayCount)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<Dictionary<string, int>> GetTopArtistsByYearAsync(Guid userId, int year, int limit = 5)
        {
            var wrapped = await _dbSet
                .Where(w => w.UserId == userId && w.Year == year)
                .Include(w => w.Song)
                    .ThenInclude(s => s.Artist)
                .ToListAsync();

            return wrapped
                .Where(w => w.Song?.Artist != null)
                .GroupBy(w => w.Song.Artist!.Name)
                .OrderByDescending(g => g.Sum(w => w.PlayCount))
                .Take(limit)
                .ToDictionary(g => g.Key, g => g.Sum(w => w.PlayCount));
        }

        public async Task<Dictionary<string, int>> GetTopGenresByYearAsync(Guid userId, int year, int limit = 5)
        {
            var wrapped = await _dbSet
                .Where(w => w.UserId == userId && w.Year == year)
                .Include(w => w.Song)
                .ToListAsync();

            return wrapped
                .Where(w => w.Song?.Genres != null && w.Song.Genres.Any())
                .SelectMany(w => w.Song.Genres!.Select(g => new { Genre = g.ToString(), w.PlayCount }))
                .GroupBy(x => x.Genre)
                .OrderByDescending(g => g.Sum(x => x.PlayCount))
                .Take(limit)
                .ToDictionary(g => g.Key, g => g.Sum(x => x.PlayCount));
        }

        public async Task<long> GetTotalListenTimeByYearAsync(Guid userId, int year)
        {
            return await _dbSet
                .Where(w => w.UserId == userId && w.Year == year && w.MsPlayed.HasValue)
                .SumAsync(w => (long)(w.MsPlayed ?? 0) * w.PlayCount);
        }

        public async Task<int> GetTotalSongsPlayedByYearAsync(Guid userId, int year)
        {
            return await _dbSet
                .Where(w => w.UserId == userId && w.Year == year)
                .SumAsync(w => w.PlayCount);
        }

        public async Task<ListenWrapped?> GetOrCreateWrappedEntryAsync(Guid userId, Guid songId, int year)
        {
            // Get wrapped entry for the year
            return await _dbSet
                .FirstOrDefaultAsync(w => 
                    w.UserId == userId && 
                    w.SongId == songId && 
                    w.Year == year);
        }

        public async Task UpdateWrappedEntryAsync(ListenWrapped wrapped)
        {
            _dbSet.Update(wrapped);
            await _context.SaveChangesAsync();
        }
    }
}
