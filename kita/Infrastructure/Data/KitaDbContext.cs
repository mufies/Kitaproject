using Kita.Domain.Entities;
using Kita.Domain.Entities.Music;
using Kita.Domain.Entities.Server;
using Domain.Entities.Music;
using Microsoft.EntityFrameworkCore;

namespace Kita.Infrastructure.Data
{
    public class KitaDbContext : DbContext
    {
        public KitaDbContext(DbContextOptions<KitaDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Song> Songs { get; set; }
        public DbSet<Playlist> Playlists { get; set; }
        public DbSet<PlaylistSong> PlaylistSongs { get; set; }
        public DbSet<ListenHistory> ListenHistories { get; set; }
        public DbSet<ListenWrapped> ListenWrappeds { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<SongStatics> SongStatics { get; set; }
        public DbSet<Kita.Domain.Entities.Server.Server> Servers { get; set; }
        public DbSet<ServerMember> ServerMembers { get; set; }
        public DbSet<Channel> Channels { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<PlaybackSession> PlaybackSessions { get; set; }
        public DbSet<ServerInvite> ServerInvites { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // PlaylistSong Many-to-Many
            modelBuilder.Entity<PlaylistSong>()
                .HasKey(ps => new { ps.PlaylistId, ps.SongId });

            modelBuilder.Entity<PlaylistSong>()
                .HasOne(ps => ps.Playlist)
                .WithMany(p => p.PlaylistSongs)
                .HasForeignKey(ps => ps.PlaylistId);

            modelBuilder.Entity<PlaylistSong>()
                .HasOne(ps => ps.Song)
                .WithMany()
                .HasForeignKey(ps => ps.SongId);

            // ServerMember Many-to-Many (User <-> Server)
            modelBuilder.Entity<ServerMember>()
                .HasKey(sm => new { sm.ServerId, sm.UserId });

            modelBuilder.Entity<ServerMember>()
                .HasOne(sm => sm.Server)
                .WithMany(s => s.Members)
                .HasForeignKey(sm => sm.ServerId);

            modelBuilder.Entity<ServerMember>()
                .HasOne(sm => sm.User)
                .WithMany(u => u.ServerMemberships)
                .HasForeignKey(sm => sm.UserId);
            
            // Server Owner
            modelBuilder.Entity<Kita.Domain.Entities.Server.Server>()
                .HasOne(s => s.Owner)
                .WithMany(u => u.OwnedServers)
                .HasForeignKey(s => s.OwnerId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete of user deleting server

            // Channel -> Server
            modelBuilder.Entity<Channel>()
                .HasOne(c => c.Server)
                .WithMany(s => s.Channels)
                .HasForeignKey(c => c.ServerId)
                .OnDelete(DeleteBehavior.Cascade);

            // Message -> Channel
            modelBuilder.Entity<Message>()
                .HasOne(m => m.Channel)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ChannelId)
                .OnDelete(DeleteBehavior.Cascade);

             // PlaybackSession -> Channel (One-to-One or One-to-Zero)
             modelBuilder.Entity<Channel>()
                 .HasOne(c => c.PlaybackSession)
                 .WithOne(ps => ps.Channel)
                 .HasForeignKey<PlaybackSession>(ps => ps.ChannelId)
                 .OnDelete(DeleteBehavior.Cascade);

            // ServerInvite -> Server
            modelBuilder.Entity<ServerInvite>()
                .HasOne(si => si.Server)
                .WithMany(s => s.Invites)
                .HasForeignKey(si => si.ServerId)
                .OnDelete(DeleteBehavior.Cascade);

            // ServerInvite -> User (Creator)
            modelBuilder.Entity<ServerInvite>()
                .HasOne(si => si.CreatedBy)
                .WithMany(u => u.CreatedInvites)
                .HasForeignKey(si => si.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            // Unique index on invite code for fast lookups
            modelBuilder.Entity<ServerInvite>()
                .HasIndex(si => si.Code)
                .IsUnique();

            // ListenHistory -> Song
            modelBuilder.Entity<ListenHistory>()
                .HasOne(lh => lh.Song)
                .WithMany()
                .HasForeignKey(lh => lh.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            // ListenHistory -> User
            modelBuilder.Entity<ListenHistory>()
                .HasOne(lh => lh.User)
                .WithMany()
                .HasForeignKey(lh => lh.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // ListenWrapped -> Song
            modelBuilder.Entity<ListenWrapped>()
                .HasOne(lw => lw.Song)
                .WithMany()
                .HasForeignKey(lw => lw.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            // ListenWrapped -> User
            modelBuilder.Entity<ListenWrapped>()
                .HasOne(lw => lw.User)
                .WithMany()
                .HasForeignKey(lw => lw.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Comment -> Song
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Song)
                .WithMany()
                .HasForeignKey(c => c.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            // Comment -> User
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // SongStatics -> Song (One-to-One)
            modelBuilder.Entity<SongStatics>()
                .HasOne(ss => ss.Song)
                .WithOne(s => s.SongStatics)
                .HasForeignKey<SongStatics>(ss => ss.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            // Song -> User
            modelBuilder.Entity<Song>()
                .HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // SongStatics -> Comments (One-to-Many)
            modelBuilder.Entity<SongStatics>()
                .HasMany(ss => ss.Comments)
                .WithOne()
                .OnDelete(DeleteBehavior.Cascade);

            // Seed Admin User
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                UserName = "Admin",
                Email = "admin@kita.com",
                PasswordHash = "$2a$11$5glWJIvKFoXWFwYIKJVB5ONySehuC4cMyghaPfEdybGcBazIDZsmy", // "admin"
                Role = "Admin",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
    }
}
