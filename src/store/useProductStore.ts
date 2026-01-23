import { create } from 'zustand';
import { Product } from '@/types';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { DEFAULT_PRODUCT_LIST } from '@/utils/defaultProducts';

interface ProductState {
  products: Product[];
  fetchProducts: () => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  resetToDefaultProducts: () => Promise<void>;
  deleteAllMyProducts: () => Promise<void>;
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

  resetToDefaultProducts: async () => {
    const supabase = createClient();
    const user = useAuthStore.getState().user;
    if (!user) return;

    if (!confirm('기본 식재료 목록을 추가하시겠습니까? (이미 있는 품목은 유지됩니다)')) return;

    const productsToInsert = DEFAULT_PRODUCT_LIST.map(p => ({
        id: crypto.randomUUID(),
        name: p.name,
        category: p.category,
        user_id: user.id
    }));

    const { error } = await supabase.from('products').insert(productsToInsert);

    if (error) {
        console.error('Error resetting products:', error);
        alert('기본 목록 추가 실패: ' + error.message);
        return;
    }

    await get().fetchProducts();
    alert('기본 식재료 목록이 추가되었습니다!');
  },

  deleteAllMyProducts: async () => {
    const supabase = createClient();
    const user = useAuthStore.getState().user;
    if (!user) return;

    if (!confirm('정말로 등록된 모든 품목을 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('products').delete().eq('user_id', user.id);

    if (error) {
        console.error('Error deleting all products:', error);
        alert('삭제 실패: ' + error.message);
        return;
    }

    set({ products: [] });
    alert('모든 품목이 삭제되었습니다.');
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
