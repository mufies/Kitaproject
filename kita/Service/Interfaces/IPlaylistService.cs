using Kita.Service.DTOs.Music;
using Kita.Service.Common;
namespace Kita.Service.Interfaces
{
    public interface IPlaylistService
    {
        Task<ApiResponse<PlaylistDto>> CreatePlaylistAsync(CreatePlaylistDto createPlaylistDto, Guid ownerId);
        Task<ApiResponse<PlaylistDto>> AddSongToPlaylistAsync(Guid playlistId, Guid songId);
        Task<ApiResponse<List<PlaylistDto>>> GetUserPlaylistsAsync(Guid userId);
        Task<ApiResponse<PlaylistDto>> RemoveSongFromPlaylistAsync(Guid playlistId, Guid songId);
        Task<ApiResponse<PlaylistDto>> UpdatePlaylistAsync(Guid playlistId, PlaylistDto updatePlaylistDto);
        Task<ApiResponse<PlaylistDto>> DeletePlaylistAsync(Guid playlistId);
        Task<ApiResponse<PlaylistDto>> GetPlaylistByIdAsync(Guid playlistId);
        Task<ApiResponse<List<PlaylistDto>>> GetAllPlaylistsAsync();
        Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsBySongIdAsync(Guid songId);
        Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsBySearchAsync(string search);
        Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsByTypeAsync(string type);
        Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsByIsPublicAsync(bool isPublic);
        Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsByIsPrivateAsync(bool isPrivate);
        Task<ApiResponse<List<SongDto>>> GetSongInPlaylist(Guid playlistId);
        Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsByUserIdAndSongIdAsync(Guid userId, Guid songId);
        

        

    }
}