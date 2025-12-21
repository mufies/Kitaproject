using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Domain.Entities.Server;

namespace Kita.Infrastructure.Repositories
{
    public interface IServerRepository : IBaseRepository<Server>
    {
        Task<IEnumerable<Server>> GetServersByOwnerIdAsync(Guid ownerId);
        Task<IEnumerable<Server>> GetServersByMemberIdAsync(Guid userId);
        Task<Server?> GetServerWithChannelsAsync(Guid serverId);
        Task<Server?> GetServerWithMembersAsync(Guid serverId);
        Task<Server?> GetServerWithDetailsAsync(Guid serverId);
    }
}
