import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AppLayout from './components/AppLayout';

export default function App() {
  const [nickname, setNickname] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedNickname = localStorage.getItem('campconnect_nickname');
    if (savedNickname) {
      setNickname(savedNickname);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/app" 
          element={nickname ? <AppLayout nickname={nickname} setNickname={setNickname} /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/app/community/:communityId" 
          element={nickname ? <AppLayout nickname={nickname} setNickname={setNickname} /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/app/post/:postId" 
          element={nickname ? <AppLayout nickname={nickname} setNickname={setNickname} /> : <Navigate to="/" replace />} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
