using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Service.Common;
using Kita.Service.DTOs.Artist;
using Microsoft.AspNetCore.Http;

namespace Kita.Service.Interfaces
{
    public interface IArtistService
    {
        Task<ApiResponse<ArtistDto>> CreateArtistAsync(Guid userId, CreateArtistDto createDto);
        Task<ApiResponse<List<ArtistDto>>> GetAllArtistsAsync();
        Task<ApiResponse<ArtistDetailDto>> GetArtistByIdAsync(Guid id);
        Task<ApiResponse<ArtistDto>> UpdateArtistAsync(Guid userId, Guid artistId, UpdateArtistDto updateDto);
        Task<ApiResponse<bool>> DeleteArtistAsync(Guid userId, Guid artistId);
        Task<ApiResponse<string>> UploadArtistImageAsync(Guid userId, Guid artistId, IFormFile file);
        Task<ApiResponse<List<ArtistDto>>> GetArtistsByUserAsync(Guid userId);
        Task<ApiResponse<List<ArtistDto>>> SearchArtistsAsync(string query);
        Task<ApiResponse<bool>> FollowArtistAsync(Guid userId, Guid artistId);
        Task<ApiResponse<bool>> UnfollowArtistAsync(Guid userId, Guid artistId);
        Task<ApiResponse<List<ArtistDto>>> GetFollowedArtistsAsync(Guid userId);
        Task<ApiResponse<bool>> IsFollowingArtistAsync(Guid userId, Guid artistId);
    }
}
