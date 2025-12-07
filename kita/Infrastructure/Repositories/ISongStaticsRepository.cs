using Domain.Entities.Music;

namespace Kita.Infrastructure.Repositories
{
    public interface ISongStaticsRepository : IBaseRepository<SongStatics>
    {
        Task<SongStatics?> GetSongStaticsAsync(Guid songId);
        Task<SongStatics> UpdateSongStaticsAsync(Guid songId, SongStatics songStatics);
        Task<SongStatics> CreateSongStaticsAsync(SongStatics songStatics);
        Task<SongStatics> DeleteSongStaticsAsync(Guid songId);
    }
}