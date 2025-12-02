using System.Threading.Tasks;
using Kita.Domain.Entities.Music;
using Kita.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kita.Infrastructure.Repositories
{
    public class SongRepository : BaseRepository<Song>, ISongRepository
    {
        public SongRepository(KitaDbContext context) : base(context)
        {
        }

        public async Task<Song?> GetByNameAndArtistAsync(string name, string artist)
        {
            return await _dbSet.FirstOrDefaultAsync(x => x.Title == name && x.Artist == artist);
        }
    }
}
