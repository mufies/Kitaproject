using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Kita.Domain.Entities.Server;
using Kita.Infrastructure.Repositories;
using Kita.Service.Common;
using Kita.Service.DTOs.Server;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Kita.Service.Services
{
    public class ServerService : IServerService
    {
        private readonly IServerRepository _serverRepository;
        private readonly IBaseRepository<ServerMember> _serverMemberRepository;
        private readonly IConfiguration _configuration;

        public ServerService(
            IServerRepository serverRepository, 
            IBaseRepository<ServerMember> serverMemberRepository,
            IConfiguration configuration)
        {
            _serverRepository = serverRepository;
            _serverMemberRepository = serverMemberRepository;
            _configuration = configuration;
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
            // Use optimized repository method that includes Server with Owner
            var servers = await _serverRepository.GetServersByMemberIdAsync(userId);
            var userServers = servers.Select(s => new ServerDto
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

        public async Task<ApiResponse<List<ServerMemberDto>>> GetServerMembersAsync(Guid serverId)
        {
            var server = await _serverRepository.GetServerWithMembersAsync(serverId);
            if (server == null) return ApiResponse<List<ServerMemberDto>>.Fail("Server not found.");

            var memberDtos = server.Members.Select(m => new ServerMemberDto
            {
                Id = m.Id,
                UserId = m.UserId,
                Username = m.User?.UserName ?? "Unknown",
                AvatarUrl = m.User?.AvatarUrl,
                Nickname = m.Nickname,
                Role = m.Role.ToString(),
                JoinedAt = m.JoinedAt
            }).OrderByDescending(m => m.Role == "Owner")
              .ThenByDescending(m => m.Role == "Admin")
              .ThenBy(m => m.Username)
              .ToList();

            return new ApiResponse<List<ServerMemberDto>>(memberDtos);
        }

        public async Task<ApiResponse<ServerDto>> UpdateServerAsync(Guid serverId, UpdateServerDto updateServerDto, Guid userId)
        {
            var server = await _serverRepository.GetByIdAsync(serverId);
            if (server == null) return ApiResponse<ServerDto>.Fail("Server not found.");

            // Only owner can update server
            if (server.OwnerId != userId)
                return ApiResponse<ServerDto>.Fail("Only the server owner can update server settings.");

            server.Name = updateServerDto.Name;
            if (updateServerDto.IconUrl != null)
            {
                server.IconUrl = updateServerDto.IconUrl;
            }

            await _serverRepository.UpdateAsync(server);
            await _serverRepository.SaveChangesAsync();

            return new ApiResponse<ServerDto>(new ServerDto
            {
                Id = server.Id,
                Name = server.Name,
                IconUrl = server.IconUrl,
                OwnerId = server.OwnerId
            });
        }

        public async Task<ApiResponse<string>> UploadServerIconAsync(Guid serverId, IFormFile file, Guid userId)
        {
            var server = await _serverRepository.GetByIdAsync(serverId);
            if (server == null) return ApiResponse<string>.Fail("Server not found.", code: 404);

            // Only owner can upload icon
            if (server.OwnerId != userId)
                return ApiResponse<string>.Fail("Only the server owner can change the server icon.", code: 403);

            if (file == null || file.Length == 0)
                return ApiResponse<string>.Fail("No file uploaded.");

            var storagePath = _configuration["FileStorage:BasePath"];
            var baseUrl = _configuration["FileStorage:BaseUrl"];

            if (string.IsNullOrEmpty(storagePath) || string.IsNullOrEmpty(baseUrl))
                return ApiResponse<string>.Fail("File storage not configured.");

            var serverIconsPath = Path.Combine(storagePath, "servers");
            if (!Directory.Exists(serverIconsPath))
                Directory.CreateDirectory(serverIconsPath);

            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = $"{serverId}_{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(serverIconsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Update server icon URL
            var iconUrl = $"{baseUrl}/servers/{fileName}";
            server.IconUrl = iconUrl;

            await _serverRepository.UpdateAsync(server);
            await _serverRepository.SaveChangesAsync();

            return new ApiResponse<string>(iconUrl, "Server icon uploaded successfully.");
        }

        public async Task<ApiResponse<bool>> DeleteServerAsync(Guid serverId)
        {
            var server = await _serverRepository.GetByIdAsync(serverId);
            if (server == null) return ApiResponse<bool>.Fail("Server not found.");

            await _serverRepository.DeleteAsync(server.Id);
            await _serverRepository.SaveChangesAsync();

            return new ApiResponse<bool>(true, "Server deleted successfully.");
        }

        public async Task<ApiResponse<bool>> RemoveMemberAsync(Guid serverId, Guid targetUserId, Guid requesterId)
        {
            var server = await _serverRepository.GetByIdAsync(serverId);
            if (server == null) return ApiResponse<bool>.Fail("Server not found.", code: 404);

            // Only owner can kick members
            if (server.OwnerId != requesterId)
                return ApiResponse<bool>.Fail("Only the server owner can remove members.", code: 403);

            // Cannot kick the owner
            if (targetUserId == server.OwnerId)
                return ApiResponse<bool>.Fail("Cannot remove the server owner.", code: 400);

            var members = await _serverMemberRepository.FindAsync(
                m => m.ServerId == serverId && m.UserId == targetUserId);

            var member = members.FirstOrDefault();
            if (member == null)
                return ApiResponse<bool>.Fail("Member not found.", code: 404);

            _serverMemberRepository.Delete(member);
            await _serverMemberRepository.SaveChangesAsync();

            return new ApiResponse<bool>(true, "Member removed successfully.");
        }

        public async Task<ApiResponse<bool>> LeaveServerAsync(Guid serverId, Guid userId)
        {
            var server = await _serverRepository.GetByIdAsync(serverId);
            if (server == null) return ApiResponse<bool>.Fail("Server not found.", code: 404);

            // Owner cannot leave, they must transfer ownership or delete the server
            if (server.OwnerId == userId)
                return ApiResponse<bool>.Fail("Server owner cannot leave the server.", code: 400);

            var members = await _serverMemberRepository.FindAsync(
                m => m.ServerId == serverId && m.UserId == userId);

            var member = members.FirstOrDefault();
            if (member == null)
                return ApiResponse<bool>.Fail("You are not a member of this server.", code: 400);

            _serverMemberRepository.Delete(member);
            await _serverMemberRepository.SaveChangesAsync();

            return new ApiResponse<bool>(true, "Successfully left the server.");
        }
    }
}

