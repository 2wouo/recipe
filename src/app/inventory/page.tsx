'use client';

import { useState, useEffect } from 'react';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useProductStore } from '@/store/useProductStore';
import { StorageType, InventoryItem } from '@/types';
import { Plus, Trash2, Search, QrCode, Pencil, X, Calendar, Barcode } from 'lucide-react';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import QuickProductAddModal from '@/components/products/QuickProductAddModal';
import BarcodeScanner from '@/components/products/BarcodeScanner';
import { searchBarcode } from '@/utils/mockBarcodeDb';
import Autocomplete from '@/components/ui/Autocomplete';
import ProductList from '@/components/products/ProductList';
import InfoTooltip from '@/components/ui/InfoTooltip';

export default function InventoryPage() {
  const { items, addItem, updateItem, deleteItem, fetchItems } = useInventoryStore();
  const { products, fetchProducts, addProduct, addBarcodeToProduct } = useProductStore();
  
  const [viewMode, setViewMode] = useState<'INVENTORY' | 'MASTER'>('INVENTORY');
  const [activeTab, setActiveTab] = useState<StorageType>('FRIDGE');

  // Load data on mount
  useEffect(() => {
    fetchItems();
    fetchProducts();
  }, [fetchItems, fetchProducts]);
  
  // UI States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Quick Add Modal State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    detail: '',
    quantityNum: '1',
    quantityUnit: '개',
    storageType: 'FRIDGE' as StorageType,
    expiryDate: format(new Date(), 'yyyy-MM-dd'),
    registeredAt: format(new Date(), 'yyyy-MM-dd'),
    barcode: ''
  });

  const filteredItems = items.filter(item => 
    item.storageType === activeTab &&
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group & Sort for Display
  const isMiscCategory = (itemName: string) => {
      const product = products.find(p => p.name === itemName);
      if (!product) return false; 
      return ['양념/소스', '음료/간식'].includes(product.category);
  };

  const sortByExpiry = (a: InventoryItem, b: InventoryItem) => {
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  };

  const mainItems = filteredItems.filter(item => !isMiscCategory(item.name)).sort(sortByExpiry);
  const miscItems = filteredItems.filter(item => isMiscCategory(item.name)).sort(sortByExpiry);

  const resetForm = () => {
    setFormData({
      name: '',
      detail: '',
      quantityNum: '1',
      quantityUnit: '개',
      storageType: activeTab,
      expiryDate: format(new Date(), 'yyyy-MM-dd'),
      registeredAt: format(new Date(), 'yyyy-MM-dd'),
      barcode: ''
    });
    setEditingItemId(null);
    setIsFormOpen(false);
  };

  // ... (handleEditClick, handleSubmit, fetchProductFromExternal, handleScanSuccess, getDDay implementations remain same)
  // Need to copy them here because I'm replacing the whole component body basically.
  // Actually, I should use the existing implementations.
  // I will use 'replace' to inject the ViewMode switcher and condition the rendering.

  // Re-implementing handlers for context (since I'm replacing the whole file content structure effectively via 'replace' with a large block, 
  // but to be safe and precise, I'll stick to the existing handlers and just wrap the return JSX)
  
  const handleEditClick = (item: InventoryItem) => {
    setEditingItemId(item.id);
    const match = item.quantity.match(/^(\d+)\s*(.*)$/);
    const qNum = match ? match[1] : item.quantity;
    const qUnit = match ? match[2] : '';

    setFormData({
      name: item.name,
      detail: item.detail || '',
      quantityNum: qNum,
      quantityUnit: qUnit,
      storageType: item.storageType,
      expiryDate: item.expiryDate,
      registeredAt: item.registeredAt.split('T')[0],
      barcode: item.barcode || ''
    });
    setActiveTab(item.storageType); 
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const fullQuantity = `${formData.quantityNum} ${formData.quantityUnit}`.trim();

    if (editingItemId) {
      updateItem(editingItemId, {
        name: formData.name,
        detail: formData.detail,
        quantity: fullQuantity,
        storageType: formData.storageType,
        expiryDate: formData.expiryDate,
        registeredAt: new Date(formData.registeredAt).toISOString(),
        barcode: formData.barcode
      });
    } else {
      addItem({
        id: crypto.randomUUID(),
        name: formData.name,
        detail: formData.detail,
        quantity: fullQuantity,
        storageType: formData.storageType,
        expiryDate: formData.expiryDate,
        registeredAt: new Date(formData.registeredAt).toISOString(),
        barcode: formData.barcode
      });
    }

    // DB 학습: 선택된 표준 이름에 바코드 연동
    if (formData.barcode && formData.name) {
        const matchedMaster = products.find(p => p.name === formData.name);
        if (matchedMaster) {
            if (!matchedMaster.barcodes?.includes(formData.barcode)) {
                addBarcodeToProduct(matchedMaster.id, formData.barcode);
            }
        }
    }

    resetForm();
  };

  const fetchProductFromExternal = async (barcode: string): Promise<string | null> => {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      if (data.status === 1 && data.product) {
        return data.product.product_name_ko || data.product.product_name || data.product.brands || null;
      }
    } catch (e) {}

    try {
      const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].title;
      }
    } catch (e) {}

    return null;
  };

  const handleScanSuccess = async (decodedText: string) => {
    setIsScannerOpen(false);

    // 1. 내부 DB 우선 검색
    const matchedProduct = products.find(p => p.barcodes?.includes(decodedText));
    if (matchedProduct) {
        setFormData(prev => ({
            ...prev,
            name: matchedProduct.name,
            detail: matchedProduct.name,
            barcode: decodedText
        }));
        if (!isFormOpen) setIsFormOpen(true);
        return;
    }

    // 2. 외부 API 검색
    const externalName = await fetchProductFromExternal(decodedText);
    
    if (externalName) {
        setFormData(prev => ({
            ...prev,
            name: externalName,
            detail: externalName,
            barcode: decodedText
        }));
        alert(`스캔 성공: ${externalName}\n\n표준 품목명과 다를 경우, '표준 품목명'을 검색하여 선택해주세요. 저장 시 바코드가 해당 품목에 자동으로 연결됩니다.`);
    } else {
        // 3. 완전히 새로운 바코드
        setFormData(prev => ({
            ...prev,
            barcode: decodedText
        }));
        alert(`새로운 바코드입니다 (${decodedText}).\n제품명을 직접 입력해 주시면 다음부터는 자동으로 인식합니다!`);
    }

    if (!isFormOpen) {
        setIsFormOpen(true);
    }
  };

  const getDDay = (expiryDate: string) => {
    const diff = differenceInDays(parseISO(expiryDate), new Date());
    if (diff === 0) return <span className="text-orange-500 font-bold">D-Day</span>;
    if (diff < 0) return <span className="text-red-500 font-bold">{Math.abs(diff)}일 지남</span>;
    return <span className={diff <= 3 ? "text-orange-500 font-bold" : "text-zinc-400"}>D-{diff}</span>;
  };

  const renderInventoryItem = (item: InventoryItem) => (
    <div key={item.id} className="group relative rounded-sm border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:bg-zinc-900/60">
        <div className="mb-2 flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-2">
                <h4 className="font-bold truncate">{item.name}</h4>
                <p className="text-xs text-zinc-400 mt-0.5 min-h-[1.2em] truncate">
                    {item.detail?.trim() || '\u00A0'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">{item.quantity || '-'}</p>
            </div>
            <div className="flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                <button 
                    onClick={() => handleEditClick(item)}
                    className="rounded-sm p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-blue-500"
                    title="수정"
                >
                    <Pencil size={14} />
                </button>
                <button 
                    onClick={() => deleteItem(item.id)}
                    className="rounded-sm p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-500"
                    title="삭제"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
            <div className="flex items-center gap-1 text-xs text-zinc-500">
            <span>소비기한:</span>
            <span>{item.expiryDate}</span>
            </div>
            <div className="text-xs">
            {getDDay(item.expiryDate)}
            </div>
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-600">
            <span>등록일: {format(new Date(item.registeredAt), 'yyyy-MM-dd')}</span>
            {item.barcode && <Barcode size={12} className="opacity-50" />}
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center">
            <h2 className="text-xl font-bold tracking-tight">
                {viewMode === 'INVENTORY' ? '식재료 관리' : '식재료 마스터 DB'}
            </h2>
            <InfoTooltip 
                text={viewMode === 'INVENTORY' 
                    ? '냉장고와 펜트리의 재고를 꼼꼼하게 관리하세요. 등록된 식재료는 레시피 작성 시 자동으로 연동되며, 요리할 때 필요한 재료의 현황을 실시간으로 확인할 수 있습니다.' 
                    : '자주 사용하는 표준 식재료 품목을 미리 등록해두세요. 내 냉장고에 새로운 식재료를 등록할 때 검색만으로 정보를 빠르게 불러올 수 있어 편리합니다.'} 
            />
          </div>
        </div>
        
        <div className="flex bg-zinc-900 rounded-sm p-1 border border-zinc-800 self-start md:self-auto">
            <button
                onClick={() => setViewMode('INVENTORY')}
                className={`px-4 py-1.5 text-xs font-bold rounded-sm transition-all ${viewMode === 'INVENTORY' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                내 냉장고
            </button>
            <button
                onClick={() => setViewMode('MASTER')}
                className={`px-4 py-1.5 text-xs font-bold rounded-sm transition-all ${viewMode === 'MASTER' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                식재료 DB
            </button>
        </div>
      </div>

      {viewMode === 'INVENTORY' ? (
        <>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                <input 
                    className="w-full h-10 rounded-sm border border-zinc-800 bg-zinc-900 pl-9 pr-4 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                    placeholder="재고 검색..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="flex justify-between items-center border-b border-zinc-800">
                <div className="flex">
                    {(['FRIDGE', 'FREEZER', 'PANTRY'] as StorageType[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                        setActiveTab(tab);
                        if (!editingItemId) {
                            setFormData(prev => ({ ...prev, storageType: tab }));
                        }
                        }}
                        className={`px-4 md:px-6 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab 
                            ? 'border-b-2 border-blue-500 text-blue-500' 
                            : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        {tab === 'FRIDGE' ? '냉장실' : tab === 'FREEZER' ? '냉동실' : '실온/펜트리'}
                    </button>
                    ))}
                </div>
                <div className="flex gap-2 pb-2">
                    <button 
                        onClick={() => setIsScannerOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-sm border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
                    >
                        <QrCode size={16} />
                        <span className="hidden md:inline">스캔</span>
                    </button>
                    <button 
                    onClick={() => {
                        resetForm(); 
                        setIsFormOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 rounded-sm bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                    <Plus size={16} />
                    <span className="hidden md:inline">추가</span>
                    </button>
                </div>
            </div>

            {isFormOpen && (
                <div className="rounded-sm border border-zinc-800 bg-zinc-900/50 p-6 animate-in fade-in slide-in-from-top-4">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold text-zinc-100">
                        {editingItemId ? '식재료 정보 수정' : '새 식재료 등록'}
                    </h3>
                    {editingItemId && (
                        <span className="text-xs text-blue-400">수정 중...</span>
                    )}
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* 1. Product Name */}
                    <div className="space-y-2">
                    <label className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        <span>표준 품목명</span>
                        <button 
                            type="button" 
                            onClick={() => {
                                setQuickAddName(formData.name);
                                setIsQuickAddOpen(true);
                            }}
                            className="text-[10px] text-blue-500 font-bold"
                        >
                            + 새 품목 등록
                        </button>
                    </label>
                    <Autocomplete
                        options={products.map(p => p.name)}
                        placeholder="예: 우유, 양파..."
                        value={formData.name}
                        onChange={(val) => setFormData({ ...formData, name: val })}
                    />
                    </div>

                    {/* 2. Detail & Memo */}
                    <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">상세 제품명 / 메모</label>
                    <input
                        className="h-12 w-full rounded-sm border border-zinc-800 bg-black px-4 text-sm outline-none focus:border-blue-500"
                        placeholder="예: 서울우유 1L (1+1)"
                        value={formData.detail}
                        onChange={e => setFormData({ ...formData, detail: e.target.value })}
                    />
                    </div>

                    {/* 3. Quantity & Unit */}
                    <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">수량</label>
                        <input
                            type="number"
                            min="0"
                            className="h-12 w-full rounded-sm border border-zinc-800 bg-black px-4 text-sm outline-none focus:border-blue-500"
                            value={formData.quantityNum}
                            onChange={e => setFormData({ ...formData, quantityNum: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">단위</label>
                        <select
                            className="h-12 w-full rounded-sm border border-zinc-800 bg-black pl-4 pr-4 text-sm outline-none focus:border-blue-500 appearance-none"
                            value={formData.quantityUnit}
                            onChange={e => setFormData({ ...formData, quantityUnit: e.target.value })}
                        >
                            <option value="개">개</option>
                            <option value="팩">팩</option>
                            <option value="봉">봉</option>
                            <option value="Box">Box</option>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="L">L</option>
                            <option value="ml">ml</option>
                            <option value="캔">캔</option>
                            <option value="병">병</option>
                        </select>
                    </div>
                    </div>

                    {/* 4. Storage & Expiry */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">보관 장소</label>
                        <select
                        className="h-12 w-full rounded-sm border border-zinc-800 bg-black pl-4 pr-4 text-sm outline-none focus:border-blue-500 appearance-none"
                        value={formData.storageType}
                        onChange={e => setFormData({ ...formData, storageType: e.target.value as StorageType })}
                        >
                            <option value="FRIDGE">냉장실</option>
                            <option value="FREEZER">냉동실</option>
                            <option value="PANTRY">실온/펜트리</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">소비기한</label>
                        <input
                        type="date"
                        className="h-12 w-full rounded-sm border border-zinc-800 bg-black px-4 text-sm outline-none focus:border-blue-500"
                        value={formData.expiryDate}
                        onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                        />
                    </div>
                    </div>
                    
                    <div className="space-y-6 pt-6 border-t border-zinc-800">
                        {/* Meta Info */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest">등록일</label>
                                <input
                                    type="date"
                                    className="bg-transparent text-xs text-zinc-400 outline-none focus:text-blue-500"
                                    value={formData.registeredAt}
                                    onChange={e => setFormData({ ...formData, registeredAt: e.target.value })}
                                />
                            </div>
                            
                            <div className="text-right">
                                {formData.barcode ? (
                                    <div className="inline-flex items-center gap-2 text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                                        <Barcode size={14} />
                                        <span className="text-[11px] font-mono font-bold">{formData.barcode}</span>
                                        <button type="button" onClick={() => setFormData({...formData, barcode: ''})} className="hover:text-red-500"><X size={14}/></button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => setIsScannerOpen(true)} className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 transition-colors text-xs font-bold">
                                        <QrCode size={16} />
                                        <span>스캔 연결됨</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Main Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="flex-1 h-14 rounded-sm border border-zinc-800 bg-zinc-900 text-sm font-bold text-zinc-400 active:bg-zinc-800"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] h-14 rounded-sm bg-blue-600 text-sm font-black text-white active:bg-blue-700 shadow-xl shadow-blue-900/20"
                            >
                                {editingItemId ? '정보 수정' : '식재료 등록'}
                            </button>
                        </div>
                    </div>
                </form>
                </div>
            )}

            {/* Item List */}
            <div className="space-y-12 pb-20">
                {/* Main Items */}
                {mainItems.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {mainItems.map(renderInventoryItem)}
                    </div>
                )}

                {/* Misc Items Section */}
                {miscItems.length > 0 && (
                    <div className="space-y-4">
                        {/* Misc Items Divider */}
                        <div className="relative flex items-center pt-8 pb-0">
                            <div className="flex-grow border-t border-zinc-800/50"></div>
                            <span className="flex-shrink-0 mx-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                                양념/소스 & 음료
                            </span>
                            <div className="flex-grow border-t border-zinc-800/50"></div>
                        </div>

                        {/* Misc Items */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 opacity-80 hover:opacity-100 transition-opacity">
                            {miscItems.map(renderInventoryItem)}
                        </div>
                    </div>
                )}
                
                {mainItems.length === 0 && miscItems.length === 0 && (
                    <div className="py-20 text-center">
                        <p className="text-zinc-500">이곳은 비어있습니다. 새로운 식재료를 추가해보세요.</p>
                    </div>
                )}
            </div>

            {/* Quick Add Modal */}
            <QuickProductAddModal
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
                initialName={quickAddName}
                onSuccess={(newName) => setFormData(prev => ({ ...prev, name: newName }))}
            />
            
            {/* Barcode Scanner */}
            {isScannerOpen && (
                <BarcodeScanner 
                    onScanSuccess={handleScanSuccess}
                    onClose={() => setIsScannerOpen(false)}
                    onManualInput={() => {
                        setIsScannerOpen(false);
                        const barcode = prompt("바코드 번호를 입력하세요:");
                        if (barcode) {
                            handleScanSuccess(barcode);
                        }
                    }}
                />
            )}
        </>
      ) : (
        <ProductList />
      )}
    </div>
  );
}
