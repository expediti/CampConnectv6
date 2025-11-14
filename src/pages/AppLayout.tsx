import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Community, Post } from '../types';
import { timeAgo } from '../utils/timeAgo';

export default function AppLayout() {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeChannelRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [nickname, setNickname] = useState<string>('');
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [view, setView] = useState<'communities' | 'chat' | 'create'>('communities');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [currentCommunity, setCurrentCommunity] = useState<Community | null>(null);
  const [messages, setMessages] = useState<Post[]>([]);

  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDesc, setNewCommunityDesc] = useState('');
  const [newMessage, setNewMessage] = useState('');

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

  useEffect(() => {
    if (!currentCommunity || view !== 'chat') {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      return;
    }

    console.log('🔴 Setting up real-time...');
    
    const channel = supabase
      .channel(`community-${currentCommunity.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `community_id=eq.${currentCommunity.id}`
        },
        (payload) => {
          console.log('🟢 NEW MESSAGE:', payload.new);
          const newPost = payload.new as Post;
          setMessages((prev) => {
            const exists = prev.some(m => m.id === newPost.id);
            if (exists) return prev;
            return [...prev, newPost];
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time status:', status);
      });

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
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
    setNewMessage('');
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
    const optimisticMsg: Post = {
      id: tempId,
      community_id: currentCommunity.id,
      title: newMessage.trim().slice(0, 100),
      content: newMessage.trim(),
      nickname: nickname,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const { data, error } = await supabase
      .from('posts')
      .insert([{
        community_id: currentCommunity.id,
        title: optimisticMsg.title,
        content: optimisticMsg.content,
        nickname: nickname
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error:', error);
      alert('Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } else {
      console.log('✅ Sent:', data);
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e] text-white flex flex-col">
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

      <div className="flex flex-1 relative overflow-hidden">
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}
        
        <aside className={`fixed md:static w-64 bg-[#1e293b] border-r border-gray-800 h-[calc(100vh-73px)] p-4 z-30 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <button onClick={goHome} className={`w-full px-4 py-3 rounded-lg mb-2 font-medium transition flex items-center gap-3 ${view === 'communities' ? 'bg-green-600 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-800'}`}>
            <span>🏘️</span> Communities
          </button>
          <button onClick={() => { setView('create'); setSidebarOpen(false); }} className={`w-full px-4 py-3 rounded-lg font-medium transition flex items-center gap-3 ${view === 'create' ? 'bg-green-600 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-800'}`}>
            <span>➕</span> Create Community
          </button>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          {view === 'communities' && (
            <div className="p-4 md:p-8 overflow-y-auto">
              <div className="max-w-4xl mx-auto w-full">
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
            </div>
          )}

          {view === 'chat' && currentCommunity && (
            <div className="flex flex-col h-full">
              <div className="p-4 md:p-6 border-b border-gray-800 shrink-0">
                <button onClick={goHome} className="mb-3 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-sm md:text-base flex items-center gap-2">
                  ← Back
                </button>
                <h2 className="text-xl md:text-2xl font-bold">{currentCommunity.name}</h2>
                <p className="text-sm text-gray-400 mt-1">{currentCommunity.description}</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No messages yet. Start the conversation!</div>
                ) : (
                  messages.map((message, idx) => (
                    <div key={message.id || idx} className="bg-[#1e293b] p-4 rounded-xl border border-gray-800 animate-fadeIn w-full">
                      <div className="flex items-start justify-between mb-2 gap-2 flex-wrap">
                        <span className="font-semibold text-green-400">@{message.nickname}</span>
                        <span className="text-xs text-gray-500">{timeAgo(message.created_at)}</span>
                      </div>
                      <p className="text-sm md:text-base text-gray-300 whitespace-pre-wrap break-words w-full overflow-hidden">{message.content}</p>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="border-t border-gray-800 bg-[#1e293b] p-4 shrink-0">
                <div className="flex gap-3 items-end max-w-4xl mx-auto">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={handleTextareaChange}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    maxLength={500}
                    className="flex-1 px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-xl text-white resize-none focus:outline-none focus:border-green-500"
                    rows={1}
                    style={{ maxHeight: '120px' }}
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-5 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
                  >
                    <span className="text-xl">📤</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'create' && (
            <div className="p-4 md:p-8 overflow-y-auto">
              <div className="max-w-2xl mx-auto">
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
            </div>
          )}
        </main>
      </div>

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
