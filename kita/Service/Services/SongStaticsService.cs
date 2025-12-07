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

        public async Task<ApiResponse<SongStaticsDto>> IncrementLikeCountAsync(Guid songId)
        {
            return await UpdateStatAsync(songId, ss => ss.LikeCount++);
        }

        public async Task<ApiResponse<SongStaticsDto>> IncrementDislikeCountAsync(Guid songId)
        {
            return await UpdateStatAsync(songId, ss => ss.DislikeCount++);
        }

        public async Task<ApiResponse<SongStaticsDto>> IncrementFavoriteCountAsync(Guid songId)
        {
            return await UpdateStatAsync(songId, ss => ss.FavoriteCount++);
        }

        public async Task<ApiResponse<SongStaticsDto>> IncrementShareCountAsync(Guid songId)
        {
            return await UpdateStatAsync(songId, ss => ss.ShareCount++);
        }

        public async Task<ApiResponse<SongStaticsDto>> DecrementLikeCountAsync(Guid songId)
        {
            return await UpdateStatAsync(songId, ss => ss.LikeCount = Math.Max(0, ss.LikeCount - 1));
        }

        public async Task<ApiResponse<SongStaticsDto>> DecrementDislikeCountAsync(Guid songId)
        {
            return await UpdateStatAsync(songId, ss => ss.DislikeCount = Math.Max(0, ss.DislikeCount - 1));
        }

        public async Task<ApiResponse<SongStaticsDto>> DecrementFavoriteCountAsync(Guid songId)
        {
            return await UpdateStatAsync(songId, ss => ss.FavoriteCount = Math.Max(0, ss.FavoriteCount - 1));
        }

        private async Task<ApiResponse<SongStaticsDto>> UpdateStatAsync(Guid songId, Action<SongStatics> updateAction)
        {
            var songStatics = await _songStaticsRepository.GetSongStaticsAsync(songId);
            
            if (songStatics == null)
            {
                var getResponse = await GetSongStaticsAsync(songId);
                if (!getResponse.Success)
                {
                    return getResponse;
                }
                songStatics = await _songStaticsRepository.GetSongStaticsAsync(songId);
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
