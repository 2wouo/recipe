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
}
