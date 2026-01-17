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

export default function InventoryPage() {
  const { items, addItem, updateItem, deleteItem, fetchItems } = useInventoryStore();
  const { products, fetchProducts } = useProductStore();
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

  const filteredItems = items.filter(item => item.storageType === activeTab);

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
    resetForm();
  };

  // 외부 API들에서 상품 정보 조회 (멀티 소스)
  const fetchProductFromExternal = async (barcode: string): Promise<string | null> => {
    // 1. Open Food Facts (글로벌/한국 식품 특화)
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      if (data.status === 1 && data.product) {
        return data.product.product_name_ko || data.product.product_name || data.product.brands || null;
      }
    } catch (e) {}

    // 2. UPCItemDB (공산품/글로벌 특화 폴백)
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
    
    // 1. 외부 API 검색 (무조건 먼저 실행)
    const externalName = await fetchProductFromExternal(decodedText);
    
    if (externalName) {
        // 외부 DB에서 찾았을 때
        setFormData(prev => ({
            ...prev,
            name: externalName,
            detail: externalName,
            barcode: decodedText
        }));

        // [지능형 학습] 외부에서 찾은 제품을 내 '식재료 마스터'에도 자동 등록 (없을 경우에만)
        const existsInMaster = products.some(p => p.name === externalName || p.barcodes?.includes(decodedText));
        if (!existsInMaster) {
            addProduct({
                id: crypto.randomUUID(),
                name: externalName,
                category: '기타', // 나중에 사용자가 수정 가능
                barcodes: [decodedText]
            });
        }
    } else {
        // 2. 외부 DB에 없을 때만 내 DB 검색
        const matchedProduct = products.find(p => p.barcodes?.includes(decodedText));
        
        if (matchedProduct) {
            setFormData(prev => ({
                ...prev,
                name: matchedProduct.name,
                detail: matchedProduct.name,
                barcode: decodedText
            }));
        } else {
            // 3. 둘 다 없을 때
            setFormData(prev => ({
                ...prev,
                barcode: decodedText
            }));
            alert(`외부 데이터베이스에도 없는 제품입니다 (${decodedText}).\n제품명을 직접 입력해 주시면 다음부터는 자동으로 인식합니다!`);
        }
    }
    
    // 폼 열기
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">식재료 관리</h2>
          <p className="text-zinc-400">냉장고와 펜트리의 재고를 관리하세요.</p>
        </div>
        <div className="flex w-full gap-2 md:w-auto">
            <button 
                onClick={() => setIsScannerOpen(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors md:flex-none md:py-2"
            >
                <QrCode size={18} />
                <span>스캔</span>
            </button>
            <button 
            onClick={() => {
                resetForm(); 
                setIsFormOpen(true);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors md:flex-none md:py-2"
            >
            <Plus size={18} />
            <span className="whitespace-nowrap">식재료 추가</span>
            </button>
        </div>
      </div>

      <div className="flex border-b border-zinc-800">
        {(['FRIDGE', 'FREEZER', 'PANTRY'] as StorageType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (!editingItemId) {
                  setFormData(prev => ({ ...prev, storageType: tab }));
              }
            }}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab 
                ? 'border-b-2 border-blue-500 text-blue-500' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab === 'FRIDGE' ? '냉장실' : tab === 'FREEZER' ? '냉동실' : '실온/펜트리'}
          </button>
        ))}
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
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
              {/* Name Input with Quick Add */}
              <div className="space-y-2 md:col-span-1">
                <label className="flex items-center justify-between text-xs font-medium text-zinc-500">
                    <span>표준 품목명</span>
                    <button 
                        type="button" 
                        onClick={() => {
                            setQuickAddName(formData.name);
                            setIsQuickAddOpen(true);
                        }}
                        className="text-[10px] text-blue-500 hover:underline"
                    >
                        + 새 품목 등록
                    </button>
                </label>
                <Autocomplete
                  options={products.map(p => p.name)}
                  placeholder="예: 우유"
                  value={formData.name}
                  onChange={(val) => setFormData({ ...formData, name: val })}
                />
              </div>

              {/* Detail Input */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-medium text-zinc-500">상세 제품명 / 메모</label>
                <input
                  className="h-10 w-full rounded-sm border border-zinc-800 bg-black px-3 text-sm outline-none focus:border-blue-500"
                  placeholder="예: 서울우유 1L (1+1)"
                  value={formData.detail}
                  onChange={e => setFormData({ ...formData, detail: e.target.value })}
                />
              </div>

              {/* Quantity Input */}
              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-medium text-zinc-500">수량</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        min="0"
                        className="h-10 w-16 rounded-sm border border-zinc-800 bg-black px-2 text-center text-sm outline-none focus:border-blue-500"
                        value={formData.quantityNum}
                        onChange={e => setFormData({ ...formData, quantityNum: e.target.value })}
                    />
                    <select
                        className="h-10 flex-1 rounded-sm border border-zinc-800 bg-black px-2 text-sm outline-none focus:border-blue-500"
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

              {/* Storage Type */}
              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-medium text-zinc-500">보관 장소</label>
                <select
                  className="h-10 w-full rounded-sm border border-zinc-800 bg-black px-3 text-sm outline-none focus:border-blue-500 appearance-none"
                  value={formData.storageType}
                  onChange={e => setFormData({ ...formData, storageType: e.target.value as StorageType })}
                >
                    <option value="FRIDGE">냉장실</option>
                    <option value="FREEZER">냉동실</option>
                    <option value="PANTRY">실온/펜트리</option>
                </select>
              </div>

              {/* Expiry Date */}
              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-medium text-zinc-500">소비기한</label>
                <input
                  type="date"
                  className="h-10 w-full rounded-sm border border-zinc-800 bg-black px-3 text-sm outline-none focus:border-blue-500"
                  value={formData.expiryDate}
                  onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                {/* Meta Info: Date & Barcode */}
                <div className="grid grid-cols-2 gap-4 text-[11px]">
                    <div className="space-y-1.5">
                        <label className="text-zinc-500 font-medium">등록일</label>
                        <input
                            type="date"
                            className="w-full bg-zinc-800/50 rounded-sm px-2 py-2 text-zinc-300 outline-none border border-zinc-700/50"
                            value={formData.registeredAt}
                            onChange={e => setFormData({ ...formData, registeredAt: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5 text-right">
                        <label className="text-zinc-500 font-medium">바코드 정보</label>
                        <div className="h-[34px] flex items-center justify-end gap-2 text-zinc-400">
                            {formData.barcode ? (
                                <div className="flex items-center gap-1.5 text-blue-500 bg-blue-500/10 px-2 py-1 rounded-sm border border-blue-500/20">
                                    <Barcode size={12} />
                                    <span className="font-mono">{formData.barcode.slice(-4)}...</span>
                                    <button type="button" onClick={() => setFormData({...formData, barcode: ''})} className="hover:text-red-500"><X size={12}/></button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => setIsScannerOpen(true)} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                                    <QrCode size={14} />
                                    <span>재스캔</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 h-12 rounded-sm border border-zinc-700 bg-zinc-800 text-sm font-medium text-zinc-400 active:bg-zinc-700 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        className="flex-[2] h-12 rounded-sm bg-blue-600 text-sm font-bold text-white active:bg-blue-700 shadow-lg shadow-blue-900/20 transition-colors"
                    >
                        {editingItemId ? '수정 완료' : '식재료 등록'}
                    </button>
                </div>
            </div>
          </form>
        </div>
      )}

      {/* Item List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div key={item.id} className="group relative rounded-sm border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:bg-zinc-900/60">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h4 className="font-bold">{item.name}</h4>
                  {item.detail && (
                      <p className="text-xs text-zinc-400 mt-0.5">{item.detail}</p>
                  )}
                  <p className="text-xs text-zinc-500 mt-1">{item.quantity || '-'}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
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
    </div>
  );
}
