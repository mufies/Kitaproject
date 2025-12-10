using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Domain.Entities;

namespace Kita.Infrastructure.Repositories
{
    public interface IUserRepository : IBaseRepository<User>
    {
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByUserNameAsync(string userName);
        Task<User?> GetWithPlaylistsAsync(Guid userId);
        Task<User?> GetWithServerMembershipsAsync(Guid userId);
        Task<List<User>> SearchUsersByNameAsync(string query);
        Task<bool> UsernameExistsAsync(string username);
    }
}
