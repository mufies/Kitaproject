using Domain.Entities.Music;

namespace Kita.Service.Interfaces
{
    public interface IListenWrappedService
    {
        Task<List<ListenWrapped>> GetUserWrappedByYearAsync(Guid userId, int year);
        Task<List<ListenWrapped>> GetTopSongsByYearAsync(Guid userId, int year, int limit = 5);
        Task<Dictionary<string, int>> GetTopArtistsByYearAsync(Guid userId, int year, int limit = 5);
        Task<Dictionary<string, int>> GetTopGenresByYearAsync(Guid userId, int year, int limit = 5);
        Task<long> GetTotalListenTimeByYearAsync(Guid userId, int year);
        Task<int> GetTotalSongsPlayedByYearAsync(Guid userId, int year);
        Task<ListenWrapped?> GetOrCreateWrappedEntryAsync(Guid userId, Guid songId, int year);
        Task UpdateWrappedEntryAsync(ListenWrapped wrapped);
    }
}