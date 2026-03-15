# 🚀 빠른 시작 가이드

이 가이드는 반려동물 모니터링 시스템을 5분 안에 설정하고 실행하는 방법을 안내합니다.

## 📋 준비물

- GitHub 계정
- OpenAI API 키 ([여기서 발급](https://platform.openai.com/api-keys))
- Cloudflare 계정 (무료, [여기서 가입](https://www.cloudflare.com/))

## ⚡ 3가지 설정 방법

### 방법 1: Cloudflare Workers (가장 권장 ⭐)

**소요 시간: 5분**

#### 1단계: Cloudflare Worker 생성 (2분)

1. [Cloudflare 대시보드](https://dash.cloudflare.com/) 접속
2. **Workers & Pages** → **Create application** 클릭
3. **Create Worker** 선택
4. Worker 이름 입력: `openai-proxy`
5. **Deploy** 클릭

#### 2단계: Worker 코드 배포 (2분)

1. **Quick edit** 버튼 클릭
2. 프로젝트의 `worker.js` 파일 내용 복사
3. Worker 에디터에 붙여넣기
4. **Save and Deploy** 클릭

#### 3단계: 환경 변수 설정 (1분)

1. Worker의 **Settings** 탭 이동
2. **Variables** 섹션에서 **Add variable** 클릭
3. 환경 변수 추가:
   - Variable name: `OPENAI_API_KEY`
   - Value: 실제 OpenAI API 키
   - **Encrypt** 체크 ✅
4. **Save** 클릭

#### 4단계: 프론트엔드 설정 (1분)

1. Worker URL 복사 (예: `https://openai-proxy.xxx.workers.dev`)
2. `js/config.js` 파일 열기
3. 다음과 같이 수정:

```javascript
const API_CONFIG = {
    CLOUDFLARE_WORKER_URL: 'https://openai-proxy.xxx.workers.dev', // 실제 Worker URL
    MODE: 'cloudflare'
};
```

#### 5단계: 테스트

```bash
# 로컬 서버 실행
python -m http.server 8000

# 브라우저에서 접속
http://localhost:8000
```

✅ 완료! 챗봇이 작동합니다.

---

### 방법 2: 서버 API 키 사용

**소요 시간: 2분**

#### 1단계: config.js 생성

```bash
cp js/config.template.js js/config.js
```

#### 2단계: API 키 입력

`js/config.js` 파일을 열고:

```javascript
const API_CONFIG = {
    OPENAI_API_KEY: 'sk-proj-여기에실제API키입력',
    MODE: 'server'
};
```

#### 3단계: 테스트

```bash
python -m http.server 8000
```

⚠️ **주의**: 이 방법은 로컬 테스트용입니다. GitHub Pages에 배포할 때는 Cloudflare를 사용하세요.

---

### 방법 3: 사용자 모드 (API 키 없이 시작)

**소요 시간: 1분**

#### 1단계: config.js 생성

```bash
cp js/config.template.js js/config.js
```

#### 2단계: 사용자 모드 설정

`js/config.js` 파일을 열고:

```javascript
const API_CONFIG = {
    MODE: 'user'
};
```

#### 3단계: 실행 후 설정

1. 로컬 서버 실행
2. 로그인 후 **설정** 페이지로 이동
3. **AI 챗봇 설정**에서 개인 API 키 입력

---

## 🌐 GitHub Pages에 배포

### 1단계: 저장소 생성

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

### 2단계: GitHub Pages 활성화

1. GitHub 저장소의 **Settings** → **Pages**
2. Source: `main` 브랜치 선택
3. **Save** 클릭

### 3단계: 배포 완료

1-2분 후 `https://your-username.github.io/your-repo` 에서 접속 가능

⚠️ **중요**: GitHub Pages에서는 Cloudflare Worker 방법을 사용해야 합니다!

---

## 🎯 체크리스트

배포 전 확인사항:

- [ ] `js/config.js` 파일이 `.gitignore`에 포함되어 있음
- [ ] GitHub에 `config.js`가 업로드되지 않았음
- [ ] Cloudflare Worker가 정상 작동함
- [ ] 로컬에서 챗봇 테스트 완료
- [ ] 모든 페이지가 정상 작동함

---

## 🧪 테스트 방법

### 1. 로그인 테스트

- 데모 계정: `admin` / `1234`
- 또는 새 계정 생성

### 2. 챗봇 테스트

대시보드에서 챗봇에 다음과 같이 물어보세요:

```
강아지가 초콜릿을 먹으면 안 되는 이유는 뭔가요?
```

정상적으로 답변이 오면 성공! ✅

### 3. 기능 테스트

- [ ] 화면 캡처 기능
- [ ] 음성 송출 기능
- [ ] 일기 작성 기능
- [ ] 테마 변경 기능

---

## ❓ 문제 해결

### 챗봇이 작동하지 않는 경우

1. **브라우저 콘솔 확인** (F12)
   - 에러 메시지 확인

2. **설정 확인**
   ```javascript
   // 콘솔에서 실행
   console.log(API_CONFIG);
   ```

3. **Worker 로그 확인** (Cloudflare 대시보드)
   - Worker → Logs 탭

### "API 키가 설정되지 않았습니다" 메시지

- **Cloudflare 모드**: Worker URL이 올바른지 확인
- **서버 모드**: `config.js`에 API 키가 있는지 확인
- **사용자 모드**: 설정 페이지에서 API 키 입력

### CORS 오류

- Worker 코드에 CORS 헤더가 있는지 확인
- `allowedOrigins` 배열에 도메인 추가

---

## 📚 더 알아보기

- [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md) - Cloudflare 상세 설정
- [API_SETUP.md](API_SETUP.md) - API 키 관리
- [DEPLOYMENT.md](DEPLOYMENT.md) - 배포 가이드
- [README.md](README.md) - 전체 문서

---

## 🎉 완료!

이제 반려동물 모니터링 시스템을 사용할 준비가 되었습니다!

궁금한 점이 있으면 이슈를 등록해주세요.
