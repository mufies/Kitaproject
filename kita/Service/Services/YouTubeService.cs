using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Google.Apis.Services;
using Google.Apis.YouTube.v3;
using Kita.Service.Common;
using Kita.Service.DTOs.Music;
using Kita.Service.DTOs.YouTube;
using Kita.Service.Interfaces;
using Microsoft.Extensions.Configuration;
using YoutubeExplode;
using YoutubeExplode.Videos.Streams;

namespace Kita.Service.Services
{
    public class YouTubeService : IYouTubeService
    {
        private readonly string _apiKey;
        private readonly string _applicationName;
        private readonly YoutubeClient _youtubeClient;

        public YouTubeService(IConfiguration configuration)
        {
            _apiKey = configuration["YouTube:ApiKey"] ?? throw new InvalidOperationException("YouTube API Key is not configured.");
            _applicationName = configuration["YouTube:ApplicationName"] ?? "KitaProject";
            _youtubeClient = new YoutubeClient();
        }

        public async Task<ApiResponse<List<YouTubeVideoDto>>> GetPlaylistVideosAsync(string playlistId)
        {
            if (string.IsNullOrWhiteSpace(playlistId))
            {
                return ApiResponse<List<YouTubeVideoDto>>.Fail("Playlist ID is required.", code: 400);
            }

            try
            {
                var youtubeService = new Google.Apis.YouTube.v3.YouTubeService(new BaseClientService.Initializer
                {
                    ApiKey = _apiKey,
                    ApplicationName = _applicationName
                });

                var videos = new List<YouTubeVideoDto>();
                string? nextPageToken = null;

                do
                {
                    var playlistItemsRequest = youtubeService.PlaylistItems.List("snippet,contentDetails");
                    playlistItemsRequest.PlaylistId = playlistId;
                    playlistItemsRequest.MaxResults = 50; 
                    playlistItemsRequest.PageToken = nextPageToken;

                    var playlistItemsResponse = await playlistItemsRequest.ExecuteAsync();

                    foreach (var playlistItem in playlistItemsResponse.Items)
                    {
                        var videoDto = new YouTubeVideoDto
                        {
                            VideoId = playlistItem.ContentDetails.VideoId,
                            Title = playlistItem.Snippet.Title,
                            Description = playlistItem.Snippet.Description,
                            ThumbnailUrl = playlistItem.Snippet.Thumbnails?.Default__?.Url 
                                ?? playlistItem.Snippet.Thumbnails?.Medium?.Url 
                                ?? playlistItem.Snippet.Thumbnails?.High?.Url,
                            ChannelName = playlistItem.Snippet.ChannelTitle,
                            PublishedAt = playlistItem.Snippet.PublishedAtDateTimeOffset?.DateTime
                        };

                        videos.Add(videoDto);
                    }

                    nextPageToken = playlistItemsResponse.NextPageToken;

                } while (!string.IsNullOrEmpty(nextPageToken));

                return new ApiResponse<List<YouTubeVideoDto>>(videos, $"Successfully retrieved {videos.Count} videos from playlist.");
            }
            catch (Google.GoogleApiException ex)
            {
                return ApiResponse<List<YouTubeVideoDto>>.Fail($"YouTube API error: {ex.Message}", code: ex.HttpStatusCode == System.Net.HttpStatusCode.NotFound ? 404 : 500);
            }
            catch (Exception ex)
            {
                return ApiResponse<List<YouTubeVideoDto>>.Fail($"An error occurred: {ex.Message}", code: 500);
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
                
                // Get the highest quality muxed stream (video + audio)
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

            try
            {
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
                
                var projectRoot = System.IO.Path.Combine(Directory.GetCurrentDirectory(), "..");
                var assetsPath = System.IO.Path.Combine(projectRoot, "Assets", "Music");
                
                if (!System.IO.Directory.Exists(assetsPath))
                {
                    System.IO.Directory.CreateDirectory(assetsPath);
                }
                
                var filePath = System.IO.Path.Combine(assetsPath, fileName);
                
                await using (var fileStream = System.IO.File.Create(filePath))
                {
                    await _youtubeClient.Videos.Streams.CopyToAsync(audioStreamInfo, fileStream);
                }

                var fileInfo = new System.IO.FileInfo(filePath);
                
                var response = new VideoDownloadResponseDto
                {
                    FileName = fileName,
                    ContentType = "audio/mpeg",
                    FileBytes = Array.Empty<byte>(), // Not returning bytes since we saved to file
                    FileSize = fileInfo.Length
                };

                return new ApiResponse<VideoDownloadResponseDto>(response, $"Successfully downloaded audio to: {filePath}");
            }
            catch (ArgumentException ex)
            {
                return ApiResponse<VideoDownloadResponseDto>.Fail($"Invalid video URL: {ex.Message}", code: 400);
            }
            catch (Exception ex)
            {
                return ApiResponse<VideoDownloadResponseDto>.Fail($"An error occurred: {ex.Message}", code: 500);
            }
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
                var youtubeService = new Google.Apis.YouTube.v3.YouTubeService(new BaseClientService.Initializer
                {
                    ApiKey = _apiKey,
                    ApplicationName = _applicationName
                });

                // Create search query combining artist and song name
                var searchQuery = $"{artist} {name}";
                
                var searchRequest = youtubeService.Search.List("snippet");
                searchRequest.Q = searchQuery;
                searchRequest.Type = "video";
                searchRequest.MaxResults = 1; 
                searchRequest.VideoCategoryId = "10"; 
                searchRequest.Order = Google.Apis.YouTube.v3.SearchResource.ListRequest.OrderEnum.Relevance;

                var searchResponse = await searchRequest.ExecuteAsync();
                
                if (searchResponse.Items == null || searchResponse.Items.Count == 0)
                {
                    return null;
                }

                var firstResult = searchResponse.Items[0];
                
                var videoDto = new YouTubeVideoDto
                {
                    VideoId = firstResult.Id.VideoId,
                    Title = firstResult.Snippet.Title,
                    Description = firstResult.Snippet.Description,
                    ThumbnailUrl = firstResult.Snippet.Thumbnails?.High?.Url 
                        ?? firstResult.Snippet.Thumbnails?.Medium?.Url 
                        ?? firstResult.Snippet.Thumbnails?.Maxres?.Url,
                    ChannelName = firstResult.Snippet.ChannelTitle,
                    PublishedAt = firstResult.Snippet.PublishedAtDateTimeOffset?.DateTime
                };

                return videoDto;
            }
            catch (Google.GoogleApiException)
            {
                return null;
            }
            catch (Exception)
            {
                return null;
            }
        }
    }
}
