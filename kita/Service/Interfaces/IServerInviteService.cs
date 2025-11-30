using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Service.Common;
using Kita.Service.DTOs.Server;

namespace Kita.Service.Interfaces
{
    public interface IServerInviteService
    {
        Task<ApiResponse<ServerInviteDto>> CreateInviteAsync(Guid serverId, CreateServerInviteDto dto, Guid creatorId);
        Task<ApiResponse<ServerInviteDto>> GetInviteByCodeAsync(string code);
        Task<ApiResponse<ServerInviteDto>> UseInviteAsync(string code, Guid userId);
        Task<ApiResponse<bool>> RevokeInviteAsync(Guid inviteId, Guid userId);
        Task<ApiResponse<List<ServerInviteDto>>> GetServerInvitesAsync(Guid serverId, Guid userId);
    }
}
