using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Kita.Hubs;

[Authorize]
public class VoiceHub : Hub
{
    // Track users in each room (channelId -> list of connection IDs)
    private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, string>> _roomParticipants 
        = new ConcurrentDictionary<string, ConcurrentDictionary<string, string>>();

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public async Task JoinRoom(string channelId, string username)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, channelId);

        // Track participant
        var participants = _roomParticipants.GetOrAdd(channelId, _ => new ConcurrentDictionary<string, string>());
        participants.TryAdd(Context.ConnectionId, username);

        // Notify others in the room
        await Clients.Group(channelId).SendAsync("UserJoined", new
        {
            userId,
            username,
            connectionId = Context.ConnectionId,
            participantCount = participants.Count
        });
    }

    public async Task LeaveRoom(string channelId)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, channelId);

        // Remove participant
        if (_roomParticipants.TryGetValue(channelId, out var participants))
        {
            if (participants.TryRemove(Context.ConnectionId, out var username))
            {
                // Notify others in the room
                await Clients.Group(channelId).SendAsync("UserLeft", new
                {
                    userId,
                    username,
                    connectionId = Context.ConnectionId,
                    participantCount = participants.Count
                });

                // Clean up empty rooms
                if (participants.IsEmpty)
                {
                    _roomParticipants.TryRemove(channelId, out _);
                }
            }
        }
    }

    public async Task<int> GetParticipantCount(string channelId)
    {
        if (_roomParticipants.TryGetValue(channelId, out var participants))
        {
            return await Task.FromResult(participants.Count);
        }
        return await Task.FromResult(0);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Clean up user from all rooms on disconnect
        foreach (var room in _roomParticipants)
        {
            if (room.Value.TryRemove(Context.ConnectionId, out var username))
            {
                var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                await Clients.Group(room.Key).SendAsync("UserLeft", new
                {
                    userId,
                    username,
                    connectionId = Context.ConnectionId,
                    participantCount = room.Value.Count
                });

                // Clean up empty rooms
                if (room.Value.IsEmpty)
                {
                    _roomParticipants.TryRemove(room.Key, out _);
                }
            }
        }

        await base.OnDisconnectedAsync(exception);
    }
}
