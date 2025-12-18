using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Kita.Domain.Entities.Server;
using Kita.Infrastructure.Repositories;
using Kita.Service.DTOs.Server;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Kita.Hubs;

public class VoiceHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public async Task JoinRoom(string roomId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
    }

    public async Task LeaveRoom(string roomId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
    }
    public async Task SendSdp(string roomId, string sdp) { 
        await Clients.Group(roomId).SendAsync("SdpReceived", sdp); 
    }

    public async Task SendIceCandidate(string roomId, object candidate) { 
        await Clients.Group(roomId).SendAsync("IceCandidateReceived", candidate); 
    }


    public override async Task OnDisconnectedAsync(Exception exception)
    {
        await LeaveRoom("room1");
        await base.OnDisconnectedAsync(exception);
    }
    
}
