export type StorageType = 'FRIDGE' | 'FREEZER' | 'PANTRY';

export interface Product {
  id: string;
  name: string; // 표준 재료명 (예: 우유)
  category: string; // 카테고리 (예: 유제품)
  barcodes?: string[]; // 연결된 바코드 목록
}

export interface InventoryItem {
  id: string;
  name: string; // 표준 재료명 (Product.name과 일치)
  detail?: string; // 상세 제품명/메모 (예: 서울우유 1L)
  storageType: StorageType;
  registeredAt: string;
  expiryDate: string;
  quantity: string;
  barcode?: string;
}

export interface RecipeVersion {
  version: string;
  ingredients: {
    name: string; // 표준 재료명
    amount: string;
  }[];
  steps: string[];
  notes: string;
  memo?: string;
  createdAt: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  currentVersion: string;
  versions: RecipeVersion[];
  is_public?: boolean;
  user_id?: string;
  source_author?: string;
}

export interface CommunityRecipe {
  id: string;
  original_recipe_id?: string;
  title: string;
  description: string;
  ingredients: {
    name: string;
    amount: string;
  }[];
  steps: string[];
  author_id: string;
  author_name?: string;
  created_at: string;
  likes_count: number;
}

export interface Comment {
  id: string;
  recipe_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}
