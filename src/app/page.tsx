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
      return daysLeft <= 7;
    })
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  // 2. 추천 알고리즘 고도화 (2개 추천)
  const getRecommendedRecipes = () => {
    if (recipes.length === 0) return [];

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
          if (daysLeft <= 3) score += 20; // 긴급 재료 가중치
          else if (daysLeft <= 7) score += 10; // 임박 재료 가중치
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

    // 점수 높은 순으로 정렬 후, 상위 5개 중 랜덤하게 2개 추출 (매번 다르게)
    const candidates = scoredRecipes
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    
    return candidates.sort(() => Math.random() - 0.5).slice(0, 2);
  };

  const recommendedOnes = getRecommendedRecipes();

  return (
    <div className="space-y-10 pb-10">
      {/* 1. 오늘의 추천 (Split 2 Cards) */}
      <section>
        <div className="flex items-center gap-2 mb-4">
            <ChefHat className="text-blue-500" size={20} />
            <h2 className="text-xl font-bold tracking-tight">오늘의 추천 레시피</h2>
        </div>
        
        {recommendedOnes.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
                {recommendedOnes.map(rec => (
                    <div key={rec.recipe.id} className="relative overflow-hidden rounded-xl border border-blue-500/10 bg-zinc-900 p-6 shadow-xl group transition-all hover:border-blue-500/30">
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-2 py-0.5 rounded-sm bg-blue-600/20 text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                                    Best Match
                                </span>
                                <div className="text-[10px] font-mono text-zinc-600">
                                    {Math.round(((rec.matchedCount || 0) / (rec.totalCount || 1)) * 100)}% Ready
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-black text-white mb-2 group-hover:text-blue-400 transition-colors truncate">
                                {rec.recipe.title}
                            </h3>
                            
                            <p className="text-zinc-500 text-xs line-clamp-2 mb-4 flex-1">
                                {rec.recipe.description || '보유한 재료를 활용해 요리해보세요.'}
                            </p>
                            
                            <div className="flex flex-wrap gap-1.5 mb-6">
                                {rec.matchedIngredients.slice(0, 3).map(ing => (
                                    <span key={ing} className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-zinc-800 text-blue-400/80 text-[10px] font-bold">
                                        <CheckCircle2 size={10} />
                                        {ing}
                                    </span>
                                ))}
                                {rec.matchedIngredients.length > 3 && <span className="text-zinc-700 text-[9px] pt-1">+{rec.matchedIngredients.length - 3}</span>}
                            </div>

                            <Link 
                                href={`/recipes?id=${rec.recipe.id}`}
                                className="flex items-center justify-between w-full h-10 px-4 rounded-md bg-blue-600/10 text-blue-500 font-bold text-xs hover:bg-blue-600 hover:text-white transition-all group/btn"
                            >
                                상세 레시피 보기
                                <ArrowRight size={14} className="group/btn:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 p-12 text-center">
                <Info className="mx-auto text-zinc-700 mb-4" size={40} />
                <p className="text-zinc-500 font-medium">추천할 레시피가 없습니다.</p>
            </div>
        )}
      </section>

      {/* 2. 유통기한 관리 */}
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
                    <h4 className="text-sm font-bold text-blue-400/80">냉장실</h4>
                    <span className="text-[10px] text-zinc-600 font-mono italic">FRIDGE</span>
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
                    <h4 className="text-sm font-bold text-blue-400/80">냉동실</h4>
                    <span className="text-[10px] text-zinc-600 font-mono italic">FREEZER</span>
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
                    <h4 className="text-sm font-bold text-blue-400/80">실온/펜트리</h4>
                    <span className="text-[10px] text-zinc-600 font-mono italic">PANTRY</span>
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
    
    // Updated color logic
    const getStatusStyles = () => {
        if (days < 0) return 'text-red-500 border-red-500/20 bg-red-500/5'; // 유통기한 지남: 레드
        if (days <= 3) return 'text-rose-400 border-rose-400/20 bg-rose-400/5'; // 0~3일: 연한 레드/로즈
        if (days <= 7) return 'text-amber-400 border-amber-400/10 bg-amber-400/5'; // 4~7일: 오렌지/앰버
        return 'text-blue-400 border-blue-500/10 bg-zinc-950'; // 그 외: 블루
    };

    return (
        <div className={`flex items-center justify-between rounded-lg p-3 border transition-all hover:scale-[1.01] ${getStatusStyles()}`}>
            <div className="overflow-hidden">
                <p className="font-bold text-sm truncate">{item.name}</p>
                <p className="text-[10px] opacity-50 truncate min-h-[1.2em]">
                    {item.detail?.trim() || '\u00A0'}
                </p>
            </div>
            <div className="text-right ml-4">
                <span className="text-[11px] font-black whitespace-nowrap">
                    {days < 0 ? `지남 (${Math.abs(days)}일)` : days === 0 ? 'D-Day' : `D-${days}`}
                </span>
                <p className="text-[9px] opacity-30 font-mono">{item.expiryDate}</p>
            </div>
        </div>
    )
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-10 rounded-lg border border-dashed border-zinc-800/50 bg-zinc-900/10">
            <p className="text-[11px] text-zinc-700 font-medium">관리 품목 없음</p>
        </div>
    )
}
