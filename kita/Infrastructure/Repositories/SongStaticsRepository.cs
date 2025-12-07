using Domain.Entities.Music;
using Kita.Infrastructure.Data;
using Kita.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class SongStaticsRepository : BaseRepository<SongStatics>, ISongStaticsRepository
    {
        public SongStaticsRepository(KitaDbContext context) : base(context)
        {
        }

        public async Task<SongStatics?> GetSongStaticsAsync(Guid songId)
        {
            return await _dbSet
                .Include(ss => ss.Comments)
                    .ThenInclude(c => c.User)
                .FirstOrDefaultAsync(ss => ss.SongId == songId);
        }

        public async Task<SongStatics> UpdateSongStaticsAsync(Guid songId, SongStatics songStatics)
        {
            var existing = await GetSongStaticsAsync(songId);
            if (existing == null)
            {
                throw new InvalidOperationException($"SongStatics for song {songId} not found");
            }

            existing.PlayCount = songStatics.PlayCount;
            existing.LikeCount = songStatics.LikeCount;
            existing.DislikeCount = songStatics.DislikeCount;
            existing.FavoriteCount = songStatics.FavoriteCount;
            existing.ShareCount = songStatics.ShareCount;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<SongStatics> CreateSongStaticsAsync(SongStatics songStatics)
        {
            await _dbSet.AddAsync(songStatics);
            await _context.SaveChangesAsync();
            return songStatics;
        }

        public async Task<SongStatics> DeleteSongStaticsAsync(Guid songId)
        {
            var songStatics = await GetSongStaticsAsync(songId);
            if (songStatics == null)
            {
                throw new InvalidOperationException($"SongStatics for song {songId} not found");
            }

            _dbSet.Remove(songStatics);
            await _context.SaveChangesAsync();
            return songStatics;
        }
    }
}
