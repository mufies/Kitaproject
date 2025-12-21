using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Domain.Entities.Server;

namespace Kita.Infrastructure.Repositories
{
    public interface IChannelRepository : IBaseRepository<Channel>
    {
        Task<IEnumerable<Channel>> GetChannelsByServerIdAsync(Guid serverId);
        Task<Channel?> GetChannelWithMessagesAsync(Guid channelId);
        Task<Channel?> GetChannelWithPlaybackSessionAsync(Guid channelId);
    }
}
