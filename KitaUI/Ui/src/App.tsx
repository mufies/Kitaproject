import { Routes, Route, useLocation } from 'react-router-dom'
import './App.css'
import Home from './page/Home'
// import { MusicDashboard } from './page/Music/MusicDas'
import PlaylistPage from './page/Music/PlaylistPage'
import SongPage from './page/Music/SongPage'
import ProfilePage from './page/ProfilePage'
import LoginPage from './page/LoginPage'
import RegisterPage from './page/RegisterPage'
// import ChatDemo from './pages/ChatDemo'
// import VoiceRoom from './pages/VoiceRoom'
import KitaChatPage from './page/Communicate/KitaChatPage'
import JoinPage from './page/Communicate/JoinPage'
import Navigator from './components/navigator'
import { AuthProvider } from './context/AuthContext'
import { PlayProvider } from './context/PlayContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AudioControl } from './components/AudioControl'
import HomePage from './page/Music/Home/HomePage'
import MyArtistsPage from './page/Artist/MyArtistsPage'
import ArtistDetailsPage from './page/Artist/ArtistDetailsPage'
import AlbumDetailsPage from './page/Album/AlbumDetailsPage'
import NowPlayingPage from './page/Music/NowPlayingPage'
import UserProfilePage from './page/UserProfilePage'

function AppContent() {
  const location = useLocation();

  const showNavigator = location.pathname !== '/login' && location.pathname !== '/register' && location.pathname !== '/chat' && location.pathname !== '/voice';

  // AudioControl overlays content, so we remove global bottom padding to avoid "gap" visuals
  // Individual pages can add padding if needed to avoid content being hidden
  const contentClass = showNavigator ? "pt-16" : "";

  return (
    <>
      {showNavigator && <Navigator />}
      <div className={contentClass}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/chat" element={<KitaChatPage />} />
          <Route path="/join/:code" element={<ProtectedRoute><JoinPage /></ProtectedRoute>} />
          {/* <Route path="/voice" element={<VoiceRoom ... />} /> */}
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
          <Route path="/music/song/:id" element={
            <ProtectedRoute>
              <SongPage />
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
          <Route path="/music/now-playing" element={
            <ProtectedRoute>
              <NowPlayingPage />
            </ProtectedRoute>
          } />
          <Route path="/user/:id" element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/profile/:id" element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          } />

        </Routes>
      </div>
      {showNavigator && <AudioControl />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <PlayProvider>
        <AppContent />
      </PlayProvider>
    </AuthProvider>
  )
}

export default App
