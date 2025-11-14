import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyYWZmYTMiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2aDI0djI0SDM2ek0wIDBIMjR2MjRIMHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>
      
      <nav className="relative z-10 p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎓</span>
          <span className="text-2xl font-bold">CampConnect</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-600/20 border border-green-500/30">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-sm text-green-300">Connect anonymously on campus!</span>
        </div>
      </nav>

      <div className="relative z-10 container mx-auto px-6 pt-20 pb-32 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
          Campus Conversations
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
            Made Beautiful
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          Create communities, share thoughts, and connect with your campus. No registration required.
        </p>

        <button
          onClick={() => navigate('/app')}
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-lg rounded-xl shadow-2xl hover:shadow-green-500/50 transform hover:scale-105 transition-all duration-300"
        >
          <span>+ Get Started</span>
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        <div className="mt-16 flex justify-center items-center gap-3 text-sm text-gray-400">
          <span>Trusted by</span>
          <span className="font-semibold text-green-400">students everywhere</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
    </div>
  );
}
