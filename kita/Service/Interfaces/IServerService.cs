using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Service.Common;
using Kita.Service.DTOs.Server;
using Microsoft.AspNetCore.Http;

namespace Kita.Service.Interfaces
{
    public interface IServerService
    {
        Task<ApiResponse<ServerDto>> CreateServerAsync(CreateServerDto createServerDto, Guid ownerId);
        Task<ApiResponse<List<ServerDto>>> GetUserServersAsync(Guid userId);
        Task<ApiResponse<ServerDto>> GetServerByIdAsync(Guid serverId);
        Task<ApiResponse<List<ServerMemberDto>>> GetServerMembersAsync(Guid serverId);
        Task<ApiResponse<ServerDto>> UpdateServerAsync(Guid serverId, UpdateServerDto updateServerDto, Guid userId);
        Task<ApiResponse<string>> UploadServerIconAsync(Guid serverId, IFormFile file, Guid userId);
        Task<ApiResponse<bool>> DeleteServerAsync(Guid serverId);
        Task<ApiResponse<bool>> RemoveMemberAsync(Guid serverId, Guid targetUserId, Guid requesterId);
        Task<ApiResponse<bool>> LeaveServerAsync(Guid serverId, Guid userId);
    }
}
