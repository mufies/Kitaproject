using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kita.Domain.Entities;
using Kita.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kita.Infrastructure.Repositories
{
    public class ArtistRepository : BaseRepository<Artist>, IArtistRepository
    {
        public ArtistRepository(KitaDbContext context) : base(context)
        {
        }

        // Override to include ManagedByUsers and FollowedByUsers for all artists
        public new async Task<IEnumerable<Artist>> GetAllAsync()
        {
            return await _dbSet
                .Include(a => a.ManagedByUsers)
                .Include(a => a.FollowedByUsers)
                .Include(a => a.Songs)
                .Include(a => a.Albums)
                .ToListAsync();
        }

        public async Task<Artist?> GetByIdAsync(Guid id)
        {
            return await _dbSet
                .Include(a => a.ManagedByUsers)
                .Include(a => a.FollowedByUsers)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<Artist?> GetByNameAsync(string name)
        {
            return await _dbSet
                .Include(a => a.ManagedByUsers)
                .Include(a => a.FollowedByUsers)
                .FirstOrDefaultAsync(a => a.Name == name);
        }

        public async Task<List<Artist>> GetByUserIdAsync(Guid userId)
        {
            return await _dbSet
                .Include(a => a.ManagedByUsers)
                .Include(a => a.FollowedByUsers)
                .Include(a => a.Songs)
                .Include(a => a.Albums)
                .Where(a => a.ManagedByUsers.Any(u => u.Id == userId))
                .ToListAsync();
        }

        public async Task<Artist?> GetByIdWithSongsAsync(Guid id)
        {
            return await _dbSet
                .Include(a => a.Songs)
                .Include(a => a.FollowedByUsers)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<Artist?> GetByIdWithAlbumsAsync(Guid id)
        {
            return await _dbSet
                .Include(a => a.Albums)
                .Include(a => a.FollowedByUsers)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<Artist?> GetByIdWithFollowersAsync(Guid id)
        {
            return await _dbSet
                .Include(a => a.FollowedByUsers)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<List<Artist>> GetFollowedArtistsByUserIdAsync(Guid userId)
        {
            return await _dbSet
                .Include(a => a.FollowedByUsers)
                .Include(a => a.Songs)
                .Include(a => a.Albums)
                .Where(a => a.FollowedByUsers.Any(u => u.Id == userId))
                .ToListAsync();
        }
    }
}
