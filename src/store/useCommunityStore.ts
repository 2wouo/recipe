import { create } from 'zustand';
import { CommunityRecipe } from '@/types';
import { supabase } from '@/lib/supabase'; // Using client-side supabase for queries
import { useAuthStore } from '@/store/useAuthStore';

interface CommunityState {
  communityRecipes: CommunityRecipe[];
  myCommunityRecipes: CommunityRecipe[];
  loading: boolean;
  
  fetchCommunityRecipes: (searchQuery?: string) => Promise<void>;
  fetchMyCommunityRecipes: () => Promise<void>;
  publishRecipe: (recipe: Omit<CommunityRecipe, 'id' | 'created_at' | 'likes_count' | 'author_id'>) => Promise<{ success: boolean; error?: string }>;
  deleteCommunityRecipe: (id: string) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  communityRecipes: [],
  myCommunityRecipes: [],
  loading: false,

  fetchCommunityRecipes: async (searchQuery) => {
    set({ loading: true });
    let query = supabase
      .from('community_recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching community recipes:', error);
      set({ loading: false });
      return;
    }

    set({ 
      communityRecipes: (data || []).map(row => ({
        id: row.id,
        original_recipe_id: row.original_recipe_id,
        title: row.title,
        description: row.description,
        ingredients: row.ingredients,
        steps: row.steps,
        author_id: row.author_id,
        author_name: row.author_name,
        created_at: row.created_at,
        likes_count: row.likes_count
      })),
      loading: false 
    });
  },

  fetchMyCommunityRecipes: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('community_recipes')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my community recipes:', error);
      return;
    }

    set({ 
      myCommunityRecipes: (data || []).map(row => ({
        id: row.id,
        original_recipe_id: row.original_recipe_id,
        title: row.title,
        description: row.description,
        ingredients: row.ingredients,
        steps: row.steps,
        author_id: row.author_id,
        author_name: row.author_name,
        created_at: row.created_at,
        likes_count: row.likes_count
      }))
    });
  },

  publishRecipe: async (recipeData) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: '로그인이 필요합니다.' };

    const { data, error } = await supabase
      .from('community_recipes')
      .insert({
        ...recipeData,
        author_id: user.id,
        author_name: user.user_metadata?.display_name || user.email?.split('@')[0] || '사용자',
      })
      .select()
      .single();

    if (error) {
      console.error('Error publishing recipe:', error);
      return { success: false, error: error.message };
    }

    // Update local state
    set(state => ({
      communityRecipes: [data as CommunityRecipe, ...state.communityRecipes],
      myCommunityRecipes: [data as CommunityRecipe, ...state.myCommunityRecipes]
    }));

    return { success: true };
  },

  deleteCommunityRecipe: async (id) => {
    const { error } = await supabase
      .from('community_recipes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting community recipe:', error);
      return;
    }

    set(state => ({
      communityRecipes: state.communityRecipes.filter(r => r.id !== id),
      myCommunityRecipes: state.myCommunityRecipes.filter(r => r.id !== id)
    }));
  },

  toggleLike: async (id) => {
    // 좋아요 기능은 나중에 likes 테이블을 따로 만들어서 관리하는 게 좋지만
    // 일단 간단하게 카운트만 올리는 로직 (실제로는 중복 방지 로직 필요)
    const { data, error } = await supabase.rpc('increment_likes', { recipe_id: id });
    // (참고: increment_likes는 RPC 함수 정의 필요, 여기서는 생략하거나 단순 업데이트 시도)
  }
}));
