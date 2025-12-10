using Kita.Service.Common;
using Service.DTOs.Music;

namespace Kita.Service.Interfaces
{
    public interface IListenHistoryService
    {
        Task<ApiResponse<ListenHistoryDto>> AddToHistoryAsync(Guid userId, Guid songId, int? msPlayed = null);
        Task<ApiResponse<List<ListenHistoryDto>>> GetUserHistoryAsync(Guid userId, int limit = 50);
        Task<ApiResponse<List<ListenHistoryDto>>> GetRecentlyPlayedAsync(Guid userId, int limit = 20);
        Task<ApiResponse<ListenHistoryStatsDto>> GetUserListenStatsAsync(Guid userId);
        Task<ApiResponse<bool>> ClearHistoryAsync(Guid userId);
        Task<ApiResponse<List<ListenHistoryDto>>> GetHistoryByDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate);
        Task<ApiResponse<ListenHistoryDto>> UpdateListenDurationAsync(Guid historyId, int msPlayed);
    }
}
