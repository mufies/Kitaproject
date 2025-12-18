using Domain.Entities.Music;
using Kita.Infrastructure.Repositories;
using Kita.Service.Common;
using Kita.Service.DTOs.Music;
using Kita.Service.Interfaces;
using Service.DTOs.Music;

namespace Kita.Service.Services
{
    public class ListenHistoryService : IListenHistoryService
    {
        private readonly IListenHistoryRepository _listenHistoryRepository;
        private readonly ISongRepository _songRepository;

        public ListenHistoryService(IListenHistoryRepository listenHistoryRepository, ISongRepository songRepository)
        {
            _listenHistoryRepository = listenHistoryRepository;
            _songRepository = songRepository;
        }

        public async Task<ApiResponse<ListenHistoryDto>> AddToHistoryAsync(Guid userId, Guid songId, int? msPlayed = null)
        {
            // Verify song exists
            var song = await _songRepository.GetByIdAsync(songId);
            if (song == null)
            {
                return ApiResponse<ListenHistoryDto>.Fail("Song not found", null, 404);
            }

            var listenHistory = new ListenHistory
            {
                UserId = userId,
                SongId = songId,
                MsPlayed = msPlayed,
                CreatedAt = DateTime.UtcNow
            };

            await _listenHistoryRepository.AddAsync(listenHistory);

            var dto = MapToDto(listenHistory, song);
            return new ApiResponse<ListenHistoryDto>(dto);
        }

        public async Task<ApiResponse<List<ListenHistoryDto>>> GetUserHistoryAsync(Guid userId, int limit = 50)
        {
            var history = await _listenHistoryRepository.GetUserListenHistoryAsync(userId, limit);
            var dtos = history.Select(h => MapToDto(h, h.Song)).ToList();
            return new ApiResponse<List<ListenHistoryDto>>(dtos);
        }

        public async Task<ApiResponse<List<ListenHistoryDto>>> GetRecentlyPlayedAsync(Guid userId, int limit = 20)
        {
            var history = await _listenHistoryRepository.GetRecentlyPlayedAsync(userId, limit);
            var dtos = history.Select(h => MapToDto(h, h.Song)).ToList();
            return new ApiResponse<List<ListenHistoryDto>>(dtos);
        }

        public async Task<ApiResponse<ListenHistoryStatsDto>> GetUserListenStatsAsync(Guid userId)
        {
            var totalCount = await _listenHistoryRepository.GetTotalListenCountAsync(userId);
            var totalTimeMs = await _listenHistoryRepository.GetTotalListenTimeAsync(userId);
            var history = await _listenHistoryRepository.GetUserListenHistoryAsync(userId, 1000);

            // Calculate unique songs
            var uniqueSongs = history.Select(h => h.SongId).Distinct().Count();

            // Find most played song
            var mostPlayedSongId = history
                .GroupBy(h => h.SongId)
                .OrderByDescending(g => g.Count())
                .FirstOrDefault()?.Key;

            SongDto? mostPlayedSong = null;
            if (mostPlayedSongId.HasValue)
            {
                var song = await _songRepository.GetByIdAsync(mostPlayedSongId.Value);
                if (song != null)
                {
                    mostPlayedSong = new SongDto
                    {
                        Id = song.Id,
                        Title = song.Title,
                        Artist = song.Artist?.Name ?? string.Empty,
                        Album = song.Album?.Name,
                        CoverUrl = song.CoverUrl
                    };
                }
            }

            // Find favorite artist
            var favoriteArtist = history
                .Where(h => h.Song?.Artist != null)
                .GroupBy(h => h.Song.Artist!.Name)
                .OrderByDescending(g => g.Count())
                .FirstOrDefault()?.Key;

            // Find favorite genre
            var favoriteGenre = history
                .Where(h => h.Song?.Genres != null && h.Song.Genres.Any())
                .SelectMany(h => h.Song.Genres!)
                .GroupBy(g => g)
                .OrderByDescending(g => g.Count())
                .FirstOrDefault()?.Key.ToString();

            // Format total time
            var timeSpan = TimeSpan.FromMilliseconds(totalTimeMs);
            var formattedTime = timeSpan.TotalHours >= 1
                ? $"{(int)timeSpan.TotalHours}h {timeSpan.Minutes}m"
                : $"{timeSpan.Minutes}m {timeSpan.Seconds}s";

            var stats = new ListenHistoryStatsDto
            {
                UserId = userId,
                TotalListenCount = totalCount,
                TotalListenTimeMs = totalTimeMs,
                TotalListenTimeFormatted = formattedTime,
                UniqueSongsListened = uniqueSongs,
                MostPlayedSong = mostPlayedSong,
                FavoriteArtist = favoriteArtist,
                FavoriteGenre = favoriteGenre
            };

            return new ApiResponse<ListenHistoryStatsDto>(stats);
        }

        public async Task<ApiResponse<bool>> ClearHistoryAsync(Guid userId)
        {
            await _listenHistoryRepository.ClearUserHistoryAsync(userId);
            return new ApiResponse<bool>(true);
        }

        public async Task<ApiResponse<List<ListenHistoryDto>>> GetHistoryByDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate)
        {
            var history = await _listenHistoryRepository.GetUserListenHistoryByDateRangeAsync(userId, startDate, endDate);
            var dtos = history.Select(h => MapToDto(h, h.Song)).ToList();
            return new ApiResponse<List<ListenHistoryDto>>(dtos);
        }

        public async Task<ApiResponse<ListenHistoryDto>> UpdateListenDurationAsync(Guid historyId, int msPlayed)
        {
            var history = await _listenHistoryRepository.GetByIdAsync(historyId);
            if (history == null)
            {
                return ApiResponse<ListenHistoryDto>.Fail("Listen history record not found", null, 404);
            }

            history.MsPlayed = msPlayed;
            history.UpdatedAt = DateTime.UtcNow;
            await _listenHistoryRepository.UpdateAsync(history);

            var song = await _songRepository.GetByIdAsync(history.SongId);
            var dto = MapToDto(history, song);
            return new ApiResponse<ListenHistoryDto>(dto);
        }

        private ListenHistoryDto MapToDto(ListenHistory history, Kita.Domain.Entities.Music.Song? song)
        {
            return new ListenHistoryDto
            {
                Id = history.Id,
                SongId = history.SongId,
                UserId = history.UserId,
                MsPlayed = history.MsPlayed,
                CreatedAt = history.CreatedAt,
                UpdatedAt = history.UpdatedAt,
                SongTitle = song?.Title,
                UserName = history.User?.UserName
            };
        }
    }
}
