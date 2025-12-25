using Kita.Domain;
using Kita.Service.Interfaces;
using StackExchange.Redis;
using System.Text.Json;

namespace Kita.Service.Services;

public class RedisService : IRedisService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _db;
    private const string DevicesKeyPrefix = "user:devices:";
    private const string ActivePlayerKeyPrefix = "user:activeplayer:";
    private const string PlaybackStateKeyPrefix = "user:playbackstate:";

    public RedisService(IConnectionMultiplexer redis)
    {
        _redis = redis;
        _db = redis.GetDatabase();
    }

    // Device Management
    public async Task AddDeviceAsync(string userId, DeviceConnection device)
    {
        var key = $"{DevicesKeyPrefix}{userId}";
        var deviceJson = JsonSerializer.Serialize(device);
        
        // Store device with connectionId as hash field
        await _db.HashSetAsync(key, device.ConnectionId, deviceJson);
    }

    public async Task RemoveDeviceAsync(string userId, string connectionId)
    {
        var key = $"{DevicesKeyPrefix}{userId}";
        await _db.HashDeleteAsync(key, connectionId);
        
        // If this was the active player, clear it
        var activePlayerDeviceId = await GetActivePlayerDeviceIdAsync(userId);
        if (activePlayerDeviceId != null)
        {
            var devices = await GetUserDevicesAsync(userId);
            var removedDevice = devices.FirstOrDefault(d => d.ConnectionId == connectionId);
            if (removedDevice?.DeviceId == activePlayerDeviceId)
            {
                await _db.KeyDeleteAsync($"{ActivePlayerKeyPrefix}{userId}");
            }
        }
    }

    public async Task<List<DeviceConnection>> GetUserDevicesAsync(string userId)
    {
        var key = $"{DevicesKeyPrefix}{userId}";
        var entries = await _db.HashGetAllAsync(key);
        
        var devices = new List<DeviceConnection>();
        foreach (var entry in entries)
        {
            var device = JsonSerializer.Deserialize<DeviceConnection>(entry.Value!);
            if (device != null)
            {
                devices.Add(device);
            }
        }
        
        return devices;
    }

    public async Task<DeviceConnection?> GetDeviceByConnectionIdAsync(string userId, string connectionId)
    {
        var key = $"{DevicesKeyPrefix}{userId}";
        var deviceJson = await _db.HashGetAsync(key, connectionId);
        
        if (deviceJson.IsNullOrEmpty)
            return null;
        
        return JsonSerializer.Deserialize<DeviceConnection>(deviceJson!);
    }

    // Active Player Management
    public async Task SetActivePlayerAsync(string userId, string deviceId)
    {
        var key = $"{ActivePlayerKeyPrefix}{userId}";
        await _db.StringSetAsync(key, deviceId);
    }

    public async Task<string?> GetActivePlayerDeviceIdAsync(string userId)
    {
        var key = $"{ActivePlayerKeyPrefix}{userId}";
        var value = await _db.StringGetAsync(key);
        
        return value.IsNullOrEmpty ? null : value.ToString();
    }

    public async Task<DeviceConnection?> GetActivePlayerAsync(string userId)
    {
        var activePlayerDeviceId = await GetActivePlayerDeviceIdAsync(userId);
        if (activePlayerDeviceId == null)
            return null;
        
        var devices = await GetUserDevicesAsync(userId);
        return devices.FirstOrDefault(d => d.DeviceId == activePlayerDeviceId);
    }

    // Playback State Management
    public async Task SetPlaybackStateAsync(string userId, PlaybackState state)
    {
        var key = $"{PlaybackStateKeyPrefix}{userId}";
        var stateJson = JsonSerializer.Serialize(state);
        await _db.StringSetAsync(key, stateJson);
    }

    public async Task<PlaybackState?> GetPlaybackStateAsync(string userId)
    {
        var key = $"{PlaybackStateKeyPrefix}{userId}";
        var stateJson = await _db.StringGetAsync(key);
        
        if (stateJson.IsNullOrEmpty)
            return null;
        
        return JsonSerializer.Deserialize<PlaybackState>(stateJson!);
    }

    // Cleanup
    public async Task ClearUserDevicesAsync(string userId)
    {
        var devicesKey = $"{DevicesKeyPrefix}{userId}";
        var activePlayerKey = $"{ActivePlayerKeyPrefix}{userId}";
        var playbackStateKey = $"{PlaybackStateKeyPrefix}{userId}";
        
        await _db.KeyDeleteAsync(devicesKey);
        await _db.KeyDeleteAsync(activePlayerKey);
        await _db.KeyDeleteAsync(playbackStateKey);
    }
}
