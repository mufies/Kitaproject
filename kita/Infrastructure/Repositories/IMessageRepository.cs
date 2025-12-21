using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Domain.Entities.Server;

namespace Kita.Infrastructure.Repositories
{
    public interface IMessageRepository : IBaseRepository<Message>
    {
        Task<IEnumerable<Message>> GetMessagesByChannelIdAsync(Guid channelId, int take = 50, int skip = 0);
        Task<Message?> GetMessageWithSenderAsync(Guid messageId);
        Task DeleteAllMessagesAsync(Guid channelId);
    }
}
