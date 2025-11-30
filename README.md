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

### 🚧 Microservice Migration (In Progress)

The project is currently transitioning from a monolithic architecture to a microservices-based architecture for better scalability and maintainability.

**Planned Microservices:**

```
┌─────────────────────────────────────────────────────────┐
│                     API Gateway                         │
│                  (Ocelot / YARP)                       │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐
│  Auth Service  │ │ Chat Service│ │ Music Service  │
│   (Port 5001)  │ │ (Port 5002) │ │  (Port 5003)   │
└────────────────┘ └─────────────┘ └────────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                ┌─────────▼─────────┐
                │   Message Queue   │
                │  (RabbitMQ/Kafka) │
                └───────────────────┘
```

**Service Breakdown:**

1. **Auth Service**
   - User authentication and authorization
   - JWT token management
   - User profile management
   - Role and permission handling

2. **Chat Service**
   - Server and channel management
   - Real-time messaging via SignalR
   - Message persistence
   - Server invitations

3. **Music Service**
   - Song and playlist management
   - File upload and streaming
   - Music metadata handling
   - Audio quality processing

**Inter-Service Communication:**
- **Synchronous**: REST APIs for direct service-to-service calls
- **Asynchronous**: Message queue for event-driven communication
- **Real-time**: SignalR for WebSocket connections

## ✨ Features

### 🎵 Music Management
- Upload and stream music files
- Create and manage playlists
- Support for multiple audio qualities (Normal, High, Lossless)
- Music categorization by genres, types, and albums
- Cover art support

### 💬 Real-time Chat
- Discord-like server and channel system
- Real-time messaging via SignalR
- Channel-based conversations
- Server invitations system

### 👥 User Management
- JWT-based authentication
- Role-based authorization (Admin, Moderator, User)
- User profiles with avatar support
- Default admin account setup

### 📁 File Storage
- Local file storage for music and images
- Nginx-based static file serving
- Organized asset management

## 🛠️ Tech Stack

### Backend
- **Framework**: ASP.NET Core 8.0
- **Database**: PostgreSQL
- **ORM**: Entity Framework Core
- **Real-time**: SignalR
- **Authentication**: JWT Bearer Tokens
- **File Server**: Nginx

### Additional Technical Requirements

#### Message Queue & Event Streaming
- **RabbitMQ** or **Apache Kafka** - For asynchronous inter-service communication
- **MassTransit** - .NET service bus abstraction layer
- Use cases: Event-driven architecture, background jobs, notifications

#### Caching Layer
- **Redis** - Distributed caching and session management
- **In-Memory Cache** - For frequently accessed data
- Use cases: JWT token blacklist, user sessions, frequently accessed playlists

#### API Gateway
- **Ocelot** or **YARP (Yet Another Reverse Proxy)** - API Gateway for microservices
- Features: Routing, load balancing, authentication, rate limiting

#### Containerization & Orchestration
- **Docker** - Container platform for all services
- **Docker Compose** - Multi-container orchestration for development
- **Kubernetes** (Future) - Production-grade container orchestration

#### Monitoring & Logging
- **Serilog** - Structured logging framework
- **Seq** or **ELK Stack** - Log aggregation and analysis
- **Prometheus** + **Grafana** - Metrics and monitoring
- **Health Checks** - ASP.NET Core health check endpoints

#### Service Discovery
- **Consul** or **Eureka** - Service registry and discovery
- Required for dynamic service location in microservices

#### Resilience & Fault Tolerance
- **Polly** - Resilience and transient-fault-handling library
- Patterns: Retry, Circuit Breaker, Timeout, Bulkhead Isolation

#### Cloud Storage (Future)
- **AWS S3** / **Azure Blob Storage** / **MinIO** - Object storage for music files
- Replace local file storage for production scalability

#### CI/CD Pipeline
- **GitHub Actions** or **GitLab CI** - Automated build and deployment
- **SonarQube** - Code quality and security analysis

### Frontend
- **Framework**: React 19.2
- **Language**: TypeScript
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
   cd "a:\Code project\Kitaproject\kita"
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
       "BasePath": "a:/Code project/Kitaproject/kita/Assets",
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
   cd "a:\Code project\Kitaproject\KitaUI\Ui"
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
           alias "a:/Code project/Kitaproject/kita/Assets/Images/";
           autoindex on;
       }

       location /assets/music/ {
           alias "a:/Code project/Kitaproject/kita/Assets/Music/";
           autoindex on;
       }
   }
   ```

2. **Start Nginx**
   ```bash
   nginx -c "a:/Code project/Kitaproject/kita/nginx.conf"
   ```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Music
- `GET /api/music/songs` - Get all songs
- `GET /api/music/songs/{id}` - Get song by ID
- `POST /api/music/songs` - Create song
- `POST /api/music/songs/upload` - Upload song with file
- `PUT /api/music/songs/{id}` - Update song
- `PATCH /api/music/songs/{id}/status` - Change song status

### Playlists
- `GET /api/music/playlists` - Get user playlists
- `GET /api/music/playlists/{id}` - Get playlist by ID
- `POST /api/music/playlists` - Create playlist
- `PUT /api/music/playlists/{id}` - Update playlist
- `DELETE /api/music/playlists/{id}` - Delete playlist
- `POST /api/music/playlists/{id}/songs` - Add song to playlist
- `DELETE /api/music/playlists/{playlistId}/songs/{songId}` - Remove song from playlist

### Servers
- `GET /api/server` - Get user servers
- `GET /api/server/{id}` - Get server by ID
- `POST /api/server` - Create server
- `PUT /api/server/{id}` - Update server
- `DELETE /api/server/{id}` - Delete server

### Channels
- `GET /api/channel/server/{serverId}` - Get server channels
- `GET /api/channel/{id}` - Get channel by ID
- `POST /api/channel` - Create channel
- `PUT /api/channel/{id}` - Update channel
- `DELETE /api/channel/{id}` - Delete channel

### Messages
- `GET /api/message/channel/{channelId}` - Get channel messages
- `POST /api/message` - Send message
- `PUT /api/message/{id}` - Update message
- `DELETE /api/message/{id}` - Delete message

### Users
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/avatar` - Upload avatar

### Server Invites
- `POST /api/serverinvite` - Create invite
- `POST /api/serverinvite/join/{code}` - Join server via invite
- `GET /api/serverinvite/{code}` - Get invite details

### SignalR Hub
- `/hubs/chat` - Real-time chat hub
  - `JoinChannel(channelId)` - Join a channel
  - `SendMessage(channelId, content)` - Send message to channel

## 🗂️ Database Schema

### Core Entities

**User**
- Id, Username, Email, PasswordHash
- DisplayName, AvatarUrl, Bio
- Role (Admin, Moderator, User)

**Song**
- Id, Title, Artist, Album, Duration
- StreamUrl, CoverUrl
- Status, Type, Genres, AudioQuality

**Playlist**
- Id, Name, Description
- IsPublic, OwnerId

**Server**
- Id, Name, Description
- OwnerId, IconUrl

**Channel**
- Id, Name, Description
- ServerId, Type (Text, Voice)

**Message**
- Id, Content, SenderId
- ChannelId, Timestamp

## 🔐 Authentication

The API uses JWT Bearer tokens for authentication. Include the token in requests:

```
Authorization: Bearer <your_token>
```

For SignalR connections, pass the token as a query parameter:
```
/hubs/chat?access_token=<your_token>
```

## 📝 Default Roles

- **Admin**: Full system access
- **Moderator**: Content moderation capabilities
- **User**: Standard user permissions

## 🎨 Frontend Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── services/      # API service layer
├── contexts/      # React contexts (Auth, etc.)
└── types/         # TypeScript type definitions
```

## 🔧 Configuration

### JWT Settings
Configure in `appsettings.json`:
```json
{
  "JwtSettings": {
    "Key": "your-secret-key-min-32-characters",
    "Issuer": "KitaApi",
    "Audience": "KitaClient"
  }
}
```

### CORS Settings
Frontend origins are configured in `Program.cs`:
```csharp
policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify connection string in `appsettings.json`
- Check database exists: `CREATE DATABASE kita_db;`

### File Upload Issues
- Verify `Assets/Images` and `Assets/Music` directories exist
- Check Nginx is running and configured correctly
- Ensure file paths in `appsettings.json` match your system

### SignalR Connection Issues
- Verify CORS settings allow your frontend origin
- Check JWT token is valid and not expired
- Ensure SignalR hub is mapped in `Program.cs`

## 📞 Support

For issues and questions, please open an issue in the repository.

---

**Built with ❤️ using ASP.NET Core and React**
