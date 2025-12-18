using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Kita.Domain.Entities;
using Kita.Domain.Entities.Music;
using Kita.Infrastructure.Repositories;
using Kita.Service.Common;
using Kita.Service.DTOs.Music;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Domain.Enums;
using Kita.Domain.Enums;
using Service.DTOs.Music;
using TagLib;

namespace Kita.Service.Services
{
    public class MusicService : IMusicService
    {
        private readonly ISongRepository _songRepository;
        private readonly IBaseRepository<Playlist> _playlistRepository;
        private readonly IPlaylistSongRepository _playlistSongRepository;
        private readonly IConfiguration _configuration;
        private readonly IYouTubeService _youtubeService;
        private readonly IUserRepository _userRepository;
        private readonly IArtistRepository _artistRepository;

        public MusicService(ISongRepository songRepository, IBaseRepository<Playlist> playlistRepository, IPlaylistSongRepository playlistSongRepository, IConfiguration configuration, IYouTubeService youtubeService, IUserRepository userRepository, IArtistRepository artistRepository)
        {
            _songRepository = songRepository;
            _playlistRepository = playlistRepository;
            _playlistSongRepository = playlistSongRepository;
            _configuration = configuration;
            _youtubeService = youtubeService;
            _userRepository = userRepository;
            _artistRepository = artistRepository;
        }

        // Helper method to map Song to SongDto
        private SongDto MapToSongDto(Song s)
        {
            return new SongDto
            {
                Id = s.Id,
                Title = s.Title,
                Artist = s.Artist?.Name ?? string.Empty,
                Album = s.Album?.Name,
                ArtistId = s.ArtistId,
                AlbumId = s.AlbumId,
                UserId = s.UserId,
                Uploader = s.User?.UserName,
                Duration = s.Duration,
                StreamUrl = s.StreamUrl,
                CoverUrl = s.CoverUrl,
                Status = s.Status,
                Type = s.Type,
                Genres = s.Genres,
                AudioQuality = s.AudioQuality,
                CreatedAt = s.CreatedAt
            };
        }

        // User uploads: just set UserId, ignore Artist
        // Artist uploads: set ArtistId (Artist must already exist)
        // Artist uploads: set ArtistId (Artist must already exist)

        public async Task<ApiResponse<SongDto>> CreateSongAsync(CreateSongDto createSongDto, Guid userId)
        {
            // Get uploading user to check role
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                return ApiResponse<SongDto>.Fail("User not found.", code: 404);

            var song = new Song
            {
                Title = createSongDto.Title,
                Duration = createSongDto.Duration,
                StreamUrl = createSongDto.StreamUrl,
                CoverUrl = createSongDto.CoverUrl,
                Status = createSongDto.Status,
                Type = createSongDto.Type,
                Genres = createSongDto.Genres,
                AudioQuality = createSongDto.AudioQuality,
                UserId = userId // Always set the uploader
            };

            // If user is an Artist, also try to find and set ArtistId
            if (user.Role == "Artist" && !string.IsNullOrWhiteSpace(createSongDto.Artist))
            {
                var artist = await _artistRepository.GetByNameAsync(createSongDto.Artist);
                if (artist != null)
                {
                    song.ArtistId = artist.Id;
                }
            }

            await _songRepository.AddAsync(song);
            await _songRepository.SaveChangesAsync();

            // Reload to get navigation properties
            song = await _songRepository.GetByIdAsync(song.Id);

            return new ApiResponse<SongDto>(new SongDto
            {
                Id = song.Id,
                Title = song.Title,
                Artist = song.Artist?.Name ?? string.Empty,
                Album = song.Album?.Name,
                ArtistId = song.ArtistId,
                AlbumId = song.AlbumId,
                UserId = song.UserId,
                Duration = song.Duration,
                StreamUrl = song.StreamUrl,
                CoverUrl = song.CoverUrl,
                Status = song.Status,
                Type = song.Type,
                Genres = song.Genres,
                AudioQuality = song.AudioQuality,
                CreatedAt = song.CreatedAt
            });
        }


        public async Task<ApiResponse<SongDto>> UploadSongAsync(CreateSongDto createSongDto, IFormFile songFile, IFormFile? coverFile, Guid userId, string role)
        {
            if (songFile == null || songFile.Length == 0)
            {
                return ApiResponse<SongDto>.Fail("Song file is required.");
            }

            // Get uploading user to check role
            if (role == "User")
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                        return ApiResponse<SongDto>.Fail("User not found.", code: 404);
                }
            }


            var storagePath = _configuration["FileStorage:BasePath"];
            var baseUrl = _configuration["FileStorage:BaseUrl"];

            if (string.IsNullOrEmpty(storagePath) || string.IsNullOrEmpty(baseUrl))
            {
                return ApiResponse<SongDto>.Fail("File storage configuration is missing.", code: 500);
            }

            var songsPath = Path.Combine(storagePath, "Music");
            var coversPath = Path.Combine(storagePath, "Images");

            if (!Directory.Exists(songsPath)) Directory.CreateDirectory(songsPath);
            if (!Directory.Exists(coversPath)) Directory.CreateDirectory(coversPath);

            var songExtension = Path.GetExtension(songFile.FileName);
            var songFileName = $"{Guid.NewGuid()}{songExtension}";
            var songFilePath = Path.Combine(songsPath, songFileName);

            using (var stream = new FileStream(songFilePath, FileMode.Create))
            {
                await songFile.CopyToAsync(stream);
            }
            var songUrl = $"{baseUrl}/music/{songFileName}";

            int duration = 0;
            try
            {
                var tagFile = TagLib.File.Create(songFilePath);
                duration = (int)tagFile.Properties.Duration.TotalSeconds;
            }
            catch (Exception)
            {
                // Ignore duration extraction errors
            }

            string? coverUrl = null;
            if (coverFile != null && coverFile.Length > 0)
            {
                var coverExtension = Path.GetExtension(coverFile.FileName);
                var coverFileName = $"{Guid.NewGuid()}{coverExtension}";
                var coverFilePath = Path.Combine(coversPath, coverFileName);

                using (var stream = new FileStream(coverFilePath, FileMode.Create))
                {
                    await coverFile.CopyToAsync(stream);
                }
                coverUrl = $"{baseUrl}/Images/{coverFileName}";
            }

            // Create Song Entity
            var song = new Song
            {
                Title = createSongDto.Title,
                Duration = duration, 
                StreamUrl = songUrl,
                CoverUrl = coverUrl ?? createSongDto.CoverUrl,
                Status = createSongDto.Status,
                Type = createSongDto.Type,
                Genres = createSongDto.Genres,
                AudioQuality = createSongDto.AudioQuality,
                CreatedAt = DateTime.UtcNow,
                UserId = userId // Always set uploader
            };

            // If user is an Artist, also try to find and set ArtistId
            if (role == "Artist" && !string.IsNullOrWhiteSpace(createSongDto.Artist))
            {
                var artist = await _artistRepository.GetByIdAsync(userId);
                if (artist != null)
                {
                    song.ArtistId = artist.Id;
                }
            }

            await _songRepository.AddAsync(song);
            await _songRepository.SaveChangesAsync();

            return new ApiResponse<SongDto>(new SongDto
            {
                Id = song.Id,
                Title = song.Title,
                Artist = song.Artist?.Name ?? string.Empty,
                Album = song.Album?.Name,
                ArtistId = song.ArtistId,
                AlbumId = song.AlbumId,
                UserId = song.UserId,
                Duration = song.Duration,
                StreamUrl = song.StreamUrl,
                CoverUrl = song.CoverUrl,
                Status = song.Status,
                Type = song.Type,
                Genres = song.Genres,
                AudioQuality = song.AudioQuality,
                CreatedAt = song.CreatedAt
            }, "Song uploaded successfully.");
        }

        public async Task<ApiResponse<List<SongDto>>> GetAllSongsAsync()
        {
            var songs = await _songRepository.GetAllAsync();
            var songDtos = songs.Select(s => MapToSongDto(s)).ToList();
            return new ApiResponse<List<SongDto>>(songDtos);
        }

        public async Task<ApiResponse<SongDto>> GetSongByIdAsync(Guid songId)
        {
            var song = await _songRepository.GetByIdAsync(songId);
            if (song == null)
            {
                return ApiResponse<SongDto>.Fail("Song not found.");
            }
            return new ApiResponse<SongDto>(MapToSongDto(song));
        }

        public async Task<ApiResponse<SongDto>> UpdateSongAsync(Guid songId, SongDto updateSongDto)
        {
            var song = await _songRepository.GetByIdAsync(songId);
            if (song == null)
            {
                return ApiResponse<SongDto>.Fail("Song not found.");
            }
            
            Guid? artistId = null;
            if (!string.IsNullOrWhiteSpace(updateSongDto.Artist))
            {
                var artist = await _artistRepository.GetByNameAsync(updateSongDto.Artist);
                if (artist != null)
                {
                    artistId = artist.Id;
                }
            }
            
            song.Title = updateSongDto.Title;
            song.ArtistId = artistId;
            // Album is now an entity, skip direct assignment from string
            song.Duration = updateSongDto.Duration;
            song.StreamUrl = updateSongDto.StreamUrl;
            song.CoverUrl = updateSongDto.CoverUrl;
            
            await _songRepository.SaveChangesAsync();
            
            // Reload to get Artist navigation property
            song = await _songRepository.GetByIdAsync(song.Id);
            var songDto = new SongDto
            {
                Id = song.Id,
                Title = song.Title,
                Artist = song.Artist?.Name ?? string.Empty,
                Album = song.Album?.Name,
                Duration = song.Duration,
                StreamUrl = song.StreamUrl,
                CoverUrl = song.CoverUrl,
                Status = song.Status,
                Type = song.Type,
                Genres = song.Genres,
                AudioQuality = song.AudioQuality,
                CreatedAt = song.CreatedAt
            };
            await _songRepository.SaveChangesAsync();
            return new ApiResponse<SongDto>(songDto);
        }

        public async Task<ApiResponse<SongDto>> ChangeSongStatusAsync(Guid songId, string status)
        {
            var song = await _songRepository.GetByIdAsync(songId);
            if (song == null)
            {
                return ApiResponse<SongDto>.Fail("Song not found.");
            }
            song.Status = (SongStatus)Enum.Parse(typeof(SongStatus), status);
            var songDto = new SongDto
            {
                Id = song.Id,
                Title = song.Title,
                Artist = song.Artist?.Name ?? string.Empty,
                Album = song.Album?.Name,
                Duration = song.Duration,
                StreamUrl = song.StreamUrl,
                CoverUrl = song.CoverUrl,
                Status = song.Status,
                Type = song.Type,
                Genres = song.Genres,
                AudioQuality = song.AudioQuality,
                CreatedAt = song.CreatedAt
            };
            await _songRepository.SaveChangesAsync();
            return new ApiResponse<SongDto>(songDto);
        }

        public async Task<ApiResponse<SongDto>> GetSongByNameAndArtistAsync(string name, string artist)
        {
            var song = await _songRepository.GetByNameAndArtistAsync(name, artist);
            if (song == null)
            {
                await _youtubeService.GetVideoUrlsBaseOnNameAndArtist(name, artist);
            }
            var songDto = new SongDto
            {
                Id = song.Id,
                Title = song.Title,
                Artist = song.Artist?.Name ?? string.Empty,
                Album = song.Album?.Name,
                Duration = song.Duration,
                StreamUrl = song.StreamUrl,
                CoverUrl = song.CoverUrl,
                Status = song.Status,
                Type = song.Type,
                Genres = song.Genres,
                AudioQuality = song.AudioQuality,
                CreatedAt = song.CreatedAt
            };
            return new ApiResponse<SongDto>(songDto);
        }

        public async Task<ApiResponse<string>> DeleteAllSongsAsync()
        {
            var songs = await _songRepository.GetAllAsync();
            var count = songs.Count();
            
            var storagePath = _configuration["FileStorage:BasePath"];
            var baseUrl = _configuration["FileStorage:BaseUrl"];

            foreach (var song in songs)
            {
                // Delete physical song file
                if (!string.IsNullOrEmpty(song.StreamUrl) && !string.IsNullOrEmpty(storagePath) && !string.IsNullOrEmpty(baseUrl))
                {
                    try
                    {
                        var songFileName = song.StreamUrl.Replace($"{baseUrl}/Music/", "");
                        var songFilePath = Path.Combine(storagePath, "Music", songFileName);
                        
                        if (System.IO.File.Exists(songFilePath))
                        {
                            System.IO.File.Delete(songFilePath);
                        }
                    }
                    catch (Exception ex)
                    {
                        // Log error but continue with other files
                        Console.WriteLine($"Error deleting song file: {ex.Message}");
                    }
                }

                // Delete physical cover file
                if (!string.IsNullOrEmpty(song.CoverUrl) && !string.IsNullOrEmpty(storagePath) && !string.IsNullOrEmpty(baseUrl))
                {
                    try
                    {
                        var coverFileName = song.CoverUrl.Replace($"{baseUrl}/Images/", "");
                        var coverFilePath = Path.Combine(storagePath, "Images", coverFileName);
                        
                        if (System.IO.File.Exists(coverFilePath))
                        {
                            System.IO.File.Delete(coverFilePath);
                        }
                    }
                    catch (Exception ex)
                    {
                        // Log error but continue with other files
                        Console.WriteLine($"Error deleting cover file: {ex.Message}");
                    }
                }

                // Delete from database
                await _songRepository.DeleteAsync(song.Id);
            }
            
            await _songRepository.SaveChangesAsync();
            
            return new ApiResponse<string>($"Successfully deleted {count} songs and their files from the database and storage.");
        }

        public async Task<ApiResponse<List<SongDto>>> FilterSongByName(string name)
        {
            var songs = await _songRepository.FilterSongByName(name);
            var songDtos = songs.Select(s => new SongDto
            {
                Id = s.Id,
                Title = s.Title,
                Artist = s.Artist?.Name ?? string.Empty,
                Album = s.Album?.Name,
                Duration = s.Duration,
                StreamUrl = s.StreamUrl,
                CoverUrl = s.CoverUrl,
                Status = s.Status,
                Type = s.Type,
                Genres = s.Genres,
                AudioQuality = s.AudioQuality,
                CreatedAt = s.CreatedAt
            }).ToList();
            return new ApiResponse<List<SongDto>>(songDtos);
        }
        public async Task<ApiResponse<List<SongDto>>> FilterSongByArtist(string artist)
        {
            var songs = await _songRepository.FilterSongByArtist(artist);
            var songDtos = songs.Select(s => new SongDto
            {
                Id = s.Id,
                Title = s.Title,
                Artist = s.Artist?.Name ?? string.Empty,
                Album = s.Album?.Name,
                Duration = s.Duration,
                StreamUrl = s.StreamUrl,
                CoverUrl = s.CoverUrl,
                Status = s.Status,
                Type = s.Type,
                Genres = s.Genres,
                AudioQuality = s.AudioQuality,
                CreatedAt = s.CreatedAt
            }).ToList();
            return new ApiResponse<List<SongDto>>(songDtos);
        }
        public async Task<ApiResponse<List<SongDto>>> FilterSongByAlbum(string album)
        {
            var songs = await _songRepository.FilterSongByAlbum(album);
            var songDtos = songs.Select(s => new SongDto
            {
                Id = s.Id,
                Title = s.Title,
                Artist = s.Artist?.Name ?? string.Empty,
                Album = s.Album?.Name,
                Duration = s.Duration,
                StreamUrl = s.StreamUrl,
                CoverUrl = s.CoverUrl,
                Status = s.Status,
                Type = s.Type,
                Genres = s.Genres,
                AudioQuality = s.AudioQuality,
                CreatedAt = s.CreatedAt
            }).ToList();
            return new ApiResponse<List<SongDto>>(songDtos);
        }
        public async Task<ApiResponse<List<SongDto>>> FilterSongByGenre(string genre)
        {
            var songs = await _songRepository.FilterSongByGenre(genre);
            var songDtos = songs.Select(s => new SongDto
            {
                Id = s.Id,
                Title = s.Title,
                Artist = s.Artist?.Name ?? string.Empty,
                Album = s.Album?.Name,
                Duration = s.Duration,
                StreamUrl = s.StreamUrl,
                CoverUrl = s.CoverUrl,
                Status = s.Status,
                Type = s.Type,
                Genres = s.Genres,
                AudioQuality = s.AudioQuality,
                CreatedAt = s.CreatedAt
            }).ToList();
            return new ApiResponse<List<SongDto>>(songDtos);
        }
        public async Task<ApiResponse<List<SongDto>>> FilterSongByAudioQuality(string audioQuality)
        {
            var songs = await _songRepository.FilterSongByAudioQuality(audioQuality);
            var songDtos = songs.Select(s => new SongDto
            {
                Id = s.Id,
                Title = s.Title,
                Artist = s.Artist?.Name ?? string.Empty,
                Album = s.Album?.Name,
                Duration = s.Duration,
                StreamUrl = s.StreamUrl,
                CoverUrl = s.CoverUrl,
                Status = s.Status,
                Type = s.Type,
                Genres = s.Genres,
                AudioQuality = s.AudioQuality,
                CreatedAt = s.CreatedAt
            }).ToList();
            return new ApiResponse<List<SongDto>>(songDtos);
        }
        

        public async Task<ApiResponse<List<SongDto>>> GetSongByUserId(Guid userId)
        {
            var songs = await _songRepository.GetSongsByUserIdAsync(userId);
            var songDtos = songs.Select(s => MapToSongDto(s)).ToList();
            return new ApiResponse<List<SongDto>>(songDtos);
        }

        public async Task<ApiResponse<List<SongDto>>> GetSongByPlaylistId(Guid playlistId)
        {
            var songs = await _songRepository.GetSongsByPlaylistIdAsync(playlistId);
            var songDtos = songs.Select(s => MapToSongDto(s)).ToList();
            return new ApiResponse<List<SongDto>>(songDtos);
        }

        public async Task<ApiResponse<List<SongDto>>> SearchSongsAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return ApiResponse<List<SongDto>>.Fail("Search query cannot be empty.");
            }
            
            var songs = await _songRepository.SearchSongsFullTextAsync(query);
            
            var songDtos = songs.Select(s => new SongDto
            {
                Id = s.Id,
                Title = s.Title,
                Artist = s.Artist?.Name ?? string.Empty,
                Album = s.Album?.Name,
                Duration = s.Duration,
                StreamUrl = s.StreamUrl,
                CoverUrl = s.CoverUrl,
                Status = s.Status,
                Type = s.Type,
                Genres = s.Genres,
                AudioQuality = s.AudioQuality,
                CreatedAt = s.CreatedAt
            }).ToList();
            
            return new ApiResponse<List<SongDto>>(songDtos);
        }

        

    }
}
