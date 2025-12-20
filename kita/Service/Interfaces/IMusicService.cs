using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Service.Common;
using Kita.Service.DTOs.Music;
using Microsoft.AspNetCore.Http;
using Service.DTOs.Music;

namespace Kita.Service.Interfaces
{
    public interface IMusicService
    {
        Task<ApiResponse<SongDto>> CreateSongAsync(CreateSongDto createSongDto, Guid userId);
        Task<ApiResponse<SongDto>> UploadSongAsync(CreateSongDto createSongDto, IFormFile songFile, IFormFile? coverFile, Guid userId, string role);
        Task<ApiResponse<SongDto>> UploadArtistSongAsync(CreateArtistSongDto createArtistSongDto, IFormFile songFile, IFormFile? coverFile, Guid userId);
        Task<ApiResponse<List<SongDto>>> GetAllSongsAsync();
        Task<ApiResponse<SongDto>> GetSongByIdAsync(Guid songId);
        Task<ApiResponse<SongDto>> UpdateSongAsync(Guid songId, SongDto updateSongDto);
        Task<ApiResponse<SongDto>> ChangeSongStatusAsync(Guid songId,string status);
        Task<ApiResponse<SongDto>> GetSongByNameAndArtistAsync(string name, string artist);
        Task<ApiResponse<string>> DeleteAllSongsAsync();
        Task<ApiResponse<List<SongDto>>> FilterSongByName(string name);
        Task<ApiResponse<List<SongDto>>> FilterSongByArtist(string artist);
        Task<ApiResponse<List<SongDto>>> FilterSongByAlbum(string album);
        Task<ApiResponse<List<SongDto>>> FilterSongByGenre(string genre);
        Task<ApiResponse<List<SongDto>>> FilterSongByAudioQuality(string audioQuality);
        // Task<ApiResponse<List<SongDto>>> FilterSongByStatus(string status);

        Task<ApiResponse<List<SongDto>>> GetSongByUserId(Guid userId);
        Task<ApiResponse<List<SongDto>>> GetSongByPlaylistId(Guid playlistId);
        
        // Full-text search
        Task<ApiResponse<List<SongDto>>> SearchSongsAsync(string query);

    }
}
