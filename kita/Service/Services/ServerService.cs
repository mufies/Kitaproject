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
    public class ServerService : IServerService
    {
        private readonly IRepository<Server> _serverRepository;
        private readonly IRepository<ServerMember> _serverMemberRepository;

        public ServerService(IRepository<Server> serverRepository, IRepository<ServerMember> serverMemberRepository)
        {
            _serverRepository = serverRepository;
            _serverMemberRepository = serverMemberRepository;
        }

        public async Task<ApiResponse<ServerDto>> CreateServerAsync(CreateServerDto createServerDto, Guid ownerId)
        {
            var server = new Server
            {
                Name = createServerDto.Name,
                IconUrl = createServerDto.IconUrl,
                OwnerId = ownerId
            };

            await _serverRepository.AddAsync(server);
            await _serverRepository.SaveChangesAsync();

            // Add owner as member with Owner role
            var member = new ServerMember
            {
                ServerId = server.Id,
                UserId = ownerId,
                Role = ServerRole.Owner
            };
            await _serverMemberRepository.AddAsync(member);
            await _serverMemberRepository.SaveChangesAsync();

            return new ApiResponse<ServerDto>(new ServerDto
            {
                Id = server.Id,
                Name = server.Name,
                IconUrl = server.IconUrl,
                OwnerId = server.OwnerId
            });
        }

        public async Task<ApiResponse<List<ServerDto>>> GetUserServersAsync(Guid userId)
        {
            var memberships = await _serverMemberRepository.FindAsync(sm => sm.UserId == userId);
            var serverIds = memberships.Select(sm => sm.ServerId).ToList();
            
            // Note: This is N+1 if not careful, but for now generic repo FindAsync returns IEnumerable.
            // A better approach would be to have a method in repo to get servers by user id with Include.
            // For simplicity with generic repo:
            var allServers = await _serverRepository.GetAllAsync();
            var userServers = allServers.Where(s => serverIds.Contains(s.Id)).Select(s => new ServerDto
            {
                Id = s.Id,
                Name = s.Name,
                IconUrl = s.IconUrl,
                OwnerId = s.OwnerId
            }).ToList();

            return new ApiResponse<List<ServerDto>>(userServers);
        }

        public async Task<ApiResponse<ServerDto>> GetServerByIdAsync(Guid serverId)
        {
            var server = await _serverRepository.GetByIdAsync(serverId);
            if (server == null) return ApiResponse<ServerDto>.Fail("Server not found.");

            return new ApiResponse<ServerDto>(new ServerDto
            {
                Id = server.Id,
                Name = server.Name,
                IconUrl = server.IconUrl,
                OwnerId = server.OwnerId
            });
        }

        public async Task<ApiResponse<bool>> DeleteServerAsync(Guid serverId)
        {
            var server = await _serverRepository.GetByIdAsync(serverId);
            if (server == null) return ApiResponse<bool>.Fail("Server not found.");

            await _serverRepository.DeleteAsync(server.Id);
            await _serverRepository.SaveChangesAsync();

            return new ApiResponse<bool>(true, "Server deleted successfully.");
        }
    }
}
