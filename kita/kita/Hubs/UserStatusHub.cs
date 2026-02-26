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
            Console.WriteLine($"🟢 User {userId} connected to UserStatusHub");
            await base.OnConnectedAsync();
            await _userService.SetActiveAsync(Guid.Parse(userId), true);
            
            await UpdateUserStatus(userId, true, null);
            
            // Broadcast to ALL clients that this user is now online
            Console.WriteLine($"🟢 Broadcasting UserStatusChanged for {userId} (online=true) to all clients");
            await Clients.All.SendAsync("UserStatusChanged", new UserStatusInfo
            {
                UserId = userId,
                IsOnline = true,
                CurrentlyPlayingSong = await GetCurrentlyPlayingSongFromStorage(userId)
            });
            
            // Send all currently online users to the newly connected client
            Console.WriteLine($"🟢 Sending all online users status to newly connected user {userId}");
            var onlineUsers = _userStatuses.Values.Where(u => u.IsOnline).ToList();
            foreach (var onlineUser in onlineUsers)
            {
                if (onlineUser.UserId != userId) // Don't send their own status back
                {
                    Console.WriteLine($"   - Sending status for {onlineUser.UserId} (online={onlineUser.IsOnline})");
                    await Clients.Caller.SendAsync("UserStatusChanged", onlineUser);
                }
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            Console.WriteLine($"🔴 User {userId} disconnected from UserStatusHub");
            await base.OnDisconnectedAsync(exception);
            await _userService.SetActiveAsync(Guid.Parse(userId), false);
            
            await UpdateUserStatus(userId, false, null);
            
            // Broadcast to ALL clients
            Console.WriteLine($"🔴 Broadcasting UserStatusChanged for {userId} (online=false) to all clients");
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
            Console.WriteLine($"🔵 GetUserStatus called for: {targetUserId}");
            
            // Check in-memory first
            if (_userStatuses.TryGetValue(targetUserId, out var status))
            {
                Console.WriteLine($"🟢 Found in memory: {targetUserId}, online={status.IsOnline}");
                return status;
            }
            
            Console.WriteLine($"🟡 Not in memory, checking database for: {targetUserId}");
            
            // If not in memory, check database for IsActive status
            var songInfo = await GetCurrentlyPlayingSongFromStorage(targetUserId);
            bool isActive = false;
            
            try
            {
                if (Guid.TryParse(targetUserId, out var userGuid))
                {
                    var user = await _userService.GetUserProfileAsync(userGuid);
                    if (user.Success && user.Data != null)
                    {
                        isActive = user.Data.IsActive;
                        Console.WriteLine($"🟢 Database IsActive for {targetUserId}: {isActive}");
                    }
                    else
                    {
                        Console.WriteLine($"🔴 Failed to get user profile for {targetUserId}: {user.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"🔴 Failed to get user active status: {ex.Message}");
            }
            
            return new UserStatusInfo
            {
                UserId = targetUserId,
                IsOnline = isActive,
                CurrentlyPlayingSong = songInfo
            };
        }


        public async Task<UserStatusInfo[]> GetUsersStatus(string[] userIds)
        {
            Console.WriteLine($"🔵 GetUsersStatus called for {userIds.Length} users");
            var statuses = new List<UserStatusInfo>();
            
            foreach (var userId in userIds)
            {
                var status = await GetUserStatus(userId);
                statuses.Add(status);
            }
            
            Console.WriteLine($"🟢 Returning {statuses.Count} statuses");
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