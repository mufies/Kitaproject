using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kita.Domain.Entities.Music;
using Kita.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Kita.Infrastructure.Repositories
{
    public class PlaylistSongRepository : BaseRepository<PlaylistSong>, IPlaylistSongRepository
    {
        public PlaylistSongRepository(KitaDbContext context) : base(context)
        {
        }

        public async Task DeleteByCompositeKeyAsync(Guid playlistId, Guid songId)
        {
            var entity = await _dbSet
                .FirstOrDefaultAsync(x => x.PlaylistId == playlistId && x.SongId == songId);
            
            if (entity != null)
            {
                _dbSet.Remove(entity);
            }
            else
            {
                throw new KeyNotFoundException($"PlaylistSong with PlaylistId {playlistId} and SongId {songId} not found");
            }
        }
    }
}
