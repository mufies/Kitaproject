# Kita - Social Music Platform

Full-stack social music app with Discord-like chat and music streaming.

## Architecture
- Domain, Infrastructure, Service layers
- ASP.NET Core 8 API + React 19.2 + TypeScript frontend

## Key Features
- Music upload/streaming (Normal/High/Lossless)
- Playlist management + Spotify/YouTube import
- Discord-style servers, text/voice channels
- Real-time chat & music control via SignalR
- User profiles, roles, cross-device sync

## Tech Stack
**Backend**: ASP.NET Core 8, PostgreSQL, SignalR, JWT, Nginx static files  
**Frontend**: React 19.2, Vite, Tailwind, Axios, SignalR client

## Quick Local Setup
```
# Backend
cd "/home/mufies/Code/Kitaproject/kita"
# Update appsettings.json (DB, JWT, FileStorage, Spotify)
dotnet ef database update
dotnet run --project kita  

# Frontend  
cd "/home/mufies/Code/Kitaproject/KitaUI/Ui"
npm install && npm run dev  # http://localhost:5173

# Nginx (static files)
nginx -c "/home/mufies/Code/Kitaproject/kita/nginx.conf"  # port 8080
```

**Build**: `dotnet publish -c Release` + `npm run build`