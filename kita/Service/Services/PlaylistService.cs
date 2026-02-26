using Kita.Domain.Entities;
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
        private readonly IUserRepository _userRepository;
        private readonly IArtistRepository _artistRepository;
        private readonly ISongStaticsService _songStaticsService;

        public PlaylistService(
            IBaseRepository<Playlist> playlistRepository, 
            ISongRepository _songRepository, 
            IPlaylistSongRepository playlistSongRepository,
            IConfiguration configuration,
            IYouTubeService youTubeService,
            ISpotifyService spotifyService,
            IUserRepository userRepository,
            IArtistRepository artistRepository,
            ISongStaticsService songStaticsService)
        {
            _playlistRepository = playlistRepository;
            this._songRepository = _songRepository;
            _playlistSongRepository = playlistSongRepository;
            _configuration = configuration;
            _youTubeService = youTubeService;
            _spotifyService = spotifyService;
            _userRepository = userRepository;
            _artistRepository = artistRepository;
            _songStaticsService = songStaticsService;
        }



        private async Task<Guid?> GetOrCreateArtistAsync(string artistName)
        {
            if (string.IsNullOrWhiteSpace(artistName))
                return null;

            // Check if artist already exists
            var existingArtist = await _artistRepository.GetByNameAsync(artistName);
            if (existingArtist != null)
                return existingArtist.Id;

            // Create new artist with null ManagedByUsers list
            var newArtist = new Artist
            {
                Name = artistName,
                Description = $"Auto-created artist from playlist import",
                Role = "Artist"
            };
            await _artistRepository.AddAsync(newArtist);
            await _artistRepository.SaveChangesAsync();
            return newArtist.Id;
        }

        // Create Playlist
        public async Task<ApiResponse<PlaylistDto>> CreatePlaylistAsync(CreatePlaylistDto createPlaylistDto, Guid ownerId, IFormFile? coverFile)
        {
            string? coverUrl = null;

            // Upload cover image if provided
            if (coverFile != null)
            {
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
                coverUrl = $"{baseUrl}/Images/{fileName}";
            }

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

            // If this is the "Favorite" playlist, also unfavorite the song
            if (playlist.Name == "Favorite")
            {
                try
                {
                    await _songStaticsService.DecrementFavoriteCountAsync(songId, playlist.OwnerId);
                }
                catch (Exception)
                {
                    // Silently fail - song is already removed from playlist
                }
            }

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
        public async Task<ApiResponse<PlaylistDto>> UpdatePlaylistAsync(Guid playlistId, PlaylistDto updatePlaylistDto, IFormFile? coverFile = null)
        {
            var playlist = await _playlistRepository.GetByIdAsync(playlistId);
            if (playlist == null) return ApiResponse<PlaylistDto>.Fail("Playlist not found.");

            playlist.Name = updatePlaylistDto.Name;
            playlist.Description = updatePlaylistDto.Description;
            playlist.IsPublic = updatePlaylistDto.IsPublic;

            // Upload new cover image if provided
            if (coverFile != null)
            {
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
                playlist.CoverUrl = $"{baseUrl}/Images/{fileName}";
            }

            await _playlistRepository.UpdateAsync(playlist);
            await _playlistRepository.SaveChangesAsync();

            return new ApiResponse<PlaylistDto>(new PlaylistDto
            {
                Id = playlist.Id,
                Name = playlist.Name,
                Description = playlist.Description,
                IsPublic = playlist.IsPublic,
                OwnerId = playlist.OwnerId,
                CoverUrl = playlist.CoverUrl
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
                await _playlistSongRepository.DeleteByCompositeKeyAsync(ps.PlaylistId, ps.SongId);
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
            
            // Use GetSongsByIdsAsync to include navigation properties (Artist, Album, User)
            var songs = await _songRepository.GetSongsByIdsAsync(songIds);
            
            var songDtos = playlistSongs
                .OrderBy(ps => ps.OrderIndex)
                .Select(ps =>
                {
                    var song = songs.FirstOrDefault(song => song.Id == ps.SongId);
                    return song != null ? new SongDto
                    {
                        Id = song.Id,
                        Title = song.Title,
                        Artist = song.Artist?.Name ?? string.Empty,
                        Album = song.Album?.Name,
                        ArtistId = song.ArtistId,
                        AlbumId = song.AlbumId,
                        UserId = song.UserId,
                        Uploader = song.User?.UserName,
                        Duration = song.Duration,
                        StreamUrl = song.StreamUrl,
                        CoverUrl = song.CoverUrl,
                        Status = song.Status,
                        Type = song.Type,
                        Genres = song.Genres,
                        AudioQuality = song.AudioQuality,
                        CreatedAt = song.CreatedAt
                        
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
                CoverUrl = playlist.CoverUrl,
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
            var playlistDtos = new List<PlaylistDto>();

            foreach (var playlist in playlists)
            {
                // Get all songs in this playlist
                var playlistSongs = await _playlistSongRepository.FindAsync(ps => ps.PlaylistId == playlist.Id);
                var songIds = playlistSongs.Select(ps => ps.SongId).ToList();
                
                // Use GetSongsByIdsAsync to include navigation properties
                var songs = await _songRepository.GetSongsByIdsAsync(songIds);
                
                var songDtos = playlistSongs
                    .OrderBy(ps => ps.OrderIndex)
                    .Select(ps =>
                    {
                        var song = songs.FirstOrDefault(s => s.Id == ps.SongId);
                        return song != null ? new SongDto
                        {
                            Id = song.Id,
                            Title = song.Title,
                            Artist = song.Artist?.Name ?? string.Empty,
                            Album = song.Album?.Name,
                            ArtistId = song.ArtistId,
                            AlbumId = song.AlbumId,
                            UserId = song.UserId,
                            Uploader = song.User?.UserName,
                            Duration = song.Duration,
                            StreamUrl = song.StreamUrl,
                            CoverUrl = song.CoverUrl,
                            Status = song.Status,
                            Type = song.Type,
                            Genres = song.Genres,
                            AudioQuality = song.AudioQuality,
                            CreatedAt = song.CreatedAt
                            
                        } : null!;
                    })
                    .Where(s => s != null)
                    .Cast<SongDto>()
                    .ToList();

                // Calculate total duration
                var totalDuration = songDtos.Sum(s => s.Duration);

                playlistDtos.Add(new PlaylistDto
                {
                    Id = playlist.Id,
                    Name = playlist.Name,
                    Description = playlist.Description,
                    IsPublic = playlist.IsPublic,
                    OwnerId = playlist.OwnerId,
                    CoverUrl = playlist.CoverUrl,
                    Songs = songDtos,
                    TotalDuration = totalDuration
                });
            }

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

            // Use GetSongsByIdsAsync to include navigation properties
            var songs = await _songRepository.GetSongsByIdsAsync(songIds);

            var songDtos = playlistSongs
                .OrderBy(ps => ps.OrderIndex)
                .Select(ps =>
                {
                    var song = songs.FirstOrDefault(s => s.Id == ps.SongId);
                    return song != null ? new SongDto
                    {
                        Id = song.Id,
                        Title = song.Title,
                        Artist = song.Artist?.Name ?? string.Empty,
                        Album = song.Album?.Name,
                        ArtistId = song.ArtistId,
                        AlbumId = song.AlbumId,
                        UserId = song.UserId,
                        Uploader = song.User?.UserName,
                        Duration = song.Duration,
                        StreamUrl = song.StreamUrl,
                        CoverUrl = song.CoverUrl,
                        Status = song.Status,
                        Type = song.Type,
                        Genres = song.Genres,
                        AudioQuality = song.AudioQuality,
                        CreatedAt = song.CreatedAt
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

                    playlistName = playlistResult.Data.playlistName;
                    playlistDescription = "Imported from YouTube";
                    
                    foreach (var video in playlistResult.Data.videos)
                    {
                        var artist = !string.IsNullOrWhiteSpace(video.ChannelName) 
                            ? video.ChannelName 
                            : ParseYouTubeTitleToArtistAndTitle(video.Title).artist;
                        var title = video.Title;
                        
                        tracks.Add((title, artist));
                    }

                    if (playlistResult.Data.videos.Any())
                    {
                        coverUrl = playlistResult.Data.videos.First().ThumbnailUrl;
                    }
                }
                else if (isSpotify)
                {
                    var playlistId = ExtractSpotifyPlaylistId(request.PlaylistUrl);
                    if (string.IsNullOrEmpty(playlistId))
                    {
                        return ApiResponse<ImportPlaylistResponseDto>.Fail("Invalid Spotify playlist URL.", code: 400);
                    }

                    var spotifyPlaylist = await _spotifyService.GetPlaylistInfoAsync(playlistId);
                    if (spotifyPlaylist == null || spotifyPlaylist.Tracks == null || !spotifyPlaylist.Tracks.Any())
                    {
                        return ApiResponse<ImportPlaylistResponseDto>.Fail("Failed to fetch Spotify playlist or playlist is empty.", code: 500);
                    }

                    playlistName = spotifyPlaylist.Name;
                    playlistDescription = "Imported from Spotify";

                    foreach (var track in spotifyPlaylist.Tracks)
                    {
                        tracks.Add((track.Name, track.Artist));
                    }
                    coverUrl = spotifyPlaylist.CoverUrl;
                }


                var playlist = new Playlist
                {
                    Name = playlistName,
                    Description = playlistDescription,
                    IsPublic = true,
                    OwnerId = userId,
                    CoverUrl = coverUrl
                };

                await _playlistRepository.AddAsync(playlist);
                await _playlistRepository.SaveChangesAsync();

                response.PlaylistId = playlist.Id;
                response.PlaylistName = playlist.Name;
                response.TotalTracks = tracks.Count;

                // Track songs added in this session to avoid duplicates
                var addedSongsInSession = new HashSet<Guid>();

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
                        // Check if song exists in DB using fuzzy matching
                        // First check if artist name contains the search artist (handles "Artist - Topic" channels)
                        // Then check if title contains the search title
                        var existingSong = await _songRepository.FindByTitleOrArtistContainsAsync(title, artist);

                        if (existingSong != null)
                        {
                            // Check if song already added in this session
                            if (addedSongsInSession.Contains(existingSong.Id))
                            {
                                importedSong.AlreadyExisted = true;
                                importedSong.WasDownloaded = false;
                                importedSong.ErrorMessage = "Duplicate song in import list";
                                response.Skipped++;
                                importedSongs.Add(importedSong);
                                continue;
                            }

                            // Check if song already exists in this playlist
                            var existingPlaylistSong = await _playlistSongRepository.GetByPlaylistAndSongIdAsync(playlist.Id, existingSong.Id);
                            
                            if (existingPlaylistSong != null)
                            {
                                // Song already in playlist, skip it
                                importedSong.AlreadyExisted = true;
                                importedSong.WasDownloaded = false;
                                importedSong.ErrorMessage = "Song already exists in this playlist";
                                response.Skipped++;
                            }
                            else
                            {
                                // Song exists in DB but not in playlist, add it
                                importedSong.AlreadyExisted = true;
                                importedSong.WasDownloaded = false;

                                var playlistSong = new PlaylistSong
                                {
                                    PlaylistId = playlist.Id,
                                    SongId = existingSong.Id,
                                    OrderIndex = orderIndex++
                                };

                                await _playlistSongRepository.AddAsync(playlistSong);
                                addedSongsInSession.Add(existingSong.Id);
                                response.Skipped++;
                            }
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

                            // Add delay between downloads to avoid rate limiting (1-2 seconds)
                            await Task.Delay(1500);
                            
                            // Download video as MP3
                            var downloadResult = await _youTubeService.DownloadVideoAsync(videoInfo.VideoUrl);

                            if (!downloadResult.Success || downloadResult.Data == null)
                            {
                                importedSong.ErrorMessage = $"Download failed: {downloadResult.Message}";
                                response.Failed++;
                                importedSongs.Add(importedSong);
                                continue;
                            }

                            // Verify file exists
                            if (string.IsNullOrEmpty(downloadResult.Data.FilePath) || !File.Exists(downloadResult.Data.FilePath))
                            {
                                importedSong.ErrorMessage = "Downloaded file not found on disk";
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

                            // Use duration from YouTube DTO instead of TagLib
                            int durationInSeconds = videoInfo.Duration.HasValue 
                                ? (int)videoInfo.Duration.Value.TotalSeconds 
                                : 0;

                            // Business logic:
                            // - Spotify import: Create artist and link to song
                            // - YouTube import: Don't create artist (just set uploader)
                            // - All cases: Set UserId as uploader
                            Guid? artistId = null;
                            if (isSpotify)
                            {
                                artistId = await GetOrCreateArtistAsync(artist);
                            }

                            var newSong = new Song
                            {
                                Title = title,
                                ArtistId = artistId,
                                UserId = userId, // User who imported = uploader
                                Duration = durationInSeconds,
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
                            addedSongsInSession.Add(newSong.Id);

                            importedSong.WasDownloaded = true;
                            importedSong.AlreadyExisted = false;
                            response.Downloaded++;
                        }
                    }
                    catch (Exception ex)
                    {
                        importedSong.ErrorMessage = ex.Message;
                        response.Failed++;
                    }

                    importedSongs.Add(importedSong);
                }

                // Save all changes once after the loop
                await _playlistSongRepository.SaveChangesAsync();

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

            return ("Unknown Artist", videoTitle);
        }

        // Get Public Playlists by User ID
        public async Task<ApiResponse<List<PlaylistDto>>> GetPublicPlaylistsByUserIdAsync(Guid userId)
        {
            var playlists = await _playlistRepository.FindAsync(p => p.OwnerId == userId && p.IsPublic);
            var playlistDtos = new List<PlaylistDto>();

            foreach (var playlist in playlists)
            {
                var playlistSongs = await _playlistSongRepository.FindAsync(ps => ps.PlaylistId == playlist.Id);
                var songCount = playlistSongs.Count();

                playlistDtos.Add(new PlaylistDto
                {
                    Id = playlist.Id,
                    Name = playlist.Name,
                    Description = playlist.Description,
                    IsPublic = playlist.IsPublic,
                    OwnerId = playlist.OwnerId,
                    CoverUrl = playlist.CoverUrl,
                    SongCount = songCount
                });
            }

            return new ApiResponse<List<PlaylistDto>>(playlistDtos);
        }
    }
}
