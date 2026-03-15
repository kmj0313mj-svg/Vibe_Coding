# 배포 가이드

이 문서는 반려동물 모니터링 시스템을 GitHub Pages나 다른 호스팅 서비스에 배포하는 방법을 설명합니다.

## 📋 배포 전 체크리스트

- [ ] `js/config.js` 파일에 실제 API 키 입력
- [ ] `.gitignore`에 `js/config.js` 포함 확인
- [ ] GitHub에 `config.js`가 업로드되지 않았는지 확인
- [ ] 모든 기능이 로컬에서 정상 작동하는지 테스트

## 🚀 GitHub Pages 배포

### 1단계: 저장소 준비

```bash
# Git 초기화 (아직 안 했다면)
git init

# 원격 저장소 추가
git remote add origin https://github.com/your-username/your-repo-name.git

# 파일 추가 (config.js는 자동으로 제외됨)
git add .

# 커밋
git commit -m "Initial commit"

# GitHub에 푸시
git push -u origin main
```

### 2단계: GitHub Pages 활성화

1. GitHub 저장소 페이지로 이동
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Pages** 선택
4. **Source**에서 `main` 브랜치 선택
5. **Save** 클릭
6. 배포 완료까지 1-2분 대기

### 3단계: API 키 설정

⚠️ **중요**: GitHub Pages는 정적 호스팅이므로 `config.js` 파일을 직접 관리해야 합니다.

#### 옵션 A: GitHub Actions 사용 (권장)

1. GitHub 저장소의 **Settings** → **Secrets and variables** → **Actions**로 이동
2. **New repository secret** 클릭
3. Name: `OPENAI_API_KEY`, Value: 실제 API 키 입력
4. `.github/workflows/deploy.yml` 파일 생성 (아래 참조)

```yaml
name: Deploy with API Key

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Create config.js
        run: |
          echo "const API_CONFIG = {" > js/config.js
          echo "  OPENAI_API_KEY: '${{ secrets.OPENAI_API_KEY }}'," >> js/config.js
          echo "  MODE: 'server'" >> js/config.js
          echo "};" >> js/config.js
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

#### 옵션 B: 수동 설정

GitHub Pages에서는 서버 측 환경 변수를 사용할 수 없으므로, 다음 방법 중 하나를 선택하세요:

**방법 1: 사용자 모드로 전환**

`js/config.js`의 `MODE`를 `'user'`로 변경하여 각 사용자가 자신의 API 키를 입력하도록 합니다.

```javascript
const API_CONFIG = {
    OPENAI_API_KEY: '',
    MODE: 'user'  // 서버 모드에서 사용자 모드로 변경
};
```

**방법 2: 별도 호스팅 사용**

Netlify, Vercel 등 환경 변수를 지원하는 호스팅 서비스를 사용합니다.

## 🌐 Netlify 배포 (환경 변수 지원)

### 1단계: Netlify 계정 생성

1. [Netlify](https://www.netlify.com/) 접속
2. GitHub 계정으로 로그인

### 2단계: 사이트 배포

1. **New site from Git** 클릭
2. GitHub 저장소 선택
3. 빌드 설정:
   - Build command: (비워둠)
   - Publish directory: `.`

### 3단계: 환경 변수 설정

1. 배포된 사이트의 **Site settings** → **Environment variables** 이동
2. **Add a variable** 클릭
3. Key: `OPENAI_API_KEY`, Value: 실제 API 키 입력

### 4단계: 빌드 스크립트 추가

`netlify.toml` 파일 생성:

```toml
[build]
  command = "node create-config.js"
  publish = "."

[build.environment]
  NODE_VERSION = "18"
```

`create-config.js` 파일 생성:

```javascript
const fs = require('fs');

const config = `const API_CONFIG = {
    OPENAI_API_KEY: '${process.env.OPENAI_API_KEY}',
    MODE: 'server'
};`;

fs.writeFileSync('js/config.js', config);
console.log('✅ config.js 생성 완료');
```

## 🔒 보안 체크

배포 전 다음 사항을 확인하세요:

### 1. config.js가 GitHub에 업로드되지 않았는지 확인

```bash
# Git 히스토리에서 config.js 검색
git log --all --full-history -- js/config.js

# 만약 발견되면 히스토리에서 제거
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch js/config.js" \
  --prune-empty --tag-name-filter cat -- --all
```

### 2. API 키가 노출되었다면

1. 즉시 OpenAI 대시보드에서 해당 API 키 삭제
2. 새 API 키 발급
3. 새 키로 `config.js` 업데이트

### 3. .gitignore 확인

```bash
# .gitignore에 config.js가 있는지 확인
cat .gitignore | grep config.js
```

## 🧪 배포 후 테스트

1. 배포된 URL 접속
2. 회원가입/로그인 테스트
3. 대시보드 접속
4. AI 챗봇 기능 테스트
5. 브라우저 콘솔(F12)에서 오류 확인

## ❓ 문제 해결

### 챗봇이 작동하지 않는 경우

1. **브라우저 콘솔 확인**
   - F12 키를 눌러 개발자 도구 열기
   - Console 탭에서 오류 메시지 확인

2. **API 키 확인**
   - 콘솔에서 `API_CONFIG` 입력하여 설정 확인
   - API 키가 올바르게 로드되었는지 확인

3. **CORS 오류**
   - GitHub Pages는 CORS 제한이 없음
   - 다른 호스팅 사용 시 CORS 설정 확인

### "API 키가 설정되지 않았습니다" 메시지

1. `js/config.js` 파일이 존재하는지 확인
2. API 키가 `'YOUR_API_KEY_HERE'`가 아닌 실제 키인지 확인
3. `MODE`가 `'server'`로 설정되어 있는지 확인

### GitHub Pages에서 404 오류

1. 저장소가 public인지 확인
2. GitHub Pages 설정에서 올바른 브랜치 선택 확인
3. `index.html` 파일이 루트 디렉토리에 있는지 확인

## 📞 지원

배포 관련 문제가 있으면 이슈를 등록해주세요.

---

**참고 문서**
- [API_SETUP.md](API_SETUP.md) - API 키 설정 가이드
- [SECURITY.md](SECURITY.md) - 보안 가이드
- [README.md](README.md) - 프로젝트 개요
