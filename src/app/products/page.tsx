'use client';

import { useState } from 'react';
import { useProductStore } from '@/store/useProductStore';
import { Plus, Trash2, Tag } from 'lucide-react';

// Default categories
const DEFAULT_CATEGORIES = [
  '유제품', '육류', '수산물', '채소', '과일', 
  '곡류', '견과류', '양념/소스', '가공식품', '냉동식품', 
  '반찬', '음료', '기타'
];

export default function ProductsPage() {
  const { products, addProduct, deleteProduct } = useProductStore();
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');

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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">표준 식재료 관리</h2>
        <p className="text-zinc-400">재고와 레시피에서 공통으로 사용할 품목 이름을 미리 등록하세요.</p>
      </div>

      {/* Add Form */}
      <div className="rounded-sm border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-4 font-bold">새 품목 등록</h3>
        <form onSubmit={handleAdd} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block mb-2 text-xs font-medium text-zinc-500">품목명 (표준 이름)</label>
            <input
              autoFocus
              className="w-full h-10 rounded-sm border border-zinc-800 bg-black px-3 text-sm outline-none focus:border-blue-500 leading-none"
              placeholder="예: 두부"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block mb-2 text-xs font-medium text-zinc-500">카테고리</label>
            <div className="relative">
                <input
                list="category-list"
                className="w-full h-10 rounded-sm border border-zinc-800 bg-black px-3 text-sm outline-none focus:border-blue-500 leading-none"
                placeholder="카테고리 선택 또는 입력"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                />
                <datalist id="category-list">
                {existingCategories.map(cat => (
                    <option key={cat} value={cat} />
                ))}
                </datalist>
            </div>
          </div>
          <button
            type="submit"
            className="rounded-sm bg-blue-600 px-8 h-10 text-sm font-bold text-white hover:bg-blue-700 transition-colors shrink-0 flex items-center justify-center"
          >
            추가
          </button>
        </form>
      </div>

      {/* Product List */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="flex items-center justify-between rounded-sm border border-zinc-800 bg-zinc-900/30 p-4">
            <div>
              <h4 className="font-bold">{product.name}</h4>
              <span className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                <Tag size={10} />
                {product.category}
              </span>
            </div>
            <button
              onClick={() => deleteProduct(product.id)}
              className="text-zinc-600 hover:text-red-500 transition-colors p-1"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {products.length === 0 && (
            <div className="col-span-full py-10 text-center text-zinc-500">
                등록된 표준 식재료가 없습니다.
            </div>
        )}
      </div>
    </div>
  );
}
