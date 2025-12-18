using System.Text.Json.Serialization;

namespace Kita.Service.DTOs.Spotify
{

    public class SpotifyTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("token_type")]
        public string TokenType { get; set; } = string.Empty;

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }
    }
    
    public class SpotifyPlaylist
    {
        public string Name { get; set; } = string.Empty;
        public string CoverUrl { get; set; } = string.Empty;
        public List<SimpleTrack> Tracks { get; set; } = new();
    }

    public class SpotifyPlaylistTracksResponse
    {
        [JsonPropertyName("items")]
        public List<SpotifyPlaylistItem> Items { get; set; } = new();

        [JsonPropertyName("next")]
        public string? Next { get; set; }
    }

    public class SpotifyPlaylistItem
    {
        [JsonPropertyName("track")]
        public SpotifyTrack? Track { get; set; }
    }

    public class SpotifyTrack
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("artists")]
        public List<SpotifyArtist> Artists { get; set; } = new();
    }

    public class SpotifyArtist
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
    }
    
}
