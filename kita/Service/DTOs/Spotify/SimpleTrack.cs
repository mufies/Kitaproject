namespace Kita.Service.DTOs.Spotify
{
    /// <summary>
    /// Simplified track information containing only name and artist
    /// </summary>
    public class SimpleTrack
    {
        public string Name { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
    }
}
