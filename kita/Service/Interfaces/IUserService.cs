using Kita.Service.Common;
using Kita.Service.DTOs;
using Microsoft.AspNetCore.Http;

namespace Kita.Service.Interfaces
{
    public interface IUserService
    {
        Task<ApiResponse<UserDto>> GetUserProfileAsync(Guid userId);
        Task<ApiResponse<string>> UploadAvatarAsync(Guid userId, IFormFile file);
        Task<ApiResponse<UserDto>> UpdateUsernameAsync(Guid userId, string newUsername);
        Task<ApiResponse<UserDto>> UpdatePasswordAsync(Guid userId, string oldPassword, string newPassword);
    }
}
