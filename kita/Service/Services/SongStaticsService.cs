using Domain.Entities.Music;
using Infrastructure.Repositories;
using Kita.Infrastructure.Repositories;
using Kita.Service.Common;
using Kita.Service.DTOs.Music;
using Kita.Service.Interfaces;
using Service.DTOs.Music;

namespace Kita.Service.Services
{
    public class SongStaticsService : ISongStaticsService
    {
        private readonly ISongStaticsRepository _songStaticsRepository;
        private readonly ISongRepository _songRepository;

        public SongStaticsService(ISongStaticsRepository songStaticsRepository, ISongRepository songRepository)
        {
            _songStaticsRepository = songStaticsRepository;
            _songRepository = songRepository;
        }

        public async Task<ApiResponse<SongStaticsDto>> GetSongStaticsAsync(Guid songId)
        {
            var songStatics = await _songStaticsRepository.GetSongStaticsAsync(songId);
            
            if (songStatics == null)
            {
                // Create default stats if not exists
                var song = await _songRepository.GetByIdAsync(songId);
                if (song == null)
                {
                    return ApiResponse<SongStaticsDto>.Fail("Song not found", null, 404);
                }

                songStatics = new SongStatics
                {
                    SongId = songId,
                    PlayCount = 0,
                    LikeCount = 0,
                    DislikeCount = 0,
                    FavoriteCount = 0,
                    ShareCount = 0,
                    UserId = song.UserId,
                    CreatedAt = DateTime.UtcNow
                };

                await _songStaticsRepository.CreateSongStaticsAsync(songStatics);
            }

            var dto = MapToDto(songStatics);
            return new ApiResponse<SongStaticsDto>(dto);
        }

        public async Task<ApiResponse<SongStaticsDto>> IncrementPlayCountAsync(Guid songId)
        {
            return await UpdateStatAsync(songId, ss => ss.PlayCount++);
        }

        public async Task<ApiResponse<SongStaticsDto>> IncrementLikeCountAsync(Guid songId, Guid userId)
        {
            var songStatics = await GetOrCreateSongStaticsAsync(songId);
            if (songStatics == null)
            {
                return ApiResponse<SongStaticsDto>.Fail("Song not found", null, 404);
            }

            // Check if user already liked
            if (songStatics.LikedByUserIds.Contains(userId))
            {
                return ApiResponse<SongStaticsDto>.Fail("User already liked this song", null, 400);
            }

            // If user disliked, remove dislike first
            if (songStatics.DislikedByUserIds.Contains(userId))
            {
                songStatics.DislikedByUserIds.Remove(userId);
                songStatics.DislikeCount = Math.Max(0, songStatics.DislikeCount - 1);
            }

            songStatics.LikedByUserIds.Add(userId);
            songStatics.LikeCount++;
            await _songStaticsRepository.UpdateSongStaticsAsync(songId, songStatics);

            return new ApiResponse<SongStaticsDto>(MapToDto(songStatics));
        }

        public async Task<ApiResponse<SongStaticsDto>> IncrementDislikeCountAsync(Guid songId, Guid userId)
        {
            var songStatics = await GetOrCreateSongStaticsAsync(songId);
            if (songStatics == null)
            {
                return ApiResponse<SongStaticsDto>.Fail("Song not found", null, 404);
            }

            // Check if user already disliked
            if (songStatics.DislikedByUserIds.Contains(userId))
            {
                return ApiResponse<SongStaticsDto>.Fail("User already disliked this song", null, 400);
            }

            // If user liked, remove like first
            if (songStatics.LikedByUserIds.Contains(userId))
            {
                songStatics.LikedByUserIds.Remove(userId);
                songStatics.LikeCount = Math.Max(0, songStatics.LikeCount - 1);
            }

            songStatics.DislikedByUserIds.Add(userId);
            songStatics.DislikeCount++;
            await _songStaticsRepository.UpdateSongStaticsAsync(songId, songStatics);

            return new ApiResponse<SongStaticsDto>(MapToDto(songStatics));
        }

        public async Task<ApiResponse<SongStaticsDto>> IncrementFavoriteCountAsync(Guid songId, Guid userId)
        {
            var songStatics = await GetOrCreateSongStaticsAsync(songId);
            if (songStatics == null)
            {
                return ApiResponse<SongStaticsDto>.Fail("Song not found", null, 404);
            }

            // Check if user already favorited
            if (songStatics.FavoritedByUserIds.Contains(userId))
            {
                return ApiResponse<SongStaticsDto>.Fail("User already favorited this song", null, 400);
            }

            songStatics.FavoritedByUserIds.Add(userId);
            songStatics.FavoriteCount++;
            await _songStaticsRepository.UpdateSongStaticsAsync(songId, songStatics);

            return new ApiResponse<SongStaticsDto>(MapToDto(songStatics));
        }

        public async Task<ApiResponse<SongStaticsDto>> IncrementShareCountAsync(Guid songId)
        {
            return await UpdateStatAsync(songId, ss => ss.ShareCount++);
        }

        public async Task<ApiResponse<SongStaticsDto>> DecrementLikeCountAsync(Guid songId, Guid userId)
        {
            var songStatics = await GetOrCreateSongStaticsAsync(songId);
            if (songStatics == null)
            {
                return ApiResponse<SongStaticsDto>.Fail("Song not found", null, 404);
            }

            // Check if user actually liked
            if (!songStatics.LikedByUserIds.Contains(userId))
            {
                return ApiResponse<SongStaticsDto>.Fail("User has not liked this song", null, 400);
            }

            songStatics.LikedByUserIds.Remove(userId);
            songStatics.LikeCount = Math.Max(0, songStatics.LikeCount - 1);
            await _songStaticsRepository.UpdateSongStaticsAsync(songId, songStatics);

            return new ApiResponse<SongStaticsDto>(MapToDto(songStatics));
        }

        public async Task<ApiResponse<SongStaticsDto>> DecrementDislikeCountAsync(Guid songId, Guid userId)
        {
            var songStatics = await GetOrCreateSongStaticsAsync(songId);
            if (songStatics == null)
            {
                return ApiResponse<SongStaticsDto>.Fail("Song not found", null, 404);
            }

            // Check if user actually disliked
            if (!songStatics.DislikedByUserIds.Contains(userId))
            {
                return ApiResponse<SongStaticsDto>.Fail("User has not disliked this song", null, 400);
            }

            songStatics.DislikedByUserIds.Remove(userId);
            songStatics.DislikeCount = Math.Max(0, songStatics.DislikeCount - 1);
            await _songStaticsRepository.UpdateSongStaticsAsync(songId, songStatics);

            return new ApiResponse<SongStaticsDto>(MapToDto(songStatics));
        }

        public async Task<ApiResponse<SongStaticsDto>> DecrementFavoriteCountAsync(Guid songId, Guid userId)
        {
            var songStatics = await GetOrCreateSongStaticsAsync(songId);
            if (songStatics == null)
            {
                return ApiResponse<SongStaticsDto>.Fail("Song not found", null, 404);
            }

            // Check if user actually favorited
            if (!songStatics.FavoritedByUserIds.Contains(userId))
            {
                return ApiResponse<SongStaticsDto>.Fail("User has not favorited this song", null, 400);
            }

            songStatics.FavoritedByUserIds.Remove(userId);
            songStatics.FavoriteCount = Math.Max(0, songStatics.FavoriteCount - 1);
            await _songStaticsRepository.UpdateSongStaticsAsync(songId, songStatics);

            return new ApiResponse<SongStaticsDto>(MapToDto(songStatics));
        }

        public async Task<bool> HasUserLikedSongAsync(Guid songId, Guid userId)
        {
            var songStatics = await _songStaticsRepository.GetSongStaticsAsync(songId);
            return songStatics?.LikedByUserIds.Contains(userId) ?? false;
        }

        public async Task<bool> HasUserDislikedSongAsync(Guid songId, Guid userId)
        {
            var songStatics = await _songStaticsRepository.GetSongStaticsAsync(songId);
            return songStatics?.DislikedByUserIds.Contains(userId) ?? false;
        }

        public async Task<bool> HasUserFavoritedSongAsync(Guid songId, Guid userId)
        {
            var songStatics = await _songStaticsRepository.GetSongStaticsAsync(songId);
            return songStatics?.FavoritedByUserIds.Contains(userId) ?? false;
        }

        private async Task<SongStatics?> GetOrCreateSongStaticsAsync(Guid songId)
        {
            var songStatics = await _songStaticsRepository.GetSongStaticsAsync(songId);
            
            if (songStatics == null)
            {
                var song = await _songRepository.GetByIdAsync(songId);
                if (song == null)
                {
                    return null;
                }

                songStatics = new SongStatics
                {
                    SongId = songId,
                    PlayCount = 0,
                    LikeCount = 0,
                    DislikeCount = 0,
                    FavoriteCount = 0,
                    ShareCount = 0,
                    UserId = song.UserId,
                    CreatedAt = DateTime.UtcNow
                };

                await _songStaticsRepository.CreateSongStaticsAsync(songStatics);
            }

            return songStatics;
        }

        private async Task<ApiResponse<SongStaticsDto>> UpdateStatAsync(Guid songId, Action<SongStatics> updateAction)
        {
            var songStatics = await GetOrCreateSongStaticsAsync(songId);
            if (songStatics == null)
            {
                return ApiResponse<SongStaticsDto>.Fail("Song not found", null, 404);
            }

            updateAction(songStatics!);
            await _songStaticsRepository.UpdateSongStaticsAsync(songId, songStatics!);

            var dto = MapToDto(songStatics!);
            return new ApiResponse<SongStaticsDto>(dto);
        }

        private SongStaticsDto MapToDto(SongStatics songStatics)
        {
            return new SongStaticsDto
            {
                Id = songStatics.Id,
                SongId = songStatics.SongId,
                PlayCount = songStatics.PlayCount,
                LikeCount = songStatics.LikeCount,
                DislikeCount = songStatics.DislikeCount,
                FavoriteCount = songStatics.FavoriteCount,
                ShareCount = songStatics.ShareCount,
                Comments = songStatics.Comments.Select(c => new CommentDto
                {
                    Id = c.Id,
                    SongId = c.SongId,
                    UserId = c.UserId,
                    Content = c.Content,
                    UserName = c.User?.UserName,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                }).ToList(),
                CreatedAt = songStatics.CreatedAt,
                UpdatedAt = songStatics.UpdatedAt,
                SongTitle = songStatics.Song?.Title,
                ArtistName = songStatics.Song?.Artist
            };
        }
    }
}
