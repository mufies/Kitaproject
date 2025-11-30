using Kita.Domain.Entities.Music;
using Kita.Infrastructure.Repositories;
using Kita.Service.Common;
using Kita.Service.DTOs.Music;
using Kita.Service.Interfaces;

namespace Kita.Service.Services
{
    public class PlaylistService : IPlaylistService
    {
        private readonly IRepository<Playlist> _playlistRepository;
        private readonly IRepository<Song> _songRepository;
        private readonly IRepository<PlaylistSong> _playlistSongRepository;

        public PlaylistService(
            IRepository<Playlist> playlistRepository, 
            IRepository<Song> songRepository, 
            IRepository<PlaylistSong> playlistSongRepository)
        {
            _playlistRepository = playlistRepository;
            _songRepository = songRepository;
            _playlistSongRepository = playlistSongRepository;
        }

        // Create Playlist
        public async Task<ApiResponse<PlaylistDto>> CreatePlaylistAsync(CreatePlaylistDto createPlaylistDto, Guid ownerId)
        {
            var playlist = new Playlist
            {
                Name = createPlaylistDto.Name,
                Description = createPlaylistDto.Description,
                IsPublic = createPlaylistDto.IsPublic,
                OwnerId = ownerId
            };

            await _playlistRepository.AddAsync(playlist);
            await _playlistRepository.SaveChangesAsync();

            return new ApiResponse<PlaylistDto>(new PlaylistDto
            {
                Id = playlist.Id,
                Name = playlist.Name,
                Description = playlist.Description,
                IsPublic = playlist.IsPublic,
                OwnerId = playlist.OwnerId,
                Songs = new List<SongDto>()
            }, "Playlist created successfully.");
        }

        // Add Song to Playlist
        public async Task<ApiResponse<PlaylistDto>> AddSongToPlaylistAsync(Guid playlistId, Guid songId)
        {
            var playlist = await _playlistRepository.GetByIdAsync(playlistId);
            if (playlist == null) return ApiResponse<PlaylistDto>.Fail("Playlist not found.");

            var song = await _songRepository.GetByIdAsync(songId);
            if (song == null) return ApiResponse<PlaylistDto>.Fail("Song not found.");

            var existing = await _playlistSongRepository.FindAsync(ps => ps.PlaylistId == playlistId && ps.SongId == songId);
            if (existing.Any()) return ApiResponse<PlaylistDto>.Fail("Song already in playlist.");

            // Get current max order index
            var playlistSongs = await _playlistSongRepository.FindAsync(ps => ps.PlaylistId == playlistId);
            var maxOrder = playlistSongs.Any() ? playlistSongs.Max(ps => ps.OrderIndex) : -1;

            var playlistSong = new PlaylistSong
            {
                PlaylistId = playlistId,
                SongId = songId,
                OrderIndex = maxOrder + 1
            };

            await _playlistSongRepository.AddAsync(playlistSong);
            await _playlistSongRepository.SaveChangesAsync();

            return new ApiResponse<PlaylistDto>(new PlaylistDto
            {
                Id = playlist.Id,
                Name = playlist.Name,
                Description = playlist.Description,
                IsPublic = playlist.IsPublic,
                OwnerId = playlist.OwnerId
            }, "Song added to playlist.");
        }

        // Remove Song from Playlist
        public async Task<ApiResponse<PlaylistDto>> RemoveSongFromPlaylistAsync(Guid playlistId, Guid songId)
        {
            var playlist = await _playlistRepository.GetByIdAsync(playlistId);
            if (playlist == null) return ApiResponse<PlaylistDto>.Fail("Playlist not found.");

            var playlistSong = await _playlistSongRepository.FindAsync(ps => ps.PlaylistId == playlistId && ps.SongId == songId);
            var songToRemove = playlistSong.FirstOrDefault();
            
            if (songToRemove == null) return ApiResponse<PlaylistDto>.Fail("Song not found in playlist.");

            await _playlistSongRepository.DeleteAsync(songToRemove.Id);
            await _playlistSongRepository.SaveChangesAsync();

            return new ApiResponse<PlaylistDto>(new PlaylistDto
            {
                Id = playlist.Id,
                Name = playlist.Name,
                Description = playlist.Description,
                IsPublic = playlist.IsPublic,
                OwnerId = playlist.OwnerId
            }, "Song removed from playlist.");
        }

        // Update Playlist
        public async Task<ApiResponse<PlaylistDto>> UpdatePlaylistAsync(Guid playlistId, PlaylistDto updatePlaylistDto)
        {
            var playlist = await _playlistRepository.GetByIdAsync(playlistId);
            if (playlist == null) return ApiResponse<PlaylistDto>.Fail("Playlist not found.");

            playlist.Name = updatePlaylistDto.Name;
            playlist.Description = updatePlaylistDto.Description;
            playlist.IsPublic = updatePlaylistDto.IsPublic;

            await _playlistRepository.UpdateAsync(playlist);
            await _playlistRepository.SaveChangesAsync();

            return new ApiResponse<PlaylistDto>(new PlaylistDto
            {
                Id = playlist.Id,
                Name = playlist.Name,
                Description = playlist.Description,
                IsPublic = playlist.IsPublic,
                OwnerId = playlist.OwnerId
            }, "Playlist updated successfully.");
        }

        // Delete Playlist
        public async Task<ApiResponse<PlaylistDto>> DeletePlaylistAsync(Guid playlistId)
        {
            var playlist = await _playlistRepository.GetByIdAsync(playlistId);
            if (playlist == null) return ApiResponse<PlaylistDto>.Fail("Playlist not found.");

            // Delete all playlist songs first
            var playlistSongs = await _playlistSongRepository.FindAsync(ps => ps.PlaylistId == playlistId);
            foreach (var ps in playlistSongs)
            {
                await _playlistSongRepository.DeleteAsync(ps.Id);
            }

            await _playlistRepository.DeleteAsync(playlist.Id);
            await _playlistRepository.SaveChangesAsync();

            return new ApiResponse<PlaylistDto>(null!, "Playlist deleted successfully.");
        }

        // Get Playlist by ID with Songs
        public async Task<ApiResponse<PlaylistDto>> GetPlaylistByIdAsync(Guid playlistId)
        {
            var playlist = await _playlistRepository.GetByIdAsync(playlistId);
            if (playlist == null) return ApiResponse<PlaylistDto>.Fail("Playlist not found.");

            var playlistSongs = await _playlistSongRepository.FindAsync(ps => ps.PlaylistId == playlistId);
            var songIds = playlistSongs.Select(ps => ps.SongId).ToList();
            
            var songs = await _songRepository.FindAsync(s => songIds.Contains(s.Id));
            
            var songDtos = playlistSongs
                .OrderBy(ps => ps.OrderIndex)
                .Select(ps =>
                {
                    var song = songs.FirstOrDefault(s => s.Id == ps.SongId);
                    return song != null ? new SongDto
                    {
                        Id = song.Id,
                        Title = song.Title,
                        Artist = song.Artist,
                        Album = song.Album,
                        Duration = song.Duration,
                        StreamUrl = song.StreamUrl,
                        CoverUrl = song.CoverUrl
                    } : null!;
                })
                .Where(s => s != null)
                .Cast<SongDto>()
                .ToList();

            return new ApiResponse<PlaylistDto>(new PlaylistDto
            {
                Id = playlist.Id,
                Name = playlist.Name,
                Description = playlist.Description,
                IsPublic = playlist.IsPublic,
                OwnerId = playlist.OwnerId,
                Songs = songDtos
            });
        }

        // Get All Playlists
        public async Task<ApiResponse<List<PlaylistDto>>> GetAllPlaylistsAsync()
        {
            var playlists = await _playlistRepository.GetAllAsync();
            var playlistDtos = playlists.Select(p => new PlaylistDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                IsPublic = p.IsPublic,
                OwnerId = p.OwnerId
            }).ToList();

            return new ApiResponse<List<PlaylistDto>>(playlistDtos);
        }

        // Get User Playlists
        public async Task<ApiResponse<List<PlaylistDto>>> GetUserPlaylistsAsync(Guid userId)
        {
            var playlists = await _playlistRepository.FindAsync(p => p.OwnerId == userId);
            var playlistDtos = playlists.Select(p => new PlaylistDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                IsPublic = p.IsPublic,
                OwnerId = p.OwnerId
            }).ToList();

            return new ApiResponse<List<PlaylistDto>>(playlistDtos);
        }

        // Get Playlists by User ID (alias for GetUserPlaylistsAsync)
        public async Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsByUserIdAsync(Guid userId)
        {
            return await GetUserPlaylistsAsync(userId);
        }

        // Get Playlists containing a specific Song
        public async Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsBySongIdAsync(Guid songId)
        {
            var playlistSongs = await _playlistSongRepository.FindAsync(ps => ps.SongId == songId);
            var playlistIds = playlistSongs.Select(ps => ps.PlaylistId).Distinct().ToList();

            var playlists = await _playlistRepository.FindAsync(p => playlistIds.Contains(p.Id));
            var playlistDtos = playlists.Select(p => new PlaylistDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                IsPublic = p.IsPublic,
                OwnerId = p.OwnerId
            }).ToList();

            return new ApiResponse<List<PlaylistDto>>(playlistDtos);
        }

        // Search Playlists by Name or Description
        public async Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsBySearchAsync(string search)
        {
            var searchLower = search.ToLower();
            var playlists = await _playlistRepository.FindAsync(p => 
                p.Name.ToLower().Contains(searchLower) || 
                (p.Description != null && p.Description.ToLower().Contains(searchLower)));

            var playlistDtos = playlists.Select(p => new PlaylistDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                IsPublic = p.IsPublic,
                OwnerId = p.OwnerId
            }).ToList();

            return new ApiResponse<List<PlaylistDto>>(playlistDtos);
        }

        // Get Playlists by Type (not implemented - placeholder)
        public async Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsByTypeAsync(string type)
        {
            // This could be extended if you add a Type field to Playlist entity
            // For now, return all playlists
            return await GetAllPlaylistsAsync();
        }

        // Get Public Playlists
        public async Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsByIsPublicAsync(bool isPublic)
        {
            var playlists = await _playlistRepository.FindAsync(p => p.IsPublic == isPublic);
            var playlistDtos = playlists.Select(p => new PlaylistDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                IsPublic = p.IsPublic,
                OwnerId = p.OwnerId
            }).ToList();

            return new ApiResponse<List<PlaylistDto>>(playlistDtos);
        }

        // Get Private Playlists
        public async Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsByIsPrivateAsync(bool isPrivate)
        {
            return await GetPlaylistsByIsPublicAsync(!isPrivate);
        }

        // Get Songs in Playlist
        public async Task<ApiResponse<List<SongDto>>> GetSongInPlaylist(Guid playlistId)
        {
            var playlist = await _playlistRepository.GetByIdAsync(playlistId);
            if (playlist == null) return ApiResponse<List<SongDto>>.Fail("Playlist not found.");

            var playlistSongs = await _playlistSongRepository.FindAsync(ps => ps.PlaylistId == playlistId);
            var songIds = playlistSongs.Select(ps => ps.SongId).ToList();

            var songs = await _songRepository.FindAsync(s => songIds.Contains(s.Id));

            var songDtos = playlistSongs
                .OrderBy(ps => ps.OrderIndex)
                .Select(ps =>
                {
                    var song = songs.FirstOrDefault(s => s.Id == ps.SongId);
                    return song != null ? new SongDto
                    {
                        Id = song.Id,
                        Title = song.Title,
                        Artist = song.Artist,
                        Album = song.Album,
                        Duration = song.Duration,
                        StreamUrl = song.StreamUrl,
                        CoverUrl = song.CoverUrl
                    } : null!;
                })
                .Where(s => s != null)
                .Cast<SongDto>()
                .ToList();

            return new ApiResponse<List<SongDto>>(songDtos);
        }

        // Get Playlists by User ID and Song ID
        public async Task<ApiResponse<List<PlaylistDto>>> GetPlaylistsByUserIdAndSongIdAsync(Guid userId, Guid songId)
        {
            var playlistSongs = await _playlistSongRepository.FindAsync(ps => ps.SongId == songId);
            var playlistIds = playlistSongs.Select(ps => ps.PlaylistId).Distinct().ToList();

            var playlists = await _playlistRepository.FindAsync(p => 
                p.OwnerId == userId && playlistIds.Contains(p.Id));

            var playlistDtos = playlists.Select(p => new PlaylistDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                IsPublic = p.IsPublic,
                OwnerId = p.OwnerId
            }).ToList();

            return new ApiResponse<List<PlaylistDto>>(playlistDtos);
        }
    }
}