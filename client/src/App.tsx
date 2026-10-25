import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import UploadPage from './pages/UploadPage';
import DashboardPage from './pages/DashboardPage';
import ChatbotPage from './pages/ChatbotPage';
import FlashPage from './pages/FlashPage';
import RoomPage from './pages/RoomPage';
import JoinRoomPage from './pages/JoinRoomPage';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/dashboard/:sessionId" element={<DashboardPage />} />
        <Route path="/chat/:sessionId" element={<ChatbotPage />} />
        <Route path="/flash/:sessionId" element={<FlashPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/join" element={<JoinRoomPage />} />
      </Routes>
    </Router>
  );
}

export default App;
