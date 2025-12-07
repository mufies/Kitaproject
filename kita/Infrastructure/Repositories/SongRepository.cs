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

        public async Task<List<Song>> FilterSongByName(string name)
        {
            return await _dbSet.Where(x => x.Title!.Contains(name)).ToListAsync();
        }
        public async Task<List<Song>> FilterSongByArtist(string artist)
        {
            return await _dbSet.Where(x => x.Artist!.Contains(artist)).ToListAsync();
        }
        public async Task<List<Song>> FilterSongByAlbum(string album)
        {
            return await _dbSet.Where(x => x.Album!.Contains(album)).ToListAsync();
        }
        public async Task<List<Song>> FilterSongByGenre(string genre)
        {
            return await _dbSet.Where(x => x.Genres!.ToString().Contains(genre)).ToListAsync();
        }
        public async Task<List<Song>> FilterSongByAudioQuality(string audioQuality)
        {
            return await _dbSet.Where(x => x.AudioQuality!.ToString().Contains(audioQuality)).ToListAsync();
        }

        // Eager loading methods
        public async Task<Song?> GetByIdWithStaticsAsync(Guid id)
        {
            return await _dbSet
                .Include(s => s.SongStatics)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<List<Song>> GetAllWithStaticsAsync()
        {
            return await _dbSet
                .Include(s => s.SongStatics)
                .ToListAsync();
        }

        public async Task<Song?> GetByIdWithStaticsAndCommentsAsync(Guid id)
        {
            return await _dbSet
                .Include(s => s.SongStatics!)
                    .ThenInclude(ss => ss.Comments)
                        .ThenInclude(c => c.User)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        // Additional query methods
        public async Task<List<Song>> GetSongsByUserIdAsync(Guid userId)
        {
            return await _dbSet
                .Where(s => s.UserId == userId)
                .ToListAsync();
        }

        public async Task<List<Song>> GetSongsByPlaylistIdAsync(Guid playlistId)
        {
            return await _context.PlaylistSongs
                .Where(ps => ps.PlaylistId == playlistId)
                .Include(ps => ps.Song)
                    .ThenInclude(s => s.SongStatics)
                .Select(ps => ps.Song)
                .ToListAsync();
        }
        
    }
}
