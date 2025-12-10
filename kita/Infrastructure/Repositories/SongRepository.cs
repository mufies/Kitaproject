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

        public async Task<List<Song>> SearchSongsFullTextAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return new List<Song>();
            
            // Sanitize input
            var sanitized = query.Trim().Replace("'", "''");
            
            // Strategy 1: Full-text search with tsvector (handles word order, exact words)
            var results = await _dbSet
                .FromSqlRaw(@"
                    SELECT * FROM ""Songs"" 
                    WHERE ""SearchVector"" @@ websearch_to_tsquery('english', {0})
                    ORDER BY ts_rank(""SearchVector"", websearch_to_tsquery('english', {0})) DESC
                    LIMIT 50
                ", sanitized)
                .ToListAsync();
            
            // Strategy 2: If no results, try partial match with ILIKE (handles partial words)
            if (!results.Any())
            {
                results = await _dbSet
                    .FromSqlRaw(@"
                        SELECT * FROM ""Songs""
                        WHERE ""Title"" ILIKE {0} OR ""Artist"" ILIKE {0}
                        LIMIT 30
                    ", $"%{sanitized}%")
                    .ToListAsync();
            }
            
            // Strategy 3: If still no results, fallback to trigram similarity (handles heavy typos)
            if (!results.Any())
            {
                results = await _dbSet
                    .FromSqlRaw(@"
                        SELECT * FROM ""Songs""
                        WHERE similarity(""Title"" || ' ' || ""Artist"", {0}) > 0.15
                        ORDER BY similarity(""Title"" || ' ' || ""Artist"", {0}) DESC
                        LIMIT 20
                    ", sanitized)
                    .ToListAsync();
            }
            
            return results;
        }
        
    }
}
