using Domain.Entities.Music;

namespace Kita.Infrastructure.Repositories
{
    public interface IListenWrappedRepository : IBaseRepository<ListenWrapped>
    {
        Task<List<ListenWrapped>> GetUserWrappedByYearAsync(Guid userId, int year);
        Task<List<ListenWrapped>> GetTopSongsByYearAsync(Guid userId, int year, int limit = 10);
        Task<Dictionary<string, int>> GetTopArtistsByYearAsync(Guid userId, int year, int limit = 5);
        Task<Dictionary<string, int>> GetTopGenresByYearAsync(Guid userId, int year, int limit = 5);
        Task<long> GetTotalListenTimeByYearAsync(Guid userId, int year);
        Task<int> GetTotalSongsPlayedByYearAsync(Guid userId, int year);
        Task<ListenWrapped?> GetOrCreateWrappedEntryAsync(Guid userId, Guid songId, int year);
        Task UpdateWrappedEntryAsync(ListenWrapped wrapped);
    }
}
