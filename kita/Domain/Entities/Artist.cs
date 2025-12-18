using System;
using System.Collections.Generic;
using Kita.Domain.Entities.Music;

namespace Kita.Domain.Entities
{
    public class Artist : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string Role { get; set; } = "Artist";    
        public virtual List<Song> Songs { get; set; } = new List<Song>();
        public virtual List<User> ManagedByUsers { get; set; } = new List<User>();
        public virtual List<Album> Albums { get; set; } = new List<Album>();
        public virtual List<User> FollowedByUsers { get; set; } = new List<User>();
    }
}