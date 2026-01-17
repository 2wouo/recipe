import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Recipe, RecipeVersion } from '@/types';

interface RecipeState {
  recipes: Recipe[];
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  addVersion: (recipeId: string, version: RecipeVersion) => void;
  updateVersion: (recipeId: string, versionIndex: number, updatedVersion: RecipeVersion) => void;
  setPrimaryVersion: (recipeId: string, version: string) => void;
  deleteRecipe: (id: string) => void;
}

const initialData: Recipe[] = [
  {
    id: '1',
    title: '알리오 올리오',
    description: '마늘 향 가득한 파스타',
    currentVersion: '1.2',
    versions: [
      {
        version: '1.0',
        ingredients: [],
        steps: [],
        notes: '마늘 5알 사용, 약간 싱거움',
        createdAt: '2024-01-10T10:00:00Z'
      },
      {
        version: '1.2',
        ingredients: [],
        steps: [],
        notes: '마늘 8알로 증량, 페페론치노 추가로 매콤함 강화',
        createdAt: '2024-01-15T18:30:00Z'
      }
    ]
  }
];

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set) => ({
      recipes: initialData,
      addRecipe: (recipe) => set((state) => ({ recipes: [...state.recipes, recipe] })),
      updateRecipe: (id, updatedRecipe) =>
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === id ? { ...recipe, ...updatedRecipe } : recipe
          ),
        })),
      addVersion: (recipeId, version) =>
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === recipeId
              ? {
                  ...recipe,
                  currentVersion: version.version,
                  versions: [...recipe.versions, version],
                }
              : recipe
          ),
        })),
      updateVersion: (recipeId, versionIndex, updatedVersion) =>
        set((state) => ({
          recipes: state.recipes.map((recipe) => {
            if (recipe.id !== recipeId) return recipe;
            
            const newVersions = [...recipe.versions];
            newVersions[versionIndex] = updatedVersion;
            
            // If we edited the last version, update currentVersion display too
            const isLatest = versionIndex === recipe.versions.length - 1;
            
            return {
              ...recipe,
              currentVersion: isLatest ? updatedVersion.version : recipe.currentVersion,
              versions: newVersions,
            };
          }),
        })),
      setPrimaryVersion: (recipeId, version) =>
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === recipeId ? { ...recipe, currentVersion: version } : recipe
          ),
        })),
      deleteRecipe: (id) =>
        set((state) => ({
          recipes: state.recipes.filter((recipe) => recipe.id !== id),
        })),
    }),
    {
      name: 'recipe-storage',
    }
  )
);