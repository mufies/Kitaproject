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
        private readonly IRepository<Channel> _channelRepository;

        public ChannelService(IRepository<Channel> channelRepository)
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

            return new ApiResponse<ChannelDto>(new ChannelDto
            {
                Id = channel.Id,
                Name = channel.Name,
                Type = channel.Type,
                ServerId = channel.ServerId
            });
        }

        public async Task<ApiResponse<List<ChannelDto>>> GetServerChannelsAsync(Guid serverId)
        {
            var channels = await _channelRepository.FindAsync(c => c.ServerId == serverId);
            var channelDtos = channels.Select(c => new ChannelDto
            {
                Id = c.Id,
                Name = c.Name,
                Type = c.Type,
                ServerId = c.ServerId
            }).ToList();

            return new ApiResponse<List<ChannelDto>>(channelDtos);
        }


    }
}
