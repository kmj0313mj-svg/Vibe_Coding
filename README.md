# 🐾 반려동물 모니터링 시스템

반려동물의 활동을 실시간으로 모니터링하고 AI 챗봇으로 상담할 수 있는 웹 애플리케이션입니다.

## ✨ 주요 기능

- 📹 실시간 카메라 모니터링
- 🤖 AI 챗봇 상담 (OpenAI GPT-3.5)
- 📊 활동 기록 및 통계
- 📧 부재 시 이메일 알림
- 🎨 다크/라이트 테마 지원
- 📱 반응형 디자인

## 🚀 시작하기

### 필요 사항

- 웹 브라우저 (Chrome, Firefox, Safari 등)
- OpenAI API 키 (AI 챗봇 사용 시)

### 설치 방법

1. 저장소 클론
```bash
git clone <repository-url>
cd <project-folder>
```

2. 웹 서버로 실행
```bash
# Python 3 사용 시
python -m http.server 8000

# Node.js 사용 시
npx serve
```

3. 브라우저에서 `http://localhost:8000` 접속

### API 키 설정

#### 방법 1: Cloudflare Workers 사용 (가장 권장 ⭐)

API 키를 클라이언트에 노출하지 않고 안전하게 관리하는 방법입니다.

**장점:**
- ✅ API 키가 클라이언트에 노출되지 않음 (가장 안전)
- ✅ 무료 플랜 제공 (하루 100,000 요청)
- ✅ 전 세계 엣지 네트워크에서 빠른 응답
- ✅ 서버 관리 불필요

**설정 방법:**

1. Cloudflare 계정 생성 및 Worker 배포
2. `js/config.js`에서 Worker URL 설정
```javascript
const API_CONFIG = {
    CLOUDFLARE_WORKER_URL: 'https://your-worker.workers.dev',
    MODE: 'cloudflare'
};
```

자세한 설정 방법은 [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md)를 참조하세요.

#### 방법 2: 서버 API 키 사용

모든 사용자가 API 키 없이 챗봇을 사용할 수 있도록 서버에서 API 키를 관리합니다.

1. `js/config.template.js`를 `js/config.js`로 복사
```bash
cp js/config.template.js js/config.js
```

2. `js/config.js` 파일에 실제 OpenAI API 키 입력
```javascript
const API_CONFIG = {
    OPENAI_API_KEY: 'sk-your-actual-api-key-here',
    MODE: 'server'
};
```

3. GitHub에 푸시 (`.gitignore`에 의해 `config.js`는 자동 제외됨)

4. 서버에 배포 후 `config.js` 파일을 별도로 업로드

⚠️ **중요**: `js/config.js` 파일을 절대 GitHub에 업로드하지 마세요!

자세한 설정 방법은 [API_SETUP.md](API_SETUP.md)를 참조하세요.

#### 방법 3: 사용자별 API 키 사용

각 사용자가 자신의 API 키를 설정하도록 하려면:

1. `js/config.js`에서 `MODE`를 `'user'`로 설정
2. 사용자는 **설정** 페이지에서 개인 API 키 입력

⚠️ **보안 주의사항**: API 키는 브라우저에만 저장되며, 절대 다른 사람과 공유하지 마세요.

## 📁 프로젝트 구조

```
├── index.html              # 로그인 페이지
├── dashboard.html          # 대시보드
├── gallery.html           # 기록장
├── settings.html          # 설정 페이지
├── css/
│   └── style.css         # 스타일시트
├── js/
│   ├── auth.js           # 인증 로직
│   ├── chatbot.js        # AI 챗봇
│   ├── config.js         # API 설정 (Git 제외)
│   ├── config.template.js # API 설정 템플릿
│   ├── dashboard.js      # 대시보드 기능
│   ├── gallery.js        # 갤러리 기능
│   ├── settings.js       # 설정 관리
│   ├── storage.js        # 데이터 저장
│   └── theme.js          # 테마 관리
├── worker.js             # Cloudflare Worker 코드
├── .gitignore            # Git 제외 파일
├── API_SETUP.md          # API 설정 가이드
├── CLOUDFLARE_SETUP.md   # Cloudflare 설정 가이드
├── DEPLOYMENT.md         # 배포 가이드
├── SECURITY.md           # 보안 가이드
└── README.md             # 프로젝트 문서
```

## 🔒 보안

API 키 및 민감한 정보 관리에 대한 자세한 내용은 [SECURITY.md](SECURITY.md)를 참조하세요.

### 중요 사항

- API 키를 코드에 직접 입력하지 마세요
- `.gitignore`에 민감한 파일이 포함되어 있는지 확인하세요
- GitHub에 푸시하기 전에 민감한 정보를 제거하세요

## 🎯 사용 방법

### 1. 회원가입 및 로그인

- 초기 화면에서 회원가입
- 아이디와 비밀번호로 로그인

### 2. 대시보드

- 실시간 카메라 피드 확인
- 반려동물 상태 모니터링
- AI 챗봇으로 상담

### 3. 기록장

- 반려동물 사진 업로드
- 활동 기록 관리
- 날짜별 필터링

### 4. 설정

- 반려동물 이름 설정
- 알림 설정
- API 키 관리
- 테마 변경
- 비밀번호 변경

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **AI**: OpenAI GPT-3.5 Turbo API
- **Storage**: LocalStorage
- **Design**: 반응형 웹 디자인, 다크/라이트 테마

## 📝 라이선스

이 프로젝트는 개인 학습 및 포트폴리오 목적으로 제작되었습니다.

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 통해 연락해주세요.

---

Made with ❤️ for pet lovers
