# API 키 설정 가이드

이 프로젝트는 OpenAI API를 사용하여 AI 챗봇 기능을 제공합니다.

## 🔑 서버 API 키 설정 방법 (권장)

사용자들이 개별적으로 API 키를 설정하지 않아도 챗봇을 사용할 수 있도록 서버에서 API 키를 관리합니다.

### 1단계: config.js 파일 생성

```bash
# config.template.js를 config.js로 복사
cp js/config.template.js js/config.js
```

### 2단계: API 키 입력

`js/config.js` 파일을 열고 실제 OpenAI API 키를 입력하세요:

```javascript
const API_CONFIG = {
    // OpenAI API 키를 여기에 입력
    OPENAI_API_KEY: 'sk-your-actual-api-key-here',
    
    // 서버 모드로 설정 (이 설정으로 모든 사용자가 서버 API 키를 사용)
    MODE: 'server'
};
```

### 3단계: GitHub에 업로드하지 않기

`.gitignore` 파일에 이미 `js/config.js`가 추가되어 있어, GitHub에 업로드되지 않습니다.

```
# .gitignore 내용
js/config.js
.env
.env.local
```

### 4단계: 서버에 배포

GitHub Pages나 다른 호스팅 서비스에 배포할 때:

1. 모든 파일을 업로드 (config.js는 자동으로 제외됨)
2. 서버에서 직접 `config.js` 파일을 생성하고 API 키 입력
3. 또는 FTP/SSH로 `config.js` 파일을 별도로 업로드

## 🔐 보안 주의사항

⚠️ **중요**: `config.js` 파일을 절대 GitHub에 업로드하지 마세요!

- API 키가 노출되면 무단 사용으로 인한 비용이 발생할 수 있습니다
- `.gitignore`에 `js/config.js`가 포함되어 있는지 확인하세요
- GitHub에 이미 업로드된 경우, 즉시 API 키를 재발급받으세요

## 📝 사용자 모드 (선택사항)

사용자가 각자의 API 키를 설정하도록 하려면:

```javascript
const API_CONFIG = {
    OPENAI_API_KEY: '',
    MODE: 'user'  // 'server'에서 'user'로 변경
};
```

이 경우 사용자는 설정 페이지에서 자신의 API 키를 입력해야 합니다.

## 🚀 OpenAI API 키 발급 방법

1. [OpenAI 웹사이트](https://platform.openai.com/) 접속
2. 계정 생성 또는 로그인
3. API Keys 메뉴로 이동
4. "Create new secret key" 버튼 클릭
5. 생성된 키를 복사하여 `config.js`에 입력

## ❓ 문제 해결

### 챗봇이 작동하지 않는 경우

1. `js/config.js` 파일이 존재하는지 확인
2. API 키가 올바르게 입력되었는지 확인
3. API 키가 유효한지 확인 (OpenAI 대시보드에서 확인)
4. 브라우저 콘솔(F12)에서 오류 메시지 확인

### API 키 오류 메시지가 표시되는 경우

- "Invalid API Key": API 키가 잘못되었거나 만료됨
- "Quota exceeded": API 사용량 한도 초과
- "Rate limit": 너무 많은 요청 (잠시 후 다시 시도)

## 📞 지원

문제가 계속되면 프로젝트 관리자에게 문의하세요.
