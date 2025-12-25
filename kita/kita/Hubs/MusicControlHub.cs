using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Kita.Domain;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Kita.Hubs
{
    [Authorize]
    public class MusicControlHub : Hub
    {
        private readonly IRedisService _redisService;

        public MusicControlHub(IRedisService redisService)
        {
            _redisService = redisService;
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            await _redisService.RemoveDeviceAsync(userId, Context.ConnectionId);
            
            // Notify other devices về việc device list đã thay đổi
            await NotifyDeviceListChanged(userId);
            
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Đăng ký device mới khi connect
        /// </summary>
        public async Task RegisterDevice(string deviceName, string deviceType)
        {
            var userId = GetUserId();
            var deviceId = Guid.NewGuid().ToString();
            
            var device = new DeviceConnection
            {
                ConnectionId = Context.ConnectionId,
                DeviceId = deviceId,
                DeviceName = deviceName,
                DeviceType = deviceType,
                ConnectedAt = DateTime.UtcNow
            };

            await _redisService.AddDeviceAsync(userId, device);
            
            // Notify tất cả devices về device mới
            await NotifyDeviceListChanged(userId);
            
            // Trả về deviceId cho client
            await Clients.Caller.SendAsync("DeviceRegistered", deviceId);
        }

        /// <summary>
        /// Chọn device để làm active playback device
        /// </summary>
        public async Task SelectActiveDevice(string deviceId)
        {
            var userId = GetUserId();
            await _redisService.SetActivePlayerAsync(userId, deviceId);
            
            // Notify tất cả devices về active device mới
            var activeDevice = await _redisService.GetActivePlayerAsync(userId);
            if (activeDevice != null)
            {
                var devices = await _redisService.GetUserDevicesAsync(userId);
                foreach (var device in devices)
                {
                    await Clients.Client(device.ConnectionId)
                        .SendAsync("ActiveDeviceChanged", activeDevice);
                }
            }
        }

        /// <summary>
        /// Lấy danh sách devices
        /// </summary>
        public async Task<object> GetConnectedDevices()
        {
            var userId = GetUserId();
            var devices = await _redisService.GetUserDevicesAsync(userId);
            var activeDevice = await _redisService.GetActivePlayerAsync(userId);
            
            return new
            {
                Devices = devices,
                ActiveDeviceId = activeDevice?.DeviceId
            };
        }

        /// <summary>
        /// Play nhạc trên active device
        /// </summary>
        public async Task Play()
        {
            var userId = GetUserId();
            var activeDevice = await _redisService.GetActivePlayerAsync(userId);
            
            if (activeDevice != null)
            {
                await Clients.Client(activeDevice.ConnectionId).SendAsync("Play");
                
                // Update playback state
                var state = await _redisService.GetPlaybackStateAsync(userId) ?? new PlaybackState();
                state.IsPlaying = true;
                state.LastUpdated = DateTime.UtcNow;
                await _redisService.SetPlaybackStateAsync(userId, state);
            }
        }

        /// <summary>
        /// Pause nhạc trên active device
        /// </summary>
        public async Task Pause()
        {
            var userId = GetUserId();
            var activeDevice = await _redisService.GetActivePlayerAsync(userId);
            
            if (activeDevice != null)
            {
                await Clients.Client(activeDevice.ConnectionId).SendAsync("Pause");
                
                // Update playback state
                var state = await _redisService.GetPlaybackStateAsync(userId) ?? new PlaybackState();
                state.IsPlaying = false;
                state.LastUpdated = DateTime.UtcNow;
                await _redisService.SetPlaybackStateAsync(userId, state);
            }
        }

        /// <summary>
        /// Next bài hát trên active device
        /// </summary>
        public async Task Next()
        {
            var userId = GetUserId();
            var activeDevice = await _redisService.GetActivePlayerAsync(userId);
            
            if (activeDevice != null)
            {
                await Clients.Client(activeDevice.ConnectionId).SendAsync("Next");
            }
        }

        /// <summary>
        /// Previous bài hát trên active device
        /// </summary>
        public async Task Previous()
        {
            var userId = GetUserId();
            var activeDevice = await _redisService.GetActivePlayerAsync(userId);
            
            if (activeDevice != null)
            {
                await Clients.Client(activeDevice.ConnectionId).SendAsync("Previous");
            }
        }

        /// <summary>
        /// Set volume trên active device
        /// </summary>
        public async Task SetVolume(int volume)
        {
            var userId = GetUserId();
            var activeDevice = await _redisService.GetActivePlayerAsync(userId);
            
            if (activeDevice != null)
            {
                await Clients.Client(activeDevice.ConnectionId).SendAsync("SetVolume", volume);
                
                // Update playback state
                var state = await _redisService.GetPlaybackStateAsync(userId) ?? new PlaybackState();
                state.Volume = volume;
                state.LastUpdated = DateTime.UtcNow;
                await _redisService.SetPlaybackStateAsync(userId, state);
            }
        }

        /// <summary>
        /// Play bài hát cụ thể trên active device
        /// </summary>
        public async Task PlaySong(string songId, int startTime = 0)
        {
            var userId = GetUserId();
            var activeDevice = await _redisService.GetActivePlayerAsync(userId);
            
            if (activeDevice != null)
            {
                await Clients.Client(activeDevice.ConnectionId)
                    .SendAsync("PlaySong", songId, startTime);
                
                // Update playback state
                var state = await _redisService.GetPlaybackStateAsync(userId) ?? new PlaybackState();
                state.CurrentSongId = songId;
                state.CurrentTime = startTime;
                state.IsPlaying = true;
                state.LastUpdated = DateTime.UtcNow;
                await _redisService.SetPlaybackStateAsync(userId, state);
            }
        }

        /// <summary>
        /// Sync playback state to all devices
        /// </summary>
        public async Task SyncPlaybackState(PlaybackState state)
        {
            var userId = GetUserId();
            await _redisService.SetPlaybackStateAsync(userId, state);
            
            // Broadcast to all devices of this user
            var devices = await _redisService.GetUserDevicesAsync(userId);
            foreach (var device in devices.Where(d => d.ConnectionId != Context.ConnectionId))
            {
                await Clients.Client(device.ConnectionId)
                    .SendAsync("PlaybackStateUpdated", state);
            }
        }

        /// <summary>
        /// Get current playback state
        /// </summary>
        public async Task<PlaybackState?> GetPlaybackState()
        {
            var userId = GetUserId();
            return await _redisService.GetPlaybackStateAsync(userId);
        }

        private async Task NotifyDeviceListChanged(string userId)
        {
            var devices = await _redisService.GetUserDevicesAsync(userId);
            var activeDevice = await _redisService.GetActivePlayerAsync(userId);
            
            var deviceList = new
            {
                Devices = devices,
                ActiveDeviceId = activeDevice?.DeviceId
            };
            
            foreach (var device in devices)
            {
                await Clients.Client(device.ConnectionId)
                    .SendAsync("DeviceListUpdated", deviceList);
            }
        }

        private string GetUserId()
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                throw new HubException("User not authenticated");
            }
            return userIdClaim;
        }
    }
}