using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Service.Common;
using Kita.Service.DTOs.YouTube;
using Kita.Service.DTOs.Music;

namespace Kita.Service.Interfaces
{
    public interface IYouTubeService
    {
        Task<ApiResponse<YoutubePlaylistVideoDto>> GetPlaylistVideosAsync(string playlistId);
        Task<ApiResponse<VideoInfoDto>> GetVideoInfoAsync(string videoUrl);
        Task<ApiResponse<VideoDownloadResponseDto>> DownloadVideoAsync(string videoUrl);
        Task<YouTubeVideoDto?> GetVideoUrlsBaseOnNameAndArtist(string name, string artist);
    }
}
