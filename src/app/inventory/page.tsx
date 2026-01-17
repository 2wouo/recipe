'use client';

import { useState } from 'react';
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
  const { items, addItem, updateItem, deleteItem } = useInventoryStore();
  const { products } = useProductStore();
  const [activeTab, setActiveTab] = useState<StorageType>('FRIDGE');
  
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

  // 외부 API(Open Food Facts)에서 상품 정보 조회
  const fetchProductFromExternal = async (barcode: string): Promise<string | null> => {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      if (data.status === 1 && data.product) {
        // 한국어 이름이 있으면 우선 사용, 없으면 영어 이름 사용
        return data.product.product_name_ko || data.product.product_name || null;
      }
    } catch (error) {
      console.error("External API fetch failed", error);
    }
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
            alert(`등록되지 않은 바코드입니다 (${decodedText}).\n제품명을 입력해주시면 다음부터 기억하겠습니다!`);
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
            
            <div className="flex items-center justify-between pt-2">
                 <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <label className="flex items-center gap-2">
                        <span>등록일:</span>
                        <input
                            type="date"
                            className="bg-transparent border-b border-zinc-800 text-zinc-400 outline-none focus:border-blue-500"
                            value={formData.registeredAt}
                            onChange={e => setFormData({ ...formData, registeredAt: e.target.value })}
                        />
                    </label>
                    
                    {formData.barcode && (
                        <div className="flex items-center gap-1 text-blue-500">
                            <Barcode size={14} />
                            <span>{formData.barcode}</span>
                            <button type="button" onClick={() => setFormData({...formData, barcode: ''})} className="ml-1 hover:text-red-500"><X size={12}/></button>
                        </div>
                    )}
                    
                    <button type="button" onClick={() => setIsScannerOpen(true)} className="flex items-center gap-2 text-zinc-400 hover:text-blue-500 hover:underline">
                        <QrCode size={14} />
                        다시 스캔
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-sm border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
                    >
                    취소
                    </button>
                    <button
                    type="submit"
                    className="rounded-sm bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                    {editingItemId ? '수정 완료' : '등록'}
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
