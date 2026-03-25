// 대시보드 기능
document.addEventListener('DOMContentLoaded', () => {
    // 테마 토글 버튼
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = theme.toggle();
            themeToggle.textContent = next === theme.DARK ? '🌙' : '☀️';
        });
        themeToggle.textContent = theme.get() === theme.DARK ? '🌙' : '☀️';
    }
    
    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('로그아웃 하시겠습니까?')) {
                auth.logout();
            }
        });
    }
    
    // 반려동물 상태 시뮬레이션 (데모용)
    simulatePetStatus();
    
    // 음성 송출 기능
    const voiceSendBtn = document.getElementById('voiceSendBtn');
    const voiceInput = document.getElementById('voiceInput');
    
    if (voiceSendBtn && voiceInput) {
        voiceSendBtn.addEventListener('click', () => {
            const text = voiceInput.value.trim();
            if (text) {
                speakText(text);
                voiceInput.value = '';
            }
        });
        
        voiceInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                voiceSendBtn.click();
            }
        });
    }
    
    // 화면 캡처 기능
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
        captureBtn.addEventListener('click', captureScreen);
    }

    // 녹화 기능
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) {
        recordBtn.addEventListener('click', toggleRecording);
    }

    // 최근 사진 및 일기 로드
    loadRecentPhotos();
    loadRecentDiaries();
});

// 반려동물 이름 불러오기
function getPetName() {
    return localStorage.getItem('petName') || '반려동물';
}

function renderPetStatus(isPetDetected) {
    const statusBadge = document.getElementById('statusBadge');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    const statusTime = document.getElementById('statusTime');
    const name = getPetName();

    if (!statusBadge || !statusIcon || !statusText || !statusTime) return;

    if (isPetDetected) {
        statusBadge.className = 'status-badge pet-detected';
        statusIcon.textContent = '🟢';
        statusText.textContent = `${name} 있음`;
    } else {
        statusBadge.className = 'status-badge pet-absent';
        statusIcon.textContent = '🔴';
        statusText.textContent = `${name} 없음`;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    statusTime.textContent = `⏱ 마지막 감지 시간: ${timeStr}`;
}

// 반려동물 상태 시뮬레이션
function simulatePetStatus() {
    const statusBadge = document.getElementById('statusBadge');
    if (!statusBadge) return;

    // 이름 초기 반영
    updatePetNameOverlay();
    renderPetStatus(true);

    // localStorage 변경 감지 (다른 탭/페이지에서 이름 바꿔도 반영)
    window.addEventListener('storage', (e) => {
        if (e.key === 'petName') {
            renderPetStatus(statusBadge.classList.contains('pet-detected'));
        }
    });

    window.addEventListener('pageshow', () => {
        renderPetStatus(statusBadge.classList.contains('pet-detected'));
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            renderPetStatus(statusBadge.classList.contains('pet-detected'));
        }
    });

    // 랜덤으로 상태 변경 (데모용)
    setInterval(() => {
        const isPetDetected = Math.random() > 0.3; // 70% 확률로 감지
        renderPetStatus(isPetDetected);
    }, 5000);
}

// 텍스트 음성 재생
function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        speechSynthesis.speak(utterance);
        
        alert(`음성 송출: "${text}"\n\n브라우저에서 음성이 재생됩니다.`);
    } else {
        alert('이 브라우저는 음성 합성을 지원하지 않습니다.');
    }
}

// 화면 캡처
async function captureScreen() {
    const captureArea = document.getElementById('captureArea');
    
    if (!captureArea) {
        alert('캡처할 영역을 찾을 수 없습니다.');
        return;
    }
    
    try {
        // html2canvas 라이브러리 사용
        const canvas = await html2canvas(captureArea, {
            backgroundColor: '#0f172a',
            scale: 2
        });
        
        // 이미지 데이터 추출
        const imageData = canvas.toDataURL('image/png');
        
        // 다운로드
        const link = document.createElement('a');
        const now = new Date();
        const filename = `capture_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}.png`;
        link.download = filename;
        link.href = imageData;
        link.click();
        
        // 스토리지에 저장
        storage.saveCapture(imageData, '대시보드 캡처');
        
        // 최근 사진 목록 새로고침
        loadRecentPhotos();
        
        alert('화면이 캡처되어 다운로드 및 기록장에 저장되었습니다!');
    } catch (error) {
        console.error('캡처 오류:', error);
        alert('화면 캡처 중 오류가 발생했습니다.');
    }
}

// 최근 사진 로드 (최대 4개)
function loadRecentPhotos() {
    const recentPhotos = document.getElementById('recentPhotos');
    if (!recentPhotos) return;
    
    const captures = storage.getCaptures();
    
    if (captures.length === 0) {
        recentPhotos.innerHTML = `
            <div class="empty-state-mini">
                <span class="empty-icon-mini">🖼️</span>
                <p>저장된 사진이 없습니다</p>
            </div>
        `;
        return;
    }
    
    // 최신순 정렬 후 최대 4개만 표시
    const recentCaptures = captures.sort((a, b) => b.id - a.id).slice(0, 4);
    
    recentPhotos.innerHTML = '';
    recentCaptures.forEach(capture => {
        const item = document.createElement('div');
        item.className = 'recent-photo-item';
        item.onclick = () => window.location.href = 'gallery.html';
        
        const img = document.createElement('img');
        img.src = capture.imageData;
        img.alt = '캡처 이미지';
        
        const info = document.createElement('div');
        info.className = 'recent-photo-info';
        const date = new Date(capture.timestamp);
        info.textContent = formatDate(date);
        
        item.appendChild(img);
        item.appendChild(info);
        recentPhotos.appendChild(item);
    });
}

// 최근 일기 로드 (최대 3개)
function loadRecentDiaries() {
    const recentDiaries = document.getElementById('recentDiaries');
    if (!recentDiaries) return;
    
    const diaries = storage.getDiaries();
    
    if (diaries.length === 0) {
        recentDiaries.innerHTML = `
            <div class="empty-state-mini">
                <span class="empty-icon-mini">📝</span>
                <p>작성된 일기가 없습니다</p>
            </div>
        `;
        return;
    }
    
    // 최신순 정렬 후 최대 3개만 표시
    const recentDiaryList = diaries.sort((a, b) => b.id - a.id).slice(0, 3);
    
    recentDiaries.innerHTML = '';
    recentDiaryList.forEach(diary => {
        const item = document.createElement('div');
        item.className = 'recent-diary-item';
        item.onclick = () => window.location.href = 'gallery.html';
        
        const content = document.createElement('div');
        content.className = 'recent-diary-content';
        content.textContent = diary.content;
        
        const date = document.createElement('div');
        date.className = 'recent-diary-date';
        const diaryDate = new Date(diary.timestamp);
        date.textContent = formatDate(diaryDate);
        
        item.appendChild(content);
        item.appendChild(date);
        recentDiaries.appendChild(item);
    });
}

// 날짜 포맷 (YYYY.MM.DD)
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
}

// ===== 녹화 기능 =====
let mediaRecorder = null;
let recordedChunks = [];
let recordInterval = null;
let recordSeconds = 0;

function toggleRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
    } else {
        const stream = document.getElementById('streamVideo').srcObject;
        if (!stream) {
            alert('카메라 스트림이 연결되지 않았습니다.\n실제 카메라 연결 후 녹화가 가능합니다.');
            return;
        }
        startRecording(stream);
    }
}

function startRecording(stream) {
    recordedChunks = [];
    recordSeconds = 0;

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

    mediaRecorder = new MediaRecorder(stream, { mimeType });

    mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = saveRecording;
    mediaRecorder.start(100);

    // UI 업데이트
    const recordBtn = document.getElementById('recordBtn');
    const recordTimer = document.getElementById('recordTimer');

    recordBtn.classList.add('recording');
    recordBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="width:17px;height:17px;">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
        </svg>
        중지
    `;
    recordTimer.style.display = 'flex';
    updateRecordTimer();

    recordInterval = setInterval(() => {
        recordSeconds++;
        updateRecordTimer();
    }, 1000);
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    clearInterval(recordInterval);
    recordInterval = null;

    const recordBtn = document.getElementById('recordBtn');
    const recordTimer = document.getElementById('recordTimer');

    recordBtn.classList.remove('recording');
    recordBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="width:17px;height:17px;">
            <circle cx="12" cy="12" r="8"/>
        </svg>
        녹화
    `;
    recordTimer.style.display = 'none';
}

function saveRecording() {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const ts = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;
    a.download = `recording_${ts}.webm`;
    a.href = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function updateRecordTimer() {
    const mins = Math.floor(recordSeconds / 60).toString().padStart(2, '0');
    const secs = (recordSeconds % 60).toString().padStart(2, '0');
    const el = document.querySelector('.record-time-text');
    if (el) el.textContent = `${mins}:${secs}`;
}
