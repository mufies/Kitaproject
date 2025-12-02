using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Service.Common;
using Kita.Service.DTOs.Music;
using Microsoft.AspNetCore.Http;

namespace Kita.Service.Interfaces
{
    public interface IMusicService
    {
        Task<ApiResponse<SongDto>> CreateSongAsync(CreateSongDto createSongDto);
        Task<ApiResponse<SongDto>> UploadSongAsync(CreateSongDto createSongDto, IFormFile songFile, IFormFile? coverFile);
        Task<ApiResponse<List<SongDto>>> GetAllSongsAsync();
        Task<ApiResponse<SongDto>> GetSongByIdAsync(Guid songId);
        Task<ApiResponse<SongDto>> UpdateSongAsync(Guid songId, SongDto updateSongDto);
        Task<ApiResponse<SongDto>> ChangeSongStatusAsync(Guid songId,string status);
        Task<ApiResponse<SongDto>> GetSongByNameAndArtistAsync(string name, string artist);


    }
}
