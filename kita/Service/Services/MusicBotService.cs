using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Kita.Domain.Entities.Server;
using Kita.Infrastructure.Repositories;
using Kita.Service.Common;
using Kita.Service.Interfaces;
using Kita.Service.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Kita.Service.Services
{
    public class MusicBotService : IMusicBotService
    {
        private readonly ILogger<MusicBotService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        
        private readonly ConcurrentDictionary<string, MusicBot> _bots = new();
        private readonly ConcurrentDictionary<string, int> _channelUserCounts = new();
        
        private const int LEAVE_DELAY_SECONDS = 15;

        public MusicBotService(
            ILogger<MusicBotService> logger,
            IServiceScopeFactory serviceScopeFactory)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
        }

        public async Task OnUserJoinedChannelAsync(string channelId, Guid userId)
        {
            try
            {
                var userCount = _channelUserCounts.AddOrUpdate(channelId, 1, (key, oldValue) => oldValue + 1);
                _logger.LogInformation($"User {userId} joined channel {channelId}. Current user count: {userCount}");

                if (_bots.TryGetValue(channelId, out var bot))
                {
                    bot.UserCount = userCount;
                    
                    if (bot.LeaveCancellationTokenSource != null)
                    {
                        bot.LeaveCancellationTokenSource.Cancel();
                        bot.LeaveCancellationTokenSource.Dispose();
                        bot.LeaveCancellationTokenSource = null;
                        bot.ScheduledLeaveTime = null;
                        _logger.LogInformation($"Cancelled bot leave timer for channel {channelId}");
                    }
                }
                else
                {
                    await JoinChannelAsync(channelId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in OnUserJoinedChannelAsync for channel {channelId}");
            }
        }

        public async Task OnUserLeftChannelAsync(string channelId, Guid userId)
        {
            try
            {
                var userCount = _channelUserCounts.AddOrUpdate(channelId, 0, (key, oldValue) => Math.Max(0, oldValue - 1));
                _logger.LogInformation($"User {userId} left channel {channelId}. Current user count: {userCount}");

                if (userCount == 0 && _bots.TryGetValue(channelId, out var bot))
                {
                    bot.UserCount = 0;
                    
                    bot.LeaveCancellationTokenSource = new CancellationTokenSource();
                    bot.ScheduledLeaveTime = DateTime.UtcNow.AddSeconds(LEAVE_DELAY_SECONDS);
                    
                    _logger.LogInformation($"Channel {channelId} is empty. Bot will leave in {LEAVE_DELAY_SECONDS} seconds");

                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await Task.Delay(TimeSpan.FromSeconds(LEAVE_DELAY_SECONDS), bot.LeaveCancellationTokenSource.Token);
                            
                            if (_channelUserCounts.TryGetValue(channelId, out var finalCount) && finalCount == 0)
                            {
                                _logger.LogInformation($"Bot leaving channel {channelId} after {LEAVE_DELAY_SECONDS}s delay");
                                await LeaveChannelAsync(channelId);
                            }
                        }
                        catch (TaskCanceledException)
                        {
                            _logger.LogInformation($"Bot leave cancelled for channel {channelId} - user rejoined");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Error during delayed leave for channel {channelId}");
                        }
                    });
                }
                else if (userCount > 0 && _bots.TryGetValue(channelId, out var existingBot))
                {
                    existingBot.UserCount = userCount;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in OnUserLeftChannelAsync for channel {channelId}");
            }
        }

        public Task<int> GetChannelUserCountAsync(string channelId)
        {
            var count = _channelUserCounts.TryGetValue(channelId, out var value) ? value : 0;
            return Task.FromResult(count);
        }

        public async Task<ApiResponse<object>> JoinChannelAsync(string channelId, Guid? playlistId = null, List<Guid>? songIds = null)
        {
            try
            {
                // Check if bot already exists in channel
                if (_bots.ContainsKey(channelId))
                {
                    return ApiResponse<object>.Fail("Bot is already in this channel");
                }

                using var scope = _serviceScopeFactory.CreateScope();
                var channelRepository = scope.ServiceProvider.GetRequiredService<IChannelRepository>();
                var songRepository = scope.ServiceProvider.GetRequiredService<ISongRepository>();
                var playbackSessionRepository = scope.ServiceProvider.GetRequiredService<IBaseRepository<PlaybackSession>>();

                // Get or create playback session
                var channel = await channelRepository.GetChannelWithPlaybackSessionAsync(Guid.Parse(channelId));
                if (channel == null)
                {
                    return ApiResponse<object>.Fail("Channel not found");
                }

                if (channel.Type != ChannelType.Voice)
                {
                    return ApiResponse<object>.Fail("Bot can only join voice channels");
                }

                PlaybackSession? playbackSession = channel.PlaybackSession;
                
                if (playbackSession == null)
                {
                    // Create new playback session
                    playbackSession = new PlaybackSession
                    {
                        ChannelId = Guid.Parse(channelId),
                        IsPlaying = false,
                        Position = 0,
                        QueueJson = "[]"
                    };
                    await playbackSessionRepository.AddAsync(playbackSession);
                }

                // Create bot instance
                var bot = new MusicBot
                {
                    ChannelId = channelId,
                    UserCount = _channelUserCounts.TryGetValue(channelId, out var userCount) ? userCount : 0,
                    IsPlaying = false,
                    SongQueue = new ConcurrentQueue<Guid>(),
                    Volume = playbackSession.Volume ?? 50 // Restore volume from session or default to 50
                };

                // Load songs into queue if provided
                if (songIds != null && songIds.Count > 0)
                {
                    foreach (var songId in songIds)
                    {
                        bot.SongQueue.Enqueue(songId);
                    }
                }
                else if (playlistId.HasValue)
                {
                    // Load playlist songs
                    var playlistSongs = await songRepository.GetSongsByPlaylistIdAsync(playlistId.Value);
                    foreach (var song in playlistSongs)
                    {
                        bot.SongQueue.Enqueue(song.Id);
                    }
                }
                else
                {
                    if (!string.IsNullOrEmpty(playbackSession.QueueJson))
                    {
                        var queueIds = JsonSerializer.Deserialize<List<Guid>>(playbackSession.QueueJson);
                        if (queueIds != null)
                        {
                            foreach (var songId in queueIds)
                            {
                                bot.SongQueue.Enqueue(songId);
                            }
                        }
                    }
                }

                // Add bot to dictionary
                _bots.TryAdd(channelId, bot);
                
                _logger.LogInformation($"Bot joined channel {channelId} with {bot.SongQueue.Count} songs in queue");
                
                return new ApiResponse<object>("Bot joined channel successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error joining bot to channel {channelId}");
                return ApiResponse<object>.Fail($"Failed to join channel: {ex.Message}");
            }
        }

        public async Task<ApiResponse<object>> LeaveChannelAsync(string channelId)
        {
            try
            {
                if (!_bots.TryRemove(channelId, out var bot))
                {
                    return ApiResponse<object>.Fail("Bot is not in this channel");
                }

                bot.LeaveCancellationTokenSource?.Cancel();
                bot.LeaveCancellationTokenSource?.Dispose();

                using var scope = _serviceScopeFactory.CreateScope();
                var channelRepository = scope.ServiceProvider.GetRequiredService<IChannelRepository>();
                var playbackSessionRepository = scope.ServiceProvider.GetRequiredService<IBaseRepository<PlaybackSession>>();

                var queueJson = JsonSerializer.Serialize(bot.SongQueue.ToArray());
                var channel = await channelRepository.GetChannelWithPlaybackSessionAsync(Guid.Parse(channelId));
                
                if (channel?.PlaybackSession != null)
                {
                    channel.PlaybackSession.QueueJson = queueJson;
                    channel.PlaybackSession.IsPlaying = false;
                    channel.PlaybackSession.CurrentSongId = bot.CurrentSongId;
                    channel.PlaybackSession.Volume = bot.Volume;
                    await playbackSessionRepository.UpdateAsync(channel.PlaybackSession);
                }

                _channelUserCounts.TryRemove(channelId, out _);

                _logger.LogInformation($"Bot left channel {channelId}");
                
                return new ApiResponse<object>("Bot left channel successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error leaving channel {channelId}");
                return ApiResponse<object>.Fail($"Failed to leave channel: {ex.Message}");
            }
        }

        public async Task<ApiResponse<object>> PlaySongAsync(string channelId, Guid songId)
        {
            try
            {
                if (!_bots.TryGetValue(channelId, out var bot))
                {
                    return ApiResponse<object>.Fail("Bot is not in this channel");
                }

                using var scope = _serviceScopeFactory.CreateScope();
                var songRepository = scope.ServiceProvider.GetRequiredService<ISongRepository>();
                var channelRepository = scope.ServiceProvider.GetRequiredService<IChannelRepository>();
                var playbackSessionRepository = scope.ServiceProvider.GetRequiredService<IBaseRepository<PlaybackSession>>();

                // Verify song exists
                var song = await songRepository.GetByIdAsync(songId);
                if (song == null)
                {
                    return ApiResponse<object>.Fail("Song not found");
                }

                // Update bot state
                bot.CurrentSongId = songId;
                bot.CurrentSongStreamUrl = song.StreamUrl;
                bot.PlaybackStartedAt = DateTime.UtcNow;
                bot.IsPlaying = true;

                // Update playback session
                var channel = await channelRepository.GetChannelWithPlaybackSessionAsync(Guid.Parse(channelId));
                if (channel?.PlaybackSession != null)
                {
                    channel.PlaybackSession.CurrentSongId = songId;
                    channel.PlaybackSession.IsPlaying = true;
                    channel.PlaybackSession.Position = 0;
                    await playbackSessionRepository.UpdateAsync(channel.PlaybackSession);
                }

                _logger.LogInformation($"Bot playing song {songId} in channel {channelId}");
                
                return new ApiResponse<object>($"Now playing: {song.Title}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error playing song {songId} in channel {channelId}");
                return ApiResponse<object>.Fail($"Failed to play song: {ex.Message}");
            }
        }

        public async Task<ApiResponse<object>> AddSongToQueueAsync(string channelId, Guid songId)
        {
            try
            {
                if (!_bots.TryGetValue(channelId, out var bot))
                {
                    return ApiResponse<object>.Fail("Bot is not in this channel");
                }

                using var scope = _serviceScopeFactory.CreateScope();
                var songRepository = scope.ServiceProvider.GetRequiredService<ISongRepository>();
                var channelRepository = scope.ServiceProvider.GetRequiredService<IChannelRepository>();
                var playbackSessionRepository = scope.ServiceProvider.GetRequiredService<IBaseRepository<PlaybackSession>>();

                var song = await songRepository.GetByIdAsync(songId);
                if (song == null)
                {
                    return ApiResponse<object>.Fail("Song not found");
                }

                // Add to queue
                bot.SongQueue.Enqueue(songId);

                // Update playback session
                var channel = await channelRepository.GetChannelWithPlaybackSessionAsync(Guid.Parse(channelId));
                if (channel?.PlaybackSession != null)
                {
                    channel.PlaybackSession.QueueJson = JsonSerializer.Serialize(bot.SongQueue.ToArray());
                    await playbackSessionRepository.UpdateAsync(channel.PlaybackSession);
                }

                _logger.LogInformation($"Added song {songId} to queue in channel {channelId}");
                
                return new ApiResponse<object>($"Added to queue: {song.Title}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error adding song {songId} to queue in channel {channelId}");
                return ApiResponse<object>.Fail($"Failed to add song to queue: {ex.Message}");
            }
        }

        public async Task<ApiResponse<object>> PauseAsync(string channelId)
        {
            try
            {
                if (!_bots.TryGetValue(channelId, out var bot))
                {
                    return ApiResponse<object>.Fail("Bot is not in this channel");
                }

                bot.IsPlaying = false;

                using var scope = _serviceScopeFactory.CreateScope();
                var channelRepository = scope.ServiceProvider.GetRequiredService<IChannelRepository>();
                var playbackSessionRepository = scope.ServiceProvider.GetRequiredService<IBaseRepository<PlaybackSession>>();

                // Update playback session
                var channel = await channelRepository.GetChannelWithPlaybackSessionAsync(Guid.Parse(channelId));
                if (channel?.PlaybackSession != null)
                {
                    channel.PlaybackSession.IsPlaying = false;
                    await playbackSessionRepository.UpdateAsync(channel.PlaybackSession);
                }

                _logger.LogInformation($"Bot paused in channel {channelId}");
                
                return new ApiResponse<object>("Playback paused");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error pausing in channel {channelId}");
                return ApiResponse<object>.Fail($"Failed to pause: {ex.Message}");
            }
        }

        public async Task<ApiResponse<object>> ResumeAsync(string channelId)
        {
            try
            {
                if (!_bots.TryGetValue(channelId, out var bot))
                {
                    return ApiResponse<object>.Fail("Bot is not in this channel");
                }

                bot.IsPlaying = true;

                using var scope = _serviceScopeFactory.CreateScope();
                var channelRepository = scope.ServiceProvider.GetRequiredService<IChannelRepository>();
                var playbackSessionRepository = scope.ServiceProvider.GetRequiredService<IBaseRepository<PlaybackSession>>();

                // Update playback session
                var channel = await channelRepository.GetChannelWithPlaybackSessionAsync(Guid.Parse(channelId));
                if (channel?.PlaybackSession != null)
                {
                    channel.PlaybackSession.IsPlaying = true;
                    await playbackSessionRepository.UpdateAsync(channel.PlaybackSession);
                }

                _logger.LogInformation($"Bot resumed in channel {channelId}");
                
                return new ApiResponse<object>("Playback resumed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error resuming in channel {channelId}");
                return ApiResponse<object>.Fail($"Failed to resume: {ex.Message}");
            }
        }

        public async Task<ApiResponse<object>> SkipAsync(string channelId)
        {
            try
            {
                if (!_bots.TryGetValue(channelId, out var bot))
                {
                    return ApiResponse<object>.Fail("Bot is not in this channel");
                }

                // Get next song from queue (thread-safe dequeue)
                if (!bot.SongQueue.TryDequeue(out var nextSongId))
                {
                    bot.CurrentSongId = null;
                    bot.IsPlaying = false;
                    return ApiResponse<object>.Fail("Queue is empty");
                }

                // Update queue in database
                using var scope = _serviceScopeFactory.CreateScope();
                var channelRepository = scope.ServiceProvider.GetRequiredService<IChannelRepository>();
                var playbackSessionRepository = scope.ServiceProvider.GetRequiredService<IBaseRepository<PlaybackSession>>();

                var channel = await channelRepository.GetChannelWithPlaybackSessionAsync(Guid.Parse(channelId));
                if (channel?.PlaybackSession != null)
                {
                    channel.PlaybackSession.QueueJson = JsonSerializer.Serialize(bot.SongQueue.ToArray());
                    await playbackSessionRepository.UpdateAsync(channel.PlaybackSession);
                }
                
                // Play next song
                return await PlaySongAsync(channelId, nextSongId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error skipping song in channel {channelId}");
                return ApiResponse<object>.Fail($"Failed to skip: {ex.Message}");
            }
        }

        public async Task<ApiResponse<object>> SetVolumeAsync(string channelId, int volume)
        {
            try
            {
                if (!_bots.TryGetValue(channelId, out var bot))
                {
                    return ApiResponse<object>.Fail("Bot is not in this channel");
                }

                if (volume < 0 || volume > 100)
                {
                    return ApiResponse<object>.Fail("Volume must be between 0 and 100");
                }

                bot.Volume = volume;

                // Persist volume to database
                using var scope = _serviceScopeFactory.CreateScope();
                var channelRepository = scope.ServiceProvider.GetRequiredService<IChannelRepository>();
                var playbackSessionRepository = scope.ServiceProvider.GetRequiredService<IBaseRepository<PlaybackSession>>();

                var channel = await channelRepository.GetChannelWithPlaybackSessionAsync(Guid.Parse(channelId));
                if (channel?.PlaybackSession != null)
                {
                    channel.PlaybackSession.Volume = volume;
                    await playbackSessionRepository.UpdateAsync(channel.PlaybackSession);
                }

                _logger.LogInformation($"Bot volume set to {volume} in channel {channelId}");
                
                return new ApiResponse<object>($"Volume set to {volume}%");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error setting volume in channel {channelId}");
                return ApiResponse<object>.Fail($"Failed to set volume: {ex.Message}");
            }
        }

        public Task<ApiResponse<object>> GetBotStatusAsync(string channelId)
        {
            try
            {
                if (!_bots.TryGetValue(channelId, out var bot))
                {
                    return Task.FromResult(ApiResponse<object>.Fail("Bot is not in this channel"));
                }

                var status = new
                {
                    ChannelId = bot.ChannelId,
                    UserCount = bot.UserCount,
                    CurrentSongId = bot.CurrentSongId,
                    CurrentSongStreamUrl = bot.CurrentSongStreamUrl,
                    PlaybackStartedAt = bot.PlaybackStartedAt,
                    IsPlaying = bot.IsPlaying,
                    QueueLength = bot.SongQueue.Count,
                    Volume = bot.Volume,
                    ScheduledLeaveTime = bot.ScheduledLeaveTime,
                    CreatedAt = bot.CreatedAt
                };

                return Task.FromResult(new ApiResponse<object>(status));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting bot status for channel {channelId}");
                return Task.FromResult(ApiResponse<object>.Fail($"Failed to get status: {ex.Message}"));
            }
        }
    }
}