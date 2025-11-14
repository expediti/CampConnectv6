// Fix: Import React to resolve namespace errors for React.FC, React.ChangeEvent, etc.
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Community, Post, Comment } from '../types';
import { supabase } from '../services/supabase';
import { timeAgo } from '../utils/timeAgo';
import { HomeIcon, PlusIcon, SearchIcon, BackIcon, LoadingIcon } from './icons/Icons';

interface AppLayoutProps {
  nickname: string;
  setNickname: (nickname: string) => void;
}

// Sub-components
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

export default function AppLayout({ nickname }: AppLayoutProps) {
    const navigate = useNavigate();
    const { communityId, postId } = useParams();

    const [view, setView] = useState<'communities' | 'create' | 'community' | 'post'>('communities');
    const [communities, setCommunities] = useState<Community[]>([]);
    const [allCommunities, setAllCommunities] = useState<Community[]>([]);
    const [currentCommunity, setCurrentCommunity] = useState<Community | null>(null);
    const [currentPost, setCurrentPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreatePostForm, setShowCreatePostForm] = useState(false);

    const [formState, setFormState] = useState({
        communityName: '',
        communityDesc: '',
        postTitle: '',
        postContent: '',
        commentText: '',
    });

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
        } catch (error) { console.error('Load error:', error); } 
        finally { setLoading(false); }
    }, []);

    const fetchCommunityDetails = useCallback(async (id: string) => {
        setLoading(true);
        const { data, error } = await supabase.from('communities').select('*').eq('id', id).single();
        if (error || !data) {
            navigate('/app');
            return;
        }
        const { data: postsData, error: postsError } = await supabase.from('posts').select('*').eq('community_id', data.id).order('created_at', { ascending: false });
        if (postsError) {
            setLoading(false);
            return;
        }
        const postsWithCounts = await Promise.all(
            postsData.map(async (post) => {
                const { count } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
                return { ...post, commentsCount: count || 0 };
            })
        );
        setCurrentCommunity({ ...data, posts: postsWithCounts });
        setView('community');
        setLoading(false);
    }, [navigate]);

    const fetchPostDetails = useCallback(async (id: string) => {
        setLoading(true);
        const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
        if (error || !data) {
            navigate('/app');
            return;
        }
        const { data: communityData, error: communityError } = await supabase.from('communities').select('*').eq('id', data.community_id).single();
        if (communityError || !communityData) {
            navigate('/app');
            return;
        }
        const { data: commentsData, error: commentsError } = await supabase.from('comments').select('*').eq('post_id', data.id).order('created_at', { ascending: true });
        
        setCurrentPost(data);
        setCurrentCommunity(communityData);
        setComments(commentsData || []);
        setView('post');
        setLoading(false);
    }, [navigate]);

    useEffect(() => {
        if (postId) {
            fetchPostDetails(postId);
        } else if (communityId) {
            fetchCommunityDetails(communityId);
        } else {
            setView('communities');
            loadCommunities();
        }
    }, [postId, communityId, fetchPostDetails, fetchCommunityDetails, loadCommunities]);

    useEffect(() => {
        const filtered = allCommunities.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setCommunities(filtered);
    }, [searchQuery, allCommunities]);

    const handleCreateCommunity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.communityName) { alert('Please enter a community name'); return; }
        const { error } = await supabase.from('communities').insert([{ name: formState.communityName, description: formState.communityDesc || 'No description' }]);
        if (error) { alert('Error: ' + error.message); }
        else {
            setFormState(prev => ({ ...prev, communityName: '', communityDesc: '' }));
            alert('Community created!');
            goHome();
        }
    };
    
    const goHome = () => navigate('/app');
    const openCommunity = (community: Community) => navigate(`/app/community/${community.id}`);
    const openPost = (post: Post) => navigate(`/app/post/${post.id}`);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.postTitle || !currentCommunity) { alert('Please enter a post title'); return; }
        const { error } = await supabase.from('posts').insert([{ community_id: currentCommunity.id, title: formState.postTitle, content: formState.postContent || '', nickname: nickname }]);
        if (error) { alert('Error: ' + error.message); }
        else {
            setFormState(prev => ({ ...prev, postTitle: '', postContent: '' }));
            setShowCreatePostForm(false);
            fetchCommunityDetails(currentCommunity.id.toString());
        }
    };
    
    const createComment = async () => {
        if (!formState.commentText.trim() || !currentPost) return;
        
        const optimisticComment = { id: Date.now(), post_id: currentPost.id, text: formState.commentText.trim(), nickname, created_at: new Date().toISOString() };
        setComments(prev => [...prev, optimisticComment]);
        setFormState(prev => ({ ...prev, commentText: '' }));

        const { data, error } = await supabase.from('comments').insert([{ post_id: currentPost.id, text: optimisticComment.text, nickname }]).select().single();
        if (error) {
            setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
            alert('Failed to post comment');
        } else {
            setComments(prev => prev.map(c => (c.id === optimisticComment.id ? data : c)));
        }
    };

    const renderContent = () => {
        if (loading) return <div className="flex justify-center items-center h-full"><LoadingIcon /></div>;
        switch (view) {
            case 'communities': return (
                <div>
                    <h2 className="text-3xl font-bold mb-6 text-white">All Communities</h2>
                    {communities.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {communities.map(c => <CommunityCard key={c.id} community={c} onClick={() => openCommunity(c)} />)}
                        </div>
                    ) : <div className="text-center text-gray-500 py-16">No communities found.</div>}
                </div>
            );
            case 'create': return (
                <div>
                    <h2 className="text-3xl font-bold mb-6">Create New Community</h2>
                    <div className="bg-gray-800 p-8 rounded-2xl">
                        <form onSubmit={handleCreateCommunity}>
                            <input type="text" name="communityName" value={formState.communityName} onChange={handleInputChange} className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg mb-4" placeholder="Community Name" maxLength={50} />
                            <textarea name="communityDesc" value={formState.communityDesc} onChange={handleInputChange} className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg mb-4 h-32 resize-none" placeholder="Description (optional)" maxLength={200}></textarea>
                            <button type="submit" className="bg-green-500 font-semibold px-6 py-3 rounded-lg hover:bg-green-600">Create Community</button>
                        </form>
                    </div>
                </div>
            );
            case 'community': if (!currentCommunity) return null; return (
                <div>
                    <button onClick={goHome} className="flex items-center gap-2 bg-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-600 mb-6"><BackIcon/> Back</button>
                    <div className="md:flex md:justify-between md:items-start mb-6">
                        <div className="mb-4 md:mb-0">
                            <h2 className="text-3xl font-bold">{currentCommunity.name}</h2>
                            <p className="text-gray-400 mt-1">{currentCommunity.description}</p>
                        </div>
                        <button onClick={() => setShowCreatePostForm(p => !p)} className="flex-shrink-0 flex items-center justify-center gap-2 bg-green-500 font-semibold px-4 py-2 rounded-lg hover:bg-green-600 w-full md:w-auto">
                            <PlusIcon /> <span>{showCreatePostForm ? 'Cancel' : 'New Post'}</span>
                        </button>
                    </div>
                    {showCreatePostForm && (
                         <div className="bg-gray-800 p-6 rounded-2xl mb-8">
                            <form onSubmit={handleCreatePost}>
                                <input type="text" name="postTitle" value={formState.postTitle} onChange={handleInputChange} className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg mb-3" placeholder="Post Title" maxLength={100} />
                                <textarea name="postContent" value={formState.postContent} onChange={handleInputChange} className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg mb-3 h-24 resize-none" placeholder="What's on your mind?" maxLength={500}></textarea>
                                <button type="submit" className="bg-green-500 font-semibold px-5 py-2 rounded-lg hover:bg-green-600">Create Post</button>
                            </form>
                        </div>
                    )}
                    <div className="space-y-4">
                        {currentCommunity.posts?.length ? currentCommunity.posts.map(p => <PostCard key={p.id} post={p} onClick={() => openPost(p)} />) : <div className="text-center text-gray-500 py-10">No posts yet. Be the first!</div>}
                    </div>
                </div>
            );
            case 'post': if (!currentPost || !currentCommunity) return null; return (
                <div>
                    <button onClick={() => openCommunity(currentCommunity)} className="flex items-center gap-2 bg-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-600 mb-6">
                        <BackIcon /> Back to {currentCommunity.name}
                    </button>
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold mb-2">{currentPost.title}</h2>
                        <div className="text-gray-500 text-sm mb-4">Posted by <span className="font-semibold text-gray-400">{currentPost.nickname}</span> • {timeAgo(currentPost.created_at)}</div>
                        {currentPost.content && <p className="text-gray-300 whitespace-pre-wrap">{currentPost.content}</p>}
                    </div>
                    <hr className="border-gray-700 my-8" />
                    <div>
                        <h3 className="text-2xl font-bold mb-6">Comments ({comments.length})</h3>
                        <div className="bg-gray-800/50 p-6 rounded-2xl mb-8">
                           <form onSubmit={(e) => {e.preventDefault(); createComment();}}>
                                <textarea name="commentText" value={formState.commentText} onChange={handleInputChange} className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg mb-3 h-24 resize-none" placeholder="Add to the discussion..." maxLength={300}></textarea>
                                <button type="submit" className="bg-green-500 font-semibold px-5 py-2 rounded-lg hover:bg-green-600">Post Comment</button>
                            </form>
                        </div>
                        <div className="space-y-4">{comments.length > 0 ? comments.map(c => <CommentCard key={c.id} comment={c} />) : <div className="text-center text-gray-500 py-10">Be the first to comment.</div>}</div>
                    </div>
                </div>
            );
        }
    };
    
    return (
        <div className="min-h-screen flex flex-col font-sans">
            <header className="bg-gray-800/80 backdrop-blur-sm p-4 border-b border-gray-700 flex items-center gap-6 sticky top-0 z-10">
                <button onClick={goHome} className="flex items-center gap-2" aria-label="Go to homepage">
                    <span className="text-2xl">🎓</span><span className="text-xl font-bold">CampConnect</span>
                </button>
                <div className="relative flex-1 max-w-lg">
                    <SearchIcon />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search communities..." className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
            </header>
            <div className="flex flex-1">
                <aside className="w-64 bg-gray-800 p-4 border-r border-gray-700 hidden md:block">
                    <nav className="space-y-2">
                        <button onClick={goHome} className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold ${view === 'communities' ? 'bg-green-500 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                            <HomeIcon /> Communities
                        </button>
                        <button onClick={() => { navigate('/app'); setView('create'); }} className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold ${view === 'create' ? 'bg-green-500 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                            <PlusIcon /> Create Community
                        </button>
                    </nav>
                </aside>
                <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-900 overflow-y-auto pb-24 md:pb-6 lg:pb-8">
                    {renderContent()}
                </main>
            </div>
            <div className="fixed bottom-0 left-0 right-0 bg-gray-800/80 backdrop-blur-sm border-t border-gray-700 p-2 flex justify-around md:hidden z-20">
                <button onClick={goHome} className={`flex flex-col items-center justify-center p-2 rounded-lg w-24 ${view === 'communities' ? 'text-green-400' : 'text-gray-400'}`} aria-label="Go to communities">
                    <HomeIcon /> <span className="text-xs font-medium mt-1">Communities</span>
                </button>
                <button onClick={() => { navigate('/app'); setView('create'); }} className={`flex flex-col items-center justify-center p-2 rounded-lg w-24 ${view === 'create' ? 'text-green-400' : 'text-gray-400'}`} aria-label="Create a new community">
                    <PlusIcon /> <span className="text-xs font-medium mt-1">Create</span>
                </button>
            </div>
        </div>
    );
};