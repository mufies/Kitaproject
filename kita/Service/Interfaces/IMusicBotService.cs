using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Service.Common;

namespace Kita.Service.Interfaces
{
    public interface IMusicBotService
    {
        // Auto-join/leave management
        Task OnUserJoinedChannelAsync(string channelId, Guid userId);
        Task OnUserLeftChannelAsync(string channelId, Guid userId);
        Task<int> GetChannelUserCountAsync(string channelId);
        
        // Bot control
        Task<ApiResponse<object>> JoinChannelAsync(string channelId, Guid? playlistId = null, List<Guid>? songIds = null);
        Task<ApiResponse<object>> LeaveChannelAsync(string channelId);
        
        // Playback control
        Task<ApiResponse<object>> PlaySongAsync(string channelId, Guid songId);
        Task<ApiResponse<object>> AddSongToQueueAsync(string channelId, Guid songId);
        Task<ApiResponse<object>> PauseAsync(string channelId);
        Task<ApiResponse<object>> ResumeAsync(string channelId);
        Task<ApiResponse<object>> SkipAsync(string channelId);
        Task<ApiResponse<object>> SetVolumeAsync(string channelId, int volume);
        Task<ApiResponse<object>> SeekAsync(string channelId, double positionSeconds);
        Task<ApiResponse<object>> RemoveSongFromQueueAsync(string channelId, int queueIndex);
        
        // Bot status
        Task<ApiResponse<object>> GetBotStatusAsync(string channelId);
        Task<ApiResponse<List<object>>> GetQueueAsync(string channelId);
    }
}