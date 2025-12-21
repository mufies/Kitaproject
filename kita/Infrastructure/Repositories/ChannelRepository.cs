using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Domain.Entities.Server;
using Kita.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kita.Infrastructure.Repositories
{
    public class ChannelRepository : BaseRepository<Channel>, IChannelRepository
    {
        public ChannelRepository(KitaDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Channel>> GetChannelsByServerIdAsync(Guid serverId)
        {
            return await _dbSet
                .Where(c => c.ServerId == serverId)
                .ToListAsync();
        }

        public async Task<Channel?> GetChannelWithMessagesAsync(Guid channelId)
        {
            return await _dbSet
                .Include(c => c.Messages)
                    .ThenInclude(m => m.Sender)
                .FirstOrDefaultAsync(c => c.Id == channelId);
        }

        public async Task<Channel?> GetChannelWithPlaybackSessionAsync(Guid channelId)
        {
            return await _dbSet
                .Include(c => c.PlaybackSession)
                .FirstOrDefaultAsync(c => c.Id == channelId);
        }
    }
}
