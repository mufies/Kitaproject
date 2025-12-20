using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Kita.Domain.Entities;
using Kita.Infrastructure.Repositories;
using Kita.Service.Common;
using Kita.Service.DTOs.Artist;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Kita.Service.Services
{
    public class ArtistService : IArtistService
    {
        private readonly IArtistRepository _artistRepository;
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public ArtistService(
            IArtistRepository artistRepository,
            IUserRepository userRepository,
            IConfiguration configuration)
        {
            _artistRepository = artistRepository;
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public async Task<ApiResponse<ArtistDto>> CreateArtistAsync(Guid userId, CreateArtistDto createDto)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<ArtistDto>.Fail("User not found.", code: 404);
            }

            var existingArtist = await _artistRepository.GetByNameAsync(createDto.Name);
            if (existingArtist != null && existingArtist.ManagedByUsers.Any(u => u.Id == userId))
            {
                return ApiResponse<ArtistDto>.Fail("You already have an artist with this name.", code: 400);
            }

            var artist = new Artist
            {
                Id = Guid.NewGuid(),
                Name = createDto.Name,
                Description = createDto.Description,
                // ImageUrl = createDto.ImageUrl,
                ManagedByUsers = new List<User> { user }
            };

            // Handle Image Upload
            if (createDto.Image != null && createDto.Image.Length > 0)
            {
                var storagePath = _configuration["FileStorage:BasePath"];
                var baseUrl = _configuration["FileStorage:BaseUrl"];

                if (!string.IsNullOrEmpty(storagePath) && !string.IsNullOrEmpty(baseUrl))
                {
                    var artistImagesPath = Path.Combine(storagePath, "avatars");
                    if (!Directory.Exists(artistImagesPath))
                    {
                        Directory.CreateDirectory(artistImagesPath);
                    }

                    var fileExtension = Path.GetExtension(createDto.Image.FileName);
                    var fileName = $"{artist.Id}_{Guid.NewGuid()}{fileExtension}";
                    var filePath = Path.Combine(artistImagesPath, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await createDto.Image.CopyToAsync(stream);
                    }

                    artist.ImageUrl = $"{baseUrl}/avatars/{fileName}";
                }
            }

            await _artistRepository.AddAsync(artist);
            await _artistRepository.SaveChangesAsync();

            return new ApiResponse<ArtistDto>(MapToArtistDto(artist), "Artist created successfully.");
        }

        public async Task<ApiResponse<List<ArtistDto>>> GetAllArtistsAsync()
        {
            var artists = await _artistRepository.GetAllAsync();
            var artistDtos = artists.Select(a => MapToArtistDto(a)).ToList();
            return new ApiResponse<List<ArtistDto>>(artistDtos);
        }

        public async Task<ApiResponse<ArtistDetailDto>> GetArtistByIdAsync(Guid id)
        {
            var artist = await _artistRepository.GetByIdWithSongsAsync(id);
            if (artist == null)
            {
                return ApiResponse<ArtistDetailDto>.Fail("Artist not found.", code: 404);
            }

            // Also get albums
            var artistWithAlbums = await _artistRepository.GetByIdWithAlbumsAsync(id);

            var artistDetailDto = new ArtistDetailDto
            {
                Id = artist.Id,
                Name = artist.Name,
                Description = artist.Description,
                ImageUrl = artist.ImageUrl,
                Role = artist.Role,
                SongCount = artist.Songs?.Count ?? 0,
                AlbumCount = artistWithAlbums?.Albums?.Count ?? 0,
                Songs = artist.Songs?.Select(s => new ArtistSongDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    CoverUrl = s.CoverUrl,
                    Duration = s.Duration
                }).ToList() ?? new List<ArtistSongDto>(),
                Albums = artistWithAlbums?.Albums?.Select(a => new ArtistAlbumDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    ImageUrl = a.ImageUrl,
                    SongCount = a.Songs?.Count ?? 0
                }).ToList() ?? new List<ArtistAlbumDto>(),
                FollowedByCount = artist.FollowedByUsers?.Count ?? 0
                // ManagedByUsers = artist.ManagedByUsers.Select(u => u.Id).ToList()

            };

            return new ApiResponse<ArtistDetailDto>(artistDetailDto);
        }

        public async Task<ApiResponse<ArtistDto>> UpdateArtistAsync(Guid userId, Guid artistId, UpdateArtistDto updateDto)
        {
            var artist = await _artistRepository.GetByIdAsync(artistId);
            if (artist == null)
            {
                return ApiResponse<ArtistDto>.Fail("Artist not found.", code: 404);
            }

            // Check if user has permission to update this artist
            if (!artist.ManagedByUsers.Any(u => u.Id == userId))
            {
                return ApiResponse<ArtistDto>.Fail("You don't have permission to update this artist.", code: 403);
            }

            // Update fields if provided
            if (!string.IsNullOrEmpty(updateDto.Name))
            {
                artist.Name = updateDto.Name;
            }

            if (updateDto.Description != null)
            {
                artist.Description = updateDto.Description;
            }

            await _artistRepository.UpdateAsync(artist);
            await _artistRepository.SaveChangesAsync();

            return new ApiResponse<ArtistDto>(MapToArtistDto(artist), "Artist updated successfully.");
        }

        public async Task<ApiResponse<bool>> DeleteArtistAsync(Guid userId, Guid artistId)
        {
            var artist = await _artistRepository.GetByIdAsync(artistId);
            if (artist == null)
            {
                return ApiResponse<bool>.Fail("Artist not found.", code: 404);
            }

            // Check if user has permission to delete this artist
            if (!artist.ManagedByUsers.Any(u => u.Id == userId))
            {
                return ApiResponse<bool>.Fail("You don't have permission to delete this artist.", code: 403);
            }

            await _artistRepository.DeleteAsync(artist.Id);
            await _artistRepository.SaveChangesAsync();

            return new ApiResponse<bool>(true, "Artist deleted successfully.");
        }

        public async Task<ApiResponse<string>> UploadArtistImageAsync(Guid userId, Guid artistId, IFormFile file)
        {
            var artist = await _artistRepository.GetByIdAsync(artistId);
            if (artist == null)
            {
                return ApiResponse<string>.Fail("Artist not found.", code: 404);
            }

            // Check if user has permission
            if (!artist.ManagedByUsers.Any(u => u.Id == userId))
            {
                return ApiResponse<string>.Fail("You don't have permission to update this artist.", code: 403);
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

            var artistImagesPath = Path.Combine(storagePath, "artists");
            if (!Directory.Exists(artistImagesPath))
            {
                Directory.CreateDirectory(artistImagesPath);
            }

            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = $"{artistId}_{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(artistImagesPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Update artist image URL
            var imageUrl = $"{baseUrl}/artists/{fileName}";
            artist.ImageUrl = imageUrl;

            await _artistRepository.UpdateAsync(artist);
            await _artistRepository.SaveChangesAsync();

            return new ApiResponse<string>(imageUrl, "Artist image uploaded successfully.");
        }

        public async Task<ApiResponse<List<ArtistDto>>> GetArtistsByUserAsync(Guid userId)
        {
            var artists = await _artistRepository.GetByUserIdAsync(userId);
            var artistDtos = artists.Select(a => MapToArtistDto(a)).ToList();
            return new ApiResponse<List<ArtistDto>>(artistDtos);
        }

        public async Task<ApiResponse<List<ArtistDto>>> SearchArtistsAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return ApiResponse<List<ArtistDto>>.Fail("Search query cannot be empty.", code: 400);
            }

            var allArtists = await _artistRepository.GetAllAsync();
            var matchedArtists = allArtists
                .Where(a => a.Name.Contains(query, StringComparison.OrdinalIgnoreCase))
                .Take(20)
                .ToList();

            var artistDtos = matchedArtists.Select(a => MapToArtistDto(a)).ToList();
            return new ApiResponse<List<ArtistDto>>(artistDtos);
        }

        private ArtistDto MapToArtistDto(Artist artist)
        {
            return new ArtistDto
            {
                Id = artist.Id,
                Name = artist.Name,
                Description = artist.Description,
                ImageUrl = artist.ImageUrl,
                Role = artist.Role,
                SongCount = artist.Songs?.Count ?? 0,
                AlbumCount = artist.Albums?.Count ?? 0,
                FollowedByCount = artist.FollowedByUsers?.Count ?? 0
            };
        }

        public async Task<ApiResponse<bool>> FollowArtistAsync(Guid userId, Guid artistId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<bool>.Fail("User not found.", code: 404);
            }

            var artist = await _artistRepository.GetByIdWithFollowersAsync(artistId);
            if (artist == null)
            {
                return ApiResponse<bool>.Fail("Artist not found.", code: 404);
            }

            // Check if already following
            if (artist.FollowedByUsers.Any(u => u.Id == userId))
            {
                return ApiResponse<bool>.Fail("You are already following this artist.", code: 400);
            }

            artist.FollowedByUsers.Add(user);
            await _artistRepository.UpdateAsync(artist);
            await _artistRepository.SaveChangesAsync();

            return new ApiResponse<bool>(true, "Successfully followed the artist.");
        }

        public async Task<ApiResponse<bool>> UnfollowArtistAsync(Guid userId, Guid artistId)
        {
            var artist = await _artistRepository.GetByIdWithFollowersAsync(artistId);
            if (artist == null)
            {
                return ApiResponse<bool>.Fail("Artist not found.", code: 404);
            }

            var follower = artist.FollowedByUsers.FirstOrDefault(u => u.Id == userId);
            if (follower == null)
            {
                return ApiResponse<bool>.Fail("You are not following this artist.", code: 400);
            }

            artist.FollowedByUsers.Remove(follower);
            await _artistRepository.UpdateAsync(artist);
            await _artistRepository.SaveChangesAsync();

            return new ApiResponse<bool>(true, "Successfully unfollowed the artist.");
        }

        public async Task<ApiResponse<List<ArtistDto>>> GetFollowedArtistsAsync(Guid userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<List<ArtistDto>>.Fail("User not found.", code: 404);
            }

            var followedArtists = await _artistRepository.GetFollowedArtistsByUserIdAsync(userId);
            var artistDtos = followedArtists.Select(a => MapToArtistDto(a)).ToList();
            return new ApiResponse<List<ArtistDto>>(artistDtos);
        }

        public async Task<ApiResponse<bool>> IsFollowingArtistAsync(Guid userId, Guid artistId)
        {
            var artist = await _artistRepository.GetByIdWithFollowersAsync(artistId);
            if (artist == null)
            {
                return ApiResponse<bool>.Fail("Artist not found.", code: 404);
            }

            var isFollowing = artist.FollowedByUsers.Any(u => u.Id == userId);
            return new ApiResponse<bool>(isFollowing);
        }
    }
}
