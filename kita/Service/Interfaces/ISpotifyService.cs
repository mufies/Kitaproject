using Kita.Service.DTOs.Spotify;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Kita.Service.Interfaces
{

    public interface ISpotifyService
    {

        Task<List<SimpleTrack>> GetPlaylistTracksAsync(string playlistId);
    }
}
