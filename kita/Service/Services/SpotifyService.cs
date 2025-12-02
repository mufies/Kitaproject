using Kita.Service.Configuration;
using Kita.Service.DTOs.Spotify;
using Kita.Service.Interfaces;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Kita.Service.Services
{

    public class SpotifyService : ISpotifyService
    {
        private readonly HttpClient _httpClient;
        private readonly SpotifyOptions _options;
        
        private string? _cachedAccessToken;
        private DateTime _tokenExpiryTime;
        private readonly SemaphoreSlim _tokenLock = new(1, 1);

        public SpotifyService(HttpClient httpClient, IOptions<SpotifyOptions> options)
        {
            _httpClient = httpClient;
            _options = options.Value;
            _tokenExpiryTime = DateTime.MinValue;
        }

        public async Task<List<SimpleTrack>> GetPlaylistTracksAsync(string playlistId)
        {
            var tracks = new List<SimpleTrack>();
            
            var token = await GetAccessTokenAsync();
            
            string? nextUrl = $"https://api.spotify.com/v1/playlists/{playlistId}/tracks";
            
            while (!string.IsNullOrEmpty(nextUrl))
            {
                var request = new HttpRequestMessage(HttpMethod.Get, nextUrl);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                
                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();
                
                var content = await response.Content.ReadAsStringAsync();
                var playlistResponse = JsonSerializer.Deserialize<SpotifyPlaylistTracksResponse>(content);
                
                if (playlistResponse?.Items != null)
                {
                    foreach (var item in playlistResponse.Items)
                    {
                        if (item.Track != null)
                        {
                            tracks.Add(new SimpleTrack
                            {
                                Name = item.Track.Name,
                                // Get first artist name, or empty string if no artists
                                Artist = item.Track.Artists.FirstOrDefault()?.Name ?? string.Empty
                            });
                        }
                    }
                }
                
                // Move to next page (if exists)
                nextUrl = playlistResponse?.Next;
            }
            
            return tracks;
        }

        private async Task<string> GetAccessTokenAsync()
        {
            if (!string.IsNullOrEmpty(_cachedAccessToken) && DateTime.UtcNow < _tokenExpiryTime.AddSeconds(-60))
            {
                return _cachedAccessToken;
            }

            await _tokenLock.WaitAsync();
            try
            {
                if (!string.IsNullOrEmpty(_cachedAccessToken) && DateTime.UtcNow < _tokenExpiryTime.AddSeconds(-60))
                {
                    return _cachedAccessToken;
                }

                var tokenUrl = "https://accounts.spotify.com/api/token";
                var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_options.ClientId}:{_options.ClientSecret}"));
                
                var request = new HttpRequestMessage(HttpMethod.Post, tokenUrl);
                request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
                request.Content = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("grant_type", "client_credentials")
                });

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var tokenResponse = JsonSerializer.Deserialize<SpotifyTokenResponse>(content);

                if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.AccessToken))
                {
                    throw new InvalidOperationException("Failed to obtain access token from Spotify");
                }

                _cachedAccessToken = tokenResponse.AccessToken;
                _tokenExpiryTime = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn);

                return _cachedAccessToken;
            }
            finally
            {
                _tokenLock.Release();
            }
        }
    }
}
