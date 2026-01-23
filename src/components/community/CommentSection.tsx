'use client';

import { useState, useEffect } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useAuthStore } from '@/store/useAuthStore';
import { MessageSquare, Send, Trash2, User, CornerDownRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Comment } from '@/types';

interface CommentSectionProps {
  recipeId: string;
}

export default function CommentSection({ recipeId }: CommentSectionProps) {
  const { comments, fetchComments, addComment, deleteComment } = useCommunityStore();
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [newComment, setNewComment] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyTo] = useState<string | null>(null); // comment ID
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments(recipeId);
  }, [recipeId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    await addComment(recipeId, newComment);
    setNewComment('');
    setIsSubmitting(false);
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;

    setIsSubmitting(true);
    await addComment(recipeId, replyContent, parentId);
    setReplyContent('');
    setReplyTo(null);
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('댓글을 삭제하시겠습니까?')) {
        await deleteComment(id);
    }
  };

  // Organize comments into hierarchy (1 level deep for simplicity)
  const rootComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => (
    <div className={`group flex gap-3 ${isReply ? 'ml-10 mt-3 border-l-2 border-zinc-800 pl-4' : 'mt-6'}`}>
        {/* Avatar */}
        <div 
            className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 cursor-pointer hover:bg-blue-900/30 hover:text-blue-400 transition-colors"
            onClick={(e) => {
                e.stopPropagation();
                router.push(`/profile/${comment.user_id}`);
            }}
        >
            {comment.user_avatar_url ? (
                <img src={comment.user_avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
                comment.user_name[0]?.toUpperCase()
            )}
        </div>

        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
                <span 
                    className="text-xs font-bold text-zinc-300 cursor-pointer hover:text-blue-400 hover:underline transition-all"
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/profile/${comment.user_id}`);
                    }}
                >
                    {comment.user_name}
                </span>
                
                {user && user.id === comment.user_id && (
                    <button 
                        onClick={() => handleDelete(comment.id)}
                        className="text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                        title="삭제"
                    >
                        <Trash2 size={12} />
                    </button>
                )}
            </div>
            
            <p className="text-sm text-zinc-400 leading-relaxed break-words">{comment.content}</p>
            
            {!isReply && (
                <div className="mt-2">
                    <button 
                        onClick={() => setReplyTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 font-medium flex items-center gap-1"
                    >
                        답글 달기
                    </button>
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="mt-12 border-t border-zinc-800 pt-8">
      <h4 className="text-sm font-bold text-zinc-400 mb-6 flex items-center gap-2">
        <MessageSquare size={16} />
        댓글 ({comments.length})
      </h4>

      {/* Comment List */}
      <div className="space-y-2 mb-8">
        {rootComments.length > 0 ? (
          rootComments.map((comment) => (
            <div key={comment.id}>
                <CommentItem comment={comment} />
                
                {/* Replies rendered first */}
                {getReplies(comment.id).map(reply => (
                    <CommentItem key={reply.id} comment={reply} isReply={true} />
                ))}

                {/* Reply Input moved here - After all replies */}
                {replyingTo === comment.id && (
                    <div className="ml-10 mt-3 border-l-2 border-zinc-800 pl-4">
                        <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                            <div className="text-zinc-600 pt-2"><CornerDownRight size={16} /></div>
                            <input 
                                autoFocus
                                className="flex-1 h-8 rounded-sm border border-zinc-800 bg-zinc-900 px-3 text-xs text-white outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
                                placeholder="답글을 입력하세요..."
                                value={replyContent}
                                onChange={e => setReplyContent(e.target.value)}
                            />
                            <button 
                                type="submit"
                                disabled={isSubmitting || !replyContent.trim()}
                                className="h-8 px-3 rounded-sm bg-zinc-800 text-zinc-300 hover:bg-blue-600 hover:text-white disabled:opacity-50 transition-colors text-xs shrink-0"
                            >
                                등록
                            </button>
                        </form>
                    </div>
                )}
            </div>
          ))
        ) : (
          <p className="text-xs text-zinc-600 text-center py-4">첫 번째 댓글을 남겨보세요.</p>
        )}
      </div>

      {/* Main Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2 sticky bottom-0 bg-zinc-950 pt-2 pb-1 border-t border-zinc-900">
            <input 
                className="flex-1 h-10 rounded-sm border border-zinc-800 bg-zinc-900 px-4 text-sm text-white outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
                placeholder="댓글을 입력하세요..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
            />
            <button 
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="h-10 px-4 rounded-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
            >
                <Send size={16} />
            </button>
        </form>
      ) : (
        <div className="text-center p-4 bg-zinc-900/30 rounded-sm border border-zinc-800 text-xs text-zinc-500">
            댓글을 작성하려면 로그인이 필요합니다.
        </div>
      )}
    </div>
  );
}
