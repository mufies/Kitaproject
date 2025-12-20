using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Domain.Entities;

namespace Kita.Infrastructure.Repositories
{
    public interface IArtistRepository : IBaseRepository<Artist>
    {
        Task<Artist> GetByIdAsync(Guid id);
        Task<Artist?> GetByNameAsync(string name);
        Task<List<Artist>> GetByUserIdAsync(Guid userId);
        Task<Artist?> GetByIdWithSongsAsync(Guid id);
        Task<Artist?> GetByIdWithAlbumsAsync(Guid id);
        Task<Artist?> GetByIdWithFollowersAsync(Guid id);
        Task<List<Artist>> GetFollowedArtistsByUserIdAsync(Guid userId);
    }
}
