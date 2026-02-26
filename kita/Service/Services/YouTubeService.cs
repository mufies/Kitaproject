using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Kita.Service.Common;
using Kita.Service.DTOs.Music;
using Kita.Service.DTOs.YouTube;
using Kita.Service.Interfaces;
using Microsoft.Extensions.Configuration;
using YoutubeExplode;
using YoutubeExplode.Videos.Streams;
using YoutubeExplode.Playlists;
using YoutubeExplode.Search;

namespace Kita.Service.Services
{
    public class YouTubeService : IYouTubeService
    {
        private readonly YoutubeClient _youtubeClient;
        private readonly string _assetsBasePath;

        public YouTubeService(IConfiguration configuration)
        {
            // YoutubeExplode 6.5.7+ uses ANDROID_VR client internally to bypass 403 errors
            _youtubeClient = new YoutubeClient();
            _assetsBasePath = configuration["FileStorage:BasePath"] 
                ?? Path.Combine(Directory.GetCurrentDirectory(), "..", "Assets");
        }

        public async Task<ApiResponse<YoutubePlaylistVideoDto>> GetPlaylistVideosAsync(string playlistId)
        {
            if (string.IsNullOrWhiteSpace(playlistId))
            {
                return ApiResponse<YoutubePlaylistVideoDto>.Fail("Playlist ID is required.", code: 400);
            }

            try
            {
                var videos = new List<YouTubeVideoDto>();
                var playlistInfo = await _youtubeClient.Playlists.GetAsync(playlistId);
                var playlistName = playlistInfo.Title;
                await foreach (var video in _youtubeClient.Playlists.GetVideosAsync(playlistId))
                {
                    var fullVideo = await _youtubeClient.Videos.GetAsync(video.Id);
                    
                    var videoDto = new YouTubeVideoDto
                    {
                        VideoId = video.Id,
                        Title = video.Title,
                        Description = null,
                        ThumbnailUrl = video.Thumbnails.OrderByDescending(t => t.Resolution.Area).FirstOrDefault()?.Url,
                        ChannelName = video.Author.ChannelTitle,
                        PublishedAt = null,
                        Duration = fullVideo?.Duration
                    };

                    videos.Add(videoDto);
                }
                var playlistDto = new YoutubePlaylistVideoDto
                {
                    playlistName = playlistName,
                    videos = videos
                };

                return new ApiResponse<YoutubePlaylistVideoDto>(playlistDto, $"Successfully retrieved {videos.Count} videos from playlist {playlistName}.");
            }
            catch (ArgumentException ex)
            {
                return ApiResponse<YoutubePlaylistVideoDto>.Fail($"Invalid playlist ID: {ex.Message}", code: 400);
            }
            catch (Exception ex)
            {
                return ApiResponse<YoutubePlaylistVideoDto>.Fail($"An error occurred: {ex.Message}", code: 500);
            }
        }

        public async Task<ApiResponse<VideoInfoDto>> GetVideoInfoAsync(string videoUrl)
        {
            if (string.IsNullOrWhiteSpace(videoUrl))
            {
                return ApiResponse<VideoInfoDto>.Fail("Video URL is required.", code: 400);
            }

            try
            {
                var video = await _youtubeClient.Videos.GetAsync(videoUrl);
                var streamManifest = await _youtubeClient.Videos.Streams.GetManifestAsync(videoUrl);
                
                var streamInfo = streamManifest.GetMuxedStreams().GetWithHighestVideoQuality();
                
                if (streamInfo == null)
                {
                    return ApiResponse<VideoInfoDto>.Fail("No suitable video stream found.", code: 404);
                }

                var videoInfo = new VideoInfoDto
                {
                    Title = video.Title,
                    FullName = $"{video.Title}.{streamInfo.Container.Name}",
                    Uri = streamInfo.Url,
                    Resolution = streamInfo.VideoResolution.Height,
                    Format = streamInfo.Container.Name,
                    ContentLength = streamInfo.Size.Bytes,
                    FileSizeFormatted = FormatFileSize(streamInfo.Size.Bytes),
                    VideoUrl = videoUrl
                };

                return new ApiResponse<VideoInfoDto>(videoInfo, "Successfully retrieved video information.");
            }
            catch (ArgumentException ex)
            {
                return ApiResponse<VideoInfoDto>.Fail($"Invalid video URL: {ex.Message}", code: 400);
            }
            catch (Exception ex)
            {
                return ApiResponse<VideoInfoDto>.Fail($"An error occurred: {ex.Message}", code: 500);
            }
        }

        public async Task<ApiResponse<VideoDownloadResponseDto>> DownloadVideoAsync(string videoUrl)
        {
            if (string.IsNullOrWhiteSpace(videoUrl))
            {
                return ApiResponse<VideoDownloadResponseDto>.Fail("Video URL is required.", code: 400);
            }

            const int maxRetries = 3;
            const int delayMilliseconds = 2000;

            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    Console.WriteLine($"[YouTubeService] Download attempt {attempt}/{maxRetries} for: {videoUrl}");
                    
                    var video = await _youtubeClient.Videos.GetAsync(videoUrl);
                    var streamManifest = await _youtubeClient.Videos.Streams.GetManifestAsync(videoUrl);
                    
                    // Get the highest quality audio-only stream
                    var audioStreamInfo = streamManifest.GetAudioOnlyStreams().GetWithHighestBitrate();
                    
                    if (audioStreamInfo == null)
                    {
                        return ApiResponse<VideoDownloadResponseDto>.Fail("No suitable audio stream found.", code: 404);
                    }

                    var sanitizedTitle = string.Join("_", video.Title.Split(System.IO.Path.GetInvalidFileNameChars()));
                    var fileName = $"{sanitizedTitle}.mp3";
                    
                    var assetsPath = System.IO.Path.Combine(_assetsBasePath, "Music");
                    
                    if (!System.IO.Directory.Exists(assetsPath))
                    {
                        System.IO.Directory.CreateDirectory(assetsPath);
                    }
                    
                    var filePath = System.IO.Path.Combine(assetsPath, fileName);
                    Console.WriteLine($"[YouTubeService] Saving audio to: {filePath}");
                    
                    // Add delay before download to avoid rate limiting
                    if (attempt > 1)
                    {
                        await Task.Delay(delayMilliseconds * attempt);
                    }
                    
                    await using (var fileStream = System.IO.File.Create(filePath))
                    {
                        await _youtubeClient.Videos.Streams.CopyToAsync(audioStreamInfo, fileStream);
                    }

                    var fileInfo = new System.IO.FileInfo(filePath);
                    
                    // Verify file was actually written
                    if (!fileInfo.Exists || fileInfo.Length == 0)
                    {
                        throw new InvalidOperationException("Downloaded file is empty or does not exist");
                    }
                    
                    var response = new VideoDownloadResponseDto
                    {
                        FileName = fileName,
                        FilePath = filePath,
                        ContentType = "audio/mpeg",
                        FileBytes = Array.Empty<byte>(),
                        FileSize = fileInfo.Length
                    };

                    Console.WriteLine($"[YouTubeService] Successfully downloaded {fileInfo.Length} bytes");
                    return new ApiResponse<VideoDownloadResponseDto>(response, $"Successfully downloaded audio to: {filePath}");
                }
                catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Forbidden)
                {
                    Console.WriteLine($"[YouTubeService] 403 Forbidden on attempt {attempt}: {ex.Message}");
                    
                    if (attempt == maxRetries)
                    {
                        return ApiResponse<VideoDownloadResponseDto>.Fail(
                            $"YouTube blocked the request after {maxRetries} attempts. This may be due to rate limiting or regional restrictions. Error: {ex.Message}", 
                            code: 403);
                    }
                    
                    // Wait longer before retrying
                    await Task.Delay(delayMilliseconds * attempt * 2);
                    continue;
                }
                catch (ArgumentException ex)
                {
                    return ApiResponse<VideoDownloadResponseDto>.Fail($"Invalid video URL: {ex.Message}", code: 400);
                }
                catch (Exception ex) when (attempt < maxRetries)
                {
                    Console.WriteLine($"[YouTubeService] Error on attempt {attempt}: {ex.Message}");
                    await Task.Delay(delayMilliseconds * attempt);
                    continue;
                }
                catch (Exception ex)
                {
                    return ApiResponse<VideoDownloadResponseDto>.Fail($"An error occurred: {ex.Message}", code: 500);
                }
            }
            
            // If we get here, all retries failed
            return ApiResponse<VideoDownloadResponseDto>.Fail("Failed to download video after multiple attempts.", code: 500);
        }

        private static string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }



        public async Task<YouTubeVideoDto?> GetVideoUrlsBaseOnNameAndArtist(string name, string artist)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return null;
            }

            try
            {
                var searchQuery = $"{artist} {name}";
                
                YoutubeExplode.Search.VideoSearchResult? firstResult = null;
                await foreach (var result in _youtubeClient.Search.GetVideosAsync(searchQuery))
                {
                    firstResult = result;
                    break; // Only get the first result
                }
                
                if (firstResult == null)
                {
                    return null;
                }

                // Get full video details to access author information
                var video = await _youtubeClient.Videos.GetAsync(firstResult.Id);
                
                var videoDto = new YouTubeVideoDto
                {
                    VideoId = video.Id,
                    Title = video.Title,
                    Description = video.Description,
                    ThumbnailUrl = video.Thumbnails.OrderByDescending(t => t.Resolution.Area).FirstOrDefault()?.Url,
                    ChannelName = video.Author.ChannelTitle,
                    PublishedAt = video.UploadDate.DateTime,
                    Duration = video.Duration
                };

                return videoDto;
            }
            catch (Exception)
            {
                return null;
            }
        }
    }
}
