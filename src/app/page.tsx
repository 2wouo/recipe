'use client';

import { useEffect } from 'react';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useRecipeStore } from '@/store/useRecipeStore';
import { Refrigerator, BookOpen, AlertCircle, Clock, ChefHat, ArrowRight } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import Link from 'next/link';

// Dashboard for Smart Kitchen Log
export default function Home() {
  const { items, fetchItems } = useInventoryStore();
  const { recipes, fetchRecipes } = useRecipeStore();

  useEffect(() => {
    fetchItems();
    fetchRecipes();
  }, [fetchItems, fetchRecipes]);

  const today = new Date();

  // 1. 임박 재료 찾기 (7일 이내)
  const expiringSoon = items
    .filter((item) => {
      const daysLeft = differenceInDays(parseISO(item.expiryDate), today);
      return daysLeft >= 0 && daysLeft <= 7;
    })
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  // 2. 추천 알고리즘
  const getRecommendedRecipe = () => {
    if (recipes.length === 0) return null;

    const scoredRecipes = recipes.map(recipe => {
      // Find current version ingredients
      const currentVer = recipe.versions.find(v => v.version === recipe.currentVersion);
      if (!currentVer) return { recipe, score: 0, reasons: [] };

      let score = 0;
      const reasons: string[] = [];

      currentVer.ingredients.forEach(ing => {
        // Find matching inventory item
        const stockItem = items.find(item => item.name.trim() === ing.name.trim());
        
        if (stockItem) {
          score += 1; // Base score for having ingredient
          
          // Check expiry
          const daysLeft = differenceInDays(parseISO(stockItem.expiryDate), today);
          if (daysLeft >= 0 && daysLeft <= 7) {
            score += 10; // High score for using expiring item
            if (!reasons.includes(stockItem.name)) reasons.push(stockItem.name);
          }
        }
      });

      return { recipe, score, reasons };
    });

    // Sort by score desc
    scoredRecipes.sort((a, b) => b.score - a.score);

    // Return top result if score > 0
    return scoredRecipes[0].score > 0 ? scoredRecipes[0] : null;
  };

  const recommendation = getRecommendedRecipe();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight">대시보드</h2>
        <p className="text-zinc-400">주방의 현황을 한눈에 확인하세요.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-sm border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">전체 재고</h3>
            <Refrigerator className="text-blue-500" size={18} />
          </div>
          <p className="mt-2 text-3xl font-bold">{items.length}개</p>
        </div>
        <div className="rounded-sm border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">저장된 레시피</h3>
            <BookOpen className="text-blue-500" size={18} />
          </div>
          <p className="mt-2 text-3xl font-bold">{recipes.length}개</p>
        </div>
        <div className="rounded-sm border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">소비 임박 (7일 내)</h3>
            <AlertCircle className="text-orange-500" size={18} />
          </div>
          <p className="mt-2 text-3xl font-bold">{expiringSoon.length}개</p>
        </div>
        
        {/* Recommendation Card */}
        <div className="relative overflow-hidden rounded-sm border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-blue-900/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-400 flex items-center gap-1">
                <ChefHat size={16} />
                오늘의 추천
            </h3>
          </div>
          {recommendation ? (
            <div>
                <p className="text-xl font-bold truncate">{recommendation.recipe.title}</p>
                {recommendation.reasons.length > 0 ? (
                    <p className="mt-1 text-xs text-orange-400">
                        임박 재료: {recommendation.reasons.join(', ')}
                    </p>
                ) : (
                    <p className="mt-1 text-xs text-zinc-500">
                        보유 재료 활용 가능
                    </p>
                )}
            </div>
          ) : (
             <p className="mt-2 text-lg font-bold text-zinc-500">추천 요리 찾기...</p>
          )}
          {recommendation && (
             <Link href={`/recipes?id=${recommendation.recipe.id}`} className="absolute bottom-4 right-4 text-blue-500 hover:text-blue-400">
                 <ArrowRight size={20} />
             </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-sm border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="mb-4 font-bold">유통기한 임박 식재료</h3>
          {expiringSoon.length > 0 ? (
            <div className="space-y-3">
              {expiringSoon.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-sm bg-zinc-950 p-3 border border-zinc-800">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-zinc-500">{item.storageType}</p>
                  </div>
                  <span className="text-sm font-bold text-orange-500">
                    D-{differenceInDays(parseISO(item.expiryDate), today)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-zinc-500">임박한 식재료가 없습니다.</p>
          )}
        </div>

        <div className="rounded-sm border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="mb-4 font-bold">최근 레시피</h3>
          {recipes.length > 0 ? (
            <div className="space-y-3">
              {recipes.slice(0, 5).map((recipe) => (
                <div key={recipe.id} className="flex items-center justify-between rounded-sm bg-zinc-950 p-3 border border-zinc-800">
                  <p className="font-medium">{recipe.title}</p>
                  <span className="text-xs text-blue-500">v{recipe.currentVersion}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <p className="text-sm text-zinc-500">등록된 레시피가 없습니다.</p>
              <button className="rounded-sm bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                첫 레시피 작성하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
