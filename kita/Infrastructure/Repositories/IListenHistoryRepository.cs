using Domain.Entities.Music;

namespace Kita.Infrastructure.Repositories
{
    public interface IListenHistoryRepository : IBaseRepository<ListenHistory>
    {
        Task<List<ListenHistory>> GetUserListenHistoryAsync(Guid userId, int limit = 50);
        Task<ListenHistory?> GetLastListenedAsync(Guid userId, Guid songId);
        Task<List<ListenHistory>> GetRecentlyPlayedAsync(Guid userId, int limit = 20);
        Task<int> GetTotalListenCountAsync(Guid userId);
        Task<long> GetTotalListenTimeAsync(Guid userId);
        Task ClearUserHistoryAsync(Guid userId);
        Task<List<ListenHistory>> GetUserListenHistoryByDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate);
    }
}
