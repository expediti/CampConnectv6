import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Community, Post } from '../types';
import { timeAgo } from '../utils/timeAgo';

export default function AppLayout() {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [nickname, setNickname] = useState<string>('');
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [view, setView] = useState<'communities' | 'chat' | 'create'>('communities');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [currentCommunity, setCurrentCommunity] = useState<Community | null>(null);
  const [messages, setMessages] = useState<Post[]>([]);

  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDesc, setNewCommunityDesc] = useState('');
  const [newMessage, setNewMessage] = useState('');

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const savedNickname = localStorage.getItem('campconnect_nickname');
    if (savedNickname) {
      setNickname(savedNickname);
    } else {
      setShowNicknameModal(true);
    }
  }, []);

  useEffect(() => {
    if (nickname) loadCommunities();
  }, [nickname]);

  // Real-time subscription
  useEffect(() => {
    if (currentCommunity && view === 'chat') {
      const channel = supabase
        .channel(`community-${currentCommunity.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'posts', filter: `community_id=eq.${currentCommunity.id}` },
          (payload) => {
            const newPost = payload.new as Post;
            setMessages(prev => {
              // Check if message already exists (to avoid duplicates)
              if (prev.some(m => m.id === newPost.id)) return prev;
              return [...prev, newPost];
            });
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentCommunity, view]);

  const handleSetNickname = () => {
    const trimmed = nicknameInput.trim();
    if (!trimmed || trimmed.length < 3 || trimmed.length > 20) {
      alert('Nickname must be 3-20 characters');
      return;
    }
    localStorage.setItem('campconnect_nickname', trimmed);
    setNickname(trimmed);
    setShowNicknameModal(false);
  };

  const loadCommunities = async () => {
    const { data } = await supabase.from('communities').select('*').order('created_at', { ascending: false });
    if (!data) return;
    const communitiesWithCounts = await Promise.all(
      data.map(async (community) => {
        const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('community_id', community.id);
        return { ...community, postsCount: count || 0 };
      })
    );
    setCommunities(communitiesWithCounts);
  };

  const goHome = () => {
    setView('communities');
    setCurrentCommunity(null);
    setMessages([]);
    setSidebarOpen(false);
    loadCommunities();
  };

  const openCommunity = async (community: Community) => {
    setCurrentCommunity(community);
    setView('chat');
    setSidebarOpen(false);
    const { data } = await supabase.from('posts').select('*').eq('community_id', community.id).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const createCommunity = async () => {
    if (!newCommunityName.trim()) {
      alert('Please enter a community name');
      return;
    }
    const { error } = await supabase.from('communities').insert([{
      name: newCommunityName.trim(),
      description: newCommunityDesc.trim() || 'No description'
    }]);
    if (error) {
      alert('Failed to create community');
      return;
    }
    setNewCommunityName('');
    setNewCommunityDesc('');
    goHome();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentCommunity) return;
    
    const tempId = `temp-${Date.now()}`;
    const newMsg: Post = {
      id: tempId,
      community_id: currentCommunity.id,
      title: newMessage.trim().slice(0, 100),
      content: newMessage.trim(),
      nickname: nickname,
      created_at: new Date().toISOString()
    };

    // Optimistically add message to UI immediately
    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
    setShowMessageModal(false);

    // Send to database
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        community_id: currentCommunity.id,
        title: newMsg.title,
        content: newMsg.content,
        nickname: nickname
      }])
      .select()
      .single();

    if (error) {
      alert('Failed to send message');
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } else {
      // Replace temp message with real one
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    }
  };

  const filteredCommunities = communities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showNicknameModal) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50 p-4">
        <div className="bg-[#1e293b] p-6 md:p-8 rounded-2xl max-w-md w-full">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Choose Your Nickname</h2>
          <p className="text-gray-400 mb-6 text-sm">This will be displayed on your messages</p>
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
          <button onClick={handleSetNickname} className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition">
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e] text-white">
      {showMessageModal && view === 'chat' && currentCommunity && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowMessageModal(false)}>
          <div className="bg-[#1e293b] p-6 rounded-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Send Message</h3>
              <button onClick={() => setShowMessageModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              maxLength={500}
              className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-xl text-white resize-none focus:outline-none focus:border-green-500 mb-4"
              rows={5}
              autoFocus
            />
            <button onClick={sendMessage} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition">
              Send Message
            </button>
          </div>
        </div>
      )}

      <header className="bg-[#1e293b] border-b border-gray-800 px-4 md:px-6 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-2xl hover:text-green-400 transition">☰</button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={goHome}>
            <span className="text-2xl md:text-3xl">🎓</span>
            <span className="text-lg md:text-xl font-bold">CampConnect</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="hidden md:block w-48 px-4 py-2 bg-[#0f172a] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
            />
            <div className="text-xs md:text-sm text-gray-400 bg-[#0f172a] px-3 py-1.5 rounded-lg">@{nickname}</div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}
        
        <aside className={`fixed md:static w-64 bg-[#1e293b] border-r border-gray-800 h-[calc(100vh-73px)] p-4 z-30 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <button onClick={goHome} className={`w-full px-4 py-3 rounded-lg mb-2 font-medium transition flex items-center gap-3 ${view === 'communities' ? 'bg-green-600 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-800'}`}>
            <span>🏘️</span> Communities
          </button>
          <button onClick={() => { setView('create'); setSidebarOpen(false); }} className={`w-full px-4 py-3 rounded-lg font-medium transition flex items-center gap-3 ${view === 'create' ? 'bg-green-600 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-800'}`}>
            <span>➕</span> Create Community
          </button>
        </aside>

        <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full pb-24">
          {view === 'communities' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">All Communities</h2>
              </div>
              <div className="md:hidden mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search communities..."
                  className="w-full px-4 py-2 bg-[#1e293b] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div className="space-y-4">
                {filteredCommunities.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    <p className="text-lg mb-2">{searchQuery ? 'No communities found' : 'No communities yet'}</p>
                    <p className="text-sm">{searchQuery ? 'Try a different search' : 'Create the first one!'}</p>
                  </div>
                ) : (
                  filteredCommunities.map((community) => (
                    <div key={community.id} onClick={() => openCommunity(community)} className="bg-[#1e293b] p-4 md:p-6 rounded-xl cursor-pointer hover:bg-[#2d3d52] transition border border-gray-800">
                      <h3 className="text-lg md:text-xl font-semibold text-green-400 mb-2">{community.name}</h3>
                      <p className="text-sm md:text-base text-gray-400 mb-3">{community.description}</p>
                      <div className="text-xs md:text-sm text-gray-500">{community.postsCount || 0} messages</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {view === 'chat' && currentCommunity && (
            <div className="flex flex-col h-[calc(100vh-200px)]">
              <button onClick={goHome} className="mb-4 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-sm md:text-base flex items-center gap-2">
                ← Back to Communities
              </button>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{currentCommunity.name}</h2>
              <p className="text-sm md:text-base text-gray-400 mb-6">{currentCommunity.description}</p>
              <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No messages yet. Start the conversation!</div>
                ) : (
                  messages.map((message, idx) => (
                    <div key={message.id || idx} className="bg-[#1e293b] p-4 rounded-xl border border-gray-800 animate-fadeIn">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-semibold text-green-400">@{message.nickname}</span>
                        <span className="text-xs text-gray-500">{timeAgo(message.created_at)}</span>
                      </div>
                      <p className="text-sm md:text-base text-gray-300 whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* FLOATING BUTTON - FIXED FOR DESKTOP */}
              <button 
                onClick={() => setShowMessageModal(true)} 
                className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white w-14 h-14 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center text-2xl z-50" 
                title="Send Message"
                style={{ position: 'fixed' }}
              >
                💬
              </button>
            </div>
          )}

          {view === 'create' && (
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Create New Community</h2>
              <div className="bg-[#1e293b] p-4 md:p-6 rounded-xl space-y-4 border border-gray-800">
                <input
                  type="text"
                  value={newCommunityName}
                  onChange={(e) => setNewCommunityName(e.target.value)}
                  placeholder="Community Name"
                  maxLength={50}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
                />
                <textarea
                  value={newCommunityDesc}
                  onChange={(e) => setNewCommunityDesc(e.target.value)}
                  placeholder="Description (optional)"
                  maxLength={200}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-xl text-white resize-none focus:outline-none focus:border-green-500"
                  rows={3}
                />
                <button onClick={createCommunity} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition">
                  Create Community
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add fade-in animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
