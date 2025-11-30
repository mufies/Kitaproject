namespace Domain.Enums
{
    public enum SongType
    {
        Single,
        Album,
        Playlist,
        Radio,
        Podcast,
        Remix,
        Live,
        Cover,
        Mashup,
        Compilation
    }
    
    public enum MusicGenre
    {
        Pop,
        Rock,
        HipHop,
        Jazz,
        Classical,
        Electronic,
        Country,
        RnB,
        Blues,
        Metal,
        Folk,
        Reggae,
        Latin,
        KPop,
        Indie,
        Soul,
        Funk,
        Disco,
        House,
        Techno,
        Dubstep,
        Trap,
        LoFi,
        Acoustic,
        Instrumental
    }
    
    public enum AudioQuality
    {
        Low,      // 96kbps
        Normal,   // 128kbps
        High,     // 192kbps
        Premium,  // 320kbps
        Lossless  // FLAC/WAV
    }
    
    public enum PlaybackMode
    {
        Normal,
        Shuffle,
        RepeatOne,
        RepeatAll
    }
    
    public enum SongStatus
    {
        Active,
        Inactive,
        Draft,
        Hidden,
        Pending,
        Restricted  // Copyright/region restricted
    }
}
