using Microsoft.EntityFrameworkCore;
using Kita.Infrastructure.Data;
using Kita.Infrastructure.Repositories;
using Infrastructure.Repositories;
using Kita.Service.Interfaces;
using Kita.Service.Services;
using Kita.Service.Configuration;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.FileProviders;
using System.Text;
using Kita.Hubs;
using DotNetEnv;
using Microsoft.AspNetCore.Http;

// Load root .env first (lower priority), then local .env overrides it
var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env");
if (File.Exists(envPath))
{
    Env.Load(envPath);
    Console.WriteLine($"Loaded root .env from: {envPath}");
}
Env.Load(); // Load local .env (higher priority, overrides root)
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddRouting(options => options.LowercaseUrls = true);

// Add Database Context
builder.Services.AddDbContext<KitaDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Repositories
// Base repository for entities without specific repositories
builder.Services.AddScoped(typeof(IBaseRepository<>), typeof(BaseRepository<>));

// Entity-specific repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ISongRepository, SongRepository>();
builder.Services.AddScoped<IPlaylistSongRepository, PlaylistSongRepository>();
builder.Services.AddScoped<ISongStaticsRepository, SongStaticsRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<IListenHistoryRepository, ListenHistoryRepository>();
builder.Services.AddScoped<IListenWrappedRepository, ListenWrappedRepository>();
builder.Services.AddScoped<IArtistRepository, ArtistRepository>();
builder.Services.AddScoped<IAlbumRepository, AlbumRepository>();
builder.Services.AddScoped<IChannelRepository, ChannelRepository>();
builder.Services.AddScoped<IServerRepository, ServerRepository>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();

// Add Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IServerService, ServerService>();
builder.Services.AddScoped<IChannelService, ChannelService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IMusicService, MusicService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IServerInviteService, ServerInviteService>();
builder.Services.AddScoped<IPlaylistService, PlaylistService>();
builder.Services.AddScoped<IYouTubeService, YouTubeService>();
builder.Services.AddScoped<ISongStaticsService, SongStaticsService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<IListenHistoryService, ListenHistoryService>();
builder.Services.AddScoped<IListenWrappedService, ListenWrappedService>();
builder.Services.AddScoped<IArtistService, ArtistService>();
builder.Services.AddScoped<IAlbumService, AlbumService>();
builder.Services.AddHttpContextAccessor();

// Add LiveKit Service
builder.Services.AddScoped<ILiveKitService, LiveKitService>();

// Add Redis
builder.Services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var redisConnectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379";
        var multiplexer = StackExchange.Redis.ConnectionMultiplexer.Connect(redisConnectionString);
        return multiplexer;

});

builder.Services.AddSingleton<IRedisService, RedisService>();

builder.Services.AddSingleton<IMusicBotService, MusicBotService>();


builder.Services.Configure<SpotifyOptions>(builder.Configuration.GetSection("Spotify"));

builder.Services.AddHttpClient<ISpotifyService, SpotifyService>();

// builder.Services.AddHostedService<WebRTCSfuService>();

// Add SignalR
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true; // CHỈ development
})
.AddJsonProtocol(options =>
{
    options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    options.PayloadSerializerOptions.WriteIndented = false;
});
// Add Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!))
    };
    
    // Enable JWT authentication for SignalR
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
                
            }
            else if (context.Request.Headers.ContainsKey("Authorization"))
            {
                var authHeader = context.Request.Headers["Authorization"].ToString();
                if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    context.Token = authHeader.Substring("Bearer ".Length).Trim();
                }
            }
            
            return Task.CompletedTask;
        }
    };

});

builder.Services.AddAuthorization();

// Get Frontend URL from config or .env (DotNetEnv loads into process env vars)
var frontendUrl = Environment.GetEnvironmentVariable("VITE_FRONTEND_URL")
               ?? builder.Configuration["VITE_FRONTEND_URL"]
               ?? "http://localhost:5173";

Console.WriteLine($"CORS AllowedOrigin: {frontendUrl}");

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(frontendUrl, "http://localhost:5174", "http://localhost:5173","https://kiseki.id.vn")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); 
    });
});



var app = builder.Build();

// Auto-migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<KitaDbContext>();
    db.Database.Migrate();
}


app.UseCors("AllowFrontend");

// Configure static files
var basePath = app.Configuration["FileStorage:BasePath"] ?? Path.Combine(app.Environment.ContentRootPath, "Assets");

var assetDirectories = new[]
{
    new { Path = "Images", RequestPath = "/Assets/images" },
    new { Path = "Music", RequestPath = "/Assets/music" },
    new { Path = "artists", RequestPath = "/Assets/artists" },
    new { Path = "avatars", RequestPath = "/Assets/avatars" },
    new { Path = "messages", RequestPath = "/Assets/messages" },
    new { Path = "albums", RequestPath = "/Assets/albums" },
    new { Path = "servers", RequestPath = "/Assets/servers" },
};

foreach (var dir in assetDirectories)
{
    var fullPath = Path.Combine(basePath, dir.Path);
    if (!Directory.Exists(fullPath))
    {
        Directory.CreateDirectory(fullPath);
    }

    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(fullPath),
        RequestPath = dir.RequestPath
    });
}

app.UseHttpsRedirection();

app.UseMiddleware<Kita.Middleware.GlobalExceptionHandler>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHub<ChatHub>("/hubs/chat").RequireCors("AllowFrontend");
app.MapHub<VoiceHub>("/hubs/voice").RequireCors("AllowFrontend");
// app.MapHub<MusicControlHub>("/hubs/music-control").RequireCors("AllowFrontend"); // Temporarily disabled
app.MapHub<UserStatusHub>("/hubs/userstatus").RequireCors("AllowFrontend");

app.Run();