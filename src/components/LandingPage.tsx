import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  const handleGetStarted = () => {
    const savedNickname = localStorage.getItem('campconnect_nickname');
    if (savedNickname) {
      navigate('/app');
    } else {
      setShowModal(true);
    }
  };

  const handleSetNickname = () => {
    const trimmed = nicknameInput.trim();
    if (!trimmed) {
      alert('Please enter a nickname');
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 20) {
      alert('Nickname must be 3-20 characters');
      return;
    }
    localStorage.setItem('campconnect_nickname', trimmed);
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0a0a0a] text-white relative overflow-hidden">
      {/* Nickname Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] p-6 md:p-8 rounded-2xl max-w-md w-full">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Choose Your Nickname</h2>
            <p className="text-gray-400 mb-6 text-sm">This will be displayed on your posts and comments</p>
            <input
              type="text"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSetNickname()}
              placeholder="Enter nickname (3-20 characters)"
              maxLength={20}
              autoFocus
              className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSetNickname}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      
      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🎓</span>
          <span className="text-2xl font-bold">CampConnect</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-6 text-center">
        <div className="inline-block mb-6 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
          <span className="text-green-400 text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Connect anonymously on campus!
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          Campus Conversations<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            Made Beautiful
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl">
          Create communities, share thoughts, and connect with your campus. No registration required.
        </p>

        <button
          onClick={handleGetStarted}
          className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-green-600/50"
        >
          + Get Started
        </button>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-semibold mb-2">Anonymous</h3>
            <p className="text-sm text-gray-400">Choose a nickname, stay private</p>
          </div>
          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-semibold mb-2">Real Conversations</h3>
            <p className="text-sm text-gray-400">Discuss what matters to you</p>
          </div>
          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="font-semibold mb-2">No Sign-up</h3>
            <p className="text-sm text-gray-400">Jump right in, no hassle</p>
          </div>
        </div>
      </main>
    </div>
  );
}
