export const MOCK_BARCODE_DB: Record<string, { name: string; category: string; defaultExpiryDays: number }> = {
  '8801056020019': { name: '제주 삼다수 2L', category: '생수/음료', defaultExpiryDays: 365 },
  '8801115111030': { name: '서울우유 1L', category: '유제품', defaultExpiryDays: 12 },
  '8801043014816': { name: '농심 신라면 5개입', category: '가공식품', defaultExpiryDays: 180 },
  '8801037004656': { name: '동서 맥심 모카골드 100T', category: '커피/차', defaultExpiryDays: 500 },
  '8801045520117': { name: '오뚜기 3분 카레', category: '가공식품', defaultExpiryDays: 730 },
  '8801094012403': { name: '코카콜라 1.5L', category: '생수/음료', defaultExpiryDays: 180 },
};

export const searchBarcode = (code: string) => {
  return MOCK_BARCODE_DB[code] || null;
};
