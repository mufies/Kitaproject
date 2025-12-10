using Kita.Service.Common;
using Kita.Service.DTOs.Music;

namespace Kita.Service.Interfaces
{
    public interface ISongStaticsService
    {
        Task<ApiResponse<SongStaticsDto>> GetSongStaticsAsync(Guid songId);
        Task<ApiResponse<SongStaticsDto>> IncrementPlayCountAsync(Guid songId);
        Task<ApiResponse<SongStaticsDto>> IncrementLikeCountAsync(Guid songId, Guid userId);
        Task<ApiResponse<SongStaticsDto>> IncrementDislikeCountAsync(Guid songId, Guid userId);
        Task<ApiResponse<SongStaticsDto>> IncrementFavoriteCountAsync(Guid songId, Guid userId);
        Task<ApiResponse<SongStaticsDto>> IncrementShareCountAsync(Guid songId);
        Task<ApiResponse<SongStaticsDto>> DecrementLikeCountAsync(Guid songId, Guid userId);
        Task<ApiResponse<SongStaticsDto>> DecrementDislikeCountAsync(Guid songId, Guid userId);
        Task<ApiResponse<SongStaticsDto>> DecrementFavoriteCountAsync(Guid songId, Guid userId);
        Task<bool> HasUserLikedSongAsync(Guid songId, Guid userId);
        Task<bool> HasUserDislikedSongAsync(Guid songId, Guid userId);
        Task<bool> HasUserFavoritedSongAsync(Guid songId, Guid userId);
    }
}
