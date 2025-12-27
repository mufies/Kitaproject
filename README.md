# Kita - Social Music Platform

A full-stack social platform combining Discord-like chat functionality with music streaming and playlist management capabilities.

## 🏗️ Architecture

Kita follows a clean architecture pattern with clear separation of concerns:

```
kita/
├── Domain/          # Core business entities and enums
├── Infrastructure/  # Data access and external services
├── Service/         # Business logic and DTOs
└── kita/           # API layer (Controllers, Hubs, Middleware)

KitaUI/
└── Ui/             # React + TypeScript frontend
```

## ✨ Features

### 🎵 Music Management
- **Song Upload & Streaming**: Upload and stream music files with support for multiple audio qualities (Normal, High, Lossless)
- **Playlist Management**: Create, edit, and organize personal playlists
- **Music Organization**: Categorize songs by genres, types, albums, and artists
- **Artist Management**: Manage artists and their discographies
- **Playlist Import**: Import playlists from Spotify and YouTube
- **Favorite System**: Mark songs as favorites with automatic playlist management
- **Song Comments**: Comment on songs and interact with other users
- **Cover Art**: Upload and display cover images for songs, albums, and playlists
- **Music Discovery**: Browse recent songs and explore music by genre or artist

### 💬 Real-time Chat & Communication
- **Server System**: Create and manage Discord-like servers with custom names and icons
- **Text Channels**: Organize conversations into separate text channels
- **Voice Channels**: Join voice channels for group voice chat
- **Real-time Messaging**: Send and receive messages instantly via SignalR
- **Server Invitations**: Generate and share invite codes to join servers
- **Music Control**: Control music playback across devices using SignalR

### 👥 User & Social Features
- **User Authentication**: Secure login and registration with JWT tokens
- **User Profiles**: Customize profiles with avatars, display names, and bios
- **Public Profiles**: View other users' public profiles and playlists
- **Role-based Access**: Admin, Moderator, and User roles with different permissions
- **Cross-device Sync**: Control music playback from multiple devices

### 🎧 Advanced Music Features
- **YouTube Integration**: Download and import songs from YouTube
- **Spotify Integration**: Import playlists from Spotify
- **Audio Quality Options**: Choose from Normal, High, and Lossless audio quality
- **Music Metadata**: Automatic extraction of song information (title, artist, album, duration)
- **Song Previews**: Preview songs before adding to playlists

## 🛠️ Tech Stack

### Backend
- **Framework**: ASP.NET Core 8.0
- **Database**: PostgreSQL with Entity Framework Core
- **Real-time Communication**: SignalR for chat and music control
- **Authentication**: JWT Bearer Tokens
- **File Storage**: Local file system + Nginx for static file serving
- **External APIs**: Spotify API, YouTube API
- **Voice Chat**: LiveKit integration

### Frontend
- **Framework**: React 19.2 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4.1
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Real-time**: SignalR Client
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
- .NET 8.0 SDK
- Node.js 18+ and npm
- PostgreSQL 14+
- Nginx (for file serving)

### Backend Setup

1. **Clone the repository**
   ```bash
   cd "/home/mufies/Code/Kitaproject/kita"
   ```

2. **Configure database connection**
   
   Update `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Port=5432;Database=kita_db;Username=postgres;Password=your_password"
     }
   }
   ```

3. **Update file storage paths**
   
   Update `appsettings.json`:
   ```json
   {
     "FileStorage": {
       "BasePath": "/home/mufies/Code/Kitaproject/kita/Assets",
       "BaseUrl": "http://localhost:8080/assets"
     }
   }
   ```

4. **Run database migrations**
   ```bash
   dotnet ef database update
   ```

5. **Start the API**
   ```bash
   dotnet run --project kita
   ```
   
   API will be available at `https://localhost:5001`

### Frontend Setup

1. **Navigate to UI directory**
   ```bash
   cd "/home/mufies/Code/Kitaproject/KitaUI/Ui"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   
   Frontend will be available at `http://localhost:5173`

### Nginx Setup

1. **Configure Nginx**
   
   Use the provided `nginx.conf` or update your Nginx configuration:
   ```nginx
   server {
       listen 8080;
       server_name localhost;

       location /assets/images/ {
           alias "/home/mufies/Code/Kitaproject/kita/Assets/Images/";
           autoindex on;
       }

       location /assets/music/ {
           alias "/home/mufies/Code/Kitaproject/kita/Assets/Music/";
           autoindex on;
       }
   }
   ```

2. **Start Nginx**
   ```bash
   nginx -c "/home/mufies/Code/Kitaproject/kita/nginx.conf"
   ```


## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Music & Playlists
- `GET /api/music/songs` - Get all songs
- `POST /api/music/songs/upload` - Upload song with file
- `GET /api/music/playlists` - Get user playlists
- `POST /api/music/playlists/import/spotify` - Import from Spotify
- `POST /api/music/playlists/import/youtube` - Import from YouTube
- `POST /api/music/playlists/{id}/songs` - Add song to playlist
- `POST /api/music/songs/{id}/favorite` - Toggle favorite

### Social & Communication
- `GET /api/server` - Get user servers
- `POST /api/server` - Create server
- `GET /api/channel/server/{serverId}` - Get server channels
- `POST /api/channel` - Create channel
- `GET /api/message/channel/{channelId}` - Get channel messages
- `POST /api/serverinvite/join/{code}` - Join server via invite

### SignalR Hubs
- `/hubs/chat` - Real-time chat
- `/hubs/voice` - Voice channel communication
- `/hubs/musiccontrol` - Cross-device music control

## 🔧 Configuration

The API uses JWT Bearer tokens for authentication. Include the token in requests:
```
Authorization: Bearer <your_token>
```

For SignalR connections, pass the token as a query parameter:
```
/hubs/chat?access_token=<your_token>
```

### Required Settings in appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=kita_db;Username=postgres;Password=your_password"
  },
  "JwtSettings": {
    "Key": "your-secret-key-min-32-characters",
    "Issuer": "KitaApi",
    "Audience": "KitaClient"
  },
  "FileStorage": {
    "BasePath": "/path/to/your/Assets",
    "BaseUrl": "http://localhost:8080/assets"
  },
  "Spotify": {
    "ClientId": "your_spotify_client_id",
    "ClientSecret": "your_spotify_client_secret"
  }
}
```

## 🎨 Frontend Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components (Home, Chat, Music, etc.)
├── services/      # API service layer
├── contexts/      # React contexts (Auth, Player, etc.)
└── types/         # TypeScript type definitions
```

## 📦 Build for Production

### Backend
```bash
dotnet publish -c Release -o ./publish
```

### Frontend
```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running on port 5432
- Verify connection string in `appsettings.json`
- Create database if it doesn't exist: `CREATE DATABASE kita_db;`
- Run migrations: `dotnet ef database update`

### File Upload & Streaming Issues
- Verify `Assets/Images` and `Assets/Music` directories exist
- Check Nginx is running: `nginx -t` to test configuration
- Ensure file paths in `appsettings.json` match your system

### SignalR/Real-time Connection Issues
- Verify CORS settings allow your frontend origin
- Check JWT token is valid and not expired
- Ensure all SignalR hubs are mapped in `Program.cs`

### External API Issues
- Verify Spotify credentials are correct in `appsettings.json`
- Check internet connection for YouTube downloads
- Ensure API rate limits are not exceeded

---

**Built with ❤️ using ASP.NET Core and React**
