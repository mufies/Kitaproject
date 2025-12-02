using Kita.Domain.Entities.Music;
using Kita.Infrastructure.Repositories;
using Kita.Service.Common;
using Kita.Service.DTOs.Music;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Domain.Enums;

namespace Kita.Service.Services
{
    public class PlaylistService : IPlaylistService
    {
        private readonly IBaseRepository<Playlist> _playlistRepository;
        private readonly ISongRepository _songRepository;
        private readonly IPlaylistSongRepository _playlistSongRepository;
        private readonly IConfiguration _configuration;
        private readonly IYouTubeService _youTubeService;
        private readonly ISpotifyService _spotifyService;

        public PlaylistService(
            IBaseRepository<Playlist> playlistRepository, 
            ISongRepository _songRepository, 
            IPlaylistSongRepository playlistSongRepository,
            IConfiguration configuration,
            IYouTubeService youTubeService,
            ISpotifyService spotifyService)
        {
            _playlistRepository = playlistRepository;
            this._songRepository = _songRepository;
            _playlistSongRepository = playlistSongRepository;
            _configuration = configuration;
            _youTubeService = youTubeService;
            _spotifyService = spotifyService;
        }

        // Create Playlist
        public async Task<ApiResponse<PlaylistDto>> CreatePlaylistAsync(CreatePlaylistDto createPlaylistDto, Guid ownerId, IFormFile coverFile)
        {
            // Lấy config
            var storagePath = _configuration["FileStorage:BasePath"];
            var baseUrl = _configuration["FileStorage:BaseUrl"];

            // Đảm bảo thư mục Images tồn tại
            var imagesFolder = Path.Combine(storagePath!, "Images");

            // Tạo tên file random + giữ lại extension
            var extension = Path.GetExtension(coverFile.FileName);
            var fileName = Path.GetRandomFileName() + extension;

            // Đường dẫn vật lý để lưu file
            var filePath = Path.Combine(imagesFolder, fileName);

            // Lưu file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await coverFile.CopyToAsync(stream);
            }

            // URL trả về cho client
            var coverUrl = $"{baseUrl}/Images/{fileName}";

            var playlist = new Playlist
            {
                Name = createPlaylistDto.Name,
                Description = createPlaylistDto.Description,
                IsPublic = createPlaylistDto.IsPublic,
                OwnerId = ownerId,
                CoverUrl = coverUrl
            };

            await _playlistRepository.AddAsync(playlist);
            await _playlistRepository.SaveChangesAsync();

            return new ApiResponse<PlaylistDto>(new PlaylistDto
            {
                Id = playlist.Id,
                Name = playlist.Name,
                Description = playlist.Description,
                IsPublic = playlist.IsPublic,
                OwnerId = playlist.OwnerId,
                CoverUrl = playlist.CoverUrl,
                Songs = new List<SongDto>()
            }, "Playlist created successfully.");
        }

        // Add Song to Playlist
        public async Task<ApiResponse<PlaylistDto>> AddSongToPlaylistAsync(Guid playlistId, Guid songId)
        {
            var playlist = await _playlistRepository.GetByIdAsync(playlistId);
            if (playlist == null) return ApiResponse<PlaylistDto>.Fail("Playlist not found.");

            var song = await _songRepository.GetByIdAsync(songId);
            if (song == null) return ApiResponse<PlaylistDto>.Fail("Song not found.");

            var existing = await _playlistSongRepository.FindAsync(ps => ps.PlaylistId == playlistId && ps.SongId == songId);
            if (existing.Any()) return ApiResponse<PlaylistDto>.Fail("Song already in playlist.");

            // Get current max order index
            var playlistSongs = await _playlistSongRepository.FindAsync(ps => ps.PlaylistId == playlistId);
            var maxOrder = playlistSongs.Any() ? playlistSongs.Max(ps => ps.OrderIndex) : -1;

            var playlistSong = new PlaylistSong
            {
                PlaylistId = playlistId,
                SongId = songId,
                OrderIndex = maxOrder + 1
            };

            await _playlistSongRepository.AddAsync(playlistSong);
            await _playlistSongRepository.SaveChangesAsync();

            return new ApiResponse<PlaylistDto>(new PlaylistDto
            {
                Id = playlist.Id,
                Name = playlist.Name,
                Description = playlist.Description,
                IsPublic = playlist.IsPublic,
                OwnerId = playlist.OwnerId
            }, "Song added to playlist.");
        }

        // Remove Song from Playlist
        public async Task<ApiResponse<PlaylistDto>> RemoveSongFromPlaylistAsync(Guid playlistId, Guid songId)
        {
            var playlist = await _playlistRepository.GetByIdAsync(playlistId);
            if (playlist == null) return ApiResponse<PlaylistDto>.Fail("Playlist not found.");

            var playlistSong = await _playlistSongRepository.FindAsync(ps => ps.PlaylistId == playlistId && ps.SongId == songId);
            var songToRemove = playlistSong.FirstOrDefault();
            
            if (songToRemove == null) return ApiResponse<PlaylistDto>.Fail("Song not found in playlist.");

            
            await _playlistSongRepository.DeleteByCompositeKeyAsync(playlistId, songId);
            await _playlistSongRepository.SaveChangesAsync();

            return new ApiResponse<PlaylistDto>(new PlaylistDto
            {
                Id = playlist.Id,
                Name = playlist.Name,
                Description = playlist.Description,
                IsPublic = playlist.IsPublic,
                OwnerId = playlist.OwnerId
            }, "Song removed from playlist.");
        }

        // Update Playlist
        public async Task<ApiResponse<PlaylistDto>> UpdatePlaylistAsync(Guid playlistId, PlaylistDto updatePlaylistDto)
        {
            var playlist = await _playlistRepository.GetByIdAsync(playlistId);
            if (playlist == null) return ApiResponse<PlaylistDto>.Fail("Playlist not found.");

            playlist.Name = updatePlaylistDto.Name;
            playlist.Description = updatePlaylistDto.Description;
            playlist.IsPublic = updatePlaylistDto.IsPublic;

            await _playlistRepository.UpdateAsync(playlist);
            await _playlistRepository.SaveChangesAsync();

            return new ApiResponse<PlaylistDto>(new PlaylistDto
            {
                Id = playlist.Id,
                Name = playlist.Name,
                Description = playlist.Description,
                IsPublic = playlist.IsPublic,
                OwnerId = playlist.OwnerId
            }, "Playlist updated successfully.");
        }

        // Delete Playlist
        public async Task<ApiResponse<PlaylistDto>> DeletePlaylistAsync(Guid playlistId)
        {
            var playlist = await _playlistRepository.GetByIdAsync(playlistId);
            if (playlist == null) return ApiResponse<PlaylistDto>.Fail("Playlist not found.");

            // Delete all playlist songs first
            var playlistSongs = await _playlistSongRepository.FindAsync(ps => ps.PlaylistId == playlistId);
            foreach (var ps in playlistSongs)
            {
                await _playlistSongRepository.DeleteAsync(ps.Id);
            }

            await _playlistRepository.DeleteAsync(playlist.Id);
            await _playlistRepository.SaveChangesAsync();

            return new ApiResponse<PlaylistDto>(null!, "Playlist deleted successfully.");
        }

        // Get Playlist by ID with Songs
        public async Task<ApiResponse<PlaylistDto>> GetPlaylistByIdAsync(Guid playlistId)
        {
            var playlist = await _playlistRepository.GetByIdAsync(playlistId);
            if (playlist == null) return ApiResponse<PlaylistDto>.Fail("Playlist not found.");

            var playlistSongs = await _playlistSongRepository.FindAsync(ps => ps.PlaylistId == playlistId);
            var songIds = playlistSongs.Select(ps => ps.SongId).ToList();
            
            var songs = await _songRepository.FindAsync(s => songIds.Contains(s.Id));
            
            var songDtos = playlistSongs
                .OrderBy(ps => ps.OrderIndex)
                .Select(ps =>
                {
                    var song = songs.FirstOrDefault(s => s.Id == ps.SongId);
                    return song != null ? new SongDto
                    {
                        Id = song.Id,
                        Title = song.Title,
                        Artist = song.Artist,
                        Album = song.Album,
                        Duration = song.Duration,
                        StreamUrl = song.StreamUrl,
                        CoverUrl = song.CoverUrl
                    } : null!;
                })
                .Where(s => s != null)
                .Cast<SongDto>()
                .ToList();

            return new ApiResponse<PlaylistDto>(new PlaylistDto
            {
                Id = playlist.Id,
                Name = playlist.Name,
                Description = playlist.Description,
                IsPublic = playlist.IsPublic,
                OwnerId = playlist.OwnerId,
                Songs = songDtos
            });
        }

        // Get All Playlists
        public async Task<ApiResponse<List<PlaylistDto>>> GetAllPlaylistsAsync()
        {
            var playlists = await _playlistRepository.GetAllAsync();
            var playlistDtos = playlists.Select(p => new PlaylistDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                IsPublic = p.IsPublic,
                OwnerId = p.OwnerId,
                CoverUrl = p.CoverUrl
            }).ToList();

            return new ApiResponse<List<PlaylistDto>>(playlistDtos);
        }

        // Get User Playlists
        public async Task<ApiResponse<List<PlaylistDto>>> GetUserPlaylistsAsync(Guid userId)
        {
            var playlists = await _playlistRepository.FindAsync(p => p.OwnerId == userId);
            var playlistDtos = playlists.Select(p => new PlaylistDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                IsPublic = p.IsPublic,
                OwnerId = p.OwnerId,
                CoverUrl = p.CoverUrl
            }).ToList();

            return new ApiResponse<List<PlaylistDto>>(playlistDtos);
        }

        // Get Playlists by User ID (alias for GetUserPlaylistsAsync)
        public async Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsByUserIdAsync(Guid userId)
        {
            return await GetUserPlaylistsAsync(userId);
        }

        // Get Playlists containing a specific Song
        public async Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsBySongIdAsync(Guid songId)
        {
            var playlistSongs = await _playlistSongRepository.FindAsync(ps => ps.SongId == songId);
            var playlistIds = playlistSongs.Select(ps => ps.PlaylistId).Distinct().ToList();

            var playlists = await _playlistRepository.FindAsync(p => playlistIds.Contains(p.Id));
            var playlistDtos = playlists.Select(p => new PlaylistDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                IsPublic = p.IsPublic,
                OwnerId = p.OwnerId
            }).ToList();

            return new ApiResponse<List<PlaylistDto>>(playlistDtos);
        }

        // Search Playlists by Name or Description
        public async Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsBySearchAsync(string search)
        {
            var searchLower = search.ToLower();
            var playlists = await _playlistRepository.FindAsync(p => 
                p.Name.ToLower().Contains(searchLower) || 
                (p.Description != null && p.Description.ToLower().Contains(searchLower)));

            var playlistDtos = playlists.Select(p => new PlaylistDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                IsPublic = p.IsPublic,
                OwnerId = p.OwnerId
            }).ToList();

            return new ApiResponse<List<PlaylistDto>>(playlistDtos);
        }

        // Get Playlists by Type (not implemented - placeholder)
        public async Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsByTypeAsync(string type)
        {
            // This could be extended if you add a Type field to Playlist entity
            // For now, return all playlists
            return await GetAllPlaylistsAsync();
        }

        // Get Public Playlists
        public async Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsByIsPublicAsync(bool isPublic)
        {
            var playlists = await _playlistRepository.FindAsync(p => p.IsPublic == isPublic);
            var playlistDtos = playlists.Select(p => new PlaylistDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                IsPublic = p.IsPublic,
                OwnerId = p.OwnerId
            }).ToList();

            return new ApiResponse<List<PlaylistDto>>(playlistDtos);
        }

        // Get Private Playlists
        public async Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsByIsPrivateAsync(bool isPrivate)
        {
            return await GetPlaylistsByIsPublicAsync(!isPrivate);
        }

        // Get Songs in Playlist
        public async Task<ApiResponse<List<SongDto>>> GetSongInPlaylist(Guid playlistId)
        {
            var playlist = await _playlistRepository.GetByIdAsync(playlistId);
            if (playlist == null) return ApiResponse<List<SongDto>>.Fail("Playlist not found.");

            var playlistSongs = await _playlistSongRepository.FindAsync(ps => ps.PlaylistId == playlistId);
            var songIds = playlistSongs.Select(ps => ps.SongId).ToList();

            var songs = await _songRepository.FindAsync(s => songIds.Contains(s.Id));

            var songDtos = playlistSongs
                .OrderBy(ps => ps.OrderIndex)
                .Select(ps =>
                {
                    var song = songs.FirstOrDefault(s => s.Id == ps.SongId);
                    return song != null ? new SongDto
                    {
                        Id = song.Id,
                        Title = song.Title,
                        Artist = song.Artist,
                        Album = song.Album,
                        Duration = song.Duration,
                        StreamUrl = song.StreamUrl,
                        CoverUrl = song.CoverUrl
                    } : null!;
                })
                .Where(s => s != null)
                .Cast<SongDto>()
                .ToList();

            return new ApiResponse<List<SongDto>>(songDtos);
        }

        // Get Playlists by User ID and Song ID
        public async Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsByUserIdAndSongIdAsync(Guid userId, Guid songId)
        {
            var playlistSongs = await _playlistSongRepository.FindAsync(ps => ps.SongId == songId);
            var playlistIds = playlistSongs.Select(ps => ps.PlaylistId).Distinct().ToList();

            var playlists = await _playlistRepository.FindAsync(p => 
                p.OwnerId == userId && playlistIds.Contains(p.Id));

            var playlistDtos = playlists.Select(p => new PlaylistDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                IsPublic = p.IsPublic,
                OwnerId = p.OwnerId
            }).ToList();

            return new ApiResponse<List<PlaylistDto>>(playlistDtos);
        }

        // Import Playlist from YouTube or Spotify
        public async Task<ApiResponse<ImportPlaylistResponseDto>> ImportPlaylistAsync(ImportPlaylistRequestDto request, Guid userId)
        {
            var response = new ImportPlaylistResponseDto();
            var importedSongs = new List<ImportedSongDto>();

            try
            {
                // Parse URL to determine source
                var isYouTube = request.PlaylistUrl.Contains("youtube.com") || request.PlaylistUrl.Contains("youtu.be");
                var isSpotify = request.PlaylistUrl.Contains("spotify.com");

                if (!isYouTube && !isSpotify)
                {
                    return ApiResponse<ImportPlaylistResponseDto>.Fail("Invalid playlist URL. Only YouTube and Spotify playlists are supported.", code: 400);
                }

                string playlistName = "Imported Playlist";
                string? playlistDescription = null;
                string? coverUrl = null;
                List<(string title, string artist)> tracks = new();

                // Fetch playlist data based on source
                if (isYouTube)
                {
                    // Extract playlist ID from URL
                    var playlistId = ExtractYouTubePlaylistId(request.PlaylistUrl);
                    if (string.IsNullOrEmpty(playlistId))
                    {
                        return ApiResponse<ImportPlaylistResponseDto>.Fail("Invalid YouTube playlist URL.", code: 400);
                    }

                    var playlistResult = await _youTubeService.GetPlaylistVideosAsync(playlistId);
                    if (!playlistResult.Success || playlistResult.Data == null)
                    {
                        return ApiResponse<ImportPlaylistResponseDto>.Fail($"Failed to fetch YouTube playlist: {playlistResult.Message}", code: 500);
                    }

                    playlistName = $"YouTube Playlist {playlistId}";
                    playlistDescription = "Imported from YouTube";
                    
                    foreach (var video in playlistResult.Data)
                    {
                        // Use ChannelName as artist, fallback to parsing title if not available
                        var artist = !string.IsNullOrWhiteSpace(video.ChannelName) 
                            ? video.ChannelName 
                            : ParseYouTubeTitleToArtistAndTitle(video.Title).artist;
                        var title = video.Title;
                        
                        tracks.Add((title, artist));
                    }

                    if (playlistResult.Data.Any())
                    {
                        coverUrl = playlistResult.Data.First().ThumbnailUrl;
                    }
                }
                else if (isSpotify)
                {
                    // Extract playlist ID from Spotify URL
                    var playlistId = ExtractSpotifyPlaylistId(request.PlaylistUrl);
                    if (string.IsNullOrEmpty(playlistId))
                    {
                        return ApiResponse<ImportPlaylistResponseDto>.Fail("Invalid Spotify playlist URL.", code: 400);
                    }

                    var spotifyTracks = await _spotifyService.GetPlaylistTracksAsync(playlistId);
                    if (spotifyTracks == null || !spotifyTracks.Any())
                    {
                        return ApiResponse<ImportPlaylistResponseDto>.Fail("Failed to fetch Spotify playlist or playlist is empty.", code: 500);
                    }

                    playlistName = $"Spotify Playlist {playlistId}";
                    playlistDescription = "Imported from Spotify";

                    foreach (var track in spotifyTracks)
                    {
                        tracks.Add((track.Name, track.Artist));
                    }
                }

                // Create playlist
                var playlist = new Playlist
                {
                    Name = playlistName,
                    Description = playlistDescription,
                    IsPublic = false,
                    OwnerId = userId,
                    CoverUrl = coverUrl
                };

                await _playlistRepository.AddAsync(playlist);
                await _playlistRepository.SaveChangesAsync();

                response.PlaylistId = playlist.Id;
                response.PlaylistName = playlist.Name;
                response.TotalTracks = tracks.Count;

                // Process each track
                int orderIndex = 0;
                foreach (var (title, artist) in tracks)
                {
                    var importedSong = new ImportedSongDto
                    {
                        Title = title,
                        Artist = artist
                    };

                    try
                    {
                        // Check if song exists in DB
                        var existingSong = await _songRepository.GetByNameAndArtistAsync(title, artist);

                        if (existingSong != null)
                        {
                            // Song exists, just add to playlist
                            importedSong.AlreadyExisted = true;
                            importedSong.WasDownloaded = false;

                            var playlistSong = new PlaylistSong
                            {
                                PlaylistId = playlist.Id,
                                SongId = existingSong.Id,
                                OrderIndex = orderIndex++
                            };

                            await _playlistSongRepository.AddAsync(playlistSong);
                            response.Skipped++;
                        }
                        else
                        {
                            // Song doesn't exist, search YouTube and download
                            var videoInfo = await _youTubeService.GetVideoUrlsBaseOnNameAndArtist(title, artist);

                            if (videoInfo == null)
                            {
                                importedSong.ErrorMessage = "Video not found on YouTube";
                                response.Failed++;
                                importedSongs.Add(importedSong);
                                continue;
                            }

                            // Download video as MP3
                            var downloadResult = await _youTubeService.DownloadVideoAsync(videoInfo.VideoUrl);

                            if (!downloadResult.Success || downloadResult.Data == null)
                            {
                                importedSong.ErrorMessage = $"Download failed: {downloadResult.Message}";
                                response.Failed++;
                                importedSongs.Add(importedSong);
                                continue;
                            }

                            // Create Song entity
                            var storagePath = _configuration["FileStorage:BasePath"];
                            var baseUrl = _configuration["FileStorage:BaseUrl"];
                            var musicFolder = Path.Combine(storagePath!, "Music");
                            var fileName = downloadResult.Data.FileName;
                            var streamUrl = $"{baseUrl}/Music/{fileName}";

                            var newSong = new Song
                            {
                                Title = title,
                                Artist = artist,
                                Duration = 0, // Could be extracted from video if needed
                                StreamUrl = streamUrl,
                                CoverUrl = videoInfo.ThumbnailUrl,
                                Status = SongStatus.Active,
                                Type = SongType.Single,
                                AudioQuality = AudioQuality.Normal
                            };

                            await _songRepository.AddAsync(newSong);
                            await _songRepository.SaveChangesAsync();

                            // Add to playlist
                            var playlistSong = new PlaylistSong
                            {
                                PlaylistId = playlist.Id,
                                SongId = newSong.Id,
                                OrderIndex = orderIndex++
                            };

                            await _playlistSongRepository.AddAsync(playlistSong);

                            importedSong.WasDownloaded = true;
                            importedSong.AlreadyExisted = false;
                            response.Downloaded++;
                        }

                        await _playlistSongRepository.SaveChangesAsync();
                    }
                    catch (Exception ex)
                    {
                        importedSong.ErrorMessage = ex.Message;
                        response.Failed++;
                    }

                    importedSongs.Add(importedSong);
                }

                response.ImportedSongs = importedSongs;
                response.Message = $"Playlist imported successfully. Downloaded: {response.Downloaded}, Skipped: {response.Skipped}, Failed: {response.Failed}";

                return new ApiResponse<ImportPlaylistResponseDto>(response, response.Message);
            }
            catch (Exception ex)
            {
                return ApiResponse<ImportPlaylistResponseDto>.Fail($"An error occurred during import: {ex.Message}", code: 500);
            }
        }

        private string? ExtractYouTubePlaylistId(string url)
        {
            try
            {
                var uri = new Uri(url);
                var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
                return query["list"];
            }
            catch
            {
                return null;
            }
        }

        private string? ExtractSpotifyPlaylistId(string url)
        {
            try
            {
                // Format: https://open.spotify.com/playlist/{id}
                var uri = new Uri(url);
                var segments = uri.Segments;
                return segments.Length > 2 ? segments[^1].TrimEnd('/') : null;
            }
            catch
            {
                return null;
            }
        }

        private (string artist, string title) ParseYouTubeTitleToArtistAndTitle(string videoTitle)
        {
            // Common patterns: "Artist - Title", "Artist: Title", "Title by Artist"
            if (videoTitle.Contains(" - "))
            {
                var parts = videoTitle.Split(new string[] { " - " }, 2, StringSplitOptions.None);
                return (parts[0].Trim(), parts[1].Trim());
            }
            else if (videoTitle.Contains(": "))
            {
                var parts = videoTitle.Split(new string[] { ": " }, 2, StringSplitOptions.None);
                return (parts[0].Trim(), parts[1].Trim());
            }
            else if (videoTitle.ToLower().Contains(" by "))
            {
                var parts = videoTitle.Split(new string[] { " by ", " By ", " BY " }, StringSplitOptions.None);
                if (parts.Length >= 2)
                {
                    return (parts[1].Trim(), parts[0].Trim());
                }
            }

            // Default: use video title as both artist and title
            return ("Unknown Artist", videoTitle);
        }
    }
}
