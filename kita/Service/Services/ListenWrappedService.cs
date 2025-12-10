using Domain.Entities.Music;
using Kita.Infrastructure.Repositories;
using Kita.Service.Interfaces;

namespace Kita.Service.Services
{
    public class ListenWrappedService : IListenWrappedService
    {
        private readonly IListenWrappedRepository _wrappedRepository;

        public ListenWrappedService(IListenWrappedRepository wrappedRepository)
        {
            _wrappedRepository = wrappedRepository;
        }

        public async Task<List<ListenWrapped>> GetUserWrappedByYearAsync(Guid userId, int year)
        {
            return await _wrappedRepository.GetUserWrappedByYearAsync(userId, year);
        }

        public async Task<List<ListenWrapped>> GetTopSongsByYearAsync(Guid userId, int year, int limit = 5)
        {
            return await _wrappedRepository.GetTopSongsByYearAsync(userId, year, limit);
        }

        public async Task<Dictionary<string, int>> GetTopArtistsByYearAsync(Guid userId, int year, int limit = 5)
        {
            return await _wrappedRepository.GetTopArtistsByYearAsync(userId, year, limit);
        }

        public async Task<Dictionary<string, int>> GetTopGenresByYearAsync(Guid userId, int year, int limit = 5)
        {
            return await _wrappedRepository.GetTopGenresByYearAsync(userId, year, limit);
        }

        public async Task<long> GetTotalListenTimeByYearAsync(Guid userId, int year)
        {
            return await _wrappedRepository.GetTotalListenTimeByYearAsync(userId, year);
        }

        public async Task<int> GetTotalSongsPlayedByYearAsync(Guid userId, int year)
        {
            return await _wrappedRepository.GetTotalSongsPlayedByYearAsync(userId, year);
        }

        public async Task<ListenWrapped?> GetOrCreateWrappedEntryAsync(Guid userId, Guid songId, int year)
        {
            return await _wrappedRepository.GetOrCreateWrappedEntryAsync(userId, songId, year);
        }

        public async Task UpdateWrappedEntryAsync(ListenWrapped wrapped)
        {
            await _wrappedRepository.UpdateWrappedEntryAsync(wrapped);
        }
    }
}
