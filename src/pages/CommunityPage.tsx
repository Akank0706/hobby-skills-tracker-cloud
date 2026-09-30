import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Post, Comment, Skill } from '../types';
import {
  Users,
  Heart,
  MessageSquare,
  Share2,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Search,
  Filter,
  Send,
  X,
  AlertCircle,
  Award,
  UploadCloud
} from 'lucide-react';

interface CommunityPageProps {
  initialMilestone?: string;
  initialSkillId?: string;
}

const CATEGORIES = [
  'All',
  'Music',
  'Photography',
  'Coding',
  'Art',
  'Fitness',
  'Cooking',
  'Other'
];

export const CommunityPage: React.FC<CommunityPageProps> = ({
  initialMilestone,
  initialSkillId
}) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'likes'>('recent');

  // New post form state
  const [postContent, setPostContent] = useState('');
  const [postSkillId, setPostSkillId] = useState(initialSkillId || '');
  const [postMilestone, setPostMilestone] = useState(initialMilestone || '');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active comments drawer
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadFeed();
    loadUserSkills();
  }, [selectedCategory, sortBy]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const feed = await api.community.getFeed({
        category: selectedCategory,
        search: searchQuery,
        sort: sortBy
      });
      setPosts(feed);
    } catch (err) {
      console.error('Failed to load community feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserSkills = async () => {
    try {
      const userSkills = await api.skills.getAll();
      setSkills(userSkills);
    } catch (e) {
      console.warn('Could not load user skills:', e);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setPostError('Image file exceeds maximum permitted size of 5MB.');
      return;
    }

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setPostError('Invalid file type. Please upload a JPEG, PNG, WEBP, or GIF image.');
      return;
    }

    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setSelectedImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    setSubmittingPost(true);
    setPostError(null);

    try {
      let mediaUrl: string | undefined = undefined;

      // Upload image to Cloud Object Storage if attached
      if (selectedImageFile) {
        const uploadRes = await api.files.uploadImage(selectedImageFile);
        mediaUrl = uploadRes.url;
      }

      await api.community.createPost({
        content: postContent.trim(),
        skill_id: postSkillId || undefined,
        milestone: postMilestone.trim() || undefined,
        media_url: mediaUrl
      });

      // Reset form
      setPostContent('');
      setPostMilestone('');
      setPostSkillId('');
      handleClearImage();

      // Refresh feed
      await loadFeed();
    } catch (err: any) {
      setPostError(err.message || 'Failed to publish post');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleLikeToggle = async (postId: string) => {
    try {
      const res = await api.community.toggleLike(postId);
      setPosts(prev =>
        prev.map(p =>
          p.post_id === postId
            ? { ...p, is_liked_by_me: res.liked, likes_count: res.likesCount }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update like');
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedCommentsPostId === postId) {
      setExpandedCommentsPostId(null);
    } else {
      setExpandedCommentsPostId(postId);
      try {
        const comments = await api.community.getComments(postId);
        setCommentsMap(prev => ({ ...prev, [postId]: comments }));
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    setSubmittingComment(true);
    try {
      const newComment = await api.community.addComment(postId, text);
      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));

      // Increment comments count on post
      setPosts(prev =>
        prev.map(p =>
          p.post_id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
        )
      );
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await api.community.deleteComment(postId, commentId);
      setCommentsMap(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(c => c.comment_id !== commentId)
      }));
      setPosts(prev =>
        prev.map(p =>
          p.post_id === postId ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p
        )
      );
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Delete this post permanently from cloud feed?')) return;
    try {
      await api.community.deletePost(postId);
      setPosts(prev => prev.filter(p => p.post_id !== postId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete post');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Title */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Community Learning Feed
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Share skill milestones, upload achievement proofs to cloud storage, and interact with peers.
        </p>
      </div>

      {/* Create Post Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-start space-x-3">
          <img
            src={user?.profile_picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`}
            alt={user?.name}
            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
          />

          <div className="flex-1">
            <form onSubmit={handleCreatePost} className="space-y-3">
              <textarea
                rows={3}
                required
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                placeholder={`Share an update or milestone achievement, ${user?.name || ''}...`}
                className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />

              {/* Milestone & Skill Tag selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={postMilestone}
                  onChange={e => setPostMilestone(e.target.value)}
                  placeholder="Optional milestone (e.g. 30 Hours Milestone 🎸)"
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />

                <select
                  value={postSkillId}
                  onChange={e => setPostSkillId(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  <option value="">Tag a skill (optional)</option>
                  {skills.map(s => (
                    <option key={s.skill_id} value={s.skill_id}>
                      {s.skill_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="relative inline-block mt-2">
                  <img
                    src={imagePreview}
                    alt="Upload Preview"
                    className="max-h-60 rounded-lg border border-slate-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute top-2 right-2 p-1 bg-slate-900/70 text-white rounded-full hover:bg-slate-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {postError && (
                <div className="p-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{postError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="post-image-upload"
                  />
                  <label
                    htmlFor="post-image-upload"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium cursor-pointer transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Attach Photo Proof</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submittingPost || !postContent.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingPost ? 'Posting to Cloud...' : 'Publish Post'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Filters and Search Strip */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadFeed()}
            placeholder="Search feed by keyword, topic, or username..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-medium text-slate-700 outline-hidden"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Disciplines' : c}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-medium text-slate-700 outline-hidden"
          >
            <option value="recent">Most Recent</option>
            <option value="likes">Most Liked</option>
          </select>
        </div>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading community feed...</div>
      ) : posts.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border border-dashed border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No community posts found</p>
          <p className="text-xs text-slate-400 mt-1">Be the first to share an achievement or practice milestone!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => {
            const isOwner = user?.user_id === post.user_id;
            const postComments = commentsMap[post.post_id] || [];

            return (
              <div
                key={post.post_id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Post Header */}
                <div className="p-5 pb-3 flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={
                        post.author_avatar ||
                        `https://api.dicebear.com/7.x/identicon/svg?seed=${post.author_username}`
                      }
                      alt={post.author_name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-100"
                    />
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-sm text-slate-900">{post.author_name}</span>
                        <span className="text-xs text-slate-400">@{post.author_username}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        {new Date(post.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {post.skill_name && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {post.skill_name}
                      </span>
                    )}

                    {isOwner && (
                      <button
                        onClick={() => handleDeletePost(post.post_id)}
                        title="Delete post"
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Milestone Pill if any */}
                {post.milestone && (
                  <div className="px-5 pb-2">
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-xs font-semibold">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>{post.milestone}</span>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="px-5 py-2">
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                {/* Media Image */}
                {post.media_url && (
                  <div className="mt-3 bg-slate-100 border-y border-slate-100">
                    <img
                      src={post.media_url}
                      alt="Achievement Proof"
                      className="w-full max-h-96 object-contain mx-auto"
                    />
                  </div>
                )}

                {/* Engagement Bar */}
                <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLikeToggle(post.post_id)}
                      className={`flex items-center space-x-1.5 font-semibold transition-colors ${
                        post.is_liked_by_me ? 'text-rose-600' : 'text-slate-500 hover:text-rose-600'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          post.is_liked_by_me ? 'fill-rose-600 text-rose-600' : ''
                        }`}
                      />
                      <span>{post.likes_count} Likes</span>
                    </button>

                    <button
                      onClick={() => handleToggleComments(post.post_id)}
                      className="flex items-center space-x-1.5 font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.comments_count} Comments</span>
                    </button>
                  </div>
                </div>

                {/* Comments Drawer */}
                {expandedCommentsPostId === post.post_id && (
                  <div className="bg-slate-50 p-4 border-t border-slate-100 space-y-3">
                    {/* Add comment input */}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={commentInputs[post.post_id] || ''}
                        onChange={e =>
                          setCommentInputs({ ...commentInputs, [post.post_id]: e.target.value })
                        }
                        onKeyDown={e => e.key === 'Enter' && handleAddComment(post.post_id)}
                        placeholder="Write a constructive comment or encouragement..."
                        className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      />
                      <button
                        onClick={() => handleAddComment(post.post_id)}
                        disabled={submittingComment || !(commentInputs[post.post_id] || '').trim()}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>

                    {/* Comments list */}
                    {postComments.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2 text-center">No comments yet. Start the conversation!</p>
                    ) : (
                      <div className="space-y-2 pt-2">
                        {postComments.map(comment => {
                          const isCommentOwner = user?.user_id === comment.user_id;

                          return (
                            <div
                              key={comment.comment_id}
                              className="flex items-start justify-between bg-white p-2.5 rounded-lg border border-slate-200 text-xs"
                            >
                              <div className="flex items-start space-x-2">
                                <img
                                  src={
                                    comment.author_avatar ||
                                    `https://api.dicebear.com/7.x/identicon/svg?seed=${comment.author_username}`
                                  }
                                  alt={comment.author_name}
                                  className="w-6 h-6 rounded-full mt-0.5"
                                />
                                <div>
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-bold text-slate-800">{comment.author_name}</span>
                                    <span className="text-[10px] text-slate-400">@{comment.author_username}</span>
                                  </div>
                                  <p className="text-slate-700 mt-0.5">{comment.text}</p>
                                </div>
                              </div>

                              {isCommentOwner && (
                                <button
                                  onClick={() => handleDeleteComment(post.post_id, comment.comment_id)}
                                  title="Delete your comment"
                                  className="text-slate-300 hover:text-red-500 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
