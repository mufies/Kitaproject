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
using Kita.Domain.Entities;

namespace Kita.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IBaseRepository<Channel> _channelRepository;
        private readonly IBaseRepository<ServerMember> _serverMemberRepository;
        private readonly IMessageService _messageService;
        private readonly IUserService _userService;

        public ChatHub(
            IBaseRepository<Channel> channelRepository,
            IBaseRepository<ServerMember> serverMemberRepository,
            IMessageService messageService,
            IUserService userService)
        {
            _channelRepository = channelRepository;
            _serverMemberRepository = serverMemberRepository;
            _messageService = messageService;
            _userService = userService;
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

            var groupName = GetChannelGroupName(channelGuid);
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            var username = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
            await Clients.OthersInGroup(groupName).SendAsync("UserOnline", userId, username, channelId);

        }

        public async Task LeaveChannel(string channelId)
        {
            if (!Guid.TryParse(channelId, out var channelGuid)) return;
            
            var userId = GetUserId();
            var groupName = GetChannelGroupName(channelGuid);
            
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

            var username = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
            await Clients.OthersInGroup(groupName).SendAsync("UserOffline", userId, username, channelId);

        }

        public async Task SendMessage(string channelId, string content, string? replyToId = null, string? replyToContent = null, string? replyToSenderName = null)
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

            Guid? replyToGuid = null;
            if (replyToId != null && Guid.TryParse(replyToId, out var parsedReplyId))
            {
                replyToGuid = parsedReplyId;
            }

            var createMessageDto = new CreateMessageDto
            {
                Content = content,
                ChannelId = channelGuid,
                ReplyToId = replyToGuid,
                ReplyToContent = replyToContent,
                ReplyToSenderName = replyToSenderName
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

        public async Task NotifyImageSent(string channelId, string messageId)
        {
            var userId = GetUserId();

            if (!Guid.TryParse(channelId, out var channelGuid))
            {
                await Clients.Caller.SendAsync("Error", "Invalid channel ID");
                return;
            }

            if (!Guid.TryParse(messageId, out var messageGuid))
            {
                await Clients.Caller.SendAsync("Error", "Invalid message ID");
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

            // Fetch the message to verify it exists and belongs to the channel
            var messageResult = await _messageService.GetMessageByIdAsync(messageGuid);
            if (!messageResult.Success || messageResult.Data == null)
            {
                await Clients.Caller.SendAsync("Error", "Message not found");
                return;
            }

            if (messageResult.Data.ChannelId != channelGuid)
            {
                await Clients.Caller.SendAsync("Error", "Message does not belong to this channel");
                return;
            }

            var groupName = GetChannelGroupName(channelGuid);
            await Clients.Group(groupName).SendAsync("ReceiveMessage", messageResult.Data);
        }
        public async Task DeleteMessage(string messageId, string channelId, string? captions)
        {
            var userId = GetUserId();
            if (!Guid.TryParse(messageId, out var messageGuid))
            {
                await Clients.Caller.SendAsync("Error", "Invalid message ID");
                return;
            }

            if (!Guid.TryParse(channelId, out var channelGuid))
            {
                await Clients.Caller.SendAsync("Error", "Invalid channel ID");
                return;
            }

            var result = await _messageService.DeleteMessageAsync(messageGuid, userId);

            if (result.Success)
            {
                var groupName = GetChannelGroupName(channelGuid);
                // Broadcast the messageId to all clients in the channel
                await Clients.Group(groupName).SendAsync("DeleteMessage", new { id = messageId });
            }
            else
            {
                await Clients.Caller.SendAsync("Error", result.Message ?? "Failed to delete message");
            }
        }

        public async Task EditMessage(string messageId, string content, string channelId)
        {
            var userId = GetUserId();
            
            if (!Guid.TryParse(messageId, out var messageGuid))
            {
                await Clients.Caller.SendAsync("Error", "Invalid message ID");
                return;
            }

            if (!Guid.TryParse(channelId, out var channelGuid))
            {
                await Clients.Caller.SendAsync("Error", "Invalid channel ID");
                return;
            }

            var result = await _messageService.UpdateMessageAsync(messageGuid, new UpdateMessageDto { Content = content }, userId);

            if (result.Success)
            {
                var groupName = GetChannelGroupName(channelGuid);
                await Clients.Group(groupName).SendAsync("EditMessage", result.Data);
            }
            else
            {
                await Clients.Caller.SendAsync("Error", result.Message ?? "Failed to edit message");
            }
        }

        public async Task StartTyping(string channelId)
        {
            if (!Guid.TryParse(channelId, out var channelGuid)) return;
            
            var userId = GetUserId();
            var userProfileInfo = await _userService.GetUserProfileAsync(userId);
            var username = userProfileInfo.Data?.UserName ?? "Unknown";
            var groupName = GetChannelGroupName(channelGuid);

            await Clients.OthersInGroup(groupName).SendAsync("UserTyping", userId, username, channelId);
        }

        public async Task StopTyping(string channelId)
        {
            if (!Guid.TryParse(channelId, out var channelGuid)) return;
            
            var userId = GetUserId();
            var userProfileInfo = await _userService.GetUserProfileAsync(userId);
            var username = userProfileInfo.Data?.UserName ?? "Unknown";
            var groupName = GetChannelGroupName(channelGuid);

            await Clients.OthersInGroup(groupName).SendAsync("UserStoppedTyping", userId, username, channelId);
        }

        public async Task ToggleReaction(string messageId, string channelId, string emoji)
        {
            var userId = GetUserId();

            if (!Guid.TryParse(messageId, out var messageGuid))
            {
                await Clients.Caller.SendAsync("Error", "Invalid message ID");
                return;
            }

            if (!Guid.TryParse(channelId, out var channelGuid))
            {
                await Clients.Caller.SendAsync("Error", "Invalid channel ID");
                return;
            }

            var result = await _messageService.ToggleReactionAsync(messageGuid, emoji, userId);

            if (result.Success)
            {
                var groupName = GetChannelGroupName(channelGuid);
                await Clients.Group(groupName).SendAsync("MessageReactionChanged", result.Data);
            }
            else
            {
                await Clients.Caller.SendAsync("Error", result.Message ?? "Failed to toggle reaction");
            }
        }

        public async Task LeaveServer(string serverId)
        {
            var userId = GetUserId();

            await Clients.Caller.SendAsync("ServerLeft", serverId, userId);
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
