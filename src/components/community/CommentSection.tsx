'use client';

import { useState, useEffect } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useAuthStore } from '@/store/useAuthStore';
import { MessageSquare, Send, Trash2, User } from 'lucide-react';
import { format } from 'date-fns';

interface CommentSectionProps {
  recipeId: string;
}

export default function CommentSection({ recipeId }: CommentSectionProps) {
  const { comments, fetchComments, addComment, deleteComment } = useCommunityStore();
  const { user } = useAuthStore();
  const [newComment, setNewComment] = useState('');
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

  const handleDelete = async (id: string) => {
    if (confirm('댓글을 삭제하시겠습니까?')) {
        await deleteComment(id);
    }
  };

  return (
    <div className="mt-12 border-t border-zinc-800 pt-8">
      <h4 className="text-sm font-bold text-zinc-400 mb-6 flex items-center gap-2">
        <MessageSquare size={16} />
        댓글 ({comments.length})
      </h4>

      {/* Comment List */}
      <div className="space-y-6 mb-8">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                {comment.user_name[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-zinc-300">{comment.user_name}</span>
                    <span className="text-[10px] text-zinc-600">{format(new Date(comment.created_at), 'yyyy.MM.dd HH:mm')}</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{comment.content}</p>
              </div>
              {user && user.id === comment.user_id && (
                <button 
                    onClick={() => handleDelete(comment.id)}
                    className="text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all self-start pt-1"
                >
                    <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-xs text-zinc-600 text-center py-4">첫 번째 댓글을 남겨보세요.</p>
        )}
      </div>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
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
