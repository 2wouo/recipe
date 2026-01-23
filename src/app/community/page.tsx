'use client';

import { useEffect, useState } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useRecipeStore } from '@/store/useRecipeStore';
import { Search, Heart, User, Clock, Trash2, BookOpen, ChevronRight, X, ChefHat, ExternalLink, Pencil, Eye, ArrowDownWideNarrow } from 'lucide-react';
import { format } from 'date-fns';
import { CommunityRecipe, Recipe } from '@/types';
import PublishModal from '@/components/community/PublishModal';
import RecipeDetailModal from '@/components/community/RecipeDetailModal';
import { useRouter } from 'next/navigation';

export default function CommunityPage() {
  const router = useRouter();
  const { communityRecipes, myCommunityRecipes, likedRecipes, loading, fetchCommunityRecipes, fetchMyCommunityRecipes, fetchLikedRecipes, deleteCommunityRecipe, incrementViews } = useCommunityStore();
  const { importRecipe } = useRecipeStore();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'liked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortOrder] = useState<'created_at' | 'likes_count' | 'views_count'>('created_at');
  
  const [selectedRecipe, setSelectedRecipe] = useState<CommunityRecipe | null>(null);
  const [recipeToEdit, setRecipeToEdit] = useState<CommunityRecipe | null>(null);

  useEffect(() => {
    if (activeTab === 'all') fetchCommunityRecipes(searchQuery, sortBy);
    else if (activeTab === 'mine') fetchMyCommunityRecipes();
    else if (activeTab === 'liked') fetchLikedRecipes();
  }, [fetchCommunityRecipes, fetchMyCommunityRecipes, fetchLikedRecipes, activeTab, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'all') fetchCommunityRecipes(searchQuery, sortBy);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('커뮤니티에서 이 레시피를 삭제하시겠습니까? (내 보관함의 원본은 유지됩니다)')) {
      await deleteCommunityRecipe(id);
    }
  };

  const handleEdit = (recipe: CommunityRecipe, e: React.MouseEvent) => {
      e.stopPropagation();
      setRecipeToEdit(recipe);
  };

  const handleSelectRecipe = (recipe: CommunityRecipe) => {
      setSelectedRecipe(recipe);
      incrementViews(recipe.id); 
  };

  const recipesToShow = activeTab === 'all' 
    ? communityRecipes 
    : activeTab === 'mine' 
        ? myCommunityRecipes 
        : likedRecipes;

  const mockRecipeForEdit: Recipe | null = recipeToEdit ? {
      id: recipeToEdit.original_recipe_id || '', 
      title: recipeToEdit.title,
      description: recipeToEdit.description,
      currentVersion: '1.0', 
      versions: [{
          version: '1.0',
          ingredients: recipeToEdit.ingredients,
          steps: recipeToEdit.steps,
          notes: '',
          createdAt: recipeToEdit.created_at
      }]
  } : null;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ChefHat className="text-blue-500" size={24} />
            커뮤니티
          </h2>
        </div>
        
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
          <input 
            placeholder="레시피 제목 또는 작성자 검색..."
            className="w-full h-10 rounded-sm border border-zinc-800 bg-zinc-900 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 transition-colors"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Tabs & Sorting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800">
        <div className="flex">
            <button 
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-zinc-500 hover:text-white'}`}
            >
            탐색하기
            </button>
            <button 
            onClick={() => setActiveTab('mine')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'mine' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-zinc-500 hover:text-white'}`}
            >
            내 게시물 ({myCommunityRecipes.length})
            </button>
            <button 
            onClick={() => setActiveTab('liked')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'liked' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-zinc-500 hover:text-white'}`}
            >
            좋아요 ({likedRecipes.length})
            </button>
        </div>

        {activeTab === 'all' && (
            <div className="flex items-center gap-1 pb-2 sm:pb-0 px-2">
                <ArrowDownWideNarrow size={14} className="text-zinc-500 mr-1" />
                <button 
                    onClick={() => setSortOrder('created_at')}
                    className={`px-2 py-1 text-[10px] font-bold rounded-sm transition-colors ${sortBy === 'created_at' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                    최신순
                </button>
                <button 
                    onClick={() => setSortOrder('likes_count')}
                    className={`px-2 py-1 text-[10px] font-bold rounded-sm transition-colors ${sortBy === 'likes_count' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                    인기순
                </button>
                <button 
                    onClick={() => setSortOrder('views_count')}
                    className={`px-2 py-1 text-[10px] font-bold rounded-sm transition-colors ${sortBy === 'views_count' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                    조회순
                </button>
            </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-zinc-500">레시피를 불러오고 있습니다...</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipesToShow.length > 0 ? (
            recipesToShow.map((recipe) => (
              <div 
                key={recipe.id}
                onClick={() => handleSelectRecipe(recipe)}
                className="group relative flex flex-col rounded-sm border border-zinc-800 bg-zinc-900/30 p-5 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all cursor-pointer"
              >
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">
                    {recipe.title}
                  </h3>
                  {activeTab === 'mine' && (
                    <div className="flex gap-1">
                        <button 
                        onClick={(e) => handleEdit(recipe, e)}
                        className="text-zinc-600 hover:text-blue-500 p-1 transition-colors"
                        >
                        <Pencil size={16} />
                        </button>
                        <button 
                        onClick={(e) => handleDelete(recipe.id, e)}
                        className="text-zinc-600 hover:text-red-500 p-1 transition-colors"
                        >
                        <Trash2 size={16} />
                        </button>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-zinc-400 line-clamp-2 mb-6 flex-1">
                  {recipe.description || '설명이 없는 레시피입니다.'}
                </p>

                <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors group/author"
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/profile/${recipe.author_id}`);
                    }}
                  >
                    <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden group-hover/author:bg-blue-900/30 transition-colors">
                        {recipe.author_avatar_url ? (
                            <img src={recipe.author_avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <User size={12} className="text-zinc-500 group-hover/author:text-blue-400" />
                        )}
                    </div>
                    <span className="text-xs text-zinc-500 group-hover/author:text-blue-400">{recipe.author_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-600">
                    <div className="flex items-center gap-1 text-[10px]">
                        <Clock size={12} />
                        {format(new Date(recipe.created_at), 'MM.dd')}
                    </div>
                    <div className="flex items-center gap-1 text-[10px]">
                        <Eye size={12} />
                        {recipe.views_count}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] transition-colors">
                        <Heart size={12} className={recipe.is_liked ? "fill-pink-500 text-pink-500" : ""} />
                        {recipe.likes_count}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-32 text-center border border-dashed border-zinc-800 rounded-sm">
                <BookOpen size={48} className="mx-auto text-zinc-800 mb-4" />
                <p className="text-zinc-500">
                    {activeTab === 'mine' ? '아직 커뮤니티에 게시한 레시피가 없습니다.' : '검색 결과가 없습니다.'}
                </p>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {mockRecipeForEdit && recipeToEdit && (
          <PublishModal 
            recipe={mockRecipeForEdit}
            communityRecipeId={recipeToEdit.id}
            isOpen={!!recipeToEdit}
            onClose={() => setRecipeToEdit(null)}
          />
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetailModal 
            recipe={selectedRecipe} 
            onClose={() => setSelectedRecipe(null)} 
        />
      )}
    </div>
  );
}