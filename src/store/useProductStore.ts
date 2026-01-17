import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

interface ProductState {
  products: Product[];
  addProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  registerBarcode: (productId: string, barcode: string) => void;
}

// 초기 샘플 데이터
const initialProducts: Product[] = [
  { id: '1', name: '우유', category: '유제품', barcodes: ['8801111111111'] },
  { id: '2', name: '계란', category: '유제품/알류' },
  { id: '3', name: '양파', category: '채소' },
  { id: '4', name: '대파', category: '채소' },
  { id: '5', name: '김치', category: '반찬/절임' },
  { id: '6', name: '돼지고기(목살)', category: '육류' },
];

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),
      registerBarcode: (productId, barcode) => 
        set((state) => ({
          products: state.products.map(p => {
            if (p.id !== productId) return p;
            const currentBarcodes = p.barcodes || [];
            if (currentBarcodes.includes(barcode)) return p;
            return { ...p, barcodes: [...currentBarcodes, barcode] };
          })
        })),
    }),
    {
      name: 'product-storage',
    }
  )
);
