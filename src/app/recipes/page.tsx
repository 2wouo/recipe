'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRecipeStore } from '@/store/useRecipeStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useProductStore } from '@/store/useProductStore';
import { RecipeVersion, Ingredient } from '@/types';
import { Plus, Book, History, ChevronRight, Save, Trash2, Copy, CheckCircle2, Circle, Pencil, Star, StickyNote, Lightbulb, Check, AlertCircle, Refrigerator, Box, X, Search, ArrowLeft, Send, Asterisk } from 'lucide-react';
import { format } from 'date-fns';
import QuickProductAddModal from '@/components/products/QuickProductAddModal';
import PublishModal from '@/components/community/PublishModal';
import VersionSelectModal from '@/components/community/VersionSelectModal';
import Autocomplete from '@/components/ui/Autocomplete';

function RecipesContent() {
  const { recipes, addRecipe, addVersion, updateRecipe, updateVersion, setPrimaryVersion, deleteRecipe, deleteVersion, fetchRecipes } = useRecipeStore();
  const { items: inventoryItems, fetchItems } = useInventoryStore();
  const { products, fetchProducts } = useProductStore();
  
  // Load data on mount
  useEffect(() => {
    fetchRecipes();
    fetchItems(); // For stock checking
    fetchProducts(); // For autocomplete
  }, [fetchRecipes, fetchItems, fetchProducts]);

  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');

  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(initialId);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [isAddingVersion, setIsAddingVersion] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isVersionSelectOpen, setIsVersionSelectOpen] = useState(false);
  const [selectedVersionForPublish, setSelectedVersionForPublish] = useState<RecipeVersion | undefined>(undefined);
  const [editingVersionIndex, setEditingVersionIndex] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'mine' | 'imported'>('mine');
  
  // Quick Add Modal State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  
  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);

  // Title Editing State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleText, setEditingTitleText] = useState('');

  const handleStartEditTitle = () => {
    if (selectedRecipe) {
      setEditingTitleText(selectedRecipe.title);
      setIsEditingTitle(true);
    }
  };

  // New Recipe State
  const [newRecipeTitle, setNewRecipeTitle] = useState('');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecipes = recipes.filter(recipe => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = recipe.title.toLowerCase().includes(query);
    
    if (!matchesSearch) return false;

    if (filterType === 'mine') {
        return !recipe.source_author;
    } else {
        return !!recipe.source_author;
    }
  });
  
  // New Version State
  const [newVersion, setNewVersion] = useState<Omit<RecipeVersion, 'createdAt'>>({
    version: '',
    notes: '',
    memo: '',
    ingredients: [{ name: '', amount: '', isRequired: false }],
    steps: ['']
  });

  const handleOpenAddVersion = () => {
    if (selectedRecipe && selectedRecipe.versions.length > 0) {
      const latest = selectedRecipe.versions[selectedRecipe.versions.length - 1];
      const nextVersionNum = (parseFloat(latest.version) + 0.1).toFixed(1);
      setNewVersion({
        version: nextVersionNum,
        notes: '',
        memo: latest.memo || '',
        ingredients: latest.ingredients.map(ing => ({ ...ing, isRequired: !!ing.isRequired })), 
        steps: [...latest.steps]
      });
    } else {
      setNewVersion({
        version: '1.0',
        notes: '',
        memo: '',
        ingredients: [{ name: '', amount: '', isRequired: false }],
        steps: ['']
      });
    }
    setIsAddingVersion(true);
    setEditingVersionIndex(null);
  };

  const handleCreateRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipeTitle) return;
    const id = crypto.randomUUID();
    addRecipe({
      id,
      title: newRecipeTitle,
      description: '',
      currentVersion: '1.0',
      versions: [{
        version: '1.0',
        ingredients: [{ name: '', amount: '', isRequired: false }],
        steps: [''],
        notes: '최초 작성',
        memo: '',
        createdAt: new Date().toISOString()
      }]
    });
    setNewRecipeTitle('');
    setIsAddingRecipe(false);
    setSelectedRecipeId(id);
  };

  const handleDeleteRecipe = () => {
    if (!selectedRecipeId) return;
    if (confirm('정말로 이 레시피를 삭제하시겠습니까? 모든 버전 기록이 사라집니다.')) {
      deleteRecipe(selectedRecipeId);
      setSelectedRecipeId(null);
    }
  };

  const handleSaveTitle = () => {
    if (selectedRecipeId && editingTitleText.trim()) {
      updateRecipe(selectedRecipeId, { title: editingTitleText });
      setIsEditingTitle(false);
    }
  };

  const handleSaveVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipeId || !newVersion.version) return;
    const cleanedIngredients = newVersion.ingredients.filter(i => i.name.trim() !== '');
    const cleanedSteps = newVersion.steps.filter(s => s.trim() !== '');
    const versionData: RecipeVersion = {
      ...newVersion,
      ingredients: cleanedIngredients,
      steps: cleanedSteps,
      createdAt: editingVersionIndex !== null ? selectedRecipe!.versions[editingVersionIndex].createdAt : new Date().toISOString()
    };
    if (editingVersionIndex !== null) {
      updateVersion(selectedRecipeId, editingVersionIndex, versionData);
    } else {
      addVersion(selectedRecipeId, versionData);
    }
    setIsAddingVersion(false);
    setEditingVersionIndex(null);
  };

  const handleEditVersion = (index: number) => {
    if (!selectedRecipe) return;
    const versionToEdit = selectedRecipe.versions[index];
    setNewVersion({
      version: versionToEdit.version,
      notes: versionToEdit.notes,
      memo: versionToEdit.memo || '',
      ingredients: versionToEdit.ingredients.map(ing => ({ ...ing, isRequired: !!ing.isRequired })),
      steps: [...versionToEdit.steps]
    });
    setEditingVersionIndex(index);
    setIsAddingVersion(true);
  };

  const handleDeleteVersion = (index: number) => {
    if (!selectedRecipeId) return;
    if (confirm('정말로 이 버전을 삭제하시겠습니까?')) {
        deleteVersion(selectedRecipeId, index);
    }
  };

  const handleOpenPublish = (version?: RecipeVersion) => {
      if (version) {
          // specific version selected
          setSelectedVersionForPublish(version);
          setIsPublishModalOpen(true);
      } else {
          // open version selector
          setIsVersionSelectOpen(true);
      }
  };

  const handleVersionSelected = (version: RecipeVersion) => {
      setIsVersionSelectOpen(false);
      setSelectedVersionForPublish(version);
      setIsPublishModalOpen(true);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    const updated = [...newVersion.ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setNewVersion({ ...newVersion, ingredients: updated });
  };

  const addIngredientRow = () => {
    setNewVersion({ ...newVersion, ingredients: [...newVersion.ingredients, { name: '', amount: '', isRequired: false }] });
  };

  const removeIngredientRow = (index: number) => {
    setNewVersion({ ...newVersion, ingredients: newVersion.ingredients.filter((_, i) => i !== index) });
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...newVersion.steps];
    updated[index] = value;
    setNewVersion({ ...newVersion, steps: updated });
  };

  const addStepRow = () => {
    setNewVersion({ ...newVersion, steps: [...newVersion.steps, ''] });
  };

  const removeStepRow = (index: number) => {
    setNewVersion({ ...newVersion, steps: newVersion.steps.filter((_, i) => i !== index) });
  };

  const checkStock = (ingredientName: string) => {
    return inventoryItems.find(item => item.name.trim().toLowerCase() === ingredientName.trim().toLowerCase());
  };

  const getStorageIcon = (type: string) => {
    if (type === 'FRIDGE') return <Refrigerator size={10} />;
    if (type === 'FREEZER') return <Refrigerator size={10} className="text-blue-300" />;
    return <Box size={10} />;
  };

  const sortedVersions = (() => {
    if (!selectedRecipe) return [];
    // Map versions to include their original index for editing/deleting
    const versionsWithIndex = selectedRecipe.versions.map((v, idx) => ({ ...v, originalIndex: idx }));
    const primaryIndex = versionsWithIndex.findIndex(v => v.version === selectedRecipe.currentVersion);
    
    let primaryVersion = null;
    let otherVersions = [];

    if (primaryIndex !== -1) {
      primaryVersion = versionsWithIndex[primaryIndex];
      otherVersions = versionsWithIndex.filter((_, idx) => idx !== primaryIndex);
    } else {
        otherVersions = versionsWithIndex;
    }
    // Sort other versions: newest first
    otherVersions.reverse();
    
    return primaryVersion ? [primaryVersion, ...otherVersions] : otherVersions;
  })();

  return (
    <div className="flex flex-col md:grid md:h-[calc(100vh-8rem)] md:grid-cols-12 md:gap-8">
      {/* Left: Recipe List */}
      <div className={`flex-col space-y-4 md:col-span-4 md:flex md:border-r md:border-zinc-800 md:pr-8 ${selectedRecipe ? 'hidden' : 'flex'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">내 레시피</h2>
          <button onClick={() => setIsAddingRecipe(true)} className="rounded-sm bg-blue-600 p-1.5 text-white hover:bg-blue-700">
            <Plus size={18} />
          </button>
        </div>
        
        {/* Search Input */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
            <input 
              className="w-full rounded-sm border border-zinc-800 bg-zinc-900 px-3 py-2 pl-9 text-sm outline-none focus:border-blue-500" 
              placeholder="레시피명 검색..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-sm border border-zinc-800">
            <button 
              onClick={() => setFilterType('mine')}
              className={`flex-1 rounded-sm py-1 text-xs font-medium transition-colors ${filterType === 'mine' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              내 레시피
            </button>
            <button 
              onClick={() => setFilterType('imported')}
              className={`flex-1 rounded-sm py-1 text-xs font-medium transition-colors ${filterType === 'imported' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              가져온 레시피
            </button>
          </div>
        </div>

        {isAddingRecipe && (
          <form onSubmit={handleCreateRecipe} className="space-y-3 rounded-sm border border-zinc-800 bg-zinc-900 p-4">
            <input autoFocus className="w-full rounded-sm border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="요리 이름..." value={newRecipeTitle} onChange={e => setNewRecipeTitle(e.target.value)} />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 rounded-sm bg-blue-600 py-1.5 text-xs font-bold">생성</button>
              <button type="button" onClick={() => setIsAddingRecipe(false)} className="flex-1 rounded-sm bg-zinc-800 py-1.5 text-xs">취소</button>
            </div>
          </form>
        )}
        <div className="flex-1 space-y-2 overflow-y-auto pr-2">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => {
              return (
                <button key={recipe.id} onClick={() => { setSelectedRecipeId(recipe.id); setIsAddingVersion(false); }} className={`flex w-full flex-col gap-2 rounded-sm border p-4 transition-all ${selectedRecipeId === recipe.id ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60'}`}>
                  <div className="flex w-full items-center justify-between">
                    <h4 className="font-bold">{recipe.title}</h4>
                    <ChevronRight size={16} className={`transition-transform ${selectedRecipeId === recipe.id ? 'text-blue-500 translate-x-1' : 'text-zinc-600'}`} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {/* Always show current version */}
                    <span className="flex items-center gap-1 rounded-sm bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                      <Star size={8} className="fill-zinc-400" />
                      v{recipe.currentVersion}
                    </span>
                    {recipe.source_author && (
                        <span className="text-[10px] text-blue-400 flex items-center gap-1">
                            From: {recipe.source_author}
                        </span>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-10 text-center text-sm text-zinc-500">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* Right: Recipe Detail */}
      <div className={`flex-1 md:col-span-8 md:overflow-y-auto md:pr-4 ${!selectedRecipe ? 'hidden md:flex' : 'block'}`}>
        {selectedRecipe ? (
          <div className="space-y-8 pb-20">
            {/* Header with Title Editing and Delete */}
            <div className="flex flex-col border-b border-zinc-800 pb-6 md:flex-row md:items-end md:justify-between">
              <div className="flex-1 md:mr-4">
                {/* Mobile Back Button */}
                <button 
                  onClick={() => setSelectedRecipeId(null)}
                  className="mb-6 flex items-center gap-2 text-zinc-500 hover:text-white md:hidden"
                >
                  <ArrowLeft size={20} />
                  <span className="text-sm font-medium">레시피 목록</span>
                </button>

                {isEditingTitle ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveTitle(); }} className="flex items-center gap-2">
                    <input 
                      autoFocus
                      className="text-2xl font-bold bg-black border-b border-blue-500 outline-none w-full md:text-3xl"
                      value={editingTitleText}
                      onChange={(e) => setEditingTitleText(e.target.value)}
                    />
                    <button type="submit" className="p-1 text-blue-500 hover:bg-blue-500/10 rounded"><Check size={24} /></button>
                    <button type="button" onClick={() => setIsEditingTitle(false)} className="p-1 text-zinc-500 hover:bg-zinc-800 rounded"><X size={24} /></button>
                  </form>
                ) : (
                  <div className="flex items-start gap-2 group">
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl break-all">{selectedRecipe.title}</h1>
                    <button onClick={handleStartEditTitle} className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-blue-500">
                      <Pencil size={18} />
                    </button>
                  </div>
                )}
                <p className="mt-2 text-sm text-zinc-400">현재 <span className="font-bold text-white">v{selectedRecipe.currentVersion}</span>이 대표 레시피입니다.</p>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-2 md:mt-0">
                {!isAddingVersion && (
                  <>
                    <button 
                        onClick={() => handleOpenPublish()}
                        className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 px-3 py-2.5 text-xs font-medium md:flex-none transition-colors"
                    >
                        <Send size={14} />
                        공유
                    </button>
                    <button onClick={handleDeleteRecipe} className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-red-900/50 px-3 py-2.5 text-xs font-medium text-red-500 hover:bg-red-900/20 md:flex-none">
                        <Trash2 size={14} />
                        삭제
                    </button>
                  </>
                )}
                <button onClick={handleOpenAddVersion} className={`flex flex-[2] items-center justify-center gap-2 rounded-sm border px-4 py-2.5 text-xs font-medium transition-colors md:flex-none ${isAddingVersion ? 'border-zinc-700 bg-zinc-800 text-zinc-300' : 'border-blue-500 bg-blue-600 text-white hover:bg-blue-700'}`}>{isAddingVersion ? '기록 취소' : <><History size={14} />새 버전 기록</>}</button>
              </div>
            </div>

            {isAddingVersion ? (
              <form onSubmit={handleSaveVersion} className="space-y-6 rounded-lg border border-zinc-800 bg-zinc-900/20 p-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                    <h3 className="text-lg font-bold text-zinc-100">{editingVersionIndex !== null ? '버전 수정' : '새 버전 기록'}</h3>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setIsAddingVersion(false)} className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors">취소</button>
                        <button type="submit" className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all">저장하기</button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500">버전 (Version)</label>
                      <input 
                        className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all" 
                        value={newVersion.version} 
                        onChange={e => setNewVersion({...newVersion, version: e.target.value})} 
                        placeholder="예: 1.0"
                      />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500">변경 사항 (Changelog)</label>
                      <input 
                        className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all" 
                        value={newVersion.notes} 
                        onChange={e => setNewVersion({...newVersion, notes: e.target.value})} 
                        placeholder="무엇이 바뀌었나요?"
                      />
                  </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">메모 & 팁</label>
                    <textarea 
                        className="w-full h-24 resize-none rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600" 
                        value={newVersion.memo} 
                        onChange={e => setNewVersion({...newVersion, memo: e.target.value})} 
                        placeholder="조리 팁이나 주의사항을 기록하세요."
                    />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">재료 목록</label>
                      <button type="button" onClick={addIngredientRow} className="text-xs font-medium text-blue-500 hover:text-blue-400 flex items-center gap-1">
                          <Plus size={12} /> 재료 추가
                      </button>
                  </div>
                  
                  <div className="space-y-2">
                    {newVersion.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex gap-2 items-start group">
                         <div className="flex-[3]">
                            <Autocomplete 
                              options={products.map(p => p.name)}
                              value={ing.name}
                              onChange={(val) => updateIngredient(idx, 'name', val)}
                              placeholder="재료명 (예: 양파)"
                            />
                         </div>
                         <input 
                            placeholder="수량" 
                            value={ing.amount} 
                            onChange={e => updateIngredient(idx, 'amount', e.target.value)} 
                            className="flex-[1.5] rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600" 
                         />
                         <button 
                            type="button" 
                            onClick={() => updateIngredient(idx, 'isRequired', !ing.isRequired)} 
                            className={`mt-2 p-1.5 rounded-md border transition-all ${ing.isRequired ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                            title={ing.isRequired ? '필수 재료' : '선택 재료'}
                         >
                            <Asterisk size={14} />
                         </button>
                         <button 
                            type="button" 
                            onClick={() => removeIngredientRow(idx)} 
                            className="mt-2 text-zinc-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            tabIndex={-1}
                         >
                            <Trash2 size={14} />
                         </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">조리 순서</label>
                        <button type="button" onClick={addStepRow} className="text-xs font-medium text-blue-500 hover:text-blue-400 flex items-center gap-1">
                            <Plus size={12} /> 단계 추가
                        </button>
                    </div>
                    <div className="space-y-3">
                        {newVersion.steps.map((step, idx) => (
                            <div key={idx} className="flex gap-3 group">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400 mt-1.5">
                                    {idx+1}
                                </div>
                                <textarea 
                                    rows={2} 
                                    className="flex-1 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none placeholder:text-zinc-600" 
                                    value={step} 
                                    onChange={e => updateStep(idx, e.target.value)} 
                                    placeholder="조리 과정을 입력하세요."
                                />
                                <button 
                                    type="button" 
                                    onClick={() => removeStepRow(idx)} 
                                    className="mt-3 text-zinc-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    tabIndex={-1}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                {sortedVersions.map((v) => {
                  const isPrimary = v.version === selectedRecipe.currentVersion;
                  return (
                    <div key={v.version} className={`relative rounded-sm border bg-zinc-900/30 group ${isPrimary ? 'border-pink-500/50 ring-1 ring-pink-500/20' : 'border-zinc-800'}`}>
                      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 p-4">
                        <div className="flex items-center gap-3"><span className={`rounded-sm px-2 py-0.5 text-sm font-bold ${isPrimary ? 'bg-pink-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>v{v.version}</span><span className="text-[10px] text-zinc-500">{format(new Date(v.createdAt), 'MM.dd HH:mm')}</span></div>
                        <div className="flex items-center gap-4">
                          {isPrimary && <span className="flex items-center gap-1 rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-bold text-pink-500"><Star size={10} className="fill-pink-500" />대표</span>}
                          
                          <div className="flex items-center gap-2">
                            {!isPrimary && <button onClick={() => setPrimaryVersion(selectedRecipe.id, v.version)} className="text-[10px] text-zinc-500 hover:text-pink-500 mr-2">대표 설정</button>}
                            
                            <button onClick={() => handleOpenPublish(v as any)} className="text-zinc-400 hover:text-blue-500 p-1" title="커뮤니티 공유">
                                <Send size={14} />
                            </button>
                            <button onClick={() => handleEditVersion((v as any).originalIndex)} className="text-zinc-400 hover:text-blue-500 p-1" title="수정">
                                <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDeleteVersion((v as any).originalIndex)} className="text-zinc-400 hover:text-red-500 p-1" title="삭제">
                                <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 md:p-6">
                        <div className="mb-6 grid gap-4 md:grid-cols-2">
                          {v.notes && <div className={`rounded-sm p-3 text-sm border-l-2 bg-zinc-800/50 ${isPrimary ? 'text-pink-100 border-pink-500' : 'text-zinc-300 border-zinc-600'}`}><span className="block text-xs font-bold opacity-50 mb-1">Change Log</span>{v.notes}</div>}
                          {v.memo && <div className="rounded-sm p-3 text-sm border border-zinc-700 bg-zinc-900/50 text-zinc-300"><span className="flex items-center gap-1 mb-1 text-xs font-bold text-yellow-500/80"><Lightbulb size={12} />Memo & Tips</span>{v.memo}</div>}
                        </div>
                        <div className="grid gap-8 md:grid-cols-2">
                          <div>
                            <h5 className="mb-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">재료</h5>
                            <ul className="space-y-2">
                                {v.ingredients.map((ing, i) => { 
                                    const stock = checkStock(ing.name); 
                                    return (
                                        <li key={i} className="flex items-center justify-between border-b border-zinc-800/50 pb-1.5 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className={ing.isRequired ? "font-bold text-blue-400" : ""}>
                                                    {ing.isRequired && <span className="text-blue-500 mr-1">*</span>}
                                                    {ing.name}
                                                </span>
                                                {stock && <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-500"><Check size={10} />{getStorageIcon(stock.storageType)}</span>}
                                            </div>
                                            <span className="opacity-50">{ing.amount}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                          </div>
                          <div><h5 className="mb-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">조리 순서</h5><div className="space-y-4">{v.steps.map((step, i) => (<div key={i} className="flex gap-3"><div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isPrimary ? 'bg-pink-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{i+1}</div><p className="text-sm leading-relaxed">{step}</p></div>))}</div></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-zinc-500"><Book size={48} className="mb-4 opacity-10" /><p>레시피를 선택하세요.</p></div>
        )}
      </div>
      <QuickProductAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} initialName={quickAddName} />
      {selectedRecipe && (
        <>
            <VersionSelectModal 
                recipe={selectedRecipe}
                isOpen={isVersionSelectOpen}
                onClose={() => setIsVersionSelectOpen(false)}
                onSelect={handleVersionSelected}
            />
            <PublishModal 
                recipe={selectedRecipe} 
                version={selectedVersionForPublish}
                isOpen={isPublishModalOpen} 
                onClose={() => setIsPublishModalOpen(false)} 
            />
        </>
      )}
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">로딩 중...</div>}>
      <RecipesContent />
    </Suspense>
  );
}
