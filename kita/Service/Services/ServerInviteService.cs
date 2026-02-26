using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kita.Domain.Entities.Server;
using Kita.Infrastructure.Repositories;
using Kita.Service.Common;
using Kita.Service.DTOs.Server;
using Kita.Service.Interfaces;

namespace Kita.Service.Services
{
    public class ServerInviteService : IServerInviteService
    {
        private readonly IBaseRepository<ServerInvite> _inviteRepository;
        private readonly IBaseRepository<Kita.Domain.Entities.Server.Server> _serverRepository;
        private readonly IBaseRepository<ServerMember> _serverMemberRepository;

        public ServerInviteService(
            IBaseRepository<ServerInvite> inviteRepository,
            IBaseRepository<Kita.Domain.Entities.Server.Server> serverRepository,
            IBaseRepository<ServerMember> serverMemberRepository)
        {
            _inviteRepository = inviteRepository;
            _serverRepository = serverRepository;
            _serverMemberRepository = serverMemberRepository;
        }

        public async Task<ApiResponse<ServerInviteDto>> CreateInviteAsync(Guid serverId, CreateServerInviteDto dto, Guid creatorId)
        {
            var server = await _serverRepository.GetByIdAsync(serverId);
            if (server == null)
                return ApiResponse<ServerInviteDto>.Fail("Server not found.");

            var membership = await _serverMemberRepository.FindAsync(sm => sm.ServerId == serverId && sm.UserId == creatorId);
            if (!membership.Any())
                return ApiResponse<ServerInviteDto>.Fail("You must be a member of the server to create invites.");

            string code;
            bool codeExists;
            do
            {
                code = GenerateInviteCode();
                var existingInvites = await _inviteRepository.FindAsync(i => i.Code == code);
                codeExists = existingInvites.Any();
            } while (codeExists);

            var invite = new ServerInvite
            {
                Code = code,
                ServerId = serverId,
                CreatedById = creatorId,
                MaxUses = dto.MaxUses,
                ExpiresAt = dto.ExpiresInHours.HasValue 
                    ? DateTime.UtcNow.AddHours(dto.ExpiresInHours.Value) 
                    : null
            };

            await _inviteRepository.AddAsync(invite);
            await _inviteRepository.SaveChangesAsync();

            return new ApiResponse<ServerInviteDto>(MapToDto(invite, server.Name, string.Empty));
        }

        public async Task<ApiResponse<ServerInviteDto>> GetInviteByCodeAsync(string code)
        {
            var invites = await _inviteRepository.FindAsync(i => i.Code == code);
            var invite = invites.FirstOrDefault();

            if (invite == null)
                return ApiResponse<ServerInviteDto>.Fail("Invite not found.");

            var server = await _serverRepository.GetByIdAsync(invite.ServerId);
            
            return new ApiResponse<ServerInviteDto>(MapToDto(invite, server?.Name ?? "Unknown", string.Empty));
        }

        public async Task<ApiResponse<ServerInviteDto>> UseInviteAsync(string code, Guid userId)
        {
            var invites = await _inviteRepository.FindAsync(i => i.Code == code);
            var invite = invites.FirstOrDefault();

            if (invite == null)
                return ApiResponse<ServerInviteDto>.Fail("Invite not found.");

            // Validate invite
            if (invite.IsRevoked)
                return ApiResponse<ServerInviteDto>.Fail("Invite has been revoked.");

            if (invite.ExpiresAt.HasValue && invite.ExpiresAt.Value < DateTime.UtcNow)
                return ApiResponse<ServerInviteDto>.Fail("Invite has expired.");

            if (invite.MaxUses.HasValue && invite.Uses >= invite.MaxUses.Value)
                return ApiResponse<ServerInviteDto>.Fail("Invite has reached maximum uses.");

            var existingMembership = await _serverMemberRepository.FindAsync(
                sm => sm.ServerId == invite.ServerId && sm.UserId == userId);

            bool isNewMember = !existingMembership.Any();
            if (isNewMember)
            {
                var member = new ServerMember
                {
                    ServerId = invite.ServerId,
                    UserId = userId,
                    Role = ServerRole.Member
                };

                await _serverMemberRepository.AddAsync(member);
            }

            invite.Uses++;
            await _inviteRepository.UpdateAsync(invite);
            await _inviteRepository.SaveChangesAsync();

            var server = await _serverRepository.GetByIdAsync(invite.ServerId);
            var response = new ApiResponse<ServerInviteDto>(
                MapToDto(invite, server?.Name ?? "Unknown", string.Empty),
                "Successfully joined the server.");
            
            response.Data.IsNewMember = isNewMember;
            
            return response;
        }

        public async Task<ApiResponse<bool>> RevokeInviteAsync(Guid inviteId, Guid userId)
        {
            var invite = await _inviteRepository.GetByIdAsync(inviteId);
            if (invite == null)
                return ApiResponse<bool>.Fail("Invite not found.");

            // Check if user has permission (must be creator or server admin/owner)
            var membership = await _serverMemberRepository.FindAsync(
                sm => sm.ServerId == invite.ServerId && sm.UserId == userId);
            var member = membership.FirstOrDefault();

            if (member == null)
                return ApiResponse<bool>.Fail("You don't have permission to revoke this invite.");

            if (invite.CreatedById != userId && member.Role != ServerRole.Admin && member.Role != ServerRole.Owner)
                return ApiResponse<bool>.Fail("Only the invite creator or server admins can revoke invites.");

            invite.IsRevoked = true;
            await _inviteRepository.UpdateAsync(invite);
            await _inviteRepository.SaveChangesAsync();

            return new ApiResponse<bool>(true, "Invite revoked successfully.");
        }

        public async Task<ApiResponse<List<ServerInviteDto>>> GetServerInvitesAsync(Guid serverId, Guid userId)
        {
            // Check if user is admin or owner of the server
            var membership = await _serverMemberRepository.FindAsync(
                sm => sm.ServerId == serverId && sm.UserId == userId);
            var member = membership.FirstOrDefault();

            if (member == null)
                return ApiResponse<List<ServerInviteDto>>.Fail("You don't have access to this server.");

            if (member.Role != ServerRole.Admin && member.Role != ServerRole.Owner)
                return ApiResponse<List<ServerInviteDto>>.Fail("Only server admins can view all invites.");

            var invites = await _inviteRepository.FindAsync(i => i.ServerId == serverId);
            var server = await _serverRepository.GetByIdAsync(serverId);

            var inviteDtos = invites.Select(i => MapToDto(i, server?.Name ?? "Unknown", string.Empty)).ToList();

            return new ApiResponse<List<ServerInviteDto>>(inviteDtos);
        }

        private string GenerateInviteCode()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 8)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }

        private ServerInviteDto MapToDto(ServerInvite invite, string serverName, string creatorUsername)
        {
            var isExpired = invite.ExpiresAt.HasValue && invite.ExpiresAt.Value < DateTime.UtcNow;
            var isMaxedOut = invite.MaxUses.HasValue && invite.Uses >= invite.MaxUses.Value;
            var isValid = !invite.IsRevoked && !isExpired && !isMaxedOut;

            return new ServerInviteDto
            {
                Id = invite.Id,
                Code = invite.Code,
                ServerId = invite.ServerId,
                ServerName = serverName,
                CreatedById = invite.CreatedById,
                CreatedByUsername = creatorUsername,
                CreatedAt = invite.CreatedAt,
                ExpiresAt = invite.ExpiresAt,
                MaxUses = invite.MaxUses,
                Uses = invite.Uses,
                IsRevoked = invite.IsRevoked,
                IsExpired = isExpired,
                IsValid = isValid
            };
        }
    }
}
