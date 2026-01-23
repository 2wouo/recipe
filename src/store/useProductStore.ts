import { create } from 'zustand';
import { Product } from '@/types';
import { supabase } from '@/lib/supabase';

interface ProductState {
  products: Product[];
  fetchProducts: () => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  registerBarcode: (productId: string, barcode: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],

  fetchProducts: async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
        console.error('Error fetching products:', error);
        return;
    }
    set({ products: data || [] });
  },

  addProduct: async (product) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('로그인이 필요합니다.');
        return;
    }

    const { error } = await supabase.from('products').insert({
      id: product.id,
      name: product.name,
      category: product.category,
      barcodes: product.barcodes,
      user_id: user.id
    });

    if (error) {
      console.error('Error adding product:', error);
      alert('마스터 데이터 등록 실패: ' + error.message);
      return;
    }

    set((state) => ({ products: [...state.products, product] }));
  },

  deleteProduct: async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
        console.error('Error deleting product:', error);
        return;
    }
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
  },

  registerBarcode: async (productId, barcode) => {
    const product = get().products.find(p => p.id === productId);
    if (!product) return;

    const currentBarcodes = product.barcodes || [];
    if (currentBarcodes.includes(barcode)) return;

    const newBarcodes = [...currentBarcodes, barcode];

    const { error } = await supabase.from('products').update({
        barcodes: newBarcodes
    }).eq('id', productId);

    if (error) {
        console.error('Error registering barcode:', error);
        return;
    }

    set((state) => ({
      products: state.products.map(p => {
        if (p.id !== productId) return p;
        return { ...p, barcodes: newBarcodes };
      })
    }));
  },
}));