using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Domain.Entities.Music;

namespace Kita.Infrastructure.Repositories
{
    public interface IAlbumRepository : IBaseRepository<Album>
    {
        Task<List<Album>> GetByArtistIdAsync(Guid artistId);
        Task<Album?> GetByNameAndArtistAsync(string name, Guid artistId);
        Task<List<Song>> GetSongsInAlbumAsync(Guid albumId);
        Task<Album?> GetByIdWithSongsAsync(Guid id);
    }
}
