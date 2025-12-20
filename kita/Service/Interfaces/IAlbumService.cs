using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Service.Common;
using Kita.Service.DTOs.Album;
using Microsoft.AspNetCore.Http;

namespace Kita.Service.Interfaces
{
    public interface IAlbumService
    {
        Task<ApiResponse<AlbumDto>> CreateAlbumAsync(Guid userId, CreateAlbumDto createDto);
        Task<ApiResponse<List<AlbumDto>>> GetAllAlbumsAsync();
        Task<ApiResponse<AlbumDetailDto>> GetAlbumByIdAsync(Guid id);
        Task<ApiResponse<List<AlbumDto>>> GetAlbumsByArtistAsync(Guid artistId);
        Task<ApiResponse<AlbumDto>> UpdateAlbumAsync(Guid userId, Guid albumId, UpdateAlbumDto updateDto);
        Task<ApiResponse<bool>> DeleteAlbumAsync(Guid userId, Guid albumId);
        Task<ApiResponse<string>> UploadAlbumImageAsync(Guid userId, Guid albumId, IFormFile file);
        Task<ApiResponse<List<AlbumDto>>> SearchAlbumsAsync(string query);
        Task<ApiResponse<AlbumDetailDto>> AddSongsToAlbumAsync(Guid userId, Guid albumId, AddSongsToAlbumDto dto);
        Task<ApiResponse<AlbumDetailDto>> RemoveSongsFromAlbumAsync(Guid userId, Guid albumId, RemoveSongsFromAlbumDto dto);
        Task<ApiResponse<bool>> LikeAlbumAsync(Guid userId, Guid albumId);
        Task<ApiResponse<bool>> UnlikeAlbumAsync(Guid userId, Guid albumId);
        Task<ApiResponse<List<AlbumDto>>> GetLikedAlbumsAsync(Guid userId);
        Task<ApiResponse<bool>> IsLikingAlbumAsync(Guid userId, Guid albumId);
    }
}
