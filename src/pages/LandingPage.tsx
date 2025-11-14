import React from 'react';

interface LandingPageProps {
    onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    return (
        <div className="min-h-screen bg-gray-900 font-sans p-4 sm:p-6 lg:p-8">
            <div className="relative isolate overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.500),#0a0a0a)] opacity-20"></div>
                <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-gray-900 shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center"></div>
                
                <nav className="flex justify-between items-center py-4 px-2 sm:px-6 max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🎓</span>
                        <span className="text-2xl font-bold text-white">CampConnect</span>
                    </div>
                </nav>

                <main className="max-w-4xl mx-auto text-center py-24 sm:py-32">
                    <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-8">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Connect anonymously on campus!
                    </div>

                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
                        Campus Conversations<br />
                        <span className="bg-gradient-to-r from-green-400 to-teal-400 text-transparent bg-clip-text">Made Beautiful</span>
                    </h1>

                    <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
                        Create communities, share thoughts, and connect with your campus. No registration required.
                    </p>

                    <button
                        onClick={onStart}
                        className="mt-10 inline-flex items-center gap-2 bg-green-500 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-green-500/30 transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-500/50"
                    >
                        <span>+ Get Started</span>
                    </button>

                    <div className="mt-12 flex items-center justify-center gap-4">
                        <div className="flex -space-x-4">
                            <img className="inline-block h-10 w-10 rounded-full ring-2 ring-gray-800" src="https://picsum.photos/id/1005/40/40" alt="User"/>
                            <img className="inline-block h-10 w-10 rounded-full ring-2 ring-gray-800" src="https://picsum.photos/id/1011/40/40" alt="User"/>
                            <img className="inline-block h-10 w-10 rounded-full ring-2 ring-gray-800" src="https://picsum.photos/id/1025/40/40" alt="User"/>
                            <img className="inline-block h-10 w-10 rounded-full ring-2 ring-gray-800" src="https://picsum.photos/id/1027/40/40" alt="User"/>
                        </div>
                        <span className="text-gray-400 text-sm">Trusted by <strong>students</strong> everywhere</span>
                    </div>

                    <div className="mt-20">
                        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-3 max-w-2xl mx-auto shadow-2xl shadow-black/50">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                            </div>
                            <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                                <div className="bg-gray-800 p-3 rounded-md text-left font-medium">📚 Study Groups</div>
                                <div className="bg-gray-800 p-3 rounded-md text-left font-medium">🎮 Gaming Club</div>
                                <div className="bg-gray-800 p-3 rounded-md text-left font-medium">💼 Career Talk</div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default LandingPage;