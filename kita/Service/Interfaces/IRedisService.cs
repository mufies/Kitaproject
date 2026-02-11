using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Domain;

namespace Kita.Service.Interfaces
{
    public interface IRedisService
    {
        // Device Management
        Task AddDeviceAsync(string userId, DeviceConnection device);
        Task RemoveDeviceAsync(string userId, string connectionId);
        Task<List<DeviceConnection>> GetUserDevicesAsync(string userId);
        Task<DeviceConnection?> GetDeviceByConnectionIdAsync(string userId, string connectionId);
        
        // Active Player Management
        Task SetActivePlayerAsync(string userId, string deviceId);
        Task<string?> GetActivePlayerDeviceIdAsync(string userId);
        Task<DeviceConnection?> GetActivePlayerAsync(string userId);
        
        // Playback State Management
        Task SetPlaybackStateAsync(string userId, PlaybackState state);
        Task<PlaybackState?> GetPlaybackStateAsync(string userId);
        
        // Generic Key-Value Storage
        Task SetValueAsync(string key, string value, TimeSpan? expiry = null);
        Task<string?> GetValueAsync(string key);
        Task RemoveValueAsync(string key);
        
        // Cleanup
        Task ClearUserDevicesAsync(string userId);

    }
}
