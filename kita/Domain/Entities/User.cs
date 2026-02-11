using System;
using System.Collections.Generic;
using Kita.Domain.Entities.Music;
using Kita.Domain.Entities.Server;
using Kita.Domain.Enums;

namespace Kita.Domain.Entities
{
    public class User : BaseEntity
    {
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "User";
        public string? AvatarUrl { get; set; }
        public UserSubscription Subscription { get; set; } = UserSubscription.Free;
        public bool IsPremium { get; set; } = false;
        public bool IsVerified { get; set; } = false;
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual ICollection<Playlist> Playlists { get; set; } = new List<Playlist>();
        public virtual ICollection<ServerMember> ServerMemberships { get; set; } = new List<ServerMember>();
        public virtual ICollection<Kita.Domain.Entities.Server.Server> OwnedServers { get; set; } = new List<Kita.Domain.Entities.Server.Server>();
        public virtual ICollection<Kita.Domain.Entities.Server.ServerInvite> CreatedInvites { get; set; } = new List<Kita.Domain.Entities.Server.ServerInvite>();
        public virtual ICollection<Artist> FollowedArtists { get; set; } = new List<Artist>();
        public virtual ICollection<Album> LikedAlbums { get; set; } = new List<Album>();
    }
}
