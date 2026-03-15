// Cloudflare Worker - OpenAI API 프록시
// 이 코드를 Cloudflare Workers 대시보드에 복사하세요

export default {
  async fetch(request, env) {
    // 모든 도메인 허용 (개발 중)
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
      return new Response(JSON.stringify({
        error: {
          message: 'Method not allowed. Only POST requests are accepted.'
        }
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    try {
      // 환경 변수 확인
      if (!env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }

      // 클라이언트 요청 본문 파싱
      const requestBody = await request.json();

      // 필수 필드 확인
      if (!requestBody.messages || !Array.isArray(requestBody.messages)) {
        throw new Error('Invalid request: messages array is required');
      }

      // OpenAI API 호출
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
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        error: {
          message: error.message || 'Internal server error',
          type: 'worker_error'
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
