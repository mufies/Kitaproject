using System.Threading.Tasks;
using Kita.Domain.Entities.Music;

namespace Kita.Infrastructure.Repositories
{
    public interface ISongRepository : IBaseRepository<Song>
    {
        Task<Song?> GetByNameAndArtistAsync(string name, string artist);
    }
}
