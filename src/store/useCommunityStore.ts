import { create } from 'zustand';
import { CommunityRecipe, Comment } from '@/types';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';

interface CommunityState {
  communityRecipes: CommunityRecipe[];
  myCommunityRecipes: CommunityRecipe[];
  comments: Comment[];
  loading: boolean;
  
  fetchCommunityRecipes: (searchQuery?: string) => Promise<void>;
  fetchMyCommunityRecipes: () => Promise<void>;
  publishRecipe: (recipe: Omit<CommunityRecipe, 'id' | 'created_at' | 'likes_count' | 'author_id'>) => Promise<{ success: boolean; error?: string }>;
  updateCommunityRecipe: (id: string, updates: Partial<Omit<CommunityRecipe, 'id' | 'created_at' | 'likes_count' | 'author_id'>>) => Promise<{ success: boolean; error?: string }>;
  deleteCommunityRecipe: (id: string) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  
  fetchComments: (recipeId: string) => Promise<void>;
  addComment: (recipeId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  communityRecipes: [],
  myCommunityRecipes: [],
  comments: [],
  loading: false,

  fetchComments: async (recipeId) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }
    
    set({ comments: data as Comment[] });
  },

  addComment: async (recipeId, content) => {
    const supabase = createClient();
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('comments')
      .insert({
        recipe_id: recipeId,
        user_id: user.id,
        user_name: user.user_metadata?.display_name || user.email?.split('@')[0] || '익명',
        content
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      alert('댓글 등록 실패: ' + error.message);
      return;
    }

    set(state => ({ comments: [...state.comments, data as Comment] }));
  },

  deleteComment: async (commentId) => {
    const supabase = createClient();
    const { error } = await supabase.from('comments').delete().eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return;
    }

    set(state => ({ comments: state.comments.filter(c => c.id !== commentId) }));
  },

  fetchCommunityRecipes: async (searchQuery) => {
    set({ loading: true });
    const supabase = createClient();
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
    const supabase = createClient();
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
    const supabase = createClient();
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

  updateCommunityRecipe: async (id, updates) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('community_recipes')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating community recipe:', error);
      return { success: false, error: error.message };
    }

    // Update local state
    set(state => ({
      communityRecipes: state.communityRecipes.map(r => r.id === id ? { ...r, ...updates } : r),
      myCommunityRecipes: state.myCommunityRecipes.map(r => r.id === id ? { ...r, ...updates } : r)
    }));

    return { success: true };
  },

  deleteCommunityRecipe: async (id) => {
    const supabase = createClient();
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
    const supabase = createClient();
    // RPC increment logic
  }
}));
