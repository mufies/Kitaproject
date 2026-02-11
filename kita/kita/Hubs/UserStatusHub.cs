using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Kita.Hubs
{
    public class UserStatusInfo
    {
        public string UserId { get; set; } = "";
        public bool IsOnline { get; set; }
        public CurrentlyPlayingSongInfo? CurrentlyPlayingSong { get; set; }
    }

    public class CurrentlyPlayingSongInfo
    {
        public string SongId { get; set; } = "";
        public string SongTitle { get; set; } = "";
        public string ArtistName { get; set; } = "";
        public string? CoverUrl { get; set; }
        public DateTime StartedAt { get; set; }
    }

    [Authorize]
    public class UserStatusHub : Hub
    {
        private readonly IUserService _userService;
        private readonly IRedisService _redisService;
        
        private static readonly ConcurrentDictionary<string, UserStatusInfo> _userStatuses = new();

        public UserStatusHub(IUserService userService, IRedisService redisService)
        {
            _userService = userService;
            _redisService = redisService;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            await base.OnConnectedAsync();
            await _userService.SetActiveAsync(Guid.Parse(userId), true);
            
            await UpdateUserStatus(userId, true, null);
            
            // Broadcast to ALL clients
            await Clients.All.SendAsync("UserStatusChanged", new UserStatusInfo
            {
                UserId = userId,
                IsOnline = true,
                CurrentlyPlayingSong = await GetCurrentlyPlayingSongFromStorage(userId)
            });
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            await base.OnDisconnectedAsync(exception);
            await _userService.SetActiveAsync(Guid.Parse(userId), false);
            
            await UpdateUserStatus(userId, false, null);
            
            // Broadcast to ALL clients
            await Clients.All.SendAsync("UserStatusChanged", new UserStatusInfo
            {
                UserId = userId,
                IsOnline = false,
                CurrentlyPlayingSong = null
            });
        }


        public async Task UpdateCurrentlyPlayingSong(string songId, string songTitle, string artistName, string? coverUrl = null)
        {
            var userId = GetUserId();
            
            var songInfo = new CurrentlyPlayingSongInfo
            {
                SongId = songId,
                SongTitle = songTitle,
                ArtistName = artistName,
                StartedAt = DateTime.UtcNow,
                CoverUrl = coverUrl
            };

            await UpdateUserStatus(userId, true, songInfo);
            
            await Clients.All.SendAsync("UserStatusChanged", new UserStatusInfo
            {
                UserId = userId,
                IsOnline = true,
                CurrentlyPlayingSong = songInfo
            });
        }

        public async Task ClearCurrentlyPlayingSong()
        {
            var userId = GetUserId();
            
            await UpdateUserStatus(userId, true, null);
            
            // Broadcast to ALL clients
            await Clients.All.SendAsync("UserStatusChanged", new UserStatusInfo
            {
                UserId = userId,
                IsOnline = true,
                CurrentlyPlayingSong = null
            });
        }


        public async Task<UserStatusInfo> GetUserStatus(string targetUserId)
        {
            
            if (_userStatuses.TryGetValue(targetUserId, out var status))
            {
                return status;
            }
            
            var songInfo = await GetCurrentlyPlayingSongFromStorage(targetUserId);
            
            return new UserStatusInfo
            {
                UserId = targetUserId,
                IsOnline = false,
                CurrentlyPlayingSong = songInfo
            };
        }


        public async Task<UserStatusInfo[]> GetUsersStatus(string[] userIds)
        {
            var statuses = new List<UserStatusInfo>();
            
            foreach (var userId in userIds)
            {
                var status = await GetUserStatus(userId);
                statuses.Add(status);
            }
            
            return statuses.ToArray();
        }

        private async Task UpdateUserStatus(string userId, bool isOnline, CurrentlyPlayingSongInfo? songInfo)
        {
            var status = new UserStatusInfo
            {
                UserId = userId,
                IsOnline = isOnline,
                CurrentlyPlayingSong = songInfo
            };

            _userStatuses.AddOrUpdate(userId, status, (key, old) => status);
            
            try
            {
                if (songInfo != null)
                {
                    await _redisService.SetValueAsync($"user:status:song:{userId}", 
                        System.Text.Json.JsonSerializer.Serialize(songInfo), 
                        TimeSpan.FromHours(24));
                }
                else
                {
                    await _redisService.RemoveValueAsync($"user:status:song:{userId}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"🔴 Redis operation failed: {ex.Message}");
            }
        }

        private async Task<CurrentlyPlayingSongInfo?> GetCurrentlyPlayingSongFromStorage(string userId)
        {
            // Try Redis first
            try
            {
                var songJson = await _redisService.GetValueAsync($"user:status:song:{userId}");
                if (!string.IsNullOrEmpty(songJson))
                {
                    return System.Text.Json.JsonSerializer.Deserialize<CurrentlyPlayingSongInfo>(songJson);
                }
            }
            catch
            {
                // Redis not available, fallback to memory
            }

            // Fallback to in-memory
            if (_userStatuses.TryGetValue(userId, out var status))
            {
                return status.CurrentlyPlayingSong;
            }

            return null;
        }

        private string GetUserId()
        {
            return Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        }
    }
}