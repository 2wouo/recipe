'use client';

import { useState, useEffect } from 'react';
import { useProductStore } from '@/store/useProductStore';
import { Plus, Trash2, Tag, Sparkles, Eraser, Search, X } from 'lucide-react';
import Autocomplete from '@/components/ui/Autocomplete';

// Default categories
const DEFAULT_CATEGORIES = [
  '채소', '과일', '육류', '수산물', '유제품/계란', 
  '곡류/면류', '양념/소스', '가공/냉동', '음료/간식', '기타'
];

export default function ProductList() {
  const { products, addProduct, deleteProduct, fetchProducts, resetToDefaultProducts, deleteAllMyProducts } = useProductStore();
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

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

    // 중복 검사 (이름 기준)
    if (products.some(p => p.name.trim() === newName.trim())) {
        alert('이미 등록된 식재료 이름입니다.');
        return;
    }

    addProduct({
      id: crypto.randomUUID(),
      name: newName,
      category: newCategory || '기타',
    });

    setNewName('');
    setNewCategory('');
    setIsFormOpen(false); // 등록 후 폼 닫기 (선택 사항)
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 items-center justify-between">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                <input 
                    className="w-full h-10 rounded-sm border border-zinc-800 bg-zinc-900 pl-9 pr-4 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                    placeholder="식재료 이름 검색..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>
            <button 
                onClick={() => setIsFormOpen(!isFormOpen)}
                className={`flex items-center gap-2 rounded-sm px-4 h-10 text-xs font-bold transition-colors ${isFormOpen ? 'bg-zinc-800 text-zinc-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
                {isFormOpen ? <X size={16} /> : <Plus size={16} />}
                {isFormOpen ? '닫기' : '추가'}
            </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
                onClick={() => setSelectedCategory('All')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedCategory === 'All' 
                        ? 'bg-zinc-100 text-zinc-900 border-zinc-100' 
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'
                }`}
            >
                전체
            </button>
            {existingCategories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selectedCategory === cat 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>

        <div className="flex justify-end gap-2">
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
      </div>

      {/* Add Form */}
      {isFormOpen && (
        <div className="rounded-sm border border-zinc-800 bg-zinc-900/50 p-6 md:p-8 animate-in fade-in slide-in-from-top-2">
            <h3 className="mb-6 text-sm font-black text-zinc-300 flex items-center gap-2 uppercase tracking-widest">
                <Plus size={18} className="text-blue-500" />
                새 식재료 품목 등록
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
      )}

      {/* Product List */}
      <div className="space-y-3 pb-20">
        <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-1">등록된 품목 ({filteredProducts.length})</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
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