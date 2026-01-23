# Smart Kitchen Log (Recipe & Inventory Manager)

개인화된 레시피 관리 및 냉장고 재고 관리 서비스입니다. Next.js 15와 Supabase를 사용하여 구축되었습니다.

## 🚀 시작하기 (새 컴퓨터 세팅 가이드)

이 프로젝트를 다른 컴퓨터에서 작업하려면 다음 단계를 따르세요.

### 1. 저장소 클론 및 패키지 설치
```bash
git clone https://github.com/2wouo/recipe.git
cd recipe
npm install
```

### 2. 환경 변수 설정 (필수!)
프로젝트 루트에 `.env.local` 파일을 생성하고, Supabase 프로젝트 설정에서 키를 가져와 입력해야 합니다. (Vercel 설정과 동일)

**.env.local 예시:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

---

## 🛠 배포 워크플로우 (Automated)

이 프로젝트는 **Vercel**과 연동되어 있습니다.
로컬에서 작업 후 `main` 브랜치에 푸시하면 자동으로 배포됩니다.

1. **코드 수정**
2. **로컬 빌드 테스트** (권장): `npm run build`
3. **커밋 및 푸시**:
   ```bash
   git add .
   git commit -m "feat: new feature"
   git push origin main
   ```
4. **자동 배포**: Vercel이 변경 사항을 감지하고 배포를 시작합니다.

## 📚 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Auth & DB**: Supabase (Auth, Postgres, RLS)
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Icons**: Lucide React