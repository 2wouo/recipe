import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { InventoryItem } from '@/types';
import { addDays, format } from 'date-fns';

interface InventoryState {
  items: InventoryItem[];
  addItem: (item: InventoryItem) => void;
  updateItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
}

const initialData: InventoryItem[] = [
  {
    id: '1',
    name: '우유',
    storageType: 'FRIDGE',
    quantity: '1팩',
    registeredAt: new Date().toISOString(),
    expiryDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
  },
  {
    id: '2',
    name: '닭가슴살',
    storageType: 'FREEZER',
    quantity: '500g',
    registeredAt: new Date().toISOString(),
    expiryDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
  },
  {
    id: '3',
    name: '파스타 면',
    storageType: 'PANTRY',
    quantity: '1봉',
    registeredAt: new Date().toISOString(),
    expiryDate: format(addDays(new Date(), 365), 'yyyy-MM-dd'),
  }
];

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      items: initialData,
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      updateItem: (id, updatedItem) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updatedItem } : item
          ),
        })),
      deleteItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
    }),
    {
      name: 'inventory-storage',
    }
  )
);