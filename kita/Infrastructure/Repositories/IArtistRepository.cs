using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Domain.Entities;

namespace Kita.Infrastructure.Repositories
{
    public interface IArtistRepository : IBaseRepository<Artist>
    {
        Task<Artist?> GetByNameAsync(string name);
        Task<List<Artist>> GetByUserIdAsync(Guid userId);
        Task<Artist?> GetByIdWithSongsAsync(Guid id);
        Task<Artist?> GetByIdWithAlbumsAsync(Guid id);
    }
}
