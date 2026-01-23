import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { InventoryItem, StorageType } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';

interface InventoryState {
  items: InventoryItem[];
  fetchItems: () => Promise<void>;
  addItem: (item: InventoryItem) => Promise<void>;
  updateItem: (id: string, updatedItem: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  fetchItems: async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('Error fetching inventory:', error);
      return;
    }

    const mappedItems: InventoryItem[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      detail: row.detail,
      storageType: row.storage_type as StorageType,
      quantity: row.quantity,
      expiryDate: row.expiry_date,
      registeredAt: row.registered_at,
      barcode: row.barcode
    }));

    set({ items: mappedItems });
  },
  addItem: async (item) => {
    const supabase = createClient();
    const user = useAuthStore.getState().user;
    
    if (!user) {
        alert('로그인이 필요합니다. 다시 로그인해주세요.');
        return;
    }

    const { error } = await supabase.from('inventory').insert({
      id: item.id,
      name: item.name,
      detail: item.detail,
      storage_type: item.storageType,
      quantity: item.quantity,
      expiry_date: item.expiryDate,
      registered_at: item.registeredAt,
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
    const supabase = createClient();
    const updates: any = {};
    if (updatedItem.name) updates.name = updatedItem.name;
    if (updatedItem.detail !== undefined) updates.detail = updatedItem.detail;
    if (updatedItem.quantity) updates.quantity = updatedItem.quantity;
    if (updatedItem.storageType) updates.storage_type = updatedItem.storageType;
    if (updatedItem.expiryDate) updates.expiry_date = updatedItem.expiryDate;
    if (updatedItem.registeredAt) updates.registered_at = updatedItem.registeredAt;
    if (updatedItem.barcode !== undefined) updates.barcode = updatedItem.barcode;

    const { error } = await supabase.from('inventory').update(updates).eq('id', id);

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
    const supabase = createClient();
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) {
        console.error('Error deleting item:', error);
        return;
    }
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },
}));