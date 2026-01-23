import { create } from 'zustand';
import { Recipe, RecipeVersion } from '@/types';
import { supabase } from '@/lib/supabase';

interface RecipeState {
  recipes: Recipe[];
  fetchRecipes: () => Promise<void>;
  addRecipe: (recipe: Recipe) => Promise<void>;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => Promise<void>;
  addVersion: (recipeId: string, version: RecipeVersion) => Promise<void>;
  updateVersion: (recipeId: string, versionIndex: number, updatedVersion: RecipeVersion) => Promise<void>;
  setPrimaryVersion: (recipeId: string, version: string) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],

  fetchRecipes: async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipes:', error);
      return;
    }

    const mappedRecipes: Recipe[] = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      currentVersion: row.current_version as string,
      versions: (row.versions as RecipeVersion[]) || [],
    }));

    set({ recipes: mappedRecipes });
  },

  addRecipe: async (recipe) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('로그인이 필요합니다.');
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
    const updates: Record<string, unknown> = {};
    if (updatedRecipe.title) updates.title = updatedRecipe.title;
    if (updatedRecipe.description !== undefined) updates.description = updatedRecipe.description;
    
    // versions나 currentVersion 업데이트는 별도 함수로 처리 권장하지만, 여기서도 가능
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
    const recipe = get().recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const updatedVersions = [...recipe.versions, version];
    
    const { error } = await supabase.from('recipes').update({
        versions: updatedVersions,
        current_version: version.version // 새 버전 추가 시 자동으로 대표 버전 변경? (기존 로직 따름)
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
    const recipe = get().recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const newVersions = [...recipe.versions];
    newVersions[versionIndex] = updatedVersion;
    
    // If we edited the last version, update currentVersion display too
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

  setPrimaryVersion: async (recipeId, version) => {
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
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) {
        console.error('Error deleting recipe:', error);
        return;
    }
    set((state) => ({
      recipes: state.recipes.filter((recipe) => recipe.id !== id),
    }));
  },
}));
