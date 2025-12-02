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

namespace Kita.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IBaseRepository<Channel> _channelRepository;
        private readonly IBaseRepository<ServerMember> _serverMemberRepository;
        private readonly IMessageService _messageService;

        public ChatHub(
            IBaseRepository<Channel> channelRepository,
            IBaseRepository<ServerMember> serverMemberRepository,
            IMessageService messageService)
        {
            _channelRepository = channelRepository;
            _serverMemberRepository = serverMemberRepository;
            _messageService = messageService;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinChannel(string channelId)
        {
            var userId = GetUserId();
            
            
            // Parse channelId
            if (!Guid.TryParse(channelId, out var channelGuid))
            {
                await Clients.Caller.SendAsync("Error", "Invalid channel ID");
                return;
            }
            
            // Get channel and verify it exists
            var channel = await _channelRepository.GetByIdAsync(channelGuid);
            if (channel == null)
            {
                await Clients.Caller.SendAsync("Error", "Channel not found");
                return;
            }


            // Verify user is a member of the server
            var membership = await _serverMemberRepository.FindAsync(
                sm => sm.ServerId == channel.ServerId && sm.UserId == userId);
            
            
            if (!membership.Any())
            {
                await Clients.Caller.SendAsync("Error", "You don't have access to this channel");
                return;
            }

            // Add user to channel group
            var groupName = GetChannelGroupName(channelGuid);
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            // Notify others in the channel
            // var username = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
            // await Clients.OthersInGroup(groupName).SendAsync("UserJoined", userId, username, channelId);

        }

        public async Task LeaveChannel(string channelId)
        {
            if (!Guid.TryParse(channelId, out var channelGuid)) return;
            
            var userId = GetUserId();
            var groupName = GetChannelGroupName(channelGuid);
            
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

            // var username = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
            // await Clients.OthersInGroup(groupName).SendAsync("UserLeft", userId, username, channelId);

        }

        public async Task SendMessage(string channelId, string content)
        {
            var userId = GetUserId();
            
            if (!Guid.TryParse(channelId, out var channelGuid))
            {
                await Clients.Caller.SendAsync("Error", "Invalid channel ID");
                return;
            }

            var channel = await _channelRepository.GetByIdAsync(channelGuid);
            if (channel == null)
            {
                await Clients.Caller.SendAsync("Error", "Channel not found");
                return;
            }

            var membership = await _serverMemberRepository.FindAsync(
                sm => sm.ServerId == channel.ServerId && sm.UserId == userId);
            
            if (!membership.Any())
            {
                await Clients.Caller.SendAsync("Error", "You don't have access to this channel");
                return;
            }

            var createMessageDto = new CreateMessageDto
            {
                Content = content,
                ChannelId = channelGuid
            };

            var result = await _messageService.SendMessageAsync(createMessageDto, userId);

            if (result.Success && result.Data != null)
            {
                var groupName = GetChannelGroupName(channelGuid);
                await Clients.Group(groupName).SendAsync("ReceiveMessage", result.Data);

            }
            else
            {
                await Clients.Caller.SendAsync("Error", result.Message ?? "Failed to send message");
            }
        }

        public async Task StartTyping(string channelId)
        {
            if (!Guid.TryParse(channelId, out var channelGuid)) return;
            
            var userId = GetUserId();
            var username = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
            var groupName = GetChannelGroupName(channelGuid);

            await Clients.OthersInGroup(groupName).SendAsync("UserTyping", userId, username, channelId);
        }

        public async Task StopTyping(string channelId)
        {
            if (!Guid.TryParse(channelId, out var channelGuid)) return;
            
            var userId = GetUserId();
            var username = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
            var groupName = GetChannelGroupName(channelGuid);

            await Clients.OthersInGroup(groupName).SendAsync("UserStoppedTyping", userId, username, channelId);
        }

        private Guid GetUserId()
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                throw new HubException("User not authenticated");
            }
            return Guid.Parse(userIdClaim);
        }

        private string GetChannelGroupName(Guid channelId)
        {
            return $"channel_{channelId}";
        }
    }
}
