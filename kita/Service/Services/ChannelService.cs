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
    public class ChannelService : IChannelService
    {
        private readonly IChannelRepository _channelRepository;

        public ChannelService(IChannelRepository channelRepository)
        {
            _channelRepository = channelRepository;
        }

        public async Task<ApiResponse<ChannelDto>> CreateChannelAsync(CreateChannelDto createChannelDto)
        {
            var channel = new Channel
            {
                Name = createChannelDto.Name,
                Type = createChannelDto.Type,
                ServerId = createChannelDto.ServerId
            };

            await _channelRepository.AddAsync(channel);
            await _channelRepository.SaveChangesAsync();

            return new ApiResponse<ChannelDto>(MapToDto(channel));
        }

        public async Task<ApiResponse<List<ChannelDto>>> GetServerChannelsAsync(Guid serverId)
        {
            var channels = await _channelRepository.GetChannelsByServerIdAsync(serverId);
            var channelDtos = channels.Select(MapToDto).ToList();

            return new ApiResponse<List<ChannelDto>>(channelDtos);
        }

        public async Task<ApiResponse<ChannelDto>> GetChannelByIdAsync(Guid channelId)
        {
            var channel = await _channelRepository.GetByIdAsync(channelId);
            if (channel == null)
                return ApiResponse<ChannelDto>.Fail("Channel not found.");

            return new ApiResponse<ChannelDto>(MapToDto(channel));
        }

        public async Task<ApiResponse<ChannelDto>> UpdateChannelAsync(Guid channelId, UpdateChannelDto updateChannelDto)
        {
            var channel = await _channelRepository.GetByIdAsync(channelId);
            if (channel == null)
                return ApiResponse<ChannelDto>.Fail("Channel not found.");

            channel.Name = updateChannelDto.Name;
            
            await _channelRepository.UpdateAsync(channel);
            await _channelRepository.SaveChangesAsync();

            return new ApiResponse<ChannelDto>(MapToDto(channel));
        }

        public async Task<ApiResponse<bool>> DeleteChannelAsync(Guid channelId)
        {
            var channel = await _channelRepository.GetByIdAsync(channelId);
            if (channel == null)
                return ApiResponse<bool>.Fail("Channel not found.");

            await _channelRepository.DeleteAsync(channelId);
            await _channelRepository.SaveChangesAsync();

            return new ApiResponse<bool>(true, "Channel deleted successfully.");
        }

        private static ChannelDto MapToDto(Channel channel)
        {
            return new ChannelDto
            {
                Id = channel.Id,
                Name = channel.Name,
                Type = channel.Type,
                ServerId = channel.ServerId
            };
        }
    }
}
