// 설정 페이지 스크립트

// 페이지 로드 시 설정 불러오기 (Supabase 세션 복원 후)
document.addEventListener('DOMContentLoaded', () => {
    auth.init().then(() => {
        if (!auth.isLoggedIn()) {
            window.location.href = 'index.html';
            return;
        }
        checkApiMode();
        loadSettings();
        setupEventListeners();
    });
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
async function loadSettings() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = localStorage.getItem('currentUser') || localStorage.getItem('username');

    if (!isLoggedIn || !currentUser) {
        window.location.href = 'index.html';
        return;
    }

    const appData = await auth.loadAppData();
    const createdAt = appData && appData.createdAt ? new Date(appData.createdAt) : null;

    document.getElementById('displayUsername').value = currentUser;
    document.getElementById('displayJoinDate').value = createdAt
        ? `${createdAt.getFullYear()}.${String(createdAt.getMonth() + 1).padStart(2, '0')}.${String(createdAt.getDate()).padStart(2, '0')}`
        : '정보 없음';

    document.getElementById('petName').value = localStorage.getItem('petName') || '';
    document.getElementById('petSpecies').value = localStorage.getItem('petSpecies') || 'other';
    document.getElementById('petAge').value = localStorage.getItem('petAge') || '';
    document.getElementById('petTraits').value = localStorage.getItem('petTraits') || '';

    document.getElementById('mailNotificationSwitch').checked =
        localStorage.getItem('mailNotification') === 'true';
    document.getElementById('mailRecipient').value =
        localStorage.getItem('mailRecipient') || currentUser || '';
    document.getElementById('mailDelay').value =
        localStorage.getItem('mailDelay') || '30';

    document.getElementById('motorSpeed').value =
        localStorage.getItem('motorSpeed') || 'medium';

    const apiKey = localStorage.getItem('openai_api_key') || '';
    if (apiKey) {
        document.getElementById('openaiApiKey').value = apiKey;
    }

    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    });
}

// 이벤트 리스너 설정
function setupEventListeners() {
    const petNameForm = document.getElementById('petNameForm');

    async function savePetAndNotificationSettings() {
        const mailRecipient = document.getElementById('mailRecipient').value.trim();
        const petAge = document.getElementById('petAge').value.trim();

        if (mailRecipient && !isValidEmail(mailRecipient)) {
            showErrorMessage('올바른 이메일 형식이 아닙니다.');
            return;
        }

        if (petAge && Number(petAge) < 0) {
            showErrorMessage('반려동물 나이는 0 이상이어야 합니다.');
            return;
        }

        const result = await auth.saveAppData({
            petName: document.getElementById('petName').value.trim(),
            petSpecies: document.getElementById('petSpecies').value,
            petAge: petAge,
            petTraits: document.getElementById('petTraits').value.trim(),
            mailNotification: document.getElementById('mailNotificationSwitch').checked,
            mailRecipient: mailRecipient,
            mailDelay: document.getElementById('mailDelay').value
        });

        if (!result.ok) {
            showErrorMessage(result.message || '설정 저장에 실패했습니다.');
            return;
        }

        showSuccessMessage('사용자/반려동물 설정이 저장되었습니다.');
    }

    petNameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await savePetAndNotificationSettings();
    });

    ['petName', 'petSpecies', 'petAge', 'petTraits', 'mailRecipient', 'mailDelay', 'mailNotificationSwitch']
        .forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            const eventName = el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'change';
            el.addEventListener(eventName, () => {
                savePetAndNotificationSettings();
            });
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

    // 브라우저 알림 설정
    setupNotificationSettings();
}

// 브라우저 알림 설정 초기화
function setupNotificationSettings() {
    const statusEl = document.getElementById('notificationStatus');
    const enableBtn = document.getElementById('enableNotificationBtn');

    if (!statusEl || !enableBtn) return;

    function updateStatus() {
        if (!('Notification' in window)) {
            statusEl.textContent = '지원 안 함';
            statusEl.className = 'notification-status status-denied';
            enableBtn.style.display = 'none';
            return;
        }

        const permission = Notification.permission;
        
        if (permission === 'granted') {
            statusEl.textContent = '✅ 활성화됨';
            statusEl.className = 'notification-status status-granted';
            enableBtn.textContent = '테스트 알림';
        } else if (permission === 'denied') {
            statusEl.textContent = '❌ 차단됨';
            statusEl.className = 'notification-status status-denied';
            enableBtn.textContent = '설정에서 변경';
        } else {
            statusEl.textContent = '⏸️ 대기 중';
            statusEl.className = 'notification-status status-default';
            enableBtn.textContent = '알림 허용';
        }
    }

    updateStatus();

    enableBtn.addEventListener('click', async () => {
        const permission = Notification.permission;
        
        if (permission === 'granted') {
            if (typeof Notification_ !== 'undefined') {
                Notification_.custom('테스트 알림', '알림이 정상적으로 작동합니다! 🎉');
            }
        } else if (permission === 'denied') {
            Toast.info('브라우저 설정에서 알림 권한을 변경해주세요.');
        } else {
            if (typeof Notification_ !== 'undefined') {
                await Notification_.requestPermission();
                updateStatus();
            }
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

    auth.changePassword(currentPassword, newPassword).then((result) => {
        if (!result.ok) {
            errorDiv.textContent = result.message || '비밀번호 변경에 실패했습니다.';
            errorDiv.style.display = 'block';
            return;
        }

        successDiv.textContent = result.message || '비밀번호가 성공적으로 변경되었습니다.';
        successDiv.style.display = 'block';
        document.getElementById('passwordForm').reset();
    });
}

// 이메일 유효성 검사
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 오류 메시지 표시
function showErrorMessage(message) {
    if (typeof Toast !== 'undefined') {
        Toast.error(message);
    } else {
        alert(message);
    }
}

// 성공 메시지 표시
function showSuccessMessage(message) {
    if (typeof Toast !== 'undefined') {
        Toast.success(message);
    } else {
        console.log(message);
    }
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
