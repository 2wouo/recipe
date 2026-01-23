import { create } from 'zustand';
import { CommunityRecipe, Comment } from '@/types';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';

type OrderBy = 'created_at' | 'likes_count' | 'views_count';

interface CommunityState {
  communityRecipes: CommunityRecipe[];
  myCommunityRecipes: CommunityRecipe[];
  likedRecipes: CommunityRecipe[];
  comments: Comment[];
  loading: boolean;
  
  fetchCommunityRecipes: (searchQuery?: string, orderBy?: OrderBy) => Promise<void>;
  fetchMyCommunityRecipes: () => Promise<void>;
  fetchLikedRecipes: () => Promise<void>;
  publishRecipe: (recipe: Omit<CommunityRecipe, 'id' | 'created_at' | 'likes_count' | 'views_count' | 'author_id' | 'is_liked'>) => Promise<{ success: boolean; error?: string }>;
  updateCommunityRecipe: (id: string, updates: Partial<Omit<CommunityRecipe, 'id' | 'created_at' | 'likes_count' | 'views_count' | 'author_id' | 'is_liked'>>) => Promise<{ success: boolean; error?: string }>;
  deleteCommunityRecipe: (id: string) => Promise<void>;
  
  fetchComments: (recipeId: string) => Promise<void>;
  addComment: (recipeId: string, content: string, parentId?: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  
  fetchRecipesByAuthor: (authorId: string) => Promise<CommunityRecipe[]>;
  toggleLike: (id: string) => Promise<void>;
  incrementViews: (id: string) => Promise<void>;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  communityRecipes: [],
  myCommunityRecipes: [],
  likedRecipes: [],
  comments: [],
  loading: false,

  fetchCommunityRecipes: async (searchQuery, orderBy = 'created_at') => {
    set({ loading: true });
    const supabase = createClient();
    const user = useAuthStore.getState().user;
    
    // Profiles 조인 + 내 좋아요 여부 확인
    let query = supabase
      .from('community_recipes')
      .select(`
        *, 
        profiles:author_id(username, avatar_url),
        recipe_likes!left(id)
      `)
      .order(orderBy, { ascending: false });

    // 내 좋아요 필터링용 (user_id가 내 것인 것만 가져오도록 조인 조건은 줄 수 없으므로 후처리 혹은 .eq 사용)
    // Supabase의 한계상 조인된 테이블에 내 ID 조건을 걸어야 함
    if (user) {
        query = query.filter('recipe_likes.user_id', 'eq', user.id);
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,author_name.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching community recipes:', error);
      set({ loading: false });
      return;
    }

    set({ 
      communityRecipes: (data || []).map((row: any) => ({
        id: row.id,
        original_recipe_id: row.original_recipe_id,
        title: row.title,
        description: row.description,
        ingredients: row.ingredients,
        steps: row.steps,
        author_id: row.author_id,
        author_name: row.profiles?.username || row.author_name,
        author_avatar_url: row.profiles?.avatar_url,
        created_at: row.created_at,
        likes_count: row.likes_count || 0,
        views_count: row.views_count || 0,
        is_liked: (row.recipe_likes || []).length > 0
      })),
      loading: false 
    });
  },

  fetchLikedRecipes: async () => {
    const supabase = createClient();
    const user = useAuthStore.getState().user;
    if (!user) return;

    // 내가 좋아요 누른 레시피 ID 목록 먼저 가져오기
    const { data: likes } = await supabase
        .from('recipe_likes')
        .select('recipe_id')
        .eq('user_id', user.id);
    
    const recipeIds = likes?.map(l => l.recipe_id) || [];
    if (recipeIds.length === 0) {
        set({ likedRecipes: [] });
        return;
    }

    // 해당 ID들의 레시피 정보 가져오기
    const { data, error } = await supabase
        .from('community_recipes')
        .select('*, profiles:author_id(username, avatar_url)')
        .in('id', recipeIds)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching liked recipes:', error);
        return;
    }

    set({ 
        likedRecipes: (data || []).map((row: any) => ({
            id: row.id,
            original_recipe_id: row.original_recipe_id,
            title: row.title,
            description: row.description,
            ingredients: row.ingredients,
            steps: row.steps,
            author_id: row.author_id,
            author_name: row.profiles?.username || row.author_name,
            author_avatar_url: row.profiles?.avatar_url,
            created_at: row.created_at,
            likes_count: row.likes_count || 0,
            views_count: row.views_count || 0,
            is_liked: true
        }))
    });
  },

  fetchMyCommunityRecipes: async () => {
    const supabase = createClient();
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('community_recipes')
      .select('*, profiles:author_id(username, avatar_url), recipe_likes!left(id)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my community recipes:', error);
      return;
    }

    set({ 
      myCommunityRecipes: (data || []).map((row: any) => ({
        id: row.id,
        original_recipe_id: row.original_recipe_id,
        title: row.title,
        description: row.description,
        ingredients: row.ingredients,
        steps: row.steps,
        author_id: row.author_id,
        author_name: row.profiles?.username || row.author_name,
        author_avatar_url: row.profiles?.avatar_url,
        created_at: row.created_at,
        likes_count: row.likes_count || 0,
        views_count: row.views_count || 0,
        is_liked: (row.recipe_likes || []).length > 0
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
        author_name: user.user_metadata?.username || user.email?.split('@')[0] || '사용자',
      })
      .select('*, profiles:author_id(username, avatar_url)')
      .single();

    if (error) {
      console.error('Error publishing recipe:', error);
      return { success: false, error: error.message };
    }

    const mapped = {
        ...data,
        author_name: (data as any).profiles?.username || (data as any).author_name,
        author_avatar_url: (data as any).profiles?.avatar_url,
        likes_count: 0,
        views_count: 0,
        is_liked: false
    } as CommunityRecipe;

    set(state => ({
      communityRecipes: [mapped, ...state.communityRecipes],
      myCommunityRecipes: [mapped, ...state.myCommunityRecipes]
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
      myCommunityRecipes: state.myCommunityRecipes.filter(r => r.id !== id),
      likedRecipes: state.likedRecipes.filter(r => r.id !== id)
    }));
  },

  fetchComments: async (recipeId) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles:user_id(username, avatar_url)')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }
    
    set({ 
        comments: (data || []).map((row: any) => ({
            id: row.id,
            recipe_id: row.recipe_id,
            parent_id: row.parent_id,
            user_id: row.user_id,
            user_name: row.profiles?.username || row.user_name,
            user_avatar_url: row.profiles?.avatar_url || row.user_avatar_url,
            content: row.content,
            created_at: row.created_at
        })) 
    });
  },

  addComment: async (recipeId, content, parentId) => {
    const supabase = createClient();
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('comments')
      .insert({
        recipe_id: recipeId,
        parent_id: parentId || null,
        user_id: user.id,
        user_name: user.user_metadata?.username || user.email?.split('@')[0] || '익명',
        user_avatar_url: user.user_metadata?.avatar_url,
        content
      })
      .select('*, profiles:user_id(username, avatar_url)')
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      alert('댓글 등록 실패: ' + error.message);
      return;
    }

    const mapped = {
        ...data,
        user_name: (data as any).profiles?.username || (data as any).user_name,
        user_avatar_url: (data as any).profiles?.avatar_url || (data as any).user_avatar_url
    } as Comment;

    set(state => ({ comments: [...state.comments, mapped] }));
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

  fetchRecipesByAuthor: async (authorId) => {
    const supabase = createClient();
    const user = useAuthStore.getState().user;
    
    const { data, error } = await supabase
      .from('community_recipes')
      .select('*, profiles:author_id(username, avatar_url), recipe_likes!left(id)')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching author recipes:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      original_recipe_id: row.original_recipe_id,
      title: row.title,
      description: row.description,
      ingredients: row.ingredients,
      steps: row.steps,
      author_id: row.author_id,
      author_name: row.profiles?.username || row.author_name,
      author_avatar_url: row.profiles?.avatar_url,
      created_at: row.created_at,
      likes_count: row.likes_count || 0,
      views_count: row.views_count || 0,
      is_liked: (row.recipe_likes || []).some((l: any) => l.user_id === user?.id)
    }));
  },

  toggleLike: async (id) => {
    const supabase = createClient();
    const user = useAuthStore.getState().user;
    if (!user) {
        alert('로그인이 필요합니다.');
        return;
    }

    const { data, error } = await supabase.rpc('toggle_recipe_like', { 
        target_recipe_id: id,
        target_user_id: user.id
    });

    if (error) {
        console.error('Error toggling like:', error);
        return;
    }
    
    const { liked } = data;

    // Update local state
    const updateLocal = (recipes: CommunityRecipe[]) => 
        recipes.map(r => r.id === id ? { 
            ...r, 
            likes_count: liked ? r.likes_count + 1 : r.likes_count - 1,
            is_liked: liked
        } : r);
    
    set(state => ({
        communityRecipes: updateLocal(state.communityRecipes),
        myCommunityRecipes: updateLocal(state.myCommunityRecipes),
        likedRecipes: liked 
            ? [...state.likedRecipes, state.communityRecipes.find(r => r.id === id)!]
            : state.likedRecipes.filter(r => r.id !== id)
    }));
  },

  incrementViews: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.rpc('increment_views', { recipe_id: id });
    if (error) {
        console.error('Error incrementing views:', error);
        return;
    }

    // Update local state
    const updateLocal = (recipes: CommunityRecipe[]) => 
        recipes.map(r => r.id === id ? { ...r, views_count: r.views_count + 1 } : r);
    
    set(state => ({
        communityRecipes: updateLocal(state.communityRecipes),
        myCommunityRecipes: updateLocal(state.myCommunityRecipes),
        likedRecipes: updateLocal(state.likedRecipes)
    }));
  }
}));
