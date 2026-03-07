// 설정 페이지 스크립트

// 페이지 로드 시 설정 불러오기
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupEventListeners();
});

// 설정 불러오기
function loadSettings() {
    // 로그인 체크 - auth.js와 동일한 키 사용
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = localStorage.getItem('currentUser') || localStorage.getItem('username');
    
    if (!isLoggedIn || !currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // 사용자 정보 표시
    document.getElementById('displayUsername').value = currentUser;

    // 반려동물 이름
    const petName = localStorage.getItem('petName') || '';
    document.getElementById('petName').value = petName;

    // 메일 알림 설정
    const mailNotification = localStorage.getItem('mailNotification') === 'true';
    document.getElementById('mailNotificationSwitch').checked = mailNotification;

    const mailRecipient = localStorage.getItem('mailRecipient') || '';
    document.getElementById('mailRecipient').value = mailRecipient;

    const mailDelay = localStorage.getItem('mailDelay') || '30';
    document.getElementById('mailDelay').value = mailDelay;

    // 모터 속도 설정
    const motorSpeed = localStorage.getItem('motorSpeed') || 'medium';
    document.getElementById('motorSpeed').value = motorSpeed;

    // OpenAI API 키 (마스킹해서 표시)
    const apiKey = localStorage.getItem('openai_api_key') || '';
    if (apiKey) {
        document.getElementById('openaiApiKey').value = apiKey;
    }

    // 현재 테마 표시
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.querySelectorAll('.theme-option').forEach(btn => {
        if (btn.dataset.theme === currentTheme) {
            btn.classList.add('active');
        }
    });
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 반려동물 이름 저장
    document.getElementById('petName').addEventListener('change', (e) => {
        localStorage.setItem('petName', e.target.value);
        showSuccessMessage('반려동물 이름이 저장되었습니다.');
    });

    // 메일 알림 설정
    document.getElementById('mailNotificationSwitch').addEventListener('change', (e) => {
        localStorage.setItem('mailNotification', e.target.checked);
        showSuccessMessage('알림 설정이 저장되었습니다.');
    });

    document.getElementById('mailRecipient').addEventListener('change', (e) => {
        localStorage.setItem('mailRecipient', e.target.value);
        showSuccessMessage('수신 메일 주소가 저장되었습니다.');
    });

    document.getElementById('mailDelay').addEventListener('change', (e) => {
        localStorage.setItem('mailDelay', e.target.value);
        showSuccessMessage('알림 지연 시간이 저장되었습니다.');
    });

    // 모터 속도 설정
    document.getElementById('motorSpeed').addEventListener('change', (e) => {
        localStorage.setItem('motorSpeed', e.target.value);
        showSuccessMessage('모터 속도가 저장되었습니다.');
    });

    // OpenAI API 키 저장
    document.getElementById('openaiApiKey').addEventListener('change', (e) => {
        const apiKey = e.target.value.trim();
        if (apiKey) {
            localStorage.setItem('openai_api_key', apiKey);
            showSuccessMessage('API 키가 저장되었습니다.');
        } else {
            localStorage.removeItem('openai_api_key');
            showSuccessMessage('API 키가 제거되었습니다.');
        }
    });

    // API 키 보기/숨기기
    document.getElementById('toggleApiKey').addEventListener('click', () => {
        const apiKeyInput = document.getElementById('openaiApiKey');
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
        } else {
            apiKeyInput.type = 'password';
        }
    });

    // 테마 변경
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            document.body.className = theme === 'dark' ? 'dashboard' : 'dashboard light-theme';
            localStorage.setItem('theme', theme);
            
            document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            showSuccessMessage('테마가 변경되었습니다.');
        });
    });

    // 비밀번호 변경 폼
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordChange);

    // 로그아웃
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
}

// 비밀번호 변경 처리
function handlePasswordChange(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const errorDiv = document.getElementById('passwordError');
    const successDiv = document.getElementById('passwordSuccess');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    // 유효성 검사
    if (newPassword !== confirmPassword) {
        errorDiv.textContent = '새 비밀번호가 일치하지 않습니다.';
        errorDiv.style.display = 'block';
        return;
    }

    if (newPassword.length < 4) {
        errorDiv.textContent = '비밀번호는 최소 4자 이상이어야 합니다.';
        errorDiv.style.display = 'block';
        return;
    }

    // 현재 사용자 정보 가져오기
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');

    if (!users[currentUser]) {
        errorDiv.textContent = '사용자 정보를 찾을 수 없습니다.';
        errorDiv.style.display = 'block';
        return;
    }

    // 현재 비밀번호 확인
    if (users[currentUser].password !== currentPassword) {
        errorDiv.textContent = '현재 비밀번호가 일치하지 않습니다.';
        errorDiv.style.display = 'block';
        return;
    }

    // 비밀번호 변경
    users[currentUser].password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));

    successDiv.textContent = '비밀번호가 성공적으로 변경되었습니다.';
    successDiv.style.display = 'block';

    // 폼 초기화
    document.getElementById('passwordForm').reset();
}

// 성공 메시지 표시
function showSuccessMessage(message) {
    const existingMessage = document.querySelector('.temp-success-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'temp-success-message';
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-color, #27ae60);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    messageDiv.textContent = message;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => messageDiv.remove(), 300);
    }, 2000);
}

// 애니메이션 스타일 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .theme-option {
        margin: 4px;
        padding: 8px 16px;
        border: 2px solid transparent;
    }

    .theme-option.active {
        border-color: var(--primary-color);
        background: rgba(52, 152, 219, 0.1);
    }
`;
document.head.appendChild(style);
