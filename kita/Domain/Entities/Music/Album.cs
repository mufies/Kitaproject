using System;
using System.Collections.Generic;
using Kita.Domain.Entities; // for BaseEntity if needed, though they are in different namespace
using Kita.Domain.Entities.Music; // for Song if in same namespace

namespace Kita.Domain.Entities.Music
{
    public class Album : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public Guid ArtistId { get; set; }
        public virtual List<Song> Songs { get; set; } = new List<Song>();
        public virtual Artist Artist { get; set; } = null!;
    }
}