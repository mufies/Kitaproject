using System;
using System.Threading.Tasks;
using Kita.Domain.Entities.Music;

namespace Kita.Infrastructure.Repositories
{
    public interface IPlaylistSongRepository : IBaseRepository<PlaylistSong>
    {
        Task DeleteByCompositeKeyAsync(Guid playlistId, Guid songId);
        Task<PlaylistSong?> GetByPlaylistAndSongIdAsync(Guid playlistId, Guid songId);
    }
}
