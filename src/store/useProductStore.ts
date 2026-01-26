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
  deleteDefaultProducts: () => Promise<void>;
  deleteAllMyProducts: () => Promise<void>;
  addBarcodeToProduct: (productId: string, newBarcode: string) => Promise<void>;
  searchProduct: (query: string) => Product[];
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  
  // ... (fetchProducts, addProduct, deleteProduct implementations remain same)

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

    // 1. 현재 DB에 있는 내 품목 이름들 가져오기
    const { data: existingProducts } = await supabase
        .from('products')
        .select('name')
        .eq('user_id', user.id);
    
    const existingNames = new Set(existingProducts?.map(p => p.name) || []);

    // 2. 없는 것만 골라내기
    const productsToInsert = DEFAULT_PRODUCT_LIST
        .filter(p => !existingNames.has(p.name))
        .map(p => ({
            id: crypto.randomUUID(),
            name: p.name,
            category: p.category,
            user_id: user.id
        }));

    if (productsToInsert.length === 0) {
        alert('이미 모든 기본 품목이 등록되어 있습니다.');
        return;
    }

    if (!confirm(`새로운 기본 품목 ${productsToInsert.length}개를 추가하시겠습니까?`)) return;

    // 3. 추가하기
    const { error } = await supabase.from('products').insert(productsToInsert);

    if (error) {
        console.error('Error adding default products:', error);
        alert('추가 실패: ' + error.message);
        return;
    }

    await get().fetchProducts();
    
    const addedNames = productsToInsert.map(p => p.name).join(', ');
    alert(`${productsToInsert.length}개 항목이 추가되었습니다.\n(${addedNames.length > 50 ? addedNames.slice(0, 50) + '...' : addedNames})`);
  },

  deleteDefaultProducts: async () => {
    const supabase = createClient();
    const user = useAuthStore.getState().user;
    if (!user) return;

    if (!confirm('기본 목록에 포함된 품목들을 일괄 삭제하시겠습니까? (직접 추가한 커스텀 품목은 유지됩니다)')) return;

    const defaultNames = DEFAULT_PRODUCT_LIST.map(p => p.name);

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('user_id', user.id)
        .in('name', defaultNames);

    if (error) {
        console.error('Error deleting default products:', error);
        alert('삭제 실패: ' + error.message);
        return;
    }

    await get().fetchProducts();
    alert('기본 품목들이 삭제되었습니다.');
  },

  deleteAllMyProducts: async () => {
    const supabase = createClient();
    const user = useAuthStore.getState().user;
    if (!user) return;

    if (!confirm('정말로 등록된 모든 품목을 삭제하시겠습니까? (되돌릴 수 없습니다)')) return;

    const { error } = await supabase.from('products').delete().eq('user_id', user.id);

    if (error) {
        console.error('Error deleting all products:', error);
        alert('삭제 실패: ' + error.message);
        return;
    }

    set({ products: [] });
    alert('모든 품목이 삭제되었습니다.');
  },

  addBarcodeToProduct: async (productId, newBarcode) => {
    const supabase = createClient();
    const { products } = get();
    const targetProduct = products.find(p => p.id === productId);
    
    if (!targetProduct) return;
    
    // 이미 있는 바코드면 패스
    if (targetProduct.barcodes?.includes(newBarcode)) return;

    const updatedBarcodes = [...(targetProduct.barcodes || []), newBarcode];

    const { error } = await supabase
      .from('products')
      .update({ barcodes: updatedBarcodes })
      .eq('id', productId);

    if (error) {
      console.error('Error adding barcode to product:', error);
      return;
    }

    set({
      products: products.map(p => 
        p.id === productId ? { ...p, barcodes: updatedBarcodes } : p
      )
    });
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
