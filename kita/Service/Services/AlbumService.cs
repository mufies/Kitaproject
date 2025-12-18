using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Kita.Domain.Entities;
using Kita.Domain.Entities.Music;
using Kita.Infrastructure.Repositories;
using Kita.Service.Common;
using Kita.Service.DTOs.Album;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Kita.Service.Services
{
    public class AlbumService : IAlbumService
    {
        private readonly IAlbumRepository _albumRepository;
        private readonly IArtistRepository _artistRepository;
        private readonly IConfiguration _configuration;

        public AlbumService(
            IAlbumRepository albumRepository,
            IArtistRepository artistRepository,
            IConfiguration configuration)
        {
            _albumRepository = albumRepository;
            _artistRepository = artistRepository;
            _configuration = configuration;
        }

        public async Task<ApiResponse<AlbumDto>> CreateAlbumAsync(Guid userId, CreateAlbumDto createDto)
        {
            // Check if artist exists
            var artist = await _artistRepository.GetByIdAsync(createDto.ArtistId);
            if (artist == null)
            {
                return ApiResponse<AlbumDto>.Fail("Artist not found.", code: 404);
            }

            // Check if user has permission to create album for this artist
            if (!artist.ManagedByUsers.Any(u => u.Id == userId))
            {
                return ApiResponse<AlbumDto>.Fail("You don't have permission to create albums for this artist.", code: 403);
            }

            // Check if album with same name already exists for this artist
            var existingAlbum = await _albumRepository.GetByNameAndArtistAsync(createDto.Name, createDto.ArtistId);
            if (existingAlbum != null)
            {
                return ApiResponse<AlbumDto>.Fail("An album with this name already exists for this artist.", code: 400);
            }

            var album = new Album
            {
                Id = Guid.NewGuid(),
                Name = createDto.Name,
                Description = createDto.Description,
                ArtistId = createDto.ArtistId
            };

            await _albumRepository.AddAsync(album);
            await _albumRepository.SaveChangesAsync();

            return new ApiResponse<AlbumDto>(MapToAlbumDto(album, artist.Name), "Album created successfully.");
        }

        public async Task<ApiResponse<List<AlbumDto>>> GetAllAlbumsAsync()
        {
            var albums = await _albumRepository.GetAllAsync();
            var albumDtos = new List<AlbumDto>();

            foreach (var album in albums)
            {
                var artist = await _artistRepository.GetByIdAsync(album.ArtistId);
                albumDtos.Add(MapToAlbumDto(album, artist?.Name));
            }

            return new ApiResponse<List<AlbumDto>>(albumDtos);
        }

        public async Task<ApiResponse<AlbumDetailDto>> GetAlbumByIdAsync(Guid id)
        {
            var album = await _albumRepository.GetByIdWithSongsAsync(id);
            if (album == null)
            {
                return ApiResponse<AlbumDetailDto>.Fail("Album not found.", code: 404);
            }

            var artist = await _artistRepository.GetByIdAsync(album.ArtistId);

            var albumDetailDto = new AlbumDetailDto
            {
                Id = album.Id,
                Name = album.Name,
                Description = album.Description,
                ImageUrl = album.ImageUrl,
                ArtistId = album.ArtistId,
                ArtistName = artist?.Name,
                SongCount = album.Songs?.Count ?? 0,
                Songs = album.Songs?.Select((s, index) => new AlbumSongDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    CoverUrl = s.CoverUrl,
                    Duration = s.Duration,
                    TrackNumber = index + 1
                }).ToList() ?? new List<AlbumSongDto>()
            };

            return new ApiResponse<AlbumDetailDto>(albumDetailDto);
        }

        public async Task<ApiResponse<List<AlbumDto>>> GetAlbumsByArtistAsync(Guid artistId)
        {
            var artist = await _artistRepository.GetByIdAsync(artistId);
            if (artist == null)
            {
                return ApiResponse<List<AlbumDto>>.Fail("Artist not found.", code: 404);
            }

            var albums = await _albumRepository.GetByArtistIdAsync(artistId);
            var albumDtos = albums.Select(a => MapToAlbumDto(a, artist.Name)).ToList();

            return new ApiResponse<List<AlbumDto>>(albumDtos);
        }

        public async Task<ApiResponse<AlbumDto>> UpdateAlbumAsync(Guid userId, Guid albumId, UpdateAlbumDto updateDto)
        {
            var album = await _albumRepository.GetByIdAsync(albumId);
            if (album == null)
            {
                return ApiResponse<AlbumDto>.Fail("Album not found.", code: 404);
            }

            // Check if user has permission
            var artist = await _artistRepository.GetByIdAsync(album.ArtistId);
            if (artist == null || !artist.ManagedByUsers.Any(u => u.Id == userId))
            {
                return ApiResponse<AlbumDto>.Fail("You don't have permission to update this album.", code: 403);
            }

            // Update fields if provided
            if (!string.IsNullOrEmpty(updateDto.Name))
            {
                album.Name = updateDto.Name;
            }

            if (updateDto.Description != null)
            {
                album.Description = updateDto.Description;
            }

            await _albumRepository.UpdateAsync(album);
            await _albumRepository.SaveChangesAsync();

            return new ApiResponse<AlbumDto>(MapToAlbumDto(album, artist.Name), "Album updated successfully.");
        }

        public async Task<ApiResponse<bool>> DeleteAlbumAsync(Guid userId, Guid albumId)
        {
            var album = await _albumRepository.GetByIdAsync(albumId);
            if (album == null)
            {
                return ApiResponse<bool>.Fail("Album not found.", code: 404);
            }

            // Check if user has permission
            var artist = await _artistRepository.GetByIdAsync(album.ArtistId);
            if (artist == null || !artist.ManagedByUsers.Any(u => u.Id == userId))
            {
                return ApiResponse<bool>.Fail("You don't have permission to delete this album.", code: 403);
            }

            await _albumRepository.DeleteAsync(album.Id);
            await _albumRepository.SaveChangesAsync();

            return new ApiResponse<bool>(true, "Album deleted successfully.");
        }

        public async Task<ApiResponse<string>> UploadAlbumImageAsync(Guid userId, Guid albumId, IFormFile file)
        {
            var album = await _albumRepository.GetByIdAsync(albumId);
            if (album == null)
            {
                return ApiResponse<string>.Fail("Album not found.", code: 404);
            }

            // Check if user has permission
            var artist = await _artistRepository.GetByIdAsync(album.ArtistId);
            if (artist == null || !artist.ManagedByUsers.Any(u => u.Id == userId))
            {
                return ApiResponse<string>.Fail("You don't have permission to update this album.", code: 403);
            }

            if (file == null || file.Length == 0)
            {
                return ApiResponse<string>.Fail("No file uploaded.");
            }

            var storagePath = _configuration["FileStorage:BasePath"];
            var baseUrl = _configuration["FileStorage:BaseUrl"];

            if (string.IsNullOrEmpty(storagePath) || string.IsNullOrEmpty(baseUrl))
            {
                return ApiResponse<string>.Fail("File storage configuration is missing.", code: 500);
            }

            var albumImagesPath = Path.Combine(storagePath, "albums");
            if (!Directory.Exists(albumImagesPath))
            {
                Directory.CreateDirectory(albumImagesPath);
            }

            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = $"{albumId}_{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(albumImagesPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Update album image URL
            var imageUrl = $"{baseUrl}/albums/{fileName}";
            album.ImageUrl = imageUrl;

            await _albumRepository.UpdateAsync(album);
            await _albumRepository.SaveChangesAsync();

            return new ApiResponse<string>(imageUrl, "Album image uploaded successfully.");
        }

        public async Task<ApiResponse<List<AlbumDto>>> SearchAlbumsAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return ApiResponse<List<AlbumDto>>.Fail("Search query cannot be empty.", code: 400);
            }

            var allAlbums = await _albumRepository.GetAllAsync();
            var matchedAlbums = allAlbums
                .Where(a => a.Name.Contains(query, StringComparison.OrdinalIgnoreCase))
                .Take(20)
                .ToList();

            var albumDtos = new List<AlbumDto>();
            foreach (var album in matchedAlbums)
            {
                var artist = await _artistRepository.GetByIdAsync(album.ArtistId);
                albumDtos.Add(MapToAlbumDto(album, artist?.Name));
            }

            return new ApiResponse<List<AlbumDto>>(albumDtos);
        }

        private AlbumDto MapToAlbumDto(Album album, string? artistName)
        {
            return new AlbumDto
            {
                Id = album.Id,
                Name = album.Name,
                Description = album.Description,
                ImageUrl = album.ImageUrl,
                ArtistId = album.ArtistId,
                ArtistName = artistName,
                SongCount = album.Songs?.Count ?? 0
            };
        }
    }
}
