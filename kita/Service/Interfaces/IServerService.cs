using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Service.Common;
using Kita.Service.DTOs.Server;

namespace Kita.Service.Interfaces
{
    public interface IServerService
    {
        Task<ApiResponse<ServerDto>> CreateServerAsync(CreateServerDto createServerDto, Guid ownerId);
        Task<ApiResponse<List<ServerDto>>> GetUserServersAsync(Guid userId);
        Task<ApiResponse<ServerDto>> GetServerByIdAsync(Guid serverId);
        Task<ApiResponse<bool>> DeleteServerAsync(Guid serverId);
    }
}
