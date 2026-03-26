// AI 상담 내역 페이지 스크립트

const ChatHistory = (function() {
    let allSessions = [];
    let filteredSessions = [];
    let currentPage = 1;
    const sessionsPerPage = 10;
    let supabaseClient = null;

    // DOM 요소
    const elements = {
        dateFrom: null,
        dateTo: null,
        searchKeyword: null,
        applyFilterBtn: null,
        resetFilterBtn: null,
        quickFilterBtns: null,
        statTotalChats: null,
        statTotalSessions: null,
        statLastChat: null,
        loadingState: null,
        emptyState: null,
        sessionsList: null,
        pagination: null,
        prevPageBtn: null,
        nextPageBtn: null,
        pageInfo: null,
        chatDetailModal: null,
        modalTitle: null,
        modalBody: null,
        modalCloseBtn: null,
        modalCloseBtn2: null,
        deleteSessionBtn: null
    };

    let currentSessionId = null;

    function init() {
        cacheElements();
        setupEventListeners();
        loadChatHistory();
    }

    function cacheElements() {
        elements.dateFrom = document.getElementById('dateFrom');
        elements.dateTo = document.getElementById('dateTo');
        elements.searchKeyword = document.getElementById('searchKeyword');
        elements.applyFilterBtn = document.getElementById('applyFilterBtn');
        elements.resetFilterBtn = document.getElementById('resetFilterBtn');
        elements.quickFilterBtns = document.querySelectorAll('.btn-quick[data-range]');
        elements.statTotalChats = document.getElementById('statTotalChats');
        elements.statTotalSessions = document.getElementById('statTotalSessions');
        elements.statLastChat = document.getElementById('statLastChat');
        elements.loadingState = document.getElementById('loadingState');
        elements.emptyState = document.getElementById('emptyState');
        elements.sessionsList = document.getElementById('sessionsList');
        elements.pagination = document.getElementById('pagination');
        elements.prevPageBtn = document.getElementById('prevPageBtn');
        elements.nextPageBtn = document.getElementById('nextPageBtn');
        elements.pageInfo = document.getElementById('pageInfo');
        elements.chatDetailModal = document.getElementById('chatDetailModal');
        elements.modalTitle = document.getElementById('modalTitle');
        elements.modalBody = document.getElementById('modalBody');
        elements.modalCloseBtn = document.getElementById('modalCloseBtn');
        elements.modalCloseBtn2 = document.getElementById('modalCloseBtn2');
        elements.deleteSessionBtn = document.getElementById('deleteSessionBtn');
    }

    function setupEventListeners() {
        elements.applyFilterBtn?.addEventListener('click', applyFilters);
        elements.resetFilterBtn?.addEventListener('click', resetFilters);
        
        elements.quickFilterBtns?.forEach(btn => {
            btn.addEventListener('click', () => applyQuickFilter(btn.dataset.range));
        });

        elements.searchKeyword?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') applyFilters();
        });

        elements.prevPageBtn?.addEventListener('click', () => changePage(-1));
        elements.nextPageBtn?.addEventListener('click', () => changePage(1));

        elements.modalCloseBtn?.addEventListener('click', closeModal);
        elements.modalCloseBtn2?.addEventListener('click', closeModal);
        elements.chatDetailModal?.addEventListener('click', (e) => {
            if (e.target === elements.chatDetailModal) closeModal();
        });
        elements.deleteSessionBtn?.addEventListener('click', deleteCurrentSession);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.chatDetailModal?.classList.contains('open')) {
                closeModal();
            }
        });
    }

    async function getClient() {
        if (!supabaseClient && window.auth && typeof auth.getSupabaseClient === 'function') {
            supabaseClient = auth.getSupabaseClient();
        }
        return supabaseClient;
    }

    async function loadChatHistory() {
        showLoading();

        try {
            const client = await getClient();
            if (!client) {
                showEmpty();
                return;
            }

            const userRes = await client.auth.getUser();
            const user = userRes.data.user;
            if (!user) {
                showEmpty();
                return;
            }

            const { data, error } = await client
                .from('chat_history')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('chat_history 조회 오류:', error);
                showEmpty();
                return;
            }

            if (!data || data.length === 0) {
                showEmpty();
                return;
            }

            allSessions = groupBySession(data);
            filteredSessions = [...allSessions];
            updateStats(data);
            renderSessions();

        } catch (e) {
            console.error('상담 내역 로드 실패:', e);
            showEmpty();
        }
    }

    function groupBySession(chats) {
        const sessionMap = new Map();

        chats.forEach(chat => {
            const sessionId = chat.session_id;
            if (!sessionMap.has(sessionId)) {
                sessionMap.set(sessionId, {
                    sessionId: sessionId,
                    chats: [],
                    firstChat: null,
                    lastChat: null
                });
            }
            sessionMap.get(sessionId).chats.push(chat);
        });

        const sessions = Array.from(sessionMap.values());

        sessions.forEach(session => {
            session.chats.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            session.firstChat = session.chats[0];
            session.lastChat = session.chats[session.chats.length - 1];
        });

        sessions.sort((a, b) => new Date(b.lastChat.created_at) - new Date(a.lastChat.created_at));

        return sessions;
    }

    function updateStats(allChats) {
        const totalChats = allChats.length;
        const uniqueSessions = new Set(allChats.map(c => c.session_id)).size;
        const lastChatDate = allChats.length > 0 ? formatDate(allChats[0].created_at) : '-';

        elements.statTotalChats.textContent = totalChats;
        elements.statTotalSessions.textContent = uniqueSessions;
        elements.statLastChat.textContent = lastChatDate;
    }

    function renderSessions() {
        hideLoading();

        if (filteredSessions.length === 0) {
            elements.sessionsList.innerHTML = `
                <div class="no-results">
                    <span class="no-results-icon">🔍</span>
                    <p>검색 결과가 없습니다.</p>
                </div>
            `;
            elements.pagination.style.display = 'none';
            return;
        }

        const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage);
        currentPage = Math.min(currentPage, totalPages);
        const startIdx = (currentPage - 1) * sessionsPerPage;
        const endIdx = startIdx + sessionsPerPage;
        const pageSessions = filteredSessions.slice(startIdx, endIdx);

        let html = '';
        pageSessions.forEach(session => {
            const dateLabel = formatDateLabel(session.lastChat.created_at);
            const timeLabel = formatTime(session.lastChat.created_at);
            const firstQuestion = truncate(session.firstChat.user_question, 60);
            const chatCount = session.chats.length;

            html += `
                <div class="session-card" data-session-id="${session.sessionId}">
                    <div class="session-header">
                        <span class="session-date">${dateLabel}</span>
                        <span class="session-time">${timeLabel}</span>
                        <span class="session-count">${chatCount}개의 대화</span>
                    </div>
                    <div class="session-preview">
                        <div class="session-question">
                            <span class="session-q-icon">❓</span>
                            <span class="session-q-text">${escapeHtml(firstQuestion)}</span>
                        </div>
                        <div class="session-answer">
                            <span class="session-a-icon">🤖</span>
                            <span class="session-a-text">${escapeHtml(truncate(session.firstChat.ai_answer, 80))}</span>
                        </div>
                    </div>
                    <button type="button" class="btn btn-secondary session-view-btn">상세 보기</button>
                </div>
            `;
        });

        elements.sessionsList.innerHTML = html;

        document.querySelectorAll('.session-card').forEach(card => {
            card.addEventListener('click', () => {
                const sessionId = card.dataset.sessionId;
                openSessionDetail(sessionId);
            });
        });

        updatePagination(totalPages);
    }

    function updatePagination(totalPages) {
        if (totalPages <= 1) {
            elements.pagination.style.display = 'none';
            return;
        }

        elements.pagination.style.display = 'flex';
        elements.pageInfo.textContent = `${currentPage} / ${totalPages}`;
        elements.prevPageBtn.disabled = currentPage <= 1;
        elements.nextPageBtn.disabled = currentPage >= totalPages;
    }

    function changePage(delta) {
        const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage);
        const newPage = currentPage + delta;
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            renderSessions();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function applyFilters() {
        const fromDate = elements.dateFrom.value ? new Date(elements.dateFrom.value) : null;
        const toDate = elements.dateTo.value ? new Date(elements.dateTo.value + 'T23:59:59') : null;
        const keyword = elements.searchKeyword.value.trim().toLowerCase();

        filteredSessions = allSessions.filter(session => {
            const sessionDate = new Date(session.lastChat.created_at);

            if (fromDate && sessionDate < fromDate) return false;
            if (toDate && sessionDate > toDate) return false;

            if (keyword) {
                const hasKeyword = session.chats.some(chat =>
                    chat.user_question.toLowerCase().includes(keyword) ||
                    chat.ai_answer.toLowerCase().includes(keyword)
                );
                if (!hasKeyword) return false;
            }

            return true;
        });

        currentPage = 1;
        renderSessions();
    }

    function resetFilters() {
        elements.dateFrom.value = '';
        elements.dateTo.value = '';
        elements.searchKeyword.value = '';
        elements.quickFilterBtns.forEach(btn => btn.classList.remove('active'));

        filteredSessions = [...allSessions];
        currentPage = 1;
        renderSessions();
    }

    function applyQuickFilter(range) {
        elements.quickFilterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.range === range);
        });

        const now = new Date();
        let fromDate = null;

        switch (range) {
            case 'today':
                fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                fromDate = new Date(now);
                fromDate.setDate(now.getDate() - now.getDay());
                fromDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'all':
            default:
                fromDate = null;
                break;
        }

        elements.dateFrom.value = fromDate ? formatDateInput(fromDate) : '';
        elements.dateTo.value = '';
        applyFilters();
    }

    function openSessionDetail(sessionId) {
        const session = allSessions.find(s => s.sessionId === sessionId);
        if (!session) return;

        currentSessionId = sessionId;

        const dateLabel = formatDateLabel(session.firstChat.created_at);
        elements.modalTitle.textContent = `📅 ${dateLabel} 상담`;

        let chatHtml = '<div class="modal-chat-list">';
        session.chats.forEach(chat => {
            const time = formatTime(chat.created_at);
            chatHtml += `
                <div class="modal-chat-item">
                    <div class="modal-chat-user">
                        <span class="modal-chat-avatar">👤</span>
                        <div class="modal-chat-bubble user">
                            <p>${escapeHtml(chat.user_question)}</p>
                            <span class="modal-chat-time">${time}</span>
                        </div>
                    </div>
                    <div class="modal-chat-bot">
                        <span class="modal-chat-avatar">🤖</span>
                        <div class="modal-chat-bubble bot">
                            <p>${escapeHtml(chat.ai_answer)}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        chatHtml += '</div>';

        elements.modalBody.innerHTML = chatHtml;
        elements.chatDetailModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        elements.chatDetailModal.classList.remove('open');
        document.body.style.overflow = '';
        currentSessionId = null;
    }

    async function deleteCurrentSession() {
        if (!currentSessionId) return;

        if (!confirm('이 상담 세션을 삭제하시겠습니까?\n삭제된 내역은 복구할 수 없습니다.')) {
            return;
        }

        try {
            const client = await getClient();
            if (!client) return;

            const { error } = await client
                .from('chat_history')
                .delete()
                .eq('session_id', currentSessionId);

            if (error) {
                console.error('삭제 오류:', error);
                if (typeof Toast !== 'undefined') {
                    Toast.error('삭제에 실패했습니다.');
                }
                return;
            }

            allSessions = allSessions.filter(s => s.sessionId !== currentSessionId);
            filteredSessions = filteredSessions.filter(s => s.sessionId !== currentSessionId);

            closeModal();
            renderSessions();

            if (allSessions.length === 0) {
                showEmpty();
            }

            if (typeof Toast !== 'undefined') {
                Toast.success('상담 내역이 삭제되었습니다.');
            }

        } catch (e) {
            console.error('삭제 중 오류:', e);
        }
    }

    function showLoading() {
        elements.loadingState.style.display = 'flex';
        elements.emptyState.style.display = 'none';
        elements.sessionsList.innerHTML = '';
        elements.pagination.style.display = 'none';
    }

    function hideLoading() {
        elements.loadingState.style.display = 'none';
    }

    function showEmpty() {
        hideLoading();
        elements.emptyState.style.display = 'flex';
        elements.sessionsList.innerHTML = '';
        elements.pagination.style.display = 'none';
    }

    // 유틸리티 함수
    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    }

    function formatDateLabel(dateStr) {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));

        if (diff === 0) return '오늘';
        if (diff === 1) return '어제';
        if (diff < 7) return `${diff}일 전`;

        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    }

    function formatTime(dateStr) {
        const d = new Date(dateStr);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    function formatDateInput(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function truncate(str, maxLen) {
        if (!str) return '';
        return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { init };
})();
