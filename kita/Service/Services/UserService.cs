using System;
using System.IO;
using System.Threading.Tasks;
using Kita.Domain.Entities;
using Kita.Infrastructure.Repositories;
using Kita.Service.Common;
using Kita.Service.DTOs;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Kita.Service.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public UserService(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public async Task<ApiResponse<UserDto>> GetUserProfileAsync(Guid userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<UserDto>.Fail("User not found.", code: 404);
            }

            var userDto = new UserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                AvatarUrl = user.AvatarUrl,
                Role = user.Role
            };

            return new ApiResponse<UserDto>(userDto);
        }

        public async Task<ApiResponse<string>> UploadAvatarAsync(Guid userId, IFormFile file)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<string>.Fail("User not found.", code: 404);
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

            var avatarsPath = Path.Combine(storagePath, "avatars");
            if (!Directory.Exists(avatarsPath))
            {
                Directory.CreateDirectory(avatarsPath);
            }

            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = $"{userId}_{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(avatarsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Update user avatar URL
            var avatarUrl = $"{baseUrl}/avatars/{fileName}";
            user.AvatarUrl = avatarUrl;
            
            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();

            return new ApiResponse<string>(avatarUrl, "Avatar uploaded successfully.");
        }

        public async Task<ApiResponse<UserDto>> UpdateToArtist(Guid userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<UserDto>.Fail("User not found.", code: 404);
            }

            user.Role = "Artist";
            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();

            return new ApiResponse<UserDto>(new UserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                AvatarUrl = user.AvatarUrl,
                Role = user.Role
            }, "User updated to artist.");
        }

        public async Task<ApiResponse<UserDto>> UpdateUsernameAsync(Guid userId, string newUsername)
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(newUsername))
            {
                return ApiResponse<UserDto>.Fail("Username cannot be empty.", code: 400);
            }

            newUsername = newUsername.Trim();

            if (newUsername.Length < 3 || newUsername.Length > 30)
            {
                return ApiResponse<UserDto>.Fail("Username must be between 3 and 30 characters.", code: 400);
            }

            // Get user
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<UserDto>.Fail("User not found.", code: 404);
            }

            // Check if username is already taken
            if (await _userRepository.UsernameExistsAsync(newUsername))
            {
                return ApiResponse<UserDto>.Fail("Username already exists.", code: 409);
            }

            // Update username
            user.UserName = newUsername;
            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();

            return new ApiResponse<UserDto>(new UserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                AvatarUrl = user.AvatarUrl,
                Role = user.Role
            }, "Username updated successfully.");
        }

        // public async Task<ApiResponse<UserDto>> UpdateSubscriptionAsync(Guid userId, string subscription)
        // {
        //     // Get user
        //     var user = await _userRepository.GetByIdAsync(userId);
        //     if (user == null)
        //     {
        //         return ApiResponse<UserDto>.Fail("User not found.", code: 404);
        //     }

        //     // Update subscription
        //     user.Subscription = subscription;
        //     await _userRepository.UpdateAsync(user);
        //     await _userRepository.SaveChangesAsync();

        //     return new ApiResponse<UserDto>(new UserDto
        //     {
        //         Id = user.Id,
        //         UserName = user.UserName,
        //         Email = user.Email,
        //         AvatarUrl = user.AvatarUrl,
        //         Role = user.Role,
        //         Subscription = user.Subscription
        //     }, "Subscription updated successfully.");
        // }

        public async Task<ApiResponse<UserDto>> UpdatePasswordAsync(Guid userId, string oldPassword, string newPassword)
        {
            // Get user
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<UserDto>.Fail("User not found.", code: 404);
            }

            // Update password
            if(BCrypt.Net.BCrypt.Verify(oldPassword, user.PasswordHash))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            }
            else
            {
                return ApiResponse<UserDto>.Fail("Old password is incorrect.", code: 400);
            }
            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();

            return new ApiResponse<UserDto>(new UserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                AvatarUrl = user.AvatarUrl,
                Role = user.Role,
            }, "Password updated successfully.");
        }

        public async Task<ApiResponse<bool>> SetActiveAsync(Guid userId, bool isActive)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<bool>.Fail("User not found.", code: 404);
            }

            user.IsActive = isActive;
            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();

            return new ApiResponse<bool>(true, "User status updated successfully.");
        }
    }
}
