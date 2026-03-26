// ===== AI 챗봇 - 플로팅 버전 =====

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

function getApiEndpoint() {
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.MODE === 'cloudflare') {
        return API_CONFIG.CLOUDFLARE_WORKER_URL;
    }
    return OPENAI_API_URL;
}

function getApiKey() {
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.MODE === 'cloudflare') {
        return null;
    }
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.MODE === 'server') {
        return API_CONFIG.OPENAI_API_KEY || '';
    }
    return localStorage.getItem('openai_api_key') || '';
}

function isApiKeyConfigured() {
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.MODE === 'cloudflare') {
        return API_CONFIG.CLOUDFLARE_WORKER_URL &&
               API_CONFIG.CLOUDFLARE_WORKER_URL !== 'https://your-worker.workers.dev';
    }
    const apiKey = getApiKey();
    return apiKey &&
           apiKey.trim().length > 0 &&
           apiKey !== 'your-api-key-here' &&
           apiKey !== 'YOUR_API_KEY_HERE';
}

// ── 상태 ──────────────────────────────────────────────────────
let isChatOpen = false;
let isProcessing = false;
let conversationHistory = [];
let currentChatSessionId = null;
let chatHistoryList = null;
let chatHistoryEmpty = null;

function generateSessionId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    return `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getChatSessionId() {
    if (!currentChatSessionId) {
        currentChatSessionId = localStorage.getItem('chat_session_id') || generateSessionId();
        localStorage.setItem('chat_session_id', currentChatSessionId);
    }
    return currentChatSessionId;
}

// 시스템 프롬프트 생성 (반려동물 이름 포함)
function getSystemPrompt() {
    const petName = localStorage.getItem('petName') || '';
    const petContext = petName ? `사용자의 반려동물 이름은 "${petName}"입니다. 대화 중 자연스럽게 이름을 사용해주세요. ` : '';
    return {
        role: "system",
        content: `당신은 반려동물 전문 상담사입니다. ${petContext}반려동물의 건강, 행동, 훈련, 영양 등에 대해 친절하고 전문적으로 답변해주세요. 답변은 반드시 한국어로 해주세요. 답변은 간결하게 2-3문단 이내로 해주세요.`
    };
}

// 대화 초기화
function resetConversation() {
    conversationHistory = [getSystemPrompt()];
    currentChatSessionId = generateSessionId();
    localStorage.setItem('chat_session_id', currentChatSessionId);
}

// ── DOM 요소 ───────────────────────────────────────────────────
const chatFloat = document.querySelector('.chat-float');
const chatFloatBtn  = document.getElementById('chatFloatBtn');
const chatFloatPopup = document.getElementById('chatFloatPopup');
const chatFloatClose = document.getElementById('chatFloatClose');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput  = document.getElementById('chatbotInput');
const chatbotSendBtn = document.getElementById('chatbotSendBtn');

function ensureHistoryUI() {
    if (!chatFloatPopup || document.getElementById('chatHistoryList')) return;

    const panel = document.createElement('div');
    panel.className = 'chat-history-panel';
    panel.innerHTML = `
        <div class="chat-history-header-row">
            <span class="chat-history-title">지난 상담 내역</span>
            <a href="chat-history.html" class="chat-history-view-all">전체 보기 →</a>
        </div>
        <div class="chat-history-empty" id="chatHistoryEmpty">아직 저장된 상담 내역이 없습니다.</div>
        <div class="chat-history-list" id="chatHistoryList"></div>
    `;

    const inputWrap = chatFloatPopup.querySelector('.chat-float-input');
    if (inputWrap) {
        chatFloatPopup.insertBefore(panel, inputWrap);
    } else {
        chatFloatPopup.appendChild(panel);
    }

    chatHistoryList = document.getElementById('chatHistoryList');
    chatHistoryEmpty = document.getElementById('chatHistoryEmpty');
}

function applyChatPointerFix() {
    if (chatFloat) chatFloat.style.pointerEvents = 'none';
    if (chatFloatBtn) chatFloatBtn.style.pointerEvents = 'auto';
    if (chatFloatPopup) chatFloatPopup.style.pointerEvents = isChatOpen ? 'auto' : 'none';
}

// ── 팝업 열기 / 닫기 ──────────────────────────────────────────
function openChat() {
    isChatOpen = true;
    chatFloatPopup.classList.add('open');
    chatFloatBtn.classList.add('open');
    chatFloatBtn.setAttribute('aria-expanded', 'true');
    chatFloatPopup.setAttribute('aria-hidden', 'false');
    applyChatPointerFix();
    // 약간 딜레이 후 포커스 (애니메이션 완료 후)
    setTimeout(() => chatbotInput && chatbotInput.focus(), 250);
}

function closeChat() {
    isChatOpen = false;
    chatFloatPopup.classList.remove('open');
    chatFloatBtn.classList.remove('open');
    chatFloatBtn.setAttribute('aria-expanded', 'false');
    chatFloatPopup.setAttribute('aria-hidden', 'true');
    applyChatPointerFix();
}

function toggleChat() {
    isChatOpen ? closeChat() : openChat();
}

if (chatFloatBtn)  chatFloatBtn.addEventListener('click', toggleChat);
if (chatFloatClose) chatFloatClose.addEventListener('click', closeChat);

// ESC 키로 닫기
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isChatOpen) closeChat();
});

// ── 메시지 추가 ────────────────────────────────────────────────
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

function addLoadingMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chatbot-message bot-message';
    messageDiv.id = 'chat-loading';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = '<div class="message-loading"><span></span><span></span><span></span></div>';

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

    return messageDiv;
}

async function saveChatHistory(userQuestion, aiAnswer) {
    try {
        if (!window.auth || typeof auth.getSupabaseClient !== 'function') return;
        await auth.init();
        if (!auth.isLoggedIn()) return;

        const client = auth.getSupabaseClient();
        const userRes = await client.auth.getUser();
        const user = userRes.data.user;
        if (!user) return;

        await client.from('chat_history').insert({
            user_id: user.id,
            session_id: getChatSessionId(),
            user_question: userQuestion,
            ai_answer: aiAnswer
        });
    } catch (e) {
        console.warn('chat_history 저장 실패:', e);
    }
}

function formatChatTime(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function openHistoryItem(item) {
    resetConversation();
    if (chatbotMessages) {
        chatbotMessages.innerHTML = '';
        addMessage(item.user_question, true);
        addMessage(item.ai_answer, false);
    }
    conversationHistory.push({ role: "user", content: item.user_question });
    conversationHistory.push({ role: "assistant", content: item.ai_answer });
}

function renderChatHistory(items) {
    ensureHistoryUI();
    if (!chatHistoryList || !chatHistoryEmpty) return;

    if (!items || items.length === 0) {
        chatHistoryList.innerHTML = '';
        chatHistoryEmpty.style.display = 'block';
        return;
    }

    chatHistoryEmpty.style.display = 'none';
    chatHistoryList.innerHTML = '';

    items.forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chat-history-item';
        button.innerHTML = `
            <div class="chat-history-question">${item.user_question}</div>
            <div class="chat-history-answer">${item.ai_answer}</div>
            <div class="chat-history-meta">${formatChatTime(item.created_at)}</div>
        `;
        button.addEventListener('click', () => openHistoryItem(item));
        chatHistoryList.appendChild(button);
    });
}

async function loadChatHistory() {
    try {
        ensureHistoryUI();
        if (!window.auth || typeof auth.getSupabaseClient !== 'function') return;
        await auth.init();
        if (!auth.isLoggedIn()) return;

        const client = auth.getSupabaseClient();
        const userRes = await client.auth.getUser();
        const user = userRes.data.user;
        if (!user) return;

        const result = await client
            .from('chat_history')
            .select('id, session_id, user_question, ai_answer, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(8);

        renderChatHistory(result.data || []);
    } catch (e) {
        console.warn('chat_history 조회 실패:', e);
    }
}

function removeLoadingMessage() {
    const el = document.getElementById('chat-loading');
    if (el) el.remove();
}

// ── OpenAI API 호출 ────────────────────────────────────────────
async function sendToOpenAI(userMessage) {
    const apiEndpoint = getApiEndpoint();
    const apiKey = getApiKey();

    if (!apiKey && (!API_CONFIG || API_CONFIG.MODE !== 'cloudflare')) {
        throw new Error('API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 입력해주세요.');
    }

    conversationHistory.push({ role: "user", content: userMessage });

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers,
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

    conversationHistory.push({ role: "assistant", content: assistantMessage });

    if (conversationHistory.length > 21) {
        conversationHistory = [conversationHistory[0], ...conversationHistory.slice(-20)];
    }

    return assistantMessage;
}

// ── 메시지 전송 ────────────────────────────────────────────────
async function handleSendMessage() {
    if (!chatbotInput) return;
    const message = chatbotInput.value.trim();
    if (!message || isProcessing) return;

    // 팝업이 닫혀있으면 열기
    if (!isChatOpen) openChat();

    addMessage(message, true);
    chatbotInput.value = '';

    isProcessing = true;
    chatbotInput.disabled = true;
    chatbotSendBtn.disabled = true;

    addLoadingMessage();

    try {
        const response = await sendToOpenAI(message);
        removeLoadingMessage();
        addMessage(response, false);
        await saveChatHistory(message, response);
        await loadChatHistory();
    } catch (error) {
        removeLoadingMessage();
        let errorMsg = '죄송합니다. 오류가 발생했습니다.';
        
        if (error.message.includes('API 키')) {
            errorMsg = '⚠️ API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 입력해주세요.';
        } else if (error.message.includes('네트워크') || error.message.includes('fetch')) {
            errorMsg = '🌐 네트워크 연결을 확인해주세요.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorMsg = '🔑 API 키가 유효하지 않습니다. 설정 페이지에서 확인해주세요.';
        } else if (error.message.includes('429')) {
            errorMsg = '⏳ 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('500') || error.message.includes('서버')) {
            errorMsg = '🔧 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else {
            errorMsg = `❌ ${error.message}`;
        }
        
        addMessage(errorMsg, false);
    } finally {
        isProcessing = false;
        chatbotInput.disabled = false;
        chatbotSendBtn.disabled = false;
        chatbotInput.focus();
    }
}

if (chatbotSendBtn) chatbotSendBtn.addEventListener('click', handleSendMessage);
if (chatbotInput) {
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
}


// ── 대화 초기화 버튼 ──────────────────────────────────────────
function setupResetButton() {
    const resetBtn = document.getElementById('chatResetBtn');
    if (!resetBtn) return;

    resetBtn.addEventListener('click', () => {
        resetConversation();
        if (chatbotMessages) {
            chatbotMessages.innerHTML = '';
            showWelcomeMessage();
        }
    });
}

// ── 환영 메시지 ───────────────────────────────────────────────
function showWelcomeMessage() {
    const petName = localStorage.getItem('petName') || '';
    const greeting = petName 
        ? `안녕하세요! 🐾 ${petName}에 대해 궁금한 것이 있으시면 언제든 물어보세요!`
        : '안녕하세요! 🐾 반려동물에 대해 궁금한 것이 있으시면 언제든 물어보세요!';
    
    addMessage(greeting, false);

    if (!isApiKeyConfigured()) {
        const mode = typeof API_CONFIG !== 'undefined' ? API_CONFIG.MODE : 'user';
        if (mode === 'cloudflare') {
            addMessage('⚠️ Cloudflare Worker가 설정되지 않았습니다. 관리자에게 문의해주세요.', false);
        } else if (mode === 'server') {
            addMessage('⚠️ 서버 API 키가 설정되지 않았습니다. 관리자에게 문의해주세요.', false);
        } else {
            addMessage('💡 AI 상담을 이용하려면 설정 페이지에서 OpenAI API 키를 입력해주세요.', false);
        }
    }
}

// ── 초기화 ────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    applyChatPointerFix();
    ensureHistoryUI();
    resetConversation();
    showWelcomeMessage();
    setupResetButton();
    loadChatHistory();
});

const chatHistoryStyle = document.createElement('style');
chatHistoryStyle.textContent = `
    .chat-history-panel {
        padding: 8px 14px 10px;
        border-top: 1px solid rgba(255,255,255,0.08);
        border-bottom: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.02);
    }
    .chat-history-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
    }
    .chat-history-title {
        font-size: 0.82rem;
        color: var(--text-secondary, #94a3b8);
    }
    .chat-history-view-all {
        font-size: 0.75rem;
        color: var(--primary, #3b82f6);
        text-decoration: none;
        transition: opacity 0.15s;
    }
    .chat-history-view-all:hover {
        opacity: 0.8;
    }
    .chat-history-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 140px;
        overflow-y: auto;
    }
    .chat-history-item {
        width: 100%;
        text-align: left;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(15,23,42,0.45);
        border-radius: 10px;
        padding: 8px 10px;
        color: inherit;
        cursor: pointer;
    }
    .chat-history-item:hover {
        border-color: var(--primary, #3b82f6);
    }
    .chat-history-question {
        font-size: 0.84rem;
        font-weight: 600;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .chat-history-answer {
        font-size: 0.76rem;
        color: var(--text-secondary, #94a3b8);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin-bottom: 4px;
    }
    .chat-history-meta, .chat-history-empty {
        font-size: 0.72rem;
        color: var(--text-secondary, #94a3b8);
    }
`;
document.head.appendChild(chatHistoryStyle);
