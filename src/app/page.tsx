'use client';

import { useEffect, useState } from 'react';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useRecipeStore } from '@/store/useRecipeStore';
import { Refrigerator, BookOpen, AlertCircle, Clock, ChefHat, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import Link from 'next/link';

export default function Home() {
  const { items, fetchItems } = useInventoryStore();
  const { recipes, fetchRecipes } = useRecipeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchItems();
    fetchRecipes();
  }, [fetchItems, fetchRecipes]);

  if (!mounted) return null;

  const today = new Date();

  // 1. 유통기한 관리 데이터 (지났거나 7일 이내인 것)
  const expiringItems = items
    .filter((item) => {
      const daysLeft = differenceInDays(parseISO(item.expiryDate), today);
      return daysLeft <= 7; // 지난 것 포함
    })
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  // 2. 추천 알고리즘 고도화
  const getRecommendedRecipe = () => {
    if (recipes.length === 0) return null;

    const scoredRecipes = recipes.map(recipe => {
      const currentVer = recipe.versions.find(v => v.version === recipe.currentVersion);
      if (!currentVer) return { recipe, score: 0, matchedIngredients: [] };

      let score = 0;
      const matchedIngredients: string[] = [];

      currentVer.ingredients.forEach(ing => {
        const stockItem = items.find(item => item.name.trim() === ing.name.trim());
        if (stockItem) {
          score += 1;
          matchedIngredients.push(ing.name);
          const daysLeft = differenceInDays(parseISO(stockItem.expiryDate), today);
          if (daysLeft <= 7) score += 10; // 임박 재료 우선 추천
        }
      });

      return { 
        recipe, 
        score, 
        matchedCount: matchedIngredients.length,
        totalCount: currentVer.ingredients.length,
        matchedIngredients 
      };
    });

    scoredRecipes.sort((a, b) => b.score - a.score);
    return scoredRecipes[0].score > 0 ? scoredRecipes[0] : null;
  };

  const rec = getRecommendedRecipe();

  return (
    <div className="space-y-10 pb-10">
      {/* 1. 오늘의 추천 (Large Card) */}
      <section>
        <div className="flex items-center gap-2 mb-4">
            <ChefHat className="text-blue-500" size={20} />
            <h2 className="text-xl font-bold tracking-tight">오늘의 추천 레시피</h2>
        </div>
        
        {rec ? (
            <div className="relative overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-zinc-900 to-blue-900/20 p-8 shadow-2xl group transition-all hover:border-blue-500/40">
                <div className="relative z-10 grid gap-8 md:grid-cols-2 items-center">
                    <div>
                        <span className="inline-block px-3 py-1 rounded-full bg-blue-600 text-[10px] font-black uppercase tracking-widest text-white mb-4 shadow-lg shadow-blue-900/40">
                            Most Matched
                        </span>
                        <h3 className="text-3xl md:text-4xl font-black text-white mb-4 group-hover:text-blue-400 transition-colors leading-tight">
                            {rec.recipe.title}
                        </h3>
                        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                            {rec.recipe.description || '이 레시피를 요리해보는 건 어떨까요? 보유하신 재료를 활용하기 딱 좋습니다.'}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-8">
                            {rec.matchedIngredients.slice(0, 5).map(ing => (
                                <span key={ing} className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800 text-blue-400 text-[11px] font-bold border border-blue-500/10">
                                    <CheckCircle2 size={12} />
                                    {ing}
                                </span>
                            ))}
                            {rec.matchedIngredients.length > 5 && <span className="text-zinc-600 text-[11px] pt-1">외 {rec.matchedIngredients.length - 5}개...</span>}
                        </div>

                        <Link 
                            href={`/recipes?id=${rec.recipe.id}`}
                            className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-blue-600 text-white font-black text-sm hover:bg-blue-500 transition-all hover:gap-3 shadow-xl shadow-blue-900/20"
                        >
                            레시피 보러가기
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                    
                    <div className="hidden md:flex justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                        <BookOpen size={200} className="text-blue-500" />
                    </div>
                </div>
                
                {/* Progress Bar (Ingredients Match) */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-1000" 
                        style={{ width: `${((rec.matchedCount || 0) / (rec.totalCount || 1)) * 100}%` }}
                    ></div>
                </div>
            </div>
        ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 p-12 text-center">
                <Info className="mx-auto text-zinc-700 mb-4" size={40} />
                <p className="text-zinc-500 font-medium text-lg">추천할 레시피가 없습니다.</p>
                <p className="text-zinc-600 text-sm mt-1">레시피를 등록하거나 재료를 채워보세요!</p>
            </div>
        )}
      </section>

      {/* 2. 유통기한 관리 (Category Columns) */}
      <section>
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <AlertCircle className="text-blue-500" size={20} />
                <h2 className="text-xl font-bold tracking-tight">유통기한 및 재고 현황</h2>
            </div>
            <Link href="/inventory" className="text-xs text-zinc-500 hover:text-blue-500 font-bold transition-colors">
                전체보기
            </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
            {/* 냉장실 */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h4 className="text-sm font-bold text-blue-400">냉장실</h4>
                    <span className="text-[10px] text-zinc-600 font-mono">FRIDGE</span>
                </div>
                {expiringItems.filter(i => i.storageType === 'FRIDGE').length > 0 ? (
                    expiringItems.filter(i => i.storageType === 'FRIDGE').map(item => (
                        <ExpiringItemRow key={item.id} item={item} today={today} />
                    ))
                ) : (
                    <EmptyState />
                )}
            </div>

            {/* 냉동실 */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h4 className="text-sm font-bold text-blue-400">냉동실</h4>
                    <span className="text-[10px] text-zinc-600 font-mono">FREEZER</span>
                </div>
                {expiringItems.filter(i => i.storageType === 'FREEZER').length > 0 ? (
                    expiringItems.filter(i => i.storageType === 'FREEZER').map(item => (
                        <ExpiringItemRow key={item.id} item={item} today={today} />
                    ))
                ) : (
                    <EmptyState />
                )}
            </div>

            {/* 실온 */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h4 className="text-sm font-bold text-blue-400">실온/펜트리</h4>
                    <span className="text-[10px] text-zinc-600 font-mono">PANTRY</span>
                </div>
                {expiringItems.filter(i => i.storageType === 'PANTRY').length > 0 ? (
                    expiringItems.filter(i => i.storageType === 'PANTRY').map(item => (
                        <ExpiringItemRow key={item.id} item={item} today={today} />
                    ))
                ) : (
                    <EmptyState />
                )}
            </div>
        </div>
      </section>
    </div>
  );
}

function ExpiringItemRow({ item, today }: { item: any, today: Date }) {
    const days = differenceInDays(parseISO(item.expiryDate), today);
    
    // Color logic: Red for passed, Orange for 0-3 days, Blue for others
    const getStatusStyles = () => {
        if (days < 0) return 'text-red-500 border-red-500/20 bg-red-500/5';
        if (days <= 3) return 'text-orange-500 border-orange-500/20 bg-orange-500/5';
        return 'text-blue-400 border-blue-500/10 bg-zinc-950';
    };

    return (
        <div className={`flex items-center justify-between rounded-lg p-3 border transition-all hover:scale-[1.02] ${getStatusStyles()}`}>
            <div className="overflow-hidden">
                <p className="font-bold text-sm truncate">{item.name}</p>
                <p className="text-[10px] opacity-60 truncate min-h-[1.2em]">
                    {item.detail?.trim() || '\u00A0'}
                </p>
            </div>
            <div className="text-right ml-4">
                <span className="text-[11px] font-black whitespace-nowrap">
                    {days < 0 ? `지남 (${Math.abs(days)}일)` : days === 0 ? 'D-Day' : `D-${days}`}
                </span>
                <p className="text-[9px] opacity-40 font-mono">{item.expiryDate}</p>
            </div>
        </div>
    )
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-10 rounded-lg border border-dashed border-zinc-800/50 bg-zinc-900/10">
            <p className="text-[11px] text-zinc-600 font-medium">관리 품목 없음</p>
        </div>
    )
}