using System.Threading.Tasks;
using Domain.Entities.Music;
using Kita.Domain.Entities.Music;

namespace Kita.Infrastructure.Repositories
{
    public interface ISongRepository : IBaseRepository<Song>
    {
        Task<Song?> GetByNameAndArtistAsync(string name, string artist);
        Task<List<Song>> FilterSongByName(string name);
        Task<List<Song>> FilterSongByArtist(string artist);
        Task<List<Song>> FilterSongByAlbum(string album);
        Task<List<Song>> FilterSongByGenre(string genre);
        Task<List<Song>> FilterSongByAudioQuality(string audioQuality);

        // Eager loading methods
        Task<Song?> GetByIdWithStaticsAsync(Guid id);
        Task<List<Song>> GetAllWithStaticsAsync();
        Task<Song?> GetByIdWithStaticsAndCommentsAsync(Guid id);
        
        // Additional query methods
        Task<List<Song>> GetSongsByUserIdAsync(Guid userId);
        Task<List<Song>> GetSongsByPlaylistIdAsync(Guid playlistId);
        
    }
}
