namespace Kita.Service.Configuration
{
    /// <summary>
    /// Configuration options for Spotify API credentials
    /// </summary>
    public class SpotifyOptions
    {
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
    }
}
