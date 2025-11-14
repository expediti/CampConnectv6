import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Community, Post, Comment } from '../types';
import { timeAgo } from '../utils/timeAgo';

export default function AppLayout() {
  const [nickname, setNickname] = useState<string>('');
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [view, setView] = useState<'communities' | 'community' | 'post' | 'create'>('communities');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [currentCommunity, setCurrentCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDesc, setNewCommunityDesc] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newComment, setNewComment] = useState('');

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
    setNickname(trimmed);
    setShowNicknameModal(false);
  };

  const loadCommunities = async () => {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) return;
    
    const communitiesWithCounts = await Promise.all(
      (data || []).map(async (community) => {
        const { count } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', community.id);
        return { ...community, postsCount: count || 0 };
      })
    );
    
    setCommunities(communitiesWithCounts);
  };

  const goHome = () => {
    setView('communities');
    setCurrentCommunity(null);
    setCurrentPost(null);
    setSidebarOpen(false);
    loadCommunities();
  };

  const openCommunity = async (community: Community) => {
    setCurrentCommunity(community);
    setView('community');
    setSidebarOpen(false);
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('community_id', community.id)
      .order('created_at', { ascending: false });
    
    if (error) return;
    
    const postsWithCounts = await Promise.all(
      (data || []).map(async (post) => {
        const { count } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        return { ...post, commentsCount: count || 0 };
      })
    );
    
    setPosts(postsWithCounts);
  };

  const openPost = async (post: Post) => {
    setCurrentPost(post);
    setView('post');
    
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    
    if (error) return;
    setComments(data || []);
  };

  const createCommunity = async () => {
    if (!newCommunityName.trim()) {
      alert('Please enter a community name');
      return;
    }

    const { data: communityData, error: communityError } = await supabase
      .from('communities')
      .insert([{
        name: newCommunityName.trim(),
        description: newCommunityDesc.trim() || 'No description'
      }])
      .select()
      .single();

    if (communityError) {
      alert('Failed to create community');
      return;
    }

    if (newPostTitle.trim() && communityData) {
      await supabase
        .from('posts')
        .insert([{
          community_id: communityData.id,
          title: newPostTitle.trim(),
          content: newPostContent.trim() || '',
          nickname: nickname
        }]);
    }

    setNewCommunityName('');
    setNewCommunityDesc('');
    setNewPostTitle('');
    setNewPostContent('');
    goHome();
  };

  const createComment = async () => {
    if (!newComment.trim()) {
      alert('Please enter a comment');
      return;
    }

    if (!currentPost) return;

    const { error } = await supabase
      .from('comments')
      .insert([{
        post_id: currentPost.id,
        text: newComment.trim(),
        nickname: nickname
      }]);

    if (error) {
      alert('Failed to post comment');
      return;
    }

    setNewComment('');
    openPost(currentPost);
  };

  if (showNicknameModal) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50 p-4">
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
            className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
          />
          <button
            onClick={handleSetNickname}
            className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e] text-white">
      {/* Header */}
      <header className="bg-[#1e293b] border-b border-gray-800 px-4 md:px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Hamburger (Mobile) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-2xl hover:text-green-400 transition"
          >
            ☰
          </button>

          {/* Home Button (Shows when not on communities page) */}
          {view !== 'communities' && (
            <button
              onClick={goHome}
              className="flex items-center gap-2 text-sm md:text-base text-gray-400 hover:text-white transition"
            >
              <span className="text-lg">←</span>
              <span className="hidden md:inline">Home</span>
            </button>
          )}

          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl md:text-3xl">🎓</span>
            <span className="text-lg md:text-xl font-bold">CampConnect</span>
          </div>

          {/* Nickname */}
          <div className="ml-auto text-xs md:text-sm text-gray-400 bg-[#0f172a] px-3 py-1.5 rounded-lg">
            @{nickname}
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed md:static
          w-64 bg-[#1e293b] border-r border-gray-800
          h-[calc(100vh-73px)] p-4
          z-30
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <button
            onClick={goHome}
            className={`w-full px-4 py-3 rounded-lg mb-2 font-medium transition flex items-center gap-3 ${
              view === 'communities' ? 'bg-green-600 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-800'
            }`}
          >
            <span>🏘️</span> Communities
          </button>
          <button
            onClick={() => { setView('create'); setSidebarOpen(false); }}
            className={`w-full px-4 py-3 rounded-lg font-medium transition flex items-center gap-3 ${
              view === 'create' ? 'bg-green-600 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-800'
            }`}
          >
            <span>➕</span> Create Community
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
          {/* Communities List */}
          {view === 'communities' && (
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6">All Communities</h2>
              <div className="space-y-4">
                {communities.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    <p className="text-lg mb-2">No communities yet</p>
                    <p className="text-sm">Create the first one!</p>
                  </div>
                ) : (
                  communities.map((community) => (
                    <div
                      key={community.id}
                      onClick={() => openCommunity(community)}
                      className="bg-[#1e293b] p-4 md:p-6 rounded-xl cursor-pointer hover:bg-[#2d3d52] transition border border-gray-800"
                    >
                      <h3 className="text-lg md:text-xl font-semibold text-green-400 mb-2">{community.name}</h3>
                      <p className="text-sm md:text-base text-gray-400 mb-3">{community.description}</p>
                      <div className="text-xs md:text-sm text-gray-500">{community.postsCount || 0} threads</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Community View */}
          {view === 'community' && currentCommunity && (
            <div>
              <button
                onClick={goHome}
                className="mb-4 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-sm md:text-base flex items-center gap-2"
              >
                ← Back to Communities
              </button>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{currentCommunity.name}</h2>
              <p className="text-sm md:text-base text-gray-400 mb-8">{currentCommunity.description}</p>

              <h3 className="text-lg md:text-xl font-semibold mb-4">All Threads</h3>
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">No threads yet. Be the first to post!</div>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => openPost(post)}
                      className="bg-[#1e293b] p-4 md:p-6 rounded-xl cursor-pointer hover:bg-[#2d3d52] transition border border-gray-800"
                    >
                      <h3 className="text-base md:text-lg font-semibold mb-2">{post.title}</h3>
                      <p className="text-sm md:text-base text-gray-400 mb-3 line-clamp-2">{post.content}</p>
                      <div className="text-xs md:text-sm text-gray-500">
                        by @{post.nickname} • {post.commentsCount || 0} comments • {timeAgo(post.created_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Post View */}
          {view === 'post' && currentPost && (
            <div>
              <button
                onClick={() => { setView('community'); setCurrentPost(null); }}
                className="mb-4 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-sm md:text-base flex items-center gap-2"
              >
                ← Back to Threads
              </button>

              <div className="bg-[#1e293b] p-4 md:p-6 rounded-xl mb-6 border border-gray-800">
                <h2 className="text-xl md:text-2xl font-bold mb-3">{currentPost.title}</h2>
                <p className="text-sm md:text-base text-gray-300 mb-4">{currentPost.content}</p>
                <div className="text-xs md:text-sm text-gray-500">
                  by @{currentPost.nickname} • {timeAgo(currentPost.created_at)}
                </div>
              </div>

              {/* Comment Form */}
              <div className="bg-[#1e293b] p-4 md:p-6 rounded-xl mb-6 border border-gray-800">
                <h3 className="text-base md:text-lg font-semibold mb-4">Add a Comment</h3>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write your comment..."
                  maxLength={500}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-xl text-white resize-none focus:outline-none focus:border-green-500 mb-4 text-sm md:text-base"
                  rows={4}
                />
                <button
                  onClick={createComment}
                  className="w-full md:w-auto px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                >
                  Comment
                </button>
              </div>

              {/* Comments List */}
              <h3 className="text-lg md:text-xl font-semibold mb-4">Comments</h3>
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No comments yet. Start the conversation!</div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-[#1e293b] p-4 rounded-xl border border-gray-800">
                      <p className="text-sm md:text-base text-gray-300 mb-2">{comment.text}</p>
                      <div className="text-xs md:text-sm text-gray-500">
                        @{comment.nickname} • {timeAgo(comment.created_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Create Community */}
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
                  className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 text-sm md:text-base"
                />
                <textarea
                  value={newCommunityDesc}
                  onChange={(e) => setNewCommunityDesc(e.target.value)}
                  placeholder="Description (optional)"
                  maxLength={200}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-xl text-white resize-none focus:outline-none focus:border-green-500 text-sm md:text-base"
                  rows={3}
                />

                <h3 className="text-base md:text-lg font-semibold mt-6 mb-2">Create Initial Thread (Optional)</h3>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Thread Title"
                  maxLength={100}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 text-sm md:text-base"
                />
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Thread content..."
                  maxLength={500}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-xl text-white resize-none focus:outline-none focus:border-green-500 text-sm md:text-base"
                  rows={4}
                />

                <button
                  onClick={createCommunity}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition"
                >
                  Create Community
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
