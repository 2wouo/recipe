import { create } from 'zustand';
import { InventoryItem } from '@/types';
import { supabase } from '@/lib/supabase';

interface InventoryState {
  items: InventoryItem[];
  fetchItems: () => Promise<void>;
  addItem: (item: InventoryItem) => Promise<void>;
  updateItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  
  fetchItems: async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('expiry_date', { ascending: true }); // 소비기한 임박순 정렬

    if (error) {
      console.error('Error fetching inventory:', error);
      return;
    }

    // DB의 snake_case 컬럼명을 앱의 camelCase로 변환
    const mappedItems: InventoryItem[] = (data || []).map((row: Record<string, string | null>) => ({
      id: row.id as string,
      name: row.name as string,
      detail: row.detail as string | undefined,
      storageType: row.storage_type as "FRIDGE" | "FREEZER" | "PANTRY",
      quantity: row.quantity as string,
      expiryDate: row.expiry_date as string,
      registeredAt: row.registered_at as string,
      barcode: row.barcode as string | undefined
    }));

    set({ items: mappedItems });
  },

  addItem: async (item) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('로그인이 필요합니다.');
        return;
    }

    const { error } = await supabase.from('inventory').insert({
      id: item.id,
      name: item.name,
      detail: item.detail,
      storage_type: item.storageType, // DB column name might be 'storage_type'
      quantity: item.quantity,
      expiry_date: item.expiryDate, // DB column name might be 'expiry_date'
      registered_at: item.registeredAt, // DB column name might be 'registered_at'
      barcode: item.barcode,
      user_id: user.id
    });

    if (error) {
      console.error('Error adding item:', error);
      alert('데이터 등록 실패: ' + error.message);
      return;
    }

    set((state) => ({ items: [...state.items, item] }));
  },

  updateItem: async (id, updatedItem) => {
    // 업데이트할 필드만 추출하여 snake_case로 변환
    const updates: Record<string, string | null> = {};
    if (updatedItem.name) updates.name = updatedItem.name;
    if (updatedItem.detail !== undefined) updates.detail = updatedItem.detail;
    if (updatedItem.storageType) updates.storage_type = updatedItem.storageType;
    if (updatedItem.quantity) updates.quantity = updatedItem.quantity;
    if (updatedItem.expiryDate) updates.expiry_date = updatedItem.expiryDate;
    if (updatedItem.registeredAt) updates.registered_at = updatedItem.registeredAt;
    if (updatedItem.barcode !== undefined) updates.barcode = updatedItem.barcode;

    const { error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating item:', error);
      return;
    }

    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updatedItem } : item
      ),
    }));
  },

  deleteItem: async (id) => {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting item:', error);
      return;
    }

    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },
}));
