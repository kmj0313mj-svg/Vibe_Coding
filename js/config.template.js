// API 설정 템플릿 파일
// 이 파일을 config.js로 복사하고 실제 설정을 입력하세요
// config.js는 .gitignore에 추가되어 GitHub에 업로드되지 않습니다

const API_CONFIG = {
    // OpenAI API 키 (server 모드에서만 사용)
    OPENAI_API_KEY: 'your-api-key-here',
    
    // Cloudflare Worker URL (cloudflare 모드에서 사용)
    CLOUDFLARE_WORKER_URL: 'https://your-worker.workers.dev',
    
    // API 키 사용 모드
    // 'cloudflare': Cloudflare Worker 사용 (가장 권장) - API 키가 클라이언트에 노출되지 않음
    // 'server': 서버의 API 키 사용 - 모든 사용자가 서버 API 키 사용
    // 'user': 사용자가 설정한 API 키 사용 - 각 사용자가 설정 페이지에서 개인 API 키 입력
    MODE: 'cloudflare'
};
