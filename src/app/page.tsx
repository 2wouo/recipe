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

      <div className="rounded-sm border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-6 font-bold text-lg flex items-center gap-2">
            <AlertCircle className="text-orange-500" size={20} />
            유통기한 임박 식재료 (7일 내)
        </h3>
        
        <div className="grid gap-6 lg:grid-cols-3">
            {/* 냉장실 */}
            <div className="space-y-3">
                <h4 className="text-sm font-bold text-blue-400 border-b border-zinc-800 pb-2 mb-3">냉장실</h4>
                {expiringSoon.filter(i => i.storageType === 'FRIDGE').length > 0 ? (
                    expiringSoon.filter(i => i.storageType === 'FRIDGE').slice(0, 5).map(item => (
                        <ExpiringItemRow key={item.id} item={item} today={today} />
                    ))
                ) : (
                    <EmptyState />
                )}
            </div>

            {/* 냉동실 */}
            <div className="space-y-3">
                <h4 className="text-sm font-bold text-cyan-300 border-b border-zinc-800 pb-2 mb-3">냉동실</h4>
                {expiringSoon.filter(i => i.storageType === 'FREEZER').length > 0 ? (
                    expiringSoon.filter(i => i.storageType === 'FREEZER').slice(0, 5).map(item => (
                        <ExpiringItemRow key={item.id} item={item} today={today} />
                    ))
                ) : (
                    <EmptyState />
                )}
            </div>

            {/* 실온 */}
            <div className="space-y-3">
                <h4 className="text-sm font-bold text-amber-400 border-b border-zinc-800 pb-2 mb-3">실온/펜트리</h4>
                {expiringSoon.filter(i => i.storageType === 'PANTRY').length > 0 ? (
                    expiringSoon.filter(i => i.storageType === 'PANTRY').slice(0, 5).map(item => (
                        <ExpiringItemRow key={item.id} item={item} today={today} />
                    ))
                ) : (
                    <EmptyState />
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

function ExpiringItemRow({ item, today }: { item: any, today: Date }) {
    const days = differenceInDays(parseISO(item.expiryDate), today);
    return (
        <div className="flex items-center justify-between rounded-md bg-zinc-950 p-3 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
            <div className="overflow-hidden">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-zinc-500 truncate">{item.detail}</p>
            </div>
            <span className={`text-xs font-bold whitespace-nowrap ml-2 ${days < 0 ? 'text-red-500' : days <= 3 ? 'text-orange-500' : 'text-yellow-500'}`}>
                {days < 0 ? `+${Math.abs(days)}일` : `D-${days}`}
            </span>
        </div>
    )
}

function EmptyState() {
    return <div className="text-xs text-zinc-600 text-center py-4 bg-zinc-900/30 rounded-md">임박한 재료 없음</div>
}
