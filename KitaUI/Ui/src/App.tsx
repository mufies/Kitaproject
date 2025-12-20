import { Routes, Route, useLocation } from 'react-router-dom'
import './App.css'
import Home from './page/Home'
// import { MusicDashboard } from './page/Music/MusicDas'
import PlaylistPage from './page/Music/PlaylistPage'
import ProfilePage from './page/ProfilePage'
import LoginPage from './page/LoginPage'
import ChatDemo from './pages/ChatDemo'
import VoiceRoom from './pages/VoiceRoom'
import Navigator from './components/navigator'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import HomePage from './page/Music/Home/HomePage'
import MyArtistsPage from './page/Artist/MyArtistsPage'
import ArtistDetailsPage from './page/Artist/ArtistDetailsPage'
import AlbumDetailsPage from './page/Album/AlbumDetailsPage'

function AppContent() {
  const location = useLocation();
  const showNavigator = location.pathname !== '/login' && location.pathname !== '/chat' && location.pathname !== '/voice';

  return (
    <>
      {showNavigator && <Navigator />}
      <div className={showNavigator ? "pt-16" : ""}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/chat" element={<ChatDemo />} />
          <Route path="/voice" element={<VoiceRoom channelId="52bfcf4b-c2fc-4941-9558-623a98f52c3b" channelName="Voice Chat" />} />
          <Route path="/music" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/music/playlist/:id" element={
            <ProtectedRoute>
              <PlaylistPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/artists/my" element={
            <ProtectedRoute>
              <MyArtistsPage />
            </ProtectedRoute>
          } />
          <Route path="/artist/:id" element={
            <ProtectedRoute>
              <ArtistDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/album/:id" element={
            <ProtectedRoute>
              <AlbumDetailsPage />
            </ProtectedRoute>
          } />

        </Routes>

      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
