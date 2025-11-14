import React, { useState, useEffect, useCallback } from 'react';
import { Community, Post, Comment } from '../types';
import { supabase } from '../services/supabase';
import { timeAgo } from '../utils/timeAgo';
import { HomeIcon, PlusIcon, SearchIcon, BackIcon, LoadingIcon } from './icons/Icons';

// Sub-components defined outside the main component to prevent re-creation on re-renders
const CommunityCard: React.FC<{ community: Community; onClick: () => void }> = ({ community, onClick }) => (
    <div className="bg-gray-800 p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-gray-700 hover:shadow-lg hover:-translate-y-1" onClick={onClick}>
        <h3 className="text-green-400 font-bold text-xl mb-2 truncate">{community.name}</h3>
        <p className="text-gray-400 mb-4 line-clamp-2 h-12">{community.description || ''}</p>
        <div className="text-gray-500 text-sm font-medium">{community.postsCount} posts</div>
    </div>
);

const PostCard: React.FC<{ post: Post; onClick: () => void }> = ({ post, onClick }) => (
    <div className="bg-gray-800 p-5 rounded-xl cursor-pointer transition-all duration-300 hover:bg-gray-700" onClick={onClick}>
        <h3 className="text-lg font-semibold text-white mb-1">{post.title}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2 h-10">{post.content || ''}</p>
        <div className="text-gray-500 text-sm">
            by <span className="font-semibold text-gray-400">{post.nickname}</span> • {post.commentsCount} comments • {timeAgo(post.created_at)}
        </div>
    </div>
);

const CommentCard: React.FC<{ comment: Comment }> = ({ comment }) => (
    <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-gray-300 mb-2">{comment.text}</p>
        <div className="text-gray-500 text-xs">
            <span className="font-semibold text-gray-400">{comment.nickname}</span> • {timeAgo(comment.created_at)}
        </div>
    </div>
);

// Main Layout Component
const AppLayout: React.FC = () => {
    const [view, setView] = useState<'communities' | 'create' | 'community' | 'post'>('communities');
    const [communities, setCommunities] = useState<Community[]>([]);
    const [allCommunities, setAllCommunities] = useState<Community[]>([]);
    const [currentCommunity, setCurrentCommunity] = useState<Community | null>(null);
    const [currentPost, setCurrentPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreatePostForm, setShowCreatePostForm] = useState(false);

    const [nickname, setNickname] = useState<string | null>(null);
    const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
    const [tempNickname, setTempNickname] = useState('');

    const [formState, setFormState] = useState({
        communityName: '',
        communityDesc: '',
        postTitle: '',
        postContent: '',
        commentText: '',
    });

    useEffect(() => {
        const storedNickname = sessionStorage.getItem('campconnect_nickname');
        if (storedNickname) {
            setNickname(storedNickname);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prevState => ({ ...prevState, [name]: value }));
    };

    const loadCommunities = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('communities').select('*').order('created_at', { ascending: false });
            if (error) throw error;

            const communitiesWithCounts = await Promise.all(
                data.map(async (community) => {
                    const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('community_id', community.id);
                    return { ...community, postsCount: count || 0 };
                })
            );

            setAllCommunities(communitiesWithCounts);
            setCommunities(communitiesWithCounts);
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        if (view === 'communities') {
            loadCommunities();
        }
        if (view !== 'community') {
            setShowCreatePostForm(false);
        }
    }, [view, loadCommunities]);

    useEffect(() => {
        const filtered = allCommunities.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setCommunities(filtered);
    }, [searchQuery, allCommunities]);

    const handleSetNickname = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tempNickname.trim()) {
            alert('Please enter a valid nickname.');
            return;
        }
        const finalNickname = tempNickname.trim();
        sessionStorage.setItem('campconnect_nickname', finalNickname);
        setNickname(finalNickname);
        setIsNicknameModalOpen(false);
        setTempNickname('');
        if (pendingAction) {
            await pendingAction();
            setPendingAction(null);
        }
    };

    const handleCreateCommunity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.communityName) { alert('Please enter a community name'); return; }
        try {
            const { error } = await supabase.from('communities').insert([{ name: formState.communityName, description: formState.communityDesc || 'No description' }]);
            if (error) throw error;
            setFormState(prev => ({ ...prev, communityName: '', communityDesc: '' }));
            alert('Community created!');
            setView('communities');
        } catch (error: any) { alert('Error: ' + error.message); }
    };

    const openCommunity = async (community: Community) => {
        setLoading(true);
        setCurrentCommunity(community);
        setShowCreatePostForm(false);
        try {
            const { data, error } = await supabase.from('posts').select('*').eq('community_id', community.id).order('created_at', { ascending: false });
            if (error) throw error;
            const postsWithCounts = await Promise.all(
                data.map(async (post) => {
                    const { count } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
                    return { ...post, commentsCount: count || 0 };
                })
            );
            setCurrentCommunity(prev => prev ? { ...prev, posts: postsWithCounts } : null);
            setView('community');
        } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
    };
    
    const doCreatePost = async () => {
        if (!formState.postTitle || !currentCommunity || !nickname) return;
        try {
            const { error } = await supabase.from('posts').insert([{ community_id: currentCommunity.id, title: formState.postTitle, content: formState.postContent || '', nickname: nickname }]);
            if (error) throw error;
            setFormState(prev => ({ ...prev, postTitle: '', postContent: '' }));
            setShowCreatePostForm(false);
            await openCommunity(currentCommunity); // Refresh posts
        } catch (error: any) { alert('Error: ' + error.message); }
    };
    
    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.postTitle) { alert('Please enter a post title'); return; }
        if (!nickname) {
            setPendingAction(() => doCreatePost);
            setIsNicknameModalOpen(true);
        } else {
            await doCreatePost();
        }
    };
    
    const openPost = async (post: Post) => {
        setLoading(true);
        setCurrentPost(post);
        try {
            const { data, error } = await supabase.from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true });
            if (error) throw error;
            setComments(data);
            setView('post');
        } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
    };

    const doCreateComment = async () => {
        if (!formState.commentText || !currentPost || !nickname) return;
        try {
            const { error } = await supabase.from('comments').insert([{ post_id: currentPost.id, text: formState.commentText, nickname: nickname }]);
            if (error) throw error;
            setFormState(prev => ({ ...prev, commentText: '' }));
            await openPost(currentPost); // Refresh comments
        } catch (error: any) { alert('Error: ' + error.message); }
    };

    const handleCreateComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.commentText) { alert('Please enter a comment'); return; }
         if (!nickname) {
            setPendingAction(() => doCreateComment);
            setIsNicknameModalOpen(true);
        } else {
            await doCreateComment();
        }
    };

    const renderContent = () => {
        if (loading) {
            return <div className="flex justify-center items-center h-full"><LoadingIcon /></div>;
        }

        switch (view) {
            case 'communities':
                return (
                    <div>
                        <h2 className="text-3xl font-bold mb-6 text-white">All Communities</h2>
                        {communities.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {communities.map(c => <CommunityCard key={c.id} community={c} onClick={() => openCommunity(c)} />)}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-16">No communities found.</div>
                        )}
                    </div>
                );
            case 'create':
                return (
                    <div>
                        <h2 className="text-3xl font-bold mb-6">Create New Community</h2>
                        <div className="bg-gray-800 p-8 rounded-2xl">
                            <form onSubmit={handleCreateCommunity}>
                                <input type="text" name="communityName" value={formState.communityName} onChange={handleInputChange} className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white text-base mb-4 focus:ring-2 focus:ring-green-500 outline-none" placeholder="Community Name" maxLength={50} />
                                <textarea name="communityDesc" value={formState.communityDesc} onChange={handleInputChange} className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white text-base mb-4 h-32 resize-none focus:ring-2 focus:ring-green-500 outline-none" placeholder="Description (optional)" maxLength={200}></textarea>
                                <button type="submit" className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition-colors">Create Community</button>
                            </form>
                        </div>
                    </div>
                );
            case 'community':
                if (!currentCommunity) return null;
                return (
                    <div>
                        <button onClick={() => setView('communities')} className="flex items-center gap-2 bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-600 mb-6"><BackIcon/> Back</button>
                        
                        <div className="md:flex md:justify-between md:items-start mb-6">
                            <div className="mb-4 md:mb-0">
                                <h2 className="text-3xl font-bold">{currentCommunity.name}</h2>
                                <p className="text-gray-400 mt-1">{currentCommunity.description}</p>
                            </div>
                            <button 
                                onClick={() => setShowCreatePostForm(prev => !prev)}
                                className="flex-shrink-0 flex items-center justify-center gap-2 bg-green-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-600 transition-colors w-full md:w-auto"
                            >
                                <PlusIcon /> <span>{showCreatePostForm ? 'Cancel' : 'New Post'}</span>
                            </button>
                        </div>
                        
                        {showCreatePostForm && (
                             <div className="bg-gray-800 p-6 rounded-2xl mb-8">
                                <form onSubmit={handleCreatePost}>
                                    <input type="text" name="postTitle" value={formState.postTitle} onChange={handleInputChange} className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white mb-3 focus:ring-2 focus:ring-green-500 outline-none" placeholder="Post Title" maxLength={100} />
                                    <textarea name="postContent" value={formState.postContent} onChange={handleInputChange} className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white mb-3 h-24 resize-none focus:ring-2 focus:ring-green-500 outline-none" placeholder="What's on your mind?" maxLength={500}></textarea>
                                    <button type="submit" className="bg-green-500 text-white font-semibold px-5 py-2 rounded-lg hover:bg-green-600 transition-colors">Create Post</button>
                                </form>
                            </div>
                        )}

                        <div className="space-y-4">
                            {currentCommunity.posts?.length ? currentCommunity.posts.map(p => <PostCard key={p.id} post={p} onClick={() => openPost(p)} />) : <div className="text-center text-gray-500 py-10">No posts yet. Be the first!</div>}
                        </div>
                    </div>
                );
            case 'post':
                if (!currentPost || !currentCommunity) return null;
                return (
                    <div>
                        <button onClick={() => openCommunity(currentCommunity)} className="flex items-center gap-2 bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-600 mb-6">
                            <BackIcon /> Back to {currentCommunity.name}
                        </button>
                        
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold mb-2 text-white">{currentPost.title}</h2>
                            <div className="text-gray-500 text-sm mb-4">
                                Posted by <span className="font-semibold text-gray-400">{currentPost.nickname}</span> • {timeAgo(currentPost.created_at)}
                            </div>
                            {currentPost.content && <p className="text-gray-300 whitespace-pre-wrap">{currentPost.content}</p>}
                        </div>
                        
                        <hr className="border-gray-700 my-8" />

                        <div>
                            <h3 className="text-2xl font-bold mb-6">Comments ({comments.length})</h3>
                            
                            <div className="bg-gray-800/50 p-6 rounded-2xl mb-8">
                               <form onSubmit={handleCreateComment}>
                                    <textarea name="commentText" value={formState.commentText} onChange={handleInputChange} className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white mb-3 h-24 resize-none focus:ring-2 focus:ring-green-500 outline-none" placeholder="Add to the discussion..." maxLength={300}></textarea>
                                    <button type="submit" className="bg-green-500 text-white font-semibold px-5 py-2 rounded-lg hover:bg-green-600 transition-colors">Post Comment</button>
                                </form>
                            </div>
                            
                            <div className="space-y-4">
                                {comments.length > 0 ? comments.map(c => <CommentCard key={c.id} comment={c} />) : <div className="text-center text-gray-500 py-10">Be the first to comment.</div>}
                            </div>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="min-h-screen flex flex-col font-sans">
            {isNicknameModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
                    <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4 text-white">Choose a Nickname</h3>
                        <p className="text-gray-400 mb-6 text-sm">You need a nickname to post or comment. This is stored only for your current session.</p>
                        <form onSubmit={handleSetNickname}>
                            <input 
                                type="text" 
                                value={tempNickname}
                                onChange={(e) => setTempNickname(e.target.value)}
                                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white mb-4 focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="e.g., SpeedySnail"
                                maxLength={25}
                                required
                            />
                            <button type="submit" className="w-full bg-green-500 text-white font-semibold py-3 rounded-lg hover:bg-green-600 transition-colors">
                                Save and Continue
                            </button>
                        </form>
                    </div>
                </div>
            )}
            <header className="bg-gray-800/80 backdrop-blur-sm p-4 border-b border-gray-700 flex items-center gap-6 sticky top-0 z-10">
                <button
                    onClick={() => setView('communities')}
                    className="flex items-center gap-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 rounded-lg transition-opacity hover:opacity-80"
                    aria-label="Go to homepage"
                >
                    <span className="text-2xl">🎓</span>
                    <span className="text-xl font-bold">CampConnect</span>
                </button>
                <div className="relative flex-1 max-w-lg">
                    <SearchIcon />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search communities..."
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-green-500 outline-none"
                    />
                </div>
            </header>
            <div className="flex flex-1">
                <aside className="w-64 bg-gray-800 p-4 border-r border-gray-700 hidden md:block">
                    <nav className="space-y-2">
                        <button onClick={() => setView('communities')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${view === 'communities' ? 'bg-green-500 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                            <HomeIcon /> Communities
                        </button>
                        <button onClick={() => { setView('create'); setFormState(p=>({...p, communityName: '', communityDesc: ''}))}} className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${view === 'create' ? 'bg-green-500 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                            <PlusIcon /> Create Community
                        </button>
                    </nav>
                </aside>
                <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-900 overflow-y-auto pb-24 md:pb-6 lg:pb-8">
                    {renderContent()}
                </main>
            </div>
            <footer className="text-center p-4 bg-gray-800 border-t border-gray-700 text-sm text-gray-500">
                Made with love by Broxgit
            </footer>
            {/* Mobile Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-gray-800/80 backdrop-blur-sm border-t border-gray-700 p-2 flex justify-around md:hidden z-20">
                <button 
                    onClick={() => setView('communities')} 
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-24 ${view === 'communities' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                    aria-label="Go to communities"
                >
                    <HomeIcon />
                    <span className="text-xs font-medium mt-1">Communities</span>
                </button>
                <button 
                    onClick={() => { setView('create'); setFormState(p=>({...p, communityName: '', communityDesc: ''}))}} 
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-24 ${view === 'create' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                    aria-label="Create a new community"
                >
                    <PlusIcon />
                    <span className="text-xs font-medium mt-1">Create</span>
                </button>
            </div>
        </div>
    );
};

export default AppLayout;