using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kita.Domain.Entities;
using Kita.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kita.Infrastructure.Repositories
{
    public class UserRepository : BaseRepository<User>, IUserRepository
    {
        public UserRepository(KitaDbContext context) : base(context)
        {
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _dbSet.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> GetByUserNameAsync(string userName)
        {
            return await _dbSet.FirstOrDefaultAsync(u => u.UserName == userName);
        }

        public async Task<User?> GetWithPlaylistsAsync(Guid userId)
        {
            return await _dbSet
                .Include(u => u.Playlists)
                .FirstOrDefaultAsync(u => u.Id == userId);
        }

        public async Task<User?> GetWithServerMembershipsAsync(Guid userId)
        {
            return await _dbSet
                .Include(u => u.ServerMemberships)
                    .ThenInclude(sm => sm.Server)
                .FirstOrDefaultAsync(u => u.Id == userId);
        }

        public async Task<List<User>> SearchUsersByNameAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return new List<User>();

            var lowerQuery = query.ToLower();
            return await _dbSet
                .Where(u => u.UserName.ToLower().Contains(lowerQuery))
                .Take(20)
                .ToListAsync();
        }

        public async Task<bool> UsernameExistsAsync(string username)
        {
            return await _dbSet.AnyAsync(u => u.UserName == username);
        }
    }
}
