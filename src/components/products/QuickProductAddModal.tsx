'use client';

import { useState } from 'react';
import { useProductStore } from '@/store/useProductStore';
import { X } from 'lucide-react';
import Autocomplete from '@/components/ui/Autocomplete';

interface QuickProductAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  onSuccess?: (productName: string) => void;
}

const DEFAULT_CATEGORIES = [
  '유제품', '육류', '수산물', '채소', '과일', 
  '곡류', '견과류', '양념/소스', '가공식품', '냉동식품', 
  '반찬', '음료', '기타'
];

export default function QuickProductAddModal({ isOpen, onClose, initialName = '', onSuccess }: QuickProductAddModalProps) {
  const { products, addProduct } = useProductStore();
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState('');

  // Collect existing categories
  const existingCategories = Array.from(new Set([
    ...DEFAULT_CATEGORIES,
    ...products.map(p => p.category)
  ])).sort();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    // Check duplicate
    const exists = products.some(p => p.name === name);
    if (exists) {
        alert('이미 존재하는 식재료입니다.');
        return;
    }

    addProduct({
      id: crypto.randomUUID(),
      name,
      category: category || '기타',
    });

    if (onSuccess) onSuccess(name);
    
    // Reset & Close
    setName('');
    setCategory('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="w-full max-w-sm rounded-sm border border-zinc-800 bg-zinc-900 p-6 shadow-xl animate-in zoom-in-95 duration-200">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold">새 식재료 간편 등록</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-500">품목명</label>
            <input
              autoFocus
              className="w-full h-10 rounded-sm border border-zinc-800 bg-black px-3 text-sm outline-none focus:border-blue-500 leading-none"
              placeholder="예: 트러플 오일"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-500">카테고리</label>
            <Autocomplete 
                options={existingCategories}
                value={category}
                onChange={setCategory}
                placeholder="카테고리 선택 또는 입력"
            />
          </div>

          <div className="pt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-sm border border-zinc-800 bg-zinc-800 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-sm bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
            >
              등록하고 사용하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}