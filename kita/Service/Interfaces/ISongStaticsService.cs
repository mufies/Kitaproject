using Kita.Service.Common;
using Kita.Service.DTOs.Music;

namespace Kita.Service.Interfaces
{
    public interface ISongStaticsService
    {
        Task<ApiResponse<SongStaticsDto>> GetSongStaticsAsync(Guid songId);
        Task<ApiResponse<SongStaticsDto>> IncrementPlayCountAsync(Guid songId);
        Task<ApiResponse<SongStaticsDto>> IncrementLikeCountAsync(Guid songId);
        Task<ApiResponse<SongStaticsDto>> IncrementDislikeCountAsync(Guid songId);
        Task<ApiResponse<SongStaticsDto>> IncrementFavoriteCountAsync(Guid songId);
        Task<ApiResponse<SongStaticsDto>> IncrementShareCountAsync(Guid songId);
        Task<ApiResponse<SongStaticsDto>> DecrementLikeCountAsync(Guid songId);
        Task<ApiResponse<SongStaticsDto>> DecrementDislikeCountAsync(Guid songId);
        Task<ApiResponse<SongStaticsDto>> DecrementFavoriteCountAsync(Guid songId);
    }
}
