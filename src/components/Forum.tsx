import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  Plus, 
  Search, 
  Filter, 
  User as UserIcon, 
  Clock, 
  Send,
  X,
  Image as ImageIcon,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  increment,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';

interface ForumPost {
  id: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  commentCount: number;
  timestamp: any;
  image?: string;
}

interface ForumComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: any;
}

interface ForumProps {
  user: User | null;
}

const CATEGORIES = [
  { id: 'all', name: 'అన్నీ (All)', icon: <Filter size={16} /> },
  { id: 'experience', name: 'అనుభవాలు (Experience)', icon: <ChevronRight size={16} /> },
  { id: 'question', name: 'ప్రశ్నలు (Questions)', icon: <ChevronRight size={16} /> },
  { id: 'tips', name: 'చిట్కాలు (Tips)', icon: <ChevronRight size={16} /> },
];

const Forum: React.FC<ForumProps> = ({ user }) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New Post State
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('experience');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comments State
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    // Fetch all posts ordered by timestamp to avoid composite index requirement
    const q = query(collection(db, 'forum_posts'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ForumPost[];
      
      // Apply category filter client-side
      if (activeCategory !== 'all') {
        setPosts(postsData.filter(post => post.category === activeCategory));
      } else {
        setPosts(postsData);
      }
      
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeCategory]);

  useEffect(() => {
    if (!selectedPost) return;

    const q = query(
      collection(db, `forum_posts/${selectedPost.id}/comments`), 
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ForumComment[];
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [selectedPost]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPostTitle.trim() || !newPostContent.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'forum_posts'), {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'రైతు సోదరుడు',
        title: newPostTitle,
        content: newPostContent,
        category: newPostCategory,
        likes: 0,
        commentCount: 0,
        timestamp: serverTimestamp(),
      });
      setNewPostTitle('');
      setNewPostContent('');
      setShowCreateModal(false);
      alert('పోస్ట్ విజయవంతంగా చేయబడింది! (Post created successfully!)');
    } catch (error: any) {
      console.error("Error adding post: ", error);
      alert('పోస్ట్ చేయడంలో విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి. (Failed to post. Please try again.)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const postRef = doc(db, 'forum_posts', postId);
      await updateDoc(postRef, {
        likes: increment(1)
      });
    } catch (error) {
      console.error("Error liking post: ", error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPost || !newComment.trim()) return;

    try {
      await addDoc(collection(db, `forum_posts/${selectedPost.id}/comments`), {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'రైతు సోదరుడు',
        content: newComment,
        timestamp: serverTimestamp(),
      });

      const postRef = doc(db, 'forum_posts', selectedPost.id);
      await updateDoc(postRef, {
        commentCount: increment(1)
      });

      setNewComment('');
      alert('సమాధానం పంపబడింది! (Reply sent!)');
    } catch (error: any) {
      console.error("Error adding comment: ", error);
      alert('సమాధానం పంపడంలో విఫలమైంది. (Failed to send reply.)');
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]" id="forum-container">
      {/* Search & Filter Header */}
      <div className="bg-white border-b border-black/5 p-4 space-y-4 sticky top-0 z-20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input 
            type="text" 
            placeholder="ఫోరమ్‌లో వెతకండి..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f1f3f5] border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#1b5e20] outline-none"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id 
                  ? 'bg-[#1b5e20] text-white shadow-md' 
                  : 'bg-white text-stone-500 border border-stone-200 hover:border-[#1b5e20]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="text-sm">పోస్ట్‌లను లోడ్ చేస్తున్నాము...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
            <p>ఎటువంటి పోస్ట్‌లు లేవు.</p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedPost(post)}
              className="bg-white rounded-[24px] p-5 shadow-sm border border-black/5 hover:border-[#1b5e20]/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#e8f5e9] flex items-center justify-center text-[#1b5e20]">
                  <UserIcon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-800">{post.userName}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-stone-400">
                    <Clock size={10} />
                    <span>{post.timestamp ? post.timestamp.toDate().toLocaleDateString('te-IN') : 'ఇప్పుడే'}</span>
                    <span className="px-2 py-0.5 bg-stone-100 rounded-full text-[#1b5e20] font-bold uppercase tracking-wider">
                      {post.category}
                    </span>
                  </div>
                </div>
              </div>

              <h3 className="text-base font-bold text-stone-900 mb-2 group-hover:text-[#1b5e20] transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-stone-600 line-clamp-3 mb-4 leading-relaxed">
                {post.content}
              </p>

              <div className="flex items-center gap-6 pt-3 border-t border-stone-50">
                <button 
                  onClick={(e) => handleLike(post.id, e)}
                  className="flex items-center gap-1.5 text-stone-400 hover:text-rose-500 transition-colors"
                >
                  <Heart size={18} className={post.likes > 0 ? 'fill-rose-500 text-rose-500' : ''} />
                  <span className="text-xs font-bold">{post.likes}</span>
                </button>
                <div className="flex items-center gap-1.5 text-stone-400">
                  <MessageSquare size={18} />
                  <span className="text-xs font-bold">{post.commentCount}</span>
                </div>
                <button className="flex items-center gap-1.5 text-stone-400 hover:text-[#1b5e20] transition-colors ml-auto">
                  <Share2 size={18} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#1b5e20] text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30"
      >
        <Plus size={28} />
      </button>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b flex items-center justify-between bg-[#1b5e20] text-white">
                <h2 className="text-xl font-bold">కొత్త పోస్ట్ సృష్టించండి</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleCreatePost} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5">వర్గం (Category)</label>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewPostCategory(cat.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          newPostCategory === cat.id 
                            ? 'bg-[#1b5e20] text-white' 
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5">శీర్షిక (Title)</label>
                  <input 
                    type="text" 
                    required
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="మీ పోస్ట్ శీర్షికను ఇక్కడ టైప్ చేయండి..."
                    className="w-full bg-[#f8f9fa] border border-stone-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1b5e20] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5">విషయం (Content)</label>
                  <textarea 
                    required
                    rows={5}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="మీ అనుభవాన్ని లేదా ప్రశ్నను ఇక్కడ వివరించండి..."
                    className="w-full bg-[#f8f9fa] border border-stone-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1b5e20] outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1b5e20] text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-[#144317] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  పోస్ట్ చేయండి
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full h-full sm:h-[90vh] sm:max-w-2xl bg-white sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                <button onClick={() => setSelectedPost(null)} className="p-2 hover:bg-stone-100 rounded-full text-stone-600">
                  <X size={24} />
                </button>
                <div className="text-center">
                  <h2 className="text-sm font-bold text-stone-900">పోస్ట్ వివరాలు</h2>
                </div>
                <div className="w-10" /> {/* Spacer */}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Post Content */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#e8f5e9] flex items-center justify-center text-[#1b5e20]">
                      <UserIcon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900">{selectedPost.userName}</h4>
                      <p className="text-xs text-stone-400">{selectedPost.timestamp ? selectedPost.timestamp.toDate().toLocaleString('te-IN') : 'ఇప్పుడే'}</p>
                    </div>
                  </div>
                  <h1 className="text-xl font-bold text-stone-900 leading-tight">{selectedPost.title}</h1>
                  <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
                </div>

                {/* Comments Section */}
                <div className="pt-6 border-t border-stone-100">
                  <h3 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
                    <MessageSquare size={18} />
                    సమాధానాలు ({comments.length})
                  </h3>
                  
                  <div className="space-y-4">
                    {comments.map(comment => (
                      <div key={comment.id} className="bg-stone-50 p-4 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-[#1b5e20]">{comment.userName}</span>
                          <span className="text-[10px] text-stone-400">{comment.timestamp ? comment.timestamp.toDate().toLocaleDateString('te-IN') : 'ఇప్పుడే'}</span>
                        </div>
                        <p className="text-sm text-stone-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add Comment Input */}
              <div className="p-4 bg-white border-t border-stone-100">
                <form onSubmit={handleAddComment} className="flex items-center gap-3">
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="మీ సమాధానాన్ని ఇక్కడ టైప్ చేయండి..."
                    className="flex-1 bg-[#f8f9fa] border border-stone-200 rounded-full px-5 py-2.5 text-sm focus:ring-2 focus:ring-[#1b5e20] outline-none"
                  />
                  <button 
                    type="submit"
                    disabled={!newComment.trim()}
                    className="bg-[#1b5e20] text-white p-2.5 rounded-full hover:bg-[#144317] disabled:opacity-50 transition-all"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Forum;
