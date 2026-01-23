'use client';

import { useEffect, useState } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useRecipeStore } from '@/store/useRecipeStore';
import { Search, Heart, User, Clock, Trash2, BookOpen, ChevronRight, X, ChefHat, ExternalLink, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { CommunityRecipe, Recipe } from '@/types';
import PublishModal from '@/components/community/PublishModal';
import CommentSection from '@/components/community/CommentSection';

export default function CommunityPage() {
  const { communityRecipes, myCommunityRecipes, loading, fetchCommunityRecipes, fetchMyCommunityRecipes, deleteCommunityRecipe } = useCommunityStore();
  const { importRecipe } = useRecipeStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<CommunityRecipe | null>(null);
  const [recipeToEdit, setRecipeToEdit] = useState<CommunityRecipe | null>(null);

  useEffect(() => {
    fetchCommunityRecipes();
    fetchMyCommunityRecipes();
  }, [fetchCommunityRecipes, fetchMyCommunityRecipes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCommunityRecipes(searchQuery);
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

  const handleImport = async (recipe: CommunityRecipe) => {
      await importRecipe(recipe);
      setSelectedRecipe(null);
  };

  const recipesToShow = activeTab === 'all' ? communityRecipes : myCommunityRecipes;

  // Convert CommunityRecipe to Recipe for the modal props
  const mockRecipeForEdit: Recipe | null = recipeToEdit ? {
      id: recipeToEdit.original_recipe_id || '', // or just empty string if null
      title: recipeToEdit.title,
      description: recipeToEdit.description,
      currentVersion: '1.0', // dummy
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
            placeholder="레시피 제목 검색..."
            className="w-full h-10 rounded-sm border border-zinc-800 bg-zinc-900 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 transition-colors"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
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
                onClick={() => setSelectedRecipe(recipe)}
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
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center">
                        <User size={12} className="text-zinc-500" />
                    </div>
                    <span className="text-xs text-zinc-500">{recipe.author_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-600">
                    <div className="flex items-center gap-1 text-[10px]">
                        <Clock size={12} />
                        {format(new Date(recipe.created_at), 'MM.dd')}
                    </div>
                    <div className="flex items-center gap-1 text-[10px]">
                        <Heart size={12} />
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 px-4 backdrop-blur-md overflow-y-auto pt-10 pb-10">
          <div className="w-full max-w-2xl rounded-sm border border-zinc-800 bg-zinc-950 p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 relative my-auto">
            <button 
              onClick={() => setSelectedRecipe(null)}
              className="absolute right-6 top-6 text-zinc-500 hover:text-white"
            >
              <X size={28} />
            </button>

            <div className="mb-8">
                <div className="flex items-center gap-2 text-blue-500 text-xs font-bold uppercase tracking-widest mb-2">
                    <ChefHat size={14} />
                    Community Recipe
                </div>
                <h2 className="text-3xl font-black text-white leading-tight">{selectedRecipe.title}</h2>
                <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500">
                    <span className="flex items-center gap-1.5"><User size={14}/>{selectedRecipe.author_name}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14}/>{format(new Date(selectedRecipe.created_at), 'yyyy.MM.dd')}</span>
                </div>
            </div>

            <div className="space-y-8">
                {selectedRecipe.description && (
                    <div className="p-4 bg-zinc-900/50 rounded-sm border-l-4 border-blue-600 italic text-zinc-300">
                        "{selectedRecipe.description}"
                    </div>
                )}

                <div className="grid gap-8 md:grid-cols-2">
                    <div>
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">재료</h4>
                        <ul className="space-y-2">
                            {selectedRecipe.ingredients.map((ing, idx) => (
                                <li key={idx} className="flex justify-between text-sm py-1 border-b border-zinc-900/50">
                                    <span className="text-zinc-200">{ing.name}</span>
                                    <span className="text-zinc-500">{ing.amount}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">조리 순서</h4>
                        <div className="space-y-4">
                            {selectedRecipe.steps.map((step, idx) => (
                                <div key={idx} className="flex gap-3">
                                    <span className="h-5 w-5 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{idx+1}</span>
                                    <p className="text-sm text-zinc-300 leading-relaxed">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 flex gap-4">
                <button 
                    onClick={() => handleImport(selectedRecipe)}
                    className="flex-1 h-14 rounded-sm bg-blue-600 text-white font-black hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20"
                >
                    <BookOpen size={20} />
                    내 보관함에 담기
                </button>
            </div>

            <CommentSection recipeId={selectedRecipe.id} />
          </div>
        </div>
      )}
    </div>
  );
}
