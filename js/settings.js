// 설정 페이지 스크립트

// 페이지 로드 시 설정 불러오기
document.addEventListener('DOMContentLoaded', () => {
    checkApiMode();
    loadSettings();
    setupEventListeners();
});

// API 모드 확인 및 UI 조정
function checkApiMode() {
    const cloudflareMsg = document.getElementById('cloudflareMessage');
    const serverMsg = document.getElementById('serverModeMessage');
    const userSettings = document.getElementById('userModeSettings');
    
    // 모든 메시지 숨기기
    cloudflareMsg.style.display = 'none';
    serverMsg.style.display = 'none';
    userSettings.style.display = 'none';
    
    if (typeof API_CONFIG !== 'undefined') {
        if (API_CONFIG.MODE === 'cloudflare') {
            // Cloudflare 모드: Worker 사용 메시지 표시
            cloudflareMsg.style.display = 'block';
        } else if (API_CONFIG.MODE === 'server') {
            // 서버 모드: 서버 API 키 사용 메시지 표시
            serverMsg.style.display = 'block';
        } else {
            // 사용자 모드: API 키 입력 필드 표시
            userSettings.style.display = 'block';
        }
    } else {
        // API_CONFIG가 없으면 사용자 모드로 표시
        userSettings.style.display = 'block';
    }
}

// 설정 불러오기
function loadSettings() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = localStorage.getItem('currentUser') || localStorage.getItem('username');

    if (!isLoggedIn || !currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // 사용자 정보 표시
    document.getElementById('displayUsername').value = currentUser;

    // 가입일 표시 (버그 수정: users에서 joinDate 불러오기)
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[currentUser] && users[currentUser].joinDate) {
        const joinDate = new Date(users[currentUser].joinDate);
        document.getElementById('displayJoinDate').value =
            `${joinDate.getFullYear()}.${String(joinDate.getMonth() + 1).padStart(2, '0')}.${String(joinDate.getDate()).padStart(2, '0')}`;
    } else {
        document.getElementById('displayJoinDate').value = '데모 계정';
    }

    // 반려동물 이름
    const petName = localStorage.getItem('petName') || '';
    document.getElementById('petName').value = petName;

    // 메일 알림 설정
    document.getElementById('mailNotificationSwitch').checked =
        localStorage.getItem('mailNotification') === 'true';
    document.getElementById('mailRecipient').value =
        localStorage.getItem('mailRecipient') || '';
    document.getElementById('mailDelay').value =
        localStorage.getItem('mailDelay') || '30';

    // 모터 속도 설정
    document.getElementById('motorSpeed').value =
        localStorage.getItem('motorSpeed') || 'medium';

    // OpenAI API 키
    const apiKey = localStorage.getItem('openai_api_key') || '';
    if (apiKey) {
        document.getElementById('openaiApiKey').value = apiKey;
    }

    // 현재 테마 표시
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    });
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 반려동물 이름 저장: 버튼 클릭, 엔터 제출, 입력값 변경 모두 지원
    const petNameInput = document.getElementById('petName');
    const petNameForm = document.getElementById('petNameForm');

    function savePetName() {
        const name = petNameInput.value.trim();
        localStorage.setItem('petName', name);
        showSuccessMessage(name ? `'${name}' 이름이 저장되었습니다.` : '반려동물 이름이 초기화되었습니다.');
    }

    petNameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        savePetName();
    });

    petNameInput.addEventListener('change', savePetName);
    petNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            savePetName();
        }
    });

    // 메일 알림 설정
    document.getElementById('mailNotificationSwitch').addEventListener('change', (e) => {
        localStorage.setItem('mailNotification', e.target.checked);
        showSuccessMessage('알림 설정이 저장되었습니다.');
    });

    document.getElementById('mailRecipient').addEventListener('change', (e) => {
        const email = e.target.value.trim();
        if (email && !isValidEmail(email)) {
            showErrorMessage('올바른 이메일 형식이 아닙니다.');
            return;
        }
        localStorage.setItem('mailRecipient', email);
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
        const input = document.getElementById('openaiApiKey');
        input.type = input.type === 'password' ? 'text' : 'password';
    });

    // 테마 변경
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedTheme = btn.dataset.theme;
            document.body.className = selectedTheme === 'dark' ? 'dashboard' : 'dashboard light-theme';
            localStorage.setItem('theme', selectedTheme);
            document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showSuccessMessage('테마가 변경되었습니다.');
        });
    });

    // 비밀번호 변경 폼
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordChange);

    // 데이터 초기화 버튼
    document.getElementById('clearPhotosBtn').addEventListener('click', () => {
        if (confirm('저장된 사진을 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
            localStorage.removeItem('captures');
            showSuccessMessage('사진이 모두 삭제되었습니다.');
        }
    });

    document.getElementById('clearDiariesBtn').addEventListener('click', () => {
        if (confirm('작성된 일기를 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
            localStorage.removeItem('diaries');
            showSuccessMessage('일기가 모두 삭제되었습니다.');
        }
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

// 이메일 유효성 검사
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 오류 메시지 표시
function showErrorMessage(message) {
    showToast(message, '#e74c3c');
}

// 성공 메시지 표시
function showSuccessMessage(message) {
    showToast(message, 'var(--success-color, #27ae60)');
}

function showToast(message, bgColor) {
    const existing = document.querySelector('.temp-success-message');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = 'temp-success-message';
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    div.textContent = message;
    document.body.appendChild(div);

    setTimeout(() => {
        div.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => div.remove(), 300);
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
