'use client';

import { CommunityRecipe } from '@/types';
import { useRecipeStore } from '@/store/useRecipeStore';
import { useCommunityStore } from '@/store/useCommunityStore';
import { BookOpen, X, ChefHat, User, Clock, Heart, Eye } from 'lucide-react';
import { format } from 'date-fns';
import CommentSection from './CommentSection';

interface RecipeDetailModalProps {
  recipe: CommunityRecipe;
  onClose: () => void;
}

export default function RecipeDetailModal({ recipe, onClose }: RecipeDetailModalProps) {
  const { importRecipe } = useRecipeStore();
  const { toggleLike } = useCommunityStore();

  const handleImport = async () => {
    await importRecipe(recipe);
    onClose();
  };

  const handleLike = async () => {
      await toggleLike(recipe.id);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 px-4 backdrop-blur-md overflow-y-auto pt-10 pb-10">
      <div className="w-full max-w-2xl rounded-sm border border-zinc-800 bg-zinc-950 p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 relative my-auto">
        {/* Close Button */}
        <button onClick={onClose} className="absolute right-6 top-6 text-zinc-500 hover:text-white transition-colors z-10">
          <X size={28} />
        </button>

        {/* Header Section */}
        <div className="mb-8">
            <h2 className="text-3xl font-black text-white leading-tight pr-10">{recipe.title}</h2>
            <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-zinc-500">
                <span className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                        {recipe.author_avatar_url ? (
                            <img src={recipe.author_avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <User size={12}/>
                        )}
                    </div>
                    {recipe.author_name}
                </span>
                <div className="flex items-center gap-4 border-l border-zinc-800 pl-4">
                    <span className="flex items-center gap-1.5"><Clock size={14}/>{format(new Date(recipe.created_at), 'yyyy.MM.dd')}</span>
                    <span className="flex items-center gap-1.5"><Eye size={14}/>{recipe.views_count}</span>
                </div>
            </div>
        </div>

        {/* Content Section */}
        <div className="space-y-8">
            {recipe.description && (
                <div className="p-4 bg-zinc-900/50 rounded-sm border-l-4 border-blue-600 italic text-zinc-300">
                    "{recipe.description}"
                </div>
            )}

            <div className="grid gap-8 md:grid-cols-2">
                <div>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">재료</h4>
                    <ul className="space-y-2">
                        {recipe.ingredients.map((ing, idx) => (
                            <li key={idx} className="flex justify-between text-sm py-1 border-b border-zinc-900/50">
                                <span className={ing.isRequired ? "font-bold text-blue-400" : "text-zinc-200"}>
                                    {ing.isRequired && <span className="text-blue-500 mr-1">*</span>}
                                    {ing.name}
                                </span>
                                <span className="text-zinc-500">{ing.amount}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">조리 순서</h4>
                    <div className="space-y-4">
                        {recipe.steps.map((step, idx) => (
                            <div key={idx} className="flex gap-3">
                                <span className="h-5 w-5 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{idx+1}</span>
                                <p className="text-sm text-zinc-300 leading-relaxed">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex gap-3">
            <button 
                onClick={handleLike}
                className={`h-14 w-14 shrink-0 rounded-sm border border-zinc-800 bg-zinc-900 flex items-center justify-center transition-all group ${recipe.is_liked ? 'text-pink-500 bg-pink-500/10 border-pink-500/20' : 'text-zinc-500 hover:text-pink-500 hover:bg-pink-500/5'}`}
                title="좋아요"
            >
                <Heart size={24} className={`group-active:scale-125 transition-transform ${recipe.is_liked ? 'fill-pink-500' : ''}`} />
                <span className="sr-only">좋아요</span>
            </button>
            <button 
                onClick={handleImport}
                className="flex-1 h-14 rounded-sm bg-blue-600 text-white font-black hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20"
            >
                <BookOpen size={20} />
                내 보관함에 담기
            </button>
        </div>

        {/* Footer Stats */}
        <div className="flex justify-end mt-2">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Liked by {recipe.likes_count} people</span>
        </div>

        {/* Comments Section */}
        <CommentSection recipeId={recipe.id} />
      </div>
    </div>
  );
}
