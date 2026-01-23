'use client';

import { useState, useEffect } from 'react';
import { useProductStore } from '@/store/useProductStore';
import { Plus, Trash2, Tag, Sparkles, Eraser } from 'lucide-react';
import Autocomplete from '@/components/ui/Autocomplete';

// Default categories
const DEFAULT_CATEGORIES = [
  '유제품', '육류', '수산물', '채소', '과일', 
  '곡류', '견과류', '양념/소스', '가공식품', '냉동식품', 
  '반찬', '음료', '기타'
];

export default function ProductList() {
  const { products, addProduct, deleteProduct, fetchProducts, resetToDefaultProducts, deleteAllMyProducts } = useProductStore();
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Collect all unique categories from existing products + defaults
  const existingCategories = Array.from(new Set([
    ...DEFAULT_CATEGORIES,
    ...products.map(p => p.category)
  ])).sort();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    addProduct({
      id: crypto.randomUUID(),
      name: newName,
      category: newCategory || '기타',
    });

    setNewName('');
    setNewCategory('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {/* Add Form */}
      <div className="rounded-sm border border-zinc-800 bg-zinc-900/50 p-6 md:p-8">
        <h3 className="mb-6 text-sm font-black text-zinc-300 flex items-center justify-between uppercase tracking-widest">
            <span className="flex items-center gap-2">
                <Plus size={18} className="text-blue-500" />
                새 식재료 품목 등록
            </span>
            <div className="flex gap-2">
                <button 
                    onClick={resetToDefaultProducts}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-blue-600/10 text-blue-500 text-[10px] font-bold hover:bg-blue-600/20 transition-colors"
                >
                    <Sparkles size={12} />
                    기본 목록 채우기
                </button>
                <button 
                    onClick={deleteAllMyProducts}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-red-600/10 text-red-500 text-[10px] font-bold hover:bg-red-600/20 transition-colors"
                >
                    <Eraser size={12} />
                    목록 전체 삭제
                </button>
            </div>
        </h3>
        <form onSubmit={handleAdd} className="flex flex-col gap-6 md:flex-row md:items-end">
          <div className="flex-1 space-y-2.5">
            <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest">품목명 (표준 이름)</label>
            <input
              autoFocus
              className="w-full h-12 rounded-sm border border-zinc-800 bg-black px-4 text-sm outline-none focus:border-blue-500 transition-all focus:ring-1 focus:ring-blue-500/20"
              placeholder="예: 두부, 목살, 버터"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-2.5">
            <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest">카테고리</label>
            <Autocomplete 
                options={existingCategories}
                value={newCategory}
                onChange={setNewCategory}
                placeholder="선택 또는 직접 입력"
            />
          </div>
          <button
            type="submit"
            className="h-12 md:w-40 rounded-sm bg-blue-600 px-8 text-sm font-black text-white hover:bg-blue-700 active:scale-[0.97] transition-all shadow-xl shadow-blue-900/30"
          >
            등록하기
          </button>
        </form>
      </div>

      {/* Product List */}
      <div className="space-y-3 pb-20">
        <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-1">등록된 품목 ({products.length})</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between rounded-sm border border-zinc-800/50 bg-zinc-900/30 p-3 pl-4 hover:bg-zinc-900/60 transition-colors group">
                <div className="flex flex-col overflow-hidden">
                <h4 className="font-bold text-zinc-200 truncate">{product.name}</h4>
                <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5 truncate">
                    <Tag size={10} />
                    {product.category}
                </span>
                </div>
                <button
                onClick={() => deleteProduct(product.id)}
                className="text-zinc-600 hover:text-red-500 transition-colors p-2 opacity-0 group-hover:opacity-100 md:opacity-100 shrink-0"
                >
                <Trash2 size={16} />
                </button>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
}