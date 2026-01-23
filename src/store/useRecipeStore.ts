import { create } from 'zustand';
import { Recipe, RecipeVersion, CommunityRecipe } from '@/types';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';

interface RecipeState {
  recipes: Recipe[];
  fetchRecipes: () => Promise<void>;
  addRecipe: (recipe: Recipe) => Promise<void>;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => Promise<void>;
  addVersion: (recipeId: string, version: RecipeVersion) => Promise<void>;
  updateVersion: (recipeId: string, versionIndex: number, updatedVersion: RecipeVersion) => Promise<void>;
  deleteVersion: (recipeId: string, versionIndex: number) => Promise<void>;
  setPrimaryVersion: (recipeId: string, version: string) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  importRecipe: (communityRecipe: CommunityRecipe) => Promise<void>;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],

  fetchRecipes: async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipes:', error);
      return;
    }

    const mappedRecipes: Recipe[] = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      currentVersion: row.current_version,
      versions: (row.versions as RecipeVersion[]) || [],
      user_id: row.user_id,
      is_public: row.is_public
    }));

    set({ recipes: mappedRecipes });
  },

  addRecipe: async (recipe) => {
    const supabase = createClient();
    const user = useAuthStore.getState().user;
    
    if (!user) {
        alert('로그인이 필요합니다. 다시 로그인해주세요.');
        return;
    }

    const { error } = await supabase.from('recipes').insert({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      current_version: recipe.currentVersion,
      versions: recipe.versions,
      user_id: user.id,
    });

    if (error) {
      console.error('Error adding recipe:', error);
      alert('레시피 등록 실패: ' + error.message);
      return;
    }

    set((state) => ({ recipes: [...state.recipes, recipe] }));
  },

  updateRecipe: async (id, updatedRecipe) => {
    const supabase = createClient();
    const updates: any = {};
    if (updatedRecipe.title) updates.title = updatedRecipe.title;
    if (updatedRecipe.description !== undefined) updates.description = updatedRecipe.description;
    if (updatedRecipe.currentVersion) updates.current_version = updatedRecipe.currentVersion;
    if (updatedRecipe.versions) updates.versions = updatedRecipe.versions;

    const { error } = await supabase.from('recipes').update(updates).eq('id', id);

    if (error) {
       console.error('Error updating recipe:', error);
       return;
    }

    set((state) => ({
      recipes: state.recipes.map((recipe) =>
        recipe.id === id ? { ...recipe, ...updatedRecipe } : recipe
      ),
    }));
  },

  addVersion: async (recipeId, version) => {
    const supabase = createClient();
    const recipe = get().recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const updatedVersions = [...recipe.versions, version];
    
    const { error } = await supabase.from('recipes').update({
        versions: updatedVersions,
        current_version: version.version
    }).eq('id', recipeId);

    if (error) {
        console.error('Error adding version:', error);
        return;
    }

    set((state) => ({
      recipes: state.recipes.map((r) =>
        r.id === recipeId
          ? {
              ...r,
              currentVersion: version.version,
              versions: updatedVersions,
            }
          : r
      ),
    }));
  },

  updateVersion: async (recipeId, versionIndex, updatedVersion) => {
    const supabase = createClient();
    const recipe = get().recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const newVersions = [...recipe.versions];
    newVersions[versionIndex] = updatedVersion;
    
    const isLatest = versionIndex === recipe.versions.length - 1;
    const newCurrentVersion = isLatest ? updatedVersion.version : recipe.currentVersion;

    const { error } = await supabase.from('recipes').update({
        versions: newVersions,
        current_version: newCurrentVersion
    }).eq('id', recipeId);

    if (error) {
        console.error('Error updating version:', error);
        return;
    }

    set((state) => ({
      recipes: state.recipes.map((r) => {
        if (r.id !== recipeId) return r;
        return {
          ...r,
          currentVersion: newCurrentVersion,
          versions: newVersions,
        };
      }),
    }));
  },

  deleteVersion: async (recipeId, versionIndex) => {
    const supabase = createClient();
    const recipe = get().recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    if (recipe.versions.length <= 1) {
        alert('최소 하나의 버전은 유지해야 합니다. 레시피 자체를 삭제해주세요.');
        return;
    }

    const versionToDelete = recipe.versions[versionIndex];
    const newVersions = recipe.versions.filter((_, idx) => idx !== versionIndex);
    
    // 대표 버전을 삭제하는 경우, 가장 최신 버전을 새 대표로 설정
    let newCurrentVersion = recipe.currentVersion;
    if (versionToDelete.version === recipe.currentVersion) {
        newCurrentVersion = newVersions[newVersions.length - 1].version;
    }

    const { error } = await supabase.from('recipes').update({
        versions: newVersions,
        current_version: newCurrentVersion
    }).eq('id', recipeId);

    if (error) {
        console.error('Error deleting version:', error);
        return;
    }

    set((state) => ({
      recipes: state.recipes.map((r) => {
        if (r.id !== recipeId) return r;
        return {
          ...r,
          currentVersion: newCurrentVersion,
          versions: newVersions,
        };
      }),
    }));
  },

  setPrimaryVersion: async (recipeId, version) => {
    const supabase = createClient();
    const { error } = await supabase.from('recipes').update({
        current_version: version
    }).eq('id', recipeId);

    if (error) {
        console.error('Error setting primary version:', error);
        return;
    }

    set((state) => ({
      recipes: state.recipes.map((recipe) =>
        recipe.id === recipeId ? { ...recipe, currentVersion: version } : recipe
      ),
    }));
  },

  deleteRecipe: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) {
        console.error('Error deleting recipe:', error);
        return;
    }
    set((state) => ({
      recipes: state.recipes.filter((recipe) => recipe.id !== id),
    }));
  },

  importRecipe: async (communityRecipe) => {
    const supabase = createClient();
    const user = useAuthStore.getState().user;
    
    if (!user) {
        alert('로그인이 필요합니다.');
        return;
    }

    const newRecipe: Recipe = {
        id: crypto.randomUUID(),
        title: communityRecipe.title,
        description: communityRecipe.description,
        currentVersion: '1.0',
        versions: [{
            version: '1.0',
            ingredients: communityRecipe.ingredients,
            steps: communityRecipe.steps,
            notes: `커뮤니티에서 가져옴 (원본 작성자: ${communityRecipe.author_name})`,
            createdAt: new Date().toISOString()
        }],
        user_id: user.id
    };

    const { error } = await supabase.from('recipes').insert({
        id: newRecipe.id,
        title: newRecipe.title,
        description: newRecipe.description,
        current_version: newRecipe.currentVersion,
        versions: newRecipe.versions,
        user_id: user.id,
    });

    if (error) {
        console.error('Error importing recipe:', error);
        alert('레시피 가져오기 실패: ' + error.message);
        return;
    }

    set((state) => ({ recipes: [newRecipe, ...state.recipes] }));
    alert('레시피를 내 보관함에 담았습니다!');
  },
}));