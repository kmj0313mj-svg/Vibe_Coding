# Cloudflare Workers를 사용한 API 키 보안 설정

Cloudflare Workers를 사용하면 API 키를 클라이언트에 노출하지 않고 안전하게 OpenAI API를 호출할 수 있습니다.

## 📋 목차

1. [Cloudflare Workers란?](#cloudflare-workers란)
2. [설정 방법](#설정-방법)
3. [Worker 코드 작성](#worker-코드-작성)
4. [프론트엔드 수정](#프론트엔드-수정)
5. [배포 및 테스트](#배포-및-테스트)

## 🤔 Cloudflare Workers란?

- 서버리스 환경에서 JavaScript/TypeScript 코드 실행
- 전 세계 200개 이상의 엣지 로케이션에서 실행
- 무료 플랜: 하루 100,000 요청
- API 키를 서버 측에서 안전하게 관리

## 🚀 설정 방법

### 1단계: Cloudflare 계정 생성

1. [Cloudflare](https://www.cloudflare.com/) 접속
2. 무료 계정 생성
3. 이메일 인증 완료

### 2단계: Workers 프로젝트 생성

1. Cloudflare 대시보드에서 **Workers & Pages** 클릭
2. **Create application** 클릭
3. **Create Worker** 선택
4. Worker 이름 입력 (예: `openai-proxy`)
5. **Deploy** 클릭

### 3단계: 환경 변수 설정

1. 생성된 Worker의 **Settings** 탭 이동
2. **Variables** 섹션에서 **Add variable** 클릭
3. 환경 변수 추가:
   - Variable name: `OPENAI_API_KEY`
   - Value: 실제 OpenAI API 키 입력
   - **Encrypt** 체크 (중요!)
4. **Save** 클릭

## 💻 Worker 코드 작성

### worker.js

Worker의 **Quick edit** 버튼을 클릭하고 다음 코드를 입력하세요:

```javascript
// Cloudflare Worker - OpenAI API 프록시
export default {
  async fetch(request, env) {
    // CORS 헤더 설정
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // OPTIONS 요청 처리 (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // POST 요청만 허용
    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders
      });
    }

    try {
      // 클라이언트 요청 본문 파싱
      const requestBody = await request.json();

      // OpenAI API 호출
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}` // 환경 변수에서 API 키 사용
        },
        body: JSON.stringify({
          model: requestBody.model || 'gpt-3.5-turbo',
          messages: requestBody.messages,
          temperature: requestBody.temperature || 0.7,
          max_tokens: requestBody.max_tokens || 500
        })
      });

      // OpenAI 응답 받기
      const data = await response.json();

      // 클라이언트에 응답 반환
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      // 에러 처리
      return new Response(JSON.stringify({
        error: {
          message: error.message || 'Internal server error'
        }
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};
```

**Save and Deploy** 클릭하여 배포합니다.

### 보안 강화 버전 (도메인 제한)

특정 도메인에서만 접근을 허용하려면:

```javascript
export default {
  async fetch(request, env) {
    // 허용할 도메인 목록
    const allowedOrigins = [
      'https://your-domain.github.io',
      'https://your-custom-domain.com',
      'http://localhost:8000' // 로컬 테스트용
    ];

    const origin = request.headers.get('Origin');
    const isAllowed = allowedOrigins.includes(origin);

    const corsHeaders = {
      'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 허용되지 않은 도메인 차단
    if (!isAllowed && origin) {
      return new Response('Forbidden', {
        status: 403,
        headers: corsHeaders
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders
      });
    }

    try {
      const requestBody = await request.json();

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: requestBody.model || 'gpt-3.5-turbo',
          messages: requestBody.messages,
          temperature: requestBody.temperature || 0.7,
          max_tokens: requestBody.max_tokens || 500
        })
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: {
          message: error.message || 'Internal server error'
        }
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};
```

## 🔧 프론트엔드 수정

### 1. config.js 수정

```javascript
const API_CONFIG = {
    // Cloudflare Worker URL (실제 Worker URL로 변경)
    CLOUDFLARE_WORKER_URL: 'https://openai-proxy.your-subdomain.workers.dev',
    
    // API 키 사용 모드
    // 'cloudflare': Cloudflare Worker 사용 (권장)
    // 'server': 서버의 API 키 사용
    // 'user': 사용자가 설정한 API 키 사용
    MODE: 'cloudflare'
};
```

### 2. chatbot.js 수정

기존 `chatbot.js` 파일을 수정합니다:

```javascript
// OpenAI API 설정
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// API 엔드포인트 가져오기
function getApiEndpoint() {
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.MODE === 'cloudflare') {
        return API_CONFIG.CLOUDFLARE_WORKER_URL;
    }
    return OPENAI_API_URL;
}

// API 키 가져오기
function getApiKey() {
    // Cloudflare 모드에서는 API 키 불필요
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.MODE === 'cloudflare') {
        return null;
    }
    
    // 서버 모드
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.MODE === 'server') {
        return API_CONFIG.OPENAI_API_KEY || '';
    }
    
    // 사용자 모드
    return localStorage.getItem('openai_api_key') || '';
}

// API 키 유효성 검사
function isApiKeyConfigured() {
    // Cloudflare 모드는 항상 true
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.MODE === 'cloudflare') {
        return true;
    }
    
    const apiKey = getApiKey();
    return apiKey && 
           apiKey.trim().length > 0 && 
           apiKey !== 'your-api-key-here' && 
           apiKey !== 'YOUR_API_KEY_HERE';
}

// OpenAI API 호출
async function sendToOpenAI(userMessage) {
    try {
        const apiEndpoint = getApiEndpoint();
        const apiKey = getApiKey();
        
        // Cloudflare 모드가 아닌데 API 키가 없으면 에러
        if (!apiKey && API_CONFIG.MODE !== 'cloudflare') {
            throw new Error('API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 입력해주세요.');
        }

        conversationHistory.push({
            role: "user",
            content: userMessage
        });

        // 요청 헤더 설정
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Cloudflare 모드가 아닐 때만 Authorization 헤더 추가
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: conversationHistory,
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API 오류: ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage = data.choices[0].message.content;

        conversationHistory.push({
            role: "assistant",
            content: assistantMessage
        });

        // 대화 히스토리가 너무 길어지면 최근 10개만 유지
        if (conversationHistory.length > 21) {
            conversationHistory = [
                conversationHistory[0],
                ...conversationHistory.slice(-20)
            ];
        }

        return assistantMessage;
    } catch (error) {
        console.error('OpenAI API 오류:', error);
        throw error;
    }
}

// 페이지 로드 시 API 키 확인
window.addEventListener('DOMContentLoaded', () => {
    if (!isApiKeyConfigured()) {
        if (typeof API_CONFIG !== 'undefined' && API_CONFIG.MODE === 'server') {
            addMessage('⚠️ 서버 API 키가 설정되지 않았습니다. 관리자에게 문의해주세요.', false);
        } else {
            addMessage('⚠️ OpenAI API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 입력해주세요.', false);
        }
    } else {
        if (typeof API_CONFIG !== 'undefined' && 
            (API_CONFIG.MODE === 'server' || API_CONFIG.MODE === 'cloudflare')) {
            addMessage('안녕하세요! 🐾 반려동물에 대해 궁금한 것이 있으시면 언제든 물어보세요!', false);
        }
    }
});
```

## 📝 설정 단계별 요약

### 1. Cloudflare Worker 설정
```bash
1. Cloudflare 계정 생성
2. Workers & Pages → Create Worker
3. Worker 이름: openai-proxy
4. 환경 변수 추가: OPENAI_API_KEY
```

### 2. Worker 코드 배포
```bash
1. Quick edit 클릭
2. 위의 worker.js 코드 복사
3. Save and Deploy
4. Worker URL 복사 (예: https://openai-proxy.xxx.workers.dev)
```

### 3. 프론트엔드 설정
```bash
1. js/config.js 수정
   - CLOUDFLARE_WORKER_URL에 Worker URL 입력
   - MODE를 'cloudflare'로 설정

2. js/chatbot.js 수정
   - 위의 수정된 코드로 교체
```

### 4. GitHub에 배포
```bash
git add .
git commit -m "Add Cloudflare Worker integration"
git push origin main
```

## ✅ 장점

1. **보안**: API 키가 클라이언트에 노출되지 않음
2. **무료**: 하루 100,000 요청까지 무료
3. **빠름**: 전 세계 엣지 네트워크에서 실행
4. **간단**: 서버 관리 불필요
5. **확장성**: 자동으로 스케일링

## 🧪 테스트 방법

### 로컬 테스트

```bash
# 로컬 서버 실행
python -m http.server 8000

# 브라우저에서 접속
http://localhost:8000
```

### Worker 테스트

Cloudflare 대시보드에서:
1. Worker 선택
2. **Quick edit** → **Send** 탭
3. 테스트 요청 보내기:

```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "안녕하세요"
    }
  ]
}
```

## 🔍 문제 해결

### Worker가 작동하지 않는 경우

1. **환경 변수 확인**
   - Settings → Variables에서 OPENAI_API_KEY 확인
   - Encrypt 체크 확인

2. **Worker URL 확인**
   - config.js의 URL이 정확한지 확인
   - https:// 포함 확인

3. **CORS 오류**
   - Worker 코드에 CORS 헤더가 있는지 확인
   - 브라우저 콘솔에서 에러 메시지 확인

### API 요청 실패

1. **Worker 로그 확인**
   - Cloudflare 대시보드 → Worker → Logs
   - 실시간 로그에서 에러 확인

2. **OpenAI API 키 확인**
   - OpenAI 대시보드에서 키 유효성 확인
   - 사용량 한도 확인

## 💰 비용

- **Cloudflare Workers**: 무료 플랜 (하루 100,000 요청)
- **OpenAI API**: 사용량에 따라 과금
  - GPT-3.5-turbo: $0.002 / 1K tokens

## 📚 추가 자료

- [Cloudflare Workers 문서](https://developers.cloudflare.com/workers/)
- [OpenAI API 문서](https://platform.openai.com/docs/api-reference)
- [CORS 설정 가이드](https://developers.cloudflare.com/workers/examples/cors-header-proxy/)

---

**다음 단계**: [DEPLOYMENT.md](DEPLOYMENT.md)에서 전체 배포 프로세스를 확인하세요.
