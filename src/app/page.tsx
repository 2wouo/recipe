'use client';

import { useEffect, useState } from 'react';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useRecipeStore } from '@/store/useRecipeStore';
import { Refrigerator, BookOpen, AlertCircle, Clock, ChefHat, ArrowRight, CheckCircle2, Info, Plus } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import Link from 'next/link';

export default function Home() {
    const { items, fetchItems } = useInventoryStore();
    const { recipes, fetchRecipes } = useRecipeStore();
    const [mounted, setMounted] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);

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
            if (!currentVer) return { recipe, score: 0, matchedIngredients: [], missingIngredients: [] };

            let score = 0;
            const matchedIngredients: string[] = [];
            const missingIngredients: string[] = [];

            currentVer.ingredients.forEach(ing => {
                const stockItem = items.find(item => item.name.trim().toLowerCase() === ing.name.trim().toLowerCase());

                // 선택된 재료가 포함되어 있으면 점수 대폭 추가
                if (selectedIngredient && ing.name.trim().toLowerCase() === selectedIngredient.trim().toLowerCase()) {
                    score += 1000;
                }

                if (stockItem) {
                    score += 1;
                    matchedIngredients.push(ing.name);
                    const daysLeft = differenceInDays(parseISO(stockItem.expiryDate), today);
                    if (daysLeft <= 3) score += 20;
                    else if (daysLeft <= 7) score += 10;
                } else {
                    missingIngredients.push(ing.name);
                }
            });

            return {
                recipe,
                score,
                matchedCount: matchedIngredients.length,
                totalCount: currentVer.ingredients.length,
                matchedIngredients,
                missingIngredients
            };
        });

        const candidates = scoredRecipes
            .filter(r => {
                // 선택된 재료가 있는 경우, 반드시 그 재료를 포함하는 레시피만 필터링
                if (selectedIngredient) {
                    return r.recipe.versions.find(v => v.version === r.recipe.currentVersion)
                        ?.ingredients.some(ing => ing.name.trim().toLowerCase() === selectedIngredient.trim().toLowerCase());
                }
                // 선택된 재료가 없는 경우, 점수가 0보다 큰 모든 레시피
                return r.score > 0;
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        // 점수가 같은 경우 랜덤 섞기, 단 점수가 높으면 우선 (1000점 이상 차이면 확실히 우선 순위)
        return candidates.slice(0, 2);
    };

    const recommendedOnes = getRecommendedRecipes();

    const handleItemClick = (name: string) => {
        if (selectedIngredient === name) {
            setSelectedIngredient(null);
        } else {
            setSelectedIngredient(name);
        }
    };

    return (
        <div className="space-y-10 pb-10">
            {/* 1. 오늘의 추천 (Split 2 Cards) */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <ChefHat className="text-blue-500" size={20} />
                    <h2 className="text-xl font-bold tracking-tight">
                        {selectedIngredient ? `'${selectedIngredient}' 활용 추천 레시피` : '오늘의 추천 레시피'}
                    </h2>
                    {selectedIngredient && (
                        <button
                            onClick={() => setSelectedIngredient(null)}
                            className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded-full animate-in fade-in zoom-in duration-200"
                        >
                            필터 해제 <CheckCircle2 size={10} />
                        </button>
                    )}
                </div>

                {recommendedOnes.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {recommendedOnes.map(rec => (
                            <div key={rec.recipe.id} className="relative overflow-hidden rounded-xl border border-blue-500/10 bg-zinc-900 p-6 shadow-xl group transition-all hover:border-blue-500/30 min-h-[280px] flex flex-col">
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
                                        {/* 있는 재료 */}
                                        {rec.matchedIngredients.slice(0, 3).map(ing => (
                                            <span key={ing} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-bold border ${ing === selectedIngredient ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-zinc-800 text-blue-400/80 border-blue-500/10'}`}>
                                                <CheckCircle2 size={10} />
                                                {ing}
                                            </span>
                                        ))}

                                        {/* 없는 재료 (최대 표시 개수 유지) */}
                                        {rec.missingIngredients.slice(0, Math.max(0, 4 - rec.matchedIngredients.length)).map(ing => (
                                            <span key={ing} className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-zinc-900 text-zinc-600 text-[10px] font-bold border border-zinc-800 border-dashed">
                                                {ing}
                                            </span>
                                        ))}

                                        {(rec.matchedIngredients.length + rec.missingIngredients.length) > 4 && (
                                            <span className="text-zinc-700 text-[9px] pt-1">...외 더 있음</span>
                                        )}
                                    </div>

                                    <Link
                                        href={`/recipes?id=${rec.recipe.id}`}
                                        className="flex items-center justify-between w-full h-10 px-4 rounded-md bg-blue-600/10 text-blue-500 font-bold text-xs hover:bg-blue-600 hover:text-white transition-all group/btn mt-auto"
                                    >
                                        상세 레시피 보기
                                        <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 p-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300 min-h-[280px]">
                        <Info className="mx-auto text-zinc-700 mb-4" size={40} />
                        <p className="text-zinc-400 font-medium mb-1">
                            {selectedIngredient ? `'${selectedIngredient}'(으)로 만들 수 있는 레시피가 없습니다.` : '아직 등록된 레시피가 부족합니다.'}
                        </p>
                        <p className="text-zinc-600 text-xs">
                            {selectedIngredient ? '대신 다른 요리를 만들어보는 건 어떨까요?' : '나만의 레시피를 추가하여 목록을 채워보세요.'}
                        </p>
                        
                        {selectedIngredient ? (
                            <div className="mt-6 flex flex-col items-center gap-3 w-full max-w-[200px]">
                                <button 
                                    onClick={() => setSelectedIngredient(null)}
                                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md transition-all shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95"
                                >
                                    다른 추천 레시피 보기
                                </button>
                                <Link href="/recipes" className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
                                    <Plus size={10} />
                                    새 레시피 등록하기
                                </Link>
                            </div>
                        ) : (
                            <Link href="/recipes" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-md transition-all">
                                <Plus size={14} />
                                레시피 등록하기
                            </Link>
                        )}
                    </div>
                )}
            </section>

            {/* 2. 유통기한 관리 */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="text-blue-500" size={20} />
                        <h2 className="text-xl font-bold tracking-tight">유통기한 및 재고 현황</h2>
                        <span className="text-xs text-zinc-500 font-normal">품목을 클릭하여 관련 레시피를 확인하세요.</span>
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
                                <ExpiringItemRow
                                    key={item.id}
                                    item={item}
                                    today={today}
                                    onClick={handleItemClick}
                                    isSelected={selectedIngredient === item.name}
                                />
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
                                <ExpiringItemRow
                                    key={item.id}
                                    item={item}
                                    today={today}
                                    onClick={handleItemClick}
                                    isSelected={selectedIngredient === item.name}
                                />
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
                                <ExpiringItemRow
                                    key={item.id}
                                    item={item}
                                    today={today}
                                    onClick={handleItemClick}
                                    isSelected={selectedIngredient === item.name}
                                />
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

function ExpiringItemRow({ item, today, onClick, isSelected }: { item: any, today: Date, onClick: (name: string) => void, isSelected: boolean }) {
    const days = differenceInDays(parseISO(item.expiryDate), today);

    const getStatusStyles = () => {
        if (isSelected) return 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500';
        if (days < 0) return 'text-red-500 border-red-500/20 bg-red-500/5 hover:border-red-500/40';
        if (days <= 7) return 'text-amber-400 border-amber-400/20 bg-amber-400/5 hover:border-amber-400/40';
        return 'text-blue-400 border-blue-500/10 bg-zinc-950 hover:border-blue-500/30';
    };

    return (
        <div
            onClick={() => onClick(item.name)}
            className={`flex items-center justify-between rounded-lg p-3 border transition-all cursor-pointer ${getStatusStyles()}`}
        >
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