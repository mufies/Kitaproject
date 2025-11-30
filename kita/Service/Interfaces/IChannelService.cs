using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Service.Common;
using Kita.Service.DTOs.Server;

namespace Kita.Service.Interfaces
{
    public interface IChannelService
    {
        Task<ApiResponse<ChannelDto>> CreateChannelAsync(CreateChannelDto createChannelDto);
        Task<ApiResponse<List<ChannelDto>>> GetServerChannelsAsync(Guid serverId);
    }
}
