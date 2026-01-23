import { create } from 'zustand';
import { Product } from '@/types';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';

interface ProductState {
  products: Product[];
  fetchProducts: () => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  searchProduct: (query: string) => Product[];
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  
  fetchProducts: async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    const mappedProducts: Product[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      barcodes: row.barcodes || []
    }));

    set({ products: mappedProducts });
  },

  addProduct: async (product) => {
    const supabase = createClient();
    const user = useAuthStore.getState().user;
    
    if (!user) {
        alert('로그인이 필요합니다. 다시 로그인해주세요.');
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
    const supabase = createClient();
    const { error } = await supabase.from('products').delete().eq('id', id);
    
    if (error) {
        console.error('Error deleting product:', error);
        alert('삭제 실패: ' + error.message);
        return;
    }

    set((state) => ({
        products: state.products.filter((p) => p.id !== id),
    }));
  },

  searchProduct: (query) => {
    const { products } = get();
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.barcodes?.some(b => b.includes(lowerQuery))
    );
  }
}));
