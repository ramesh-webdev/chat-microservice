import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './app/auth/Login';
import VerifyOtp from './app/auth/VerifyOtp';
import ChatLayout from './app/chat/ChatLayout';
import { useAuthStore } from './stores/auth.store';

function App() {
  const token = useAuthStore(s => s.token);
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/verify" element={<VerifyOtp />} />
      <Route path="/chat" element={token ? <ChatLayout /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to={token ? "/chat" : "/login"} />} />
    </Routes>
  );
}

export default App
