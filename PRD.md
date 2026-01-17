# 제품 요구사항 문서 (PRD) - Smart Kitchen Log (가칭)

## 1. 개요 (Overview)
*   **프로젝트명:** Smart Kitchen Log
*   **목표:** 사용자가 요리 레시피를 체계적으로 기록(버전 관리 포함)하고, 식재료의 보관 장소 및 소비기한을 효율적으로 관리하여 음식물 쓰레기를 줄이고 요리의 즐거움을 높이는 웹 애플리케이션.
*   **타겟 사용자:** 요리를 즐겨하며 레시피를 발전시키고 싶은 사람, 냉장고 식재료 관리에 어려움을 겪는 1~2인 가구 및 주부.

## 2. 디자인 가이드 (Design Guidelines)
*   **테마:** 다크 모드 (Dark Mode) 기본.
*   **포인트 컬러:** 딥 블루 (Deep Blue, #2563EB ~ #1E40AF 계열) - 신뢰감과 차분함.
*   **형태 (Shape):** 라운딩을 최소화한 직관적이고 샤프한 디자인 (Border Radius: 2px ~ 4px).
*   **UI 스타일:** 정보의 가독성을 높인 카드 형태의 레이아웃, 불필요한 장식 배제.

## 3. 주요 기능 (Key Features)

### A. 식품 재고 관리 (Inventory Management)
1.  **3단 보관 장소 구분:**
    *   냉장실 (Fridge)
    *   냉동실 (Freezer)
    *   실온/펜트리 (Pantry)
    *   *탭(Tab) 또는 섹션으로 명확히 구분하여 조회.*

2.  **식료품 등록 (CRUD):**
    *   **입력 방식:**
        *   **수동 입력:** 이름, 카테고리, 수량, 보관 장소 선택.
        *   **스마트 입력 (QR/바코드):** 제품의 QR/바코드를 스캔하여 상품명 및 기본 정보 자동 입력 (외부 API 연동 필요).
    *   **날짜 관리:**
        *   **등록일:** 등록 시점의 날짜 자동 저장.
        *   **소비기한(유통기한):** 사용자 지정 혹은 자동 입력.
    *   **수정/삭제:** 등록된 정보의 자유로운 수정 및 폐기/소진 처리.

3.  **재고 현황 및 시각화:**
    *   **D-Day 표시:** 소비기한까지 남은 일수 표시 (예: `D-3`, `D-Day`, `+1일 지남`).
    *   **상태 컬러 코딩:**
        *   여유: 파란색/흰색
        *   임박 (3일 이내): 노란색/주황색
        *   경과: 붉은색 텍스트 또는 흐림 처리.

### B. 레시피 관리 (Recipe Management)
1.  **레시피 기록:**
    *   요리 이름, 한 줄 설명.
    *   **재료 목록 (Ingredients):** 필요한 재료와 정량.
    *   **조리 순서 (Steps):** 단계별 텍스트 및 사진 첨부 가능.

2.  **레시피 버전 관리 (Core Feature):**
    *   같은 요리라도 조미료 배합이나 조리법을 다르게 시도했을 때 이를 '버전(Version)'으로 기록.
    *   예: `김치찌개 v1.0 (기본)`, `김치찌개 v1.1 (설탕 줄임)`, `김치찌개 v2.0 (돼지고기 대신 참치)`
    *   이전 버전과 현재 버전의 차이점을 간단한 메모로 남김 (Change Log).

3.  **검색 및 필터:**
    *   요리 이름 검색.
    *   최신 등록순, 즐겨찾기순 정렬.

### C. 대시보드 (Dashboard) - *추가 제안*
*   **유통기한 임박 알림:** 접속 시 가장 먼저 소비해야 할 식재료 Top 5 표시.
*   **빠른 액션:** 식재료 빠른 추가, 새 레시피 작성 버튼 배치.

## 4. 데이터 구조 (Data Structure Draft)

### Inventory Item
```json
{
  "id": "uuid",
  "name": "우유",
  "storageType": "FRIDGE", // FRIDGE, FREEZER, PANTRY
  "registeredAt": "2024-01-01",
  "expiryDate": "2024-01-10",
  "quantity": "1개",
  "barcode": "8801234..." // Optional
}
```

### Recipe
```json
{
  "id": "uuid",
  "title": "알리오 올리오",
  "currentVersion": "1.2",
  "versions": [
    {
      "version": "1.0",
      "ingredients": [...],
      "steps": ["면 삶기", "볶기"],
      "notes": "좀 싱거웠음",
      "createdAt": "..."
    },
    {
      "version": "1.2",
      "ingredients": [...], // 소금 추가됨
      "steps": [...],
      "notes": "간이 딱 맞음",
      "createdAt": "..."
    }
  ]
}
```

## 5. 기술 스택 (Tech Stack)
*   **Framework:** Next.js (App Router) - SEO 및 빠른 로딩.
*   **Language:** TypeScript - 안정적인 데이터 관리.
*   **Styling:** Tailwind CSS - 다크 모드 및 커스텀 디자인 용이.
*   **State Management:** Zustand 또는 React Context.
*   **Database:** Supabase (PostgreSQL) 또는 로컬 저장을 위한 LocalStorage/IndexedDB (초기 프로토타입).
*   **Library:**
    *   `react-qr-reader` or `html5-qrcode`: 바코드 스캔.
    *   `date-fns` or `dayjs`: 날짜 계산.
    *   `lucide-react`: 아이콘.

## 6. 개발 로드맵 (Roadmap)
1.  **Phase 1 (MVP):** 프로젝트 세팅, UI 레이아웃(다크모드), 식품 재고 CRUD (수동), 레시피 CRUD (단일 버전).
2.  **Phase 2:** 레시피 버전 관리 기능 구현, 소비기한 D-Day 계산 로직 적용.
3.  **Phase 3:** 바코드/QR 스캐너 연동, 대시보드 위젯 구현.
