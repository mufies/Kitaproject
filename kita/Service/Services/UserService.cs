using System;
using System.IO;
using System.Threading.Tasks;
using Kita.Domain.Entities;
using Kita.Infrastructure.Data;
using Kita.Service.Common;
using Kita.Service.DTOs;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Kita.Service.Services
{
    public class UserService : IUserService
    {
        private readonly KitaDbContext _context;
        private readonly IConfiguration _configuration;

        public UserService(KitaDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<ApiResponse<UserDto>> GetUserProfileAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
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
            var user = await _context.Users.FindAsync(userId);
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

            var avatarsPath = Path.Combine(storagePath, "Images");
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
            var avatarUrl = $"{baseUrl}/images/{fileName}";
            user.AvatarUrl = avatarUrl;
            
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return new ApiResponse<string>(avatarUrl, "Avatar uploaded successfully.");
        }

        public async Task<ApiResponse<UserDto>> UpdateToArtist(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return ApiResponse<UserDto>.Fail("User not found.", code: 404);
            }

            user.Role = "Artist";
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return new ApiResponse<UserDto>(new UserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                AvatarUrl = user.AvatarUrl,
                Role = user.Role
            }, "User updated to artist.");
        }
    }
}
