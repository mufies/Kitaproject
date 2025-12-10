using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
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

namespace Kita.Service.Services
{
    public class MusicService : IMusicService
    {
        private readonly ISongRepository _songRepository;
        private readonly IBaseRepository<Playlist> _playlistRepository;
        private readonly IPlaylistSongRepository _playlistSongRepository;
        private readonly IConfiguration _configuration;
        private readonly IYouTubeService _youtubeService;

        public MusicService(ISongRepository songRepository, IBaseRepository<Playlist> playlistRepository, IPlaylistSongRepository playlistSongRepository, IConfiguration configuration, IYouTubeService youtubeService)
        {
            _songRepository = songRepository;
            _playlistRepository = playlistRepository;
            _playlistSongRepository = playlistSongRepository;
            _configuration = configuration;
            _youtubeService = youtubeService;
        }

        public async Task<ApiResponse<SongDto>> CreateSongAsync(CreateSongDto createSongDto)
        {
            var song = new Song
            {
                Title = createSongDto.Title,
                Artist = createSongDto.Artist,
                Album = createSongDto.Album,
                Duration = createSongDto.Duration,
                StreamUrl = createSongDto.StreamUrl,
                CoverUrl = createSongDto.CoverUrl,
                Status = createSongDto.Status,
                Type = createSongDto.Type,
                Genres = createSongDto.Genres,
                AudioQuality = createSongDto.AudioQuality
            };

            await _songRepository.AddAsync(song);
            await _songRepository.SaveChangesAsync();

            return new ApiResponse<SongDto>(new SongDto
            {
                Id = song.Id,
                Title = song.Title,
                Artist = song.Artist,
                Album = song.Album,
                Duration = song.Duration,
                StreamUrl = song.StreamUrl,
                CoverUrl = song.CoverUrl,
                Status = song.Status,
                Type = song.Type,
                Genres = song.Genres,
                AudioQuality = song.AudioQuality
            });
        }

        public async Task<ApiResponse<SongDto>> UploadSongAsync(CreateSongDto createSongDto, IFormFile songFile, IFormFile? coverFile)
        {
            if (songFile == null || songFile.Length == 0)
            {
                return ApiResponse<SongDto>.Fail("Song file is required.");
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
                coverUrl = $"{baseUrl}/images/{coverFileName}";
            }

            // Create Song Entity
            var song = new Song
            {
                Title = createSongDto.Title,
                Artist = createSongDto.Artist,
                Album = createSongDto.Album,
                Duration = createSongDto.Duration, 
                StreamUrl = songUrl,
                CoverUrl = coverUrl,
                Status = createSongDto.Status,
                Type = createSongDto.Type,
                Genres = createSongDto.Genres,
                AudioQuality = createSongDto.AudioQuality
            };

            await _songRepository.AddAsync(song);
            await _songRepository.SaveChangesAsync();

            return new ApiResponse<SongDto>(new SongDto
            {
                Id = song.Id,
                Title = song.Title,
                Artist = song.Artist,
                Album = song.Album,
                Duration = song.Duration,
                StreamUrl = song.StreamUrl,
                CoverUrl = song.CoverUrl,
                Status = song.Status,
                Type = song.Type,
                Genres = song.Genres,
                AudioQuality = song.AudioQuality
            }, "Song uploaded successfully.");
        }

        public async Task<ApiResponse<List<SongDto>>> GetAllSongsAsync()
        {
            var songs = await _songRepository.GetAllAsync();
            var songDtos = songs.Select(s => new SongDto
            {
                Id = s.Id,
                Title = s.Title,
                Artist = s.Artist,
                Album = s.Album,
                Duration = s.Duration,
                StreamUrl = s.StreamUrl,
                CoverUrl = s.CoverUrl,
                Status = s.Status,
                Type = s.Type,
                Genres = s.Genres,
                AudioQuality = s.AudioQuality
            }).ToList();

            return new ApiResponse<List<SongDto>>(songDtos);
        }

        public async Task<ApiResponse<SongDto>> GetSongByIdAsync(Guid songId)
        {
            var song = await _songRepository.GetByIdAsync(songId);
            if (song == null)
            {
                return ApiResponse<SongDto>.Fail("Song not found.");
            }
            var songDto = new SongDto
            {
                Id = song.Id,
                Title = song.Title,
                Artist = song.Artist,
                Album = song.Album,
                Duration = song.Duration,
                StreamUrl = song.StreamUrl,
                CoverUrl = song.CoverUrl,
                Status = song.Status,
                Type = song.Type,
                Genres = song.Genres,
                AudioQuality = song.AudioQuality
            };
            return new ApiResponse<SongDto>(songDto);
        }

        public async Task<ApiResponse<SongDto>> UpdateSongAsync(Guid songId, SongDto updateSongDto)
        {
            var song = await _songRepository.GetByIdAsync(songId);
            if (song == null)
            {
                return ApiResponse<SongDto>.Fail("Song not found.");
            }
            song.Title = updateSongDto.Title;
            song.Artist = updateSongDto.Artist;
            song.Album = updateSongDto.Album;
            song.Duration = updateSongDto.Duration;
            song.StreamUrl = updateSongDto.StreamUrl;
            song.CoverUrl = updateSongDto.CoverUrl;
            var songDto = new SongDto
            {
                Id = song.Id,
                Title = song.Title,
                Artist = song.Artist,
                Album = song.Album,
                Duration = song.Duration,
                StreamUrl = song.StreamUrl,
                CoverUrl = song.CoverUrl,
                Status = song.Status,
                Type = song.Type,
                Genres = song.Genres,
                AudioQuality = song.AudioQuality
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
                Artist = song.Artist,
                Album = song.Album,
                Duration = song.Duration,
                StreamUrl = song.StreamUrl,
                CoverUrl = song.CoverUrl,
                Status = song.Status,
                Type = song.Type,
                Genres = song.Genres,
                AudioQuality = song.AudioQuality
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
                Artist = song.Artist,
                Album = song.Album,
                Duration = song.Duration,
                StreamUrl = song.StreamUrl,
                CoverUrl = song.CoverUrl,
                Status = song.Status,
                Type = song.Type,
                Genres = song.Genres,
                AudioQuality = song.AudioQuality
            };
            return new ApiResponse<SongDto>(songDto);
        }

        public async Task<ApiResponse<string>> DeleteAllSongsAsync()
        {
            var songs = await _songRepository.GetAllAsync();
            var count = songs.Count();
            
            foreach (var song in songs)
            {
                await _songRepository.DeleteAsync(song.Id);
            }
            
            await _songRepository.SaveChangesAsync();
            
            return new ApiResponse<string>($"Successfully deleted {count} songs from the database.");
        }

        public async Task<ApiResponse<List<SongDto>>> FilterSongByName(string name)
        {
            var songs = await _songRepository.FilterSongByName(name);
            var songDtos = songs.Select(s => new SongDto
            {
                Id = s.Id,
                Title = s.Title,
                Artist = s.Artist,
                Album = s.Album,
                Duration = s.Duration,
                StreamUrl = s.StreamUrl,
                CoverUrl = s.CoverUrl,
                Status = s.Status,
                Type = s.Type,
                Genres = s.Genres,
                AudioQuality = s.AudioQuality
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
                Artist = s.Artist,
                Album = s.Album,
                Duration = s.Duration,
                StreamUrl = s.StreamUrl,
                CoverUrl = s.CoverUrl,
                Status = s.Status,
                Type = s.Type,
                Genres = s.Genres,
                AudioQuality = s.AudioQuality
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
                Artist = s.Artist,
                Album = s.Album,
                Duration = s.Duration,
                StreamUrl = s.StreamUrl,
                CoverUrl = s.CoverUrl,
                Status = s.Status,
                Type = s.Type,
                Genres = s.Genres,
                AudioQuality = s.AudioQuality
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
                Artist = s.Artist,
                Album = s.Album,
                Duration = s.Duration,
                StreamUrl = s.StreamUrl,
                CoverUrl = s.CoverUrl,
                Status = s.Status,
                Type = s.Type,
                Genres = s.Genres,
                AudioQuality = s.AudioQuality
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
                Artist = s.Artist,
                Album = s.Album,
                Duration = s.Duration,
                StreamUrl = s.StreamUrl,
                CoverUrl = s.CoverUrl,
                Status = s.Status,
                Type = s.Type,
                Genres = s.Genres,
                AudioQuality = s.AudioQuality
            }).ToList();
            return new ApiResponse<List<SongDto>>(songDtos);
        }
        

        public async Task<ApiResponse<List<SongDto>>> GetSongByUserId(Guid userId)
        {
            var songs = await _songRepository.GetSongsByUserIdAsync(userId);
            var songDtos = songs.Select(s => new SongDto
            {
                Id = s.Id,
                Title = s.Title,
                Artist = s.Artist,
                Album = s.Album,
                Duration = s.Duration,
                StreamUrl = s.StreamUrl,
                CoverUrl = s.CoverUrl,
                Status = s.Status,
                Type = s.Type,
                Genres = s.Genres,
                AudioQuality = s.AudioQuality
            }).ToList();
            return new ApiResponse<List<SongDto>>(songDtos);
        }

        public async Task<ApiResponse<List<SongDto>>> GetSongByPlaylistId(Guid playlistId)
        {
            var songs = await _songRepository.GetSongsByPlaylistIdAsync(playlistId);
            var songDtos = songs.Select(s => new SongDto
            {
                Id = s.Id,
                Title = s.Title,
                Artist = s.Artist,
                Album = s.Album,
                Duration = s.Duration,
                StreamUrl = s.StreamUrl,
                CoverUrl = s.CoverUrl,
                Status = s.Status,
                Type = s.Type,
                Genres = s.Genres,
                AudioQuality = s.AudioQuality
            }).ToList();
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
                Artist = s.Artist,
                Album = s.Album,
                Duration = s.Duration,
                StreamUrl = s.StreamUrl,
                CoverUrl = s.CoverUrl,
                Status = s.Status,
                Type = s.Type,
                Genres = s.Genres,
                AudioQuality = s.AudioQuality
            }).ToList();
            
            return new ApiResponse<List<SongDto>>(songDtos);
        }

        

    }
}
