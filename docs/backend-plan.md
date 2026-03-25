# 백엔드 및 데이터 영구 저장 계획서

## 1. 현재 상태 분석

### 현재 데이터 저장 방식
- **localStorage** 사용
- 브라우저별로 데이터 격리됨
- 용량 제한: 약 5MB
- 브라우저 데이터 삭제 시 데이터 손실 위험

### 저장 중인 데이터 유형
| 데이터 | 키 | 설명 |
|--------|-----|------|
| 사용자 정보 | `users`, `currentUser` | 회원 정보 |
| 사진 | `captures` | Base64 인코딩 이미지 |
| 일기 | `diaries` | 텍스트 기록 |
| 설정 | `petName`, `theme` 등 | 사용자 설정값 |

---

## 2. 권장 백엔드 솔루션

### 옵션 A: Supabase (강력 추천)
- **장점**
  - 무료 티어 제공 (500MB 스토리지, 50,000 MAU)
  - PostgreSQL 기반 실시간 데이터베이스
  - 내장 인증 시스템 (이메일, 소셜 로그인)
  - 파일 스토리지 (이미지 저장)
  - JavaScript SDK 제공
- **적합성**: 현재 프론트엔드 구조와 호환성 높음
- **학습 곡선**: 낮음

### 옵션 B: Firebase
- **장점**
  - Google 생태계 통합
  - Firestore (NoSQL), Realtime Database
  - Cloud Storage
  - 간편한 인증
- **단점**
  - 무료 티어 제한이 Supabase보다 적음
  - 데이터 구조가 NoSQL에 맞춤 필요

### 옵션 C: 자체 서버 (Node.js + MongoDB/PostgreSQL)
- **장점**: 완전한 제어권
- **단점**: 서버 관리 필요, 비용 발생

---

## 3. 구현 계획 (Supabase 기준)

### 3.1 데이터베이스 스키마

```sql
-- 사용자 테이블 (Supabase Auth 사용)
-- auth.users 테이블 자동 생성

-- 프로필 테이블
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  pet_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사진 테이블
CREATE TABLE captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  image_url TEXT NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 일기 테이블
CREATE TABLE diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 설정 테이블
CREATE TABLE user_settings (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  theme TEXT DEFAULT 'dark',
  mail_notification BOOLEAN DEFAULT FALSE,
  mail_recipient TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 마이그레이션 단계

1. **Supabase 프로젝트 생성**
2. **데이터베이스 스키마 설정**
3. **Supabase 클라이언트 라이브러리 추가**
4. **인증 시스템 교체** (localStorage → Supabase Auth)
5. **데이터 저장 로직 교체** (localStorage → Supabase DB)
6. **이미지 스토리지 연동** (Base64 → Supabase Storage)
7. **기존 데이터 마이그레이션 도구 작성**

### 3.3 예상 코드 구조

```javascript
// js/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
export const supabase = createClient(supabaseUrl, supabaseKey)

// 예: 일기 저장
export async function saveDiary(content) {
  const { data, error } = await supabase
    .from('diaries')
    .insert({ content, user_id: supabase.auth.user()?.id })
  return { data, error }
}
```

---

## 4. 비용 예상

| 서비스 | 무료 티어 | 예상 월 비용 (소규모) |
|--------|-----------|----------------------|
| Supabase | 500MB DB, 1GB Storage | $0 (무료 티어 내) |
| Firebase | Spark 플랜 | $0 (무료 티어 내) |
| 자체 서버 | - | $5~20/월 |

---

## 5. 다음 단계

1. [ ] Supabase 계정 생성 및 프로젝트 설정
2. [ ] 데이터베이스 테이블 생성
3. [ ] 프론트엔드에 Supabase SDK 연동
4. [ ] 인증 시스템 마이그레이션
5. [ ] 데이터 저장/조회 로직 마이그레이션
6. [ ] 기존 localStorage 데이터 일괄 마이그레이션 기능

---

*문서 작성일: 2026-03-25*
