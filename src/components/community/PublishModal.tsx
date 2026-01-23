'use client';

import { useState, useEffect } from 'react';
import { Recipe, RecipeVersion, Ingredient } from '@/types';
import { useCommunityStore } from '@/store/useCommunityStore';
import { X, Send, AlertCircle, Trash2, Plus, Asterisk } from 'lucide-react';

interface PublishModalProps {
  recipe: Recipe;
  version?: RecipeVersion;
  communityRecipeId?: string; // If present, we are editing an existing community recipe
  isOpen: boolean;
  onClose: () => void;
}

export default function PublishModal({ recipe, version, communityRecipeId, isOpen, onClose }: PublishModalProps) {
  const { publishRecipe, updateCommunityRecipe } = useCommunityStore();
  const isEditMode = !!communityRecipeId;
  
  // Use passed version, or fallback to current representative version
  const targetVersion = version || recipe.versions.find(v => v.version === recipe.currentVersion) || recipe.versions[0];

  const [title, setTitle] = useState(recipe.title);
  const [description, setDescription] = useState(recipe.description || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(targetVersion?.ingredients.map(i => ({ ...i, isRequired: !!i.isRequired })) || []);
  const [steps, setSteps] = useState([...(targetVersion?.steps || [])]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when version/recipe changes
  useEffect(() => {
    if (isOpen) {
        setTitle(recipe.title);
        setDescription(recipe.description || '');
        setIngredients(targetVersion?.ingredients.map(i => ({ ...i, isRequired: !!i.isRequired })) || []);
        setSteps([...(targetVersion?.steps || [])]);
    }
  }, [recipe, targetVersion, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let result;
    
    if (isEditMode && communityRecipeId) {
        result = await updateCommunityRecipe(communityRecipeId, {
            title,
            description,
            ingredients,
            steps
        });
    } else {
        result = await publishRecipe({
            original_recipe_id: recipe.id,
            title,
            description,
            ingredients,
            steps
        });
    }

    if (result.success) {
      alert(isEditMode ? '게시글이 수정되었습니다.' : '커뮤니티에 레시피가 공유되었습니다!');
      onClose();
    } else {
      alert((isEditMode ? '수정 실패: ' : '공유 실패: ') + result.error);
    }
    setIsSubmitting(false);
  };

  const updateIngredient = (idx: number, field: keyof Ingredient, val: any) => {
    const next = [...ingredients];
    next[idx] = { ...next[idx], [field]: val };
    setIngredients(next);
  };

  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', isRequired: false }]);
  };

  const updateStep = (idx: number, val: string) => {
    const next = [...steps];
    next[idx] = val;
    setSteps(next);
  };

  const removeStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const addStep = () => {
    setSteps([...steps, '']);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Send size={20} className="text-blue-500" />
                {isEditMode ? '게시글 수정' : '커뮤니티에 레시피 공유'}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
                {isEditMode ? '커뮤니티에 게시된 내용을 수정합니다. 원본 레시피는 변경되지 않습니다.' : '개인적인 메모나 팁은 자동으로 제외되었습니다. 공유하기 전 내용을 확인하세요.'}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Description */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">레시피 제목</label>
              <input 
                className="w-full h-12 rounded-sm border border-zinc-800 bg-zinc-900 px-4 text-sm text-white outline-none focus:border-blue-500"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">간단한 설명</label>
              <textarea 
                className="w-full h-24 rounded-sm border border-zinc-800 bg-zinc-900 p-4 text-sm text-white outline-none focus:border-blue-500 resize-none"
                placeholder="이 레시피의 특징이나 맛을 설명해주세요."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">재료 목록</label>
                <button type="button" onClick={addIngredient} className="text-[10px] text-blue-500 font-bold hover:underline">+ 재료 추가</button>
            </div>
            <div className="grid gap-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <button 
                    type="button" 
                    onClick={() => updateIngredient(idx, 'isRequired', !ing.isRequired)} 
                    className={`mt-1.5 h-6 w-6 shrink-0 rounded-md border transition-all flex items-center justify-center ${ing.isRequired ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
                    title={ing.isRequired ? '필수 재료' : '선택 재료'}
                  >
                    <Asterisk size={14} />
                  </button>
                  <input 
                    placeholder="재료명"
                    className="flex-[2] h-10 rounded-sm border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-blue-500"
                    value={ing.name}
                    onChange={e => updateIngredient(idx, 'name', e.target.value)}
                  />
                  <input 
                    placeholder="양"
                    className="flex-1 h-10 rounded-sm border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-blue-500"
                    value={ing.amount}
                    onChange={e => updateIngredient(idx, 'amount', e.target.value)}
                  />
                  <button type="button" onClick={() => removeIngredient(idx)} className="mt-2 text-zinc-600 hover:text-red-500 p-1 shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">조리 순서</label>
                <button type="button" onClick={addStep} className="text-[10px] text-blue-500 font-bold hover:underline">+ 단계 추가</button>
            </div>
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="mt-2 text-xs font-bold text-zinc-700">{idx + 1}</span>
                  <textarea 
                    rows={2}
                    className="flex-1 rounded-sm border border-zinc-800 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-blue-500 resize-none"
                    value={step}
                    onChange={e => updateStep(idx, e.target.value)}
                  />
                  <button type="button" onClick={() => removeStep(idx)} className="mt-2 text-zinc-600 hover:text-red-500 h-fit p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-zinc-800">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 h-12 rounded-sm border border-zinc-800 text-zinc-400 hover:bg-zinc-900 text-sm font-bold"
            >
              취소
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-[2] h-12 rounded-sm bg-blue-600 text-white hover:bg-blue-700 text-sm font-black disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : (isEditMode ? '수정사항 저장' : '커뮤니티에 게시하기')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
    return <div className={`h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent ${className}`}></div>
}