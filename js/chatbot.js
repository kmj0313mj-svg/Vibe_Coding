// OpenAI API 설정
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// LocalStorage에서 API 키 가져오기
function getApiKey() {
    return localStorage.getItem('openai_api_key') || '';
}

// API 키 유효성 검사
function isApiKeyConfigured() {
    const apiKey = getApiKey();
    return apiKey && apiKey.trim().length > 0;
}

// 챗봇 상태 관리
let isChatbotOpen = true;
let isProcessing = false;
let conversationHistory = [
    {
        role: "system",
        content: "당신은 반려동물 전문 상담사입니다. 반려동물의 건강, 행동, 훈련, 영양 등에 대해 친절하고 전문적으로 답변해주세요. 답변은 한국어로 해주세요."
    }
];

// DOM 요소
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotContainer = document.getElementById('chatbotContainer');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotSendBtn = document.getElementById('chatbotSendBtn');

// 챗봇 토글 기능
chatbotToggle.addEventListener('click', () => {
    isChatbotOpen = !isChatbotOpen;
    if (isChatbotOpen) {
        chatbotContainer.classList.remove('collapsed');
        chatbotToggle.textContent = '💬';
    } else {
        chatbotContainer.classList.add('collapsed');
        chatbotToggle.textContent = '💬';
    }
});

// 헤더 클릭으로도 토글 가능
document.querySelector('.chatbot-header').addEventListener('click', (e) => {
    if (e.target !== chatbotToggle) {
        chatbotToggle.click();
    }
});

// 메시지 추가 함수
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = isUser ? '👤' : '🤖';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const p = document.createElement('p');
    p.textContent = content;
    messageContent.appendChild(p);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    
    return messageDiv;
}

// 로딩 메시지 추가
function addLoadingMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chatbot-message bot-message';
    messageDiv.id = 'loading-message';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const loading = document.createElement('div');
    loading.className = 'message-loading';
    loading.innerHTML = '<span></span><span></span><span></span>';
    messageContent.appendChild(loading);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    
    return messageDiv;
}

// 로딩 메시지 제거
function removeLoadingMessage() {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

// OpenAI API 호출
async function sendToOpenAI(userMessage) {
    try {
        const apiKey = getApiKey();
        
        if (!apiKey) {
            throw new Error('API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 입력해주세요.');
        }

        conversationHistory.push({
            role: "user",
            content: userMessage
        });

        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
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

        // 대화 히스토리가 너무 길어지면 최근 10개만 유지 (시스템 메시지 제외)
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

// 메시지 전송 처리
async function handleSendMessage() {
    const message = chatbotInput.value.trim();
    
    if (!message || isProcessing) {
        return;
    }

    // 사용자 메시지 추가
    addMessage(message, true);
    chatbotInput.value = '';
    
    // UI 비활성화
    isProcessing = true;
    chatbotInput.disabled = true;
    chatbotSendBtn.disabled = true;
    
    // 로딩 메시지 표시
    addLoadingMessage();
    
    try {
        // OpenAI API 호출
        const response = await sendToOpenAI(message);
        
        // 로딩 메시지 제거
        removeLoadingMessage();
        
        // 봇 응답 추가
        addMessage(response, false);
    } catch (error) {
        // 로딩 메시지 제거
        removeLoadingMessage();
        
        // 에러 메시지 표시
        addMessage(`죄송합니다. 오류가 발생했습니다: ${error.message}`, false);
    } finally {
        // UI 활성화
        isProcessing = false;
        chatbotInput.disabled = false;
        chatbotSendBtn.disabled = false;
        chatbotInput.focus();
    }
}

// 전송 버튼 클릭 이벤트
chatbotSendBtn.addEventListener('click', handleSendMessage);

// Enter 키로 전송
chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

// 초기 포커스
chatbotInput.focus();

// 페이지 로드 시 API 키 확인
window.addEventListener('DOMContentLoaded', () => {
    if (!isApiKeyConfigured()) {
        addMessage('⚠️ OpenAI API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 입력해주세요.', false);
    }
});
