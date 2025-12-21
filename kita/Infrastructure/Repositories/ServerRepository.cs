using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Domain.Entities.Server;
using Kita.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kita.Infrastructure.Repositories
{
    public class ServerRepository : BaseRepository<Server>, IServerRepository
    {
        public ServerRepository(KitaDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Server>> GetServersByOwnerIdAsync(Guid ownerId)
        {
            return await _dbSet
                .Include(s => s.Owner)
                .Where(s => s.OwnerId == ownerId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Server>> GetServersByMemberIdAsync(Guid userId)
        {
            return await _context.ServerMembers
                .Where(sm => sm.UserId == userId)
                .Include(sm => sm.Server)
                    .ThenInclude(s => s.Owner)
                .Select(sm => sm.Server)
                .ToListAsync();
        }

        public async Task<Server?> GetServerWithChannelsAsync(Guid serverId)
        {
            return await _dbSet
                .Include(s => s.Channels)
                .Include(s => s.Owner)
                .FirstOrDefaultAsync(s => s.Id == serverId);
        }

        public async Task<Server?> GetServerWithMembersAsync(Guid serverId)
        {
            return await _dbSet
                .Include(s => s.Members)
                    .ThenInclude(m => m.User)
                .Include(s => s.Owner)
                .FirstOrDefaultAsync(s => s.Id == serverId);
        }

        public async Task<Server?> GetServerWithDetailsAsync(Guid serverId)
        {
            return await _dbSet
                .Include(s => s.Owner)
                .Include(s => s.Channels)
                .Include(s => s.Members)
                    .ThenInclude(m => m.User)
                .Include(s => s.Invites)
                .FirstOrDefaultAsync(s => s.Id == serverId);
        }
    }
}
