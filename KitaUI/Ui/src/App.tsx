import { Routes, Route, useLocation } from 'react-router-dom'
import './App.css'
import Home from './page/Home'
import { MusicDashboard } from './page/Music/MusicDashboard'
import PlaylistPage from './page/Music/PlaylistPage'
import LoginPage from './page/LoginPage'
import ChatDemo from './pages/ChatDemo'
import VoiceRoom from './pages/VoiceRoom'
import Navigator from './components/navigator'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

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
              <MusicDashboard />
            </ProtectedRoute>
          } />
          <Route path="/music/playlist/:id" element={
            <ProtectedRoute>
              <PlaylistPage />
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
