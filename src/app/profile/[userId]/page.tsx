'use client';

import { useEffect, useState } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import { CommunityRecipe } from '@/types';
import { User, Clock, Heart, ArrowLeft, ChefHat } from 'lucide-react';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import RecipeDetailModal from '@/components/community/RecipeDetailModal';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const { fetchRecipesByAuthor } = useCommunityStore();
  
  const [recipes, setRecipes] = useState<CommunityRecipe[]>([]);
  const [profile, setProfile] = useState<{ username: string, avatar_url?: string } | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<CommunityRecipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      const supabase = createClient();
      
      // 1. Fetch User Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .single();
      
      if (profileData) {
          setProfile(profileData);
      }

      // 2. Fetch Recipes
      const data = await fetchRecipesByAuthor(userId);
      setRecipes(data);
      
      setLoading(false);
    };

    if (userId) loadData();
  }, [userId, fetchRecipesByAuthor]);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4">
       {/* Header */}
       <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold tracking-tight text-white">요리사 프로필</h2>
       </div>

       {loading ? (
           <div className="py-20 text-center">
               <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
           </div>
       ) : (
           <>
            {/* Profile Card */}
            <div className="flex flex-col items-center justify-center py-10 bg-zinc-900/30 rounded-lg border border-zinc-800">
                <div className="h-24 w-24 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden mb-4 border-2 border-zinc-700 shadow-xl">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                        <User size={40} className="text-zinc-500" />
                    )}
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{profile?.username || '알 수 없는 요리사'}</h3>
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                    <ChefHat size={14} />
                    <span>레시피 {recipes.length}개</span>
                </div>
            </div>

            {/* Recipe Grid */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 pl-1">레시피</h3>
                {recipes.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {recipes.map((recipe) => (
                            <div 
                                key={recipe.id}
                                onClick={() => setSelectedRecipe(recipe)}
                                className="group relative flex flex-col rounded-sm border border-zinc-800 bg-zinc-900/30 p-5 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all cursor-pointer"
                            >
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">
                                        {recipe.title}
                                    </h3>
                                </div>
                                <p className="text-sm text-zinc-400 line-clamp-2 mb-6 flex-1">
                                    {recipe.description || '설명이 없는 레시피입니다.'}
                                </p>
                                <div className="flex items-center justify-between border-t border-zinc-800 pt-4 text-zinc-600 text-[10px]">
                                    <span className="flex items-center gap-1"><Clock size={12} />{format(new Date(recipe.created_at), 'yyyy.MM.dd')}</span>
                                    <span className="flex items-center gap-1"><Heart size={12} />{recipe.likes_count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-zinc-500 py-10 border border-dashed border-zinc-800 rounded-sm">
                        등록된 레시피가 없습니다.
                    </p>
                )}
            </div>
           </>
       )}

       {selectedRecipe && (
           <RecipeDetailModal 
                recipe={selectedRecipe}
                onClose={() => setSelectedRecipe(null)}
           />
       )}
    </div>
  );
}