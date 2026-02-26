using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Domain.Entities.Server;
using Kita.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kita.Infrastructure.Repositories
{
    public class MessageRepository : BaseRepository<Message>, IMessageRepository
    {
        public MessageRepository(KitaDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Message>> GetMessagesByChannelIdAsync(Guid channelId, int take = 50, int skip = 0)
        {
            return await _dbSet
                .Include(m => m.Sender)
                .Include(m => m.MessageReactions)
                .Where(m => m.ChannelId == channelId)
                .OrderByDescending(m => m.SentAt)
                .Skip(skip)
                .Take(take)
                .OrderBy(m => m.SentAt)
                .ToListAsync();
        }

        public async Task<Message?> GetMessageWithSenderAsync(Guid messageId)
        {
            // Detach any tracked instances to ensure fresh data
            var tracked = _context.ChangeTracker.Entries<Message>()
                .FirstOrDefault(e => e.Entity.Id == messageId);
            if (tracked != null)
            {
                tracked.State = Microsoft.EntityFrameworkCore.EntityState.Detached;
            }

            return await _dbSet
                .Include(m => m.Sender)
                .Include(m => m.MessageReactions)
                .FirstOrDefaultAsync(m => m.Id == messageId);
        }

        public async Task DeleteAllMessagesAsync(Guid channelId)
        {
            var messages = await _dbSet.Where(m => m.ChannelId == channelId).ToListAsync();
            _dbSet.RemoveRange(messages);
        }
    }
}
