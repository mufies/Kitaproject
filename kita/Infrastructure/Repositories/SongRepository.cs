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
            return await _dbSet
                .Include(x => x.Artist)
                .FirstOrDefaultAsync(x => x.Title == name && x.Artist!.Name == artist);
        }

        public async Task<Song?> FindByTitleOrArtistContainsAsync(string title, string artist)
        {
            // First check if artist name contains the search artist (to handle "Artist - Topic" channels)
            // Then check if title contains the search title
            return await _dbSet
                .Include(x => x.Artist)
                .Include(x => x.Album)
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => 
                    (x.Artist != null && x.Artist.Name.Contains(artist)) || 
                    x.Title == title);
        }

        public async Task<List<Song>> FilterSongByName(string name)
        {
            return await _dbSet.Where(x => x.Title!.Contains(name)).ToListAsync();
        }
        public async Task<List<Song>> FilterSongByArtist(string artist)
        {
            return await _dbSet
                .Include(x => x.Artist)
                .Where(x => x.Artist!.Name.Contains(artist))
                .ToListAsync();
        }
        public async Task<List<Song>> FilterSongByAlbum(string album)
        {
            return await _dbSet.Where(x => x.Album!.Name.Contains(album)).ToListAsync();
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
                .Include(s => s.Artist)
                .Include(s => s.Album)
                .Include(s => s.User)
                .Where(s => s.UserId == userId && s.ArtistId == null)
                .ToListAsync();
        }

        public async Task<List<Song>> GetSongsByPlaylistIdAsync(Guid playlistId)
        {
            return await _context.PlaylistSongs
                .Where(ps => ps.PlaylistId == playlistId)
                .Include(ps => ps.Song)
                    .ThenInclude(s => s.Artist)
                .Include(ps => ps.Song)
                    .ThenInclude(s => s.Album)
                .Include(ps => ps.Song)
                    .ThenInclude(s => s.User)
                .Include(ps => ps.Song)
                    .ThenInclude(s => s.SongStatics)
                .Select(ps => ps.Song)
                .ToListAsync();
        }

        // Override base methods to include related entities
        public new async Task<IEnumerable<Song>> GetAllAsync()
        {
            return await _dbSet
                .Include(s => s.Artist)
                .Include(s => s.Album)
                .Include(s => s.User)
                .ToListAsync();
        }

        public new async Task<Song?> GetByIdAsync(Guid id)
        {
            return await _dbSet
                .Include(s => s.Artist)
                .Include(s => s.Album)
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<List<Song>> GetSongsByIdsAsync(IEnumerable<Guid> ids)
        {
            return await _dbSet
                .Include(s => s.Artist)
                .Include(s => s.Album)
                .Include(s => s.User)
                .Where(s => ids.Contains(s.Id))
                .ToListAsync();
        }

        public async Task<List<Song>> SearchSongsFullTextAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return new List<Song>();
            
            // Sanitize input
            var sanitized = query.Trim().Replace("'", "''");
            sanitized = sanitized.ToLower();
            
            // Primary search: ILIKE partial match (SearchVector temporarily disabled)
            var results = await _dbSet
                .Include(s => s.Artist)
                .Include(s => s.User)
                .Where(s => s.Title.ToLower().Contains(sanitized) || (s.Artist != null && s.Artist.Name.ToLower().Contains(sanitized)))
                .Take(50)
                .ToListAsync();
            
            // Fallback: If no results, try album search
            
            // Strategy 3: If still no results, fallback to EF.Functions similarity search
            if (!results.Any())
            {
                results = await _dbSet
                    .Include(s => s.Artist)
                    .Include(s => s.User)
                    .Where(s => s.Title.ToLower().Contains(sanitized) || s.Album!.Name.ToLower().Contains(sanitized))
                    .Take(20)
                    .ToListAsync();
            }
            
            return results;
        }
        
    }
}
