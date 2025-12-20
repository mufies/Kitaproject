using System;
using System.Collections.Generic;

namespace Kita.Service.DTOs.Album
{
    public class AddSongsToAlbumDto
    {
        public List<Guid> SongIds { get; set; } = new List<Guid>();
    }

    public class RemoveSongsFromAlbumDto
    {
        public List<Guid> SongIds { get; set; } = new List<Guid>();
    }
}
