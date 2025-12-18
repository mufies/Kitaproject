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

        public async Task<Artist?> GetByNameAsync(string name)
        {
            return await _dbSet
                .FirstOrDefaultAsync(a => a.Name == name);
        }

        public async Task<List<Artist>> GetByUserIdAsync(Guid userId)
        {
            return await _dbSet
                .Include(a => a.ManagedByUsers)
                .Where(a => a.ManagedByUsers.Any(u => u.Id == userId))
                .ToListAsync();
        }

        public async Task<Artist?> GetByIdWithSongsAsync(Guid id)
        {
            return await _dbSet
                .Include(a => a.Songs)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<Artist?> GetByIdWithAlbumsAsync(Guid id)
        {
            return await _dbSet
                .Include(a => a.Albums)
                .FirstOrDefaultAsync(a => a.Id == id);
        }
    }
}
