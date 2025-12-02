using System;

namespace Kita.Service.DTOs.YouTube
{
    public class YouTubeVideoDto
    {
        public string VideoId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? ChannelName { get; set; }
        public DateTime? PublishedAt { get; set; }
        public string VideoUrl => $"https://www.youtube.com/watch?v={VideoId}";
    }

    public class YouTubePlaylistRequestDto
    {
        public string PlaylistId { get; set; } = string.Empty;
    }

    public class VideoDownloadRequestDto
    {
        public string VideoUrl { get; set; } = string.Empty;
    }

    public class VideoInfoDto
    {
        public string Title { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Uri { get; set; } = string.Empty;
        public int Resolution { get; set; }
        public string Format { get; set; } = string.Empty;
        public long ContentLength { get; set; }
        public string FileSizeFormatted { get; set; } = string.Empty;
        public string VideoUrl { get; set; } = string.Empty;
    }

    public class VideoDownloadResponseDto
    {
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public byte[] FileBytes { get; set; } = Array.Empty<byte>();
        public long FileSize { get; set; }
    }
}
