namespace Kita.Domain
{
    public class DeviceConnection
    {
        public string ConnectionId { get; set; } = string.Empty;
        public string DeviceId { get; set; } = string.Empty;
        public string DeviceName { get; set; } = string.Empty;
        public string DeviceType { get; set; } = string.Empty; // "web", "mobile", "desktop"
        public DateTime ConnectedAt { get; set; } = DateTime.UtcNow;
    }
}
