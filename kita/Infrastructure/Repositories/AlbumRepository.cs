using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kita.Domain.Entities.Music;
using Kita.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kita.Infrastructure.Repositories
{
    public class AlbumRepository : BaseRepository<Album>, IAlbumRepository
    {
        public AlbumRepository(KitaDbContext context) : base(context)
        {
        }

        public async Task<List<Album>> GetByArtistIdAsync(Guid artistId)
        {
            return await _dbSet
                .Where(a => a.ArtistId == artistId)
                .ToListAsync();
        }

        public async Task<Album?> GetByNameAndArtistAsync(string name, Guid artistId)
        {
            return await _dbSet
                .FirstOrDefaultAsync(a => a.Name == name && a.ArtistId == artistId);
        }

        public async Task<List<Song>> GetSongsInAlbumAsync(Guid albumId)
        {
            var album = await _dbSet
                .Include(a => a.Songs)
                .FirstOrDefaultAsync(a => a.Id == albumId);
            
            return album?.Songs?.ToList() ?? new List<Song>();
        }

        public async Task<Album?> GetByIdWithSongsAsync(Guid id)
        {
            return await _dbSet
                .Include(a => a.Songs)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<Album?> GetByIdWithLikesAsync(Guid id)
        {
            return await _dbSet
                .Include(a => a.LikedByUsers)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<List<Album>> GetLikedAlbumsByUserIdAsync(Guid userId)
        {
            return await _dbSet
                .Include(a => a.LikedByUsers)
                .Include(a => a.Artist)
                .Include(a => a.Songs)
                .Where(a => a.LikedByUsers.Any(u => u.Id == userId))
                .ToListAsync();
        }
    }
}
