// 기록장 페이지 기능
document.addEventListener('DOMContentLoaded', () => {
    // 인증 확인
    if (!auth.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    // 테마 토글
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = theme.toggle();
            themeToggle.textContent = next === theme.DARK ? '🌙' : '☀️';
        });
        themeToggle.textContent = theme.get() === theme.DARK ? '🌙' : '☀️';
    }

    // 로그아웃
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('로그아웃 하시겠습니까?')) {
                auth.logout();
            }
        });
    }

    // 탭 전환
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // 탭 버튼 활성화
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 탭 컨텐츠 표시
            document.querySelectorAll('.gallery-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`tab-${targetTab}`).classList.add('active');
            
            // 각 탭 로드
            if (targetTab === 'photos') {
                loadPhotos();
            } else if (targetTab === 'diary') {
                loadDiaries();
            }
        });
    });

    // 일기 작성
    const diaryAddBtn = document.getElementById('diaryAddBtn');
    const diaryInput = document.getElementById('diaryInput');
    
    if (diaryAddBtn && diaryInput) {
        diaryAddBtn.addEventListener('click', () => {
            const content = diaryInput.value.trim();
            if (content) {
                storage.saveDiary(content);
                diaryInput.value = '';
                loadDiaries();
                alert('일기가 저장되었습니다!');
            } else {
                alert('일기 내용을 입력해주세요.');
            }
        });
    }

    // 초기 로드
    loadPhotos();
    loadDiaries();
});

// 사진 목록 로드
function loadPhotos() {
    const photoGrid = document.getElementById('photoGrid');
    const photoEmpty = document.getElementById('photoEmpty');
    const captures = storage.getCaptures();
    
    if (!photoGrid || !photoEmpty) return;
    
    if (captures.length === 0) {
        photoGrid.style.display = 'none';
        photoEmpty.style.display = 'flex';
        return;
    }
    
    photoGrid.style.display = 'grid';
    photoEmpty.style.display = 'none';
    photoGrid.innerHTML = '';
    
    // 최신순 정렬
    captures.sort((a, b) => b.id - a.id);
    
    captures.forEach(capture => {
        const card = document.createElement('div');
        card.className = 'photo-card';
        
        const img = document.createElement('img');
        img.src = capture.imageData;
        img.alt = '캡처 이미지';
        
        const info = document.createElement('div');
        info.className = 'photo-card-info';
        
        const date = document.createElement('div');
        date.className = 'photo-date';
        const captureDate = new Date(capture.timestamp);
        date.textContent = formatDate(captureDate);
        
        const memo = document.createElement('span');
        memo.className = 'photo-memo';
        memo.textContent = capture.memo || '메모 없음';
        
        info.appendChild(date);
        info.appendChild(memo);
        card.appendChild(img);
        card.appendChild(info);
        
        // 클릭 이벤트 - 모달 열기
        card.addEventListener('click', () => {
            openPhotoModal(capture);
        });
        
        photoGrid.appendChild(card);
    });
}

// 일기 목록 로드
function loadDiaries() {
    const diaryList = document.getElementById('diaryList');
    const diaryEmpty = document.getElementById('diaryEmpty');
    const diaries = storage.getDiaries();
    
    if (!diaryList || !diaryEmpty) return;
    
    if (diaries.length === 0) {
        diaryList.style.display = 'none';
        diaryEmpty.style.display = 'flex';
        return;
    }
    
    diaryList.style.display = 'flex';
    diaryEmpty.style.display = 'none';
    diaryList.innerHTML = '';
    
    // 최신순 정렬
    diaries.sort((a, b) => b.id - a.id);
    
    diaries.forEach(diary => {
        const item = document.createElement('div');
        item.className = 'diary-item';
        
        const content = document.createElement('div');
        content.className = 'diary-content';
        content.textContent = diary.content;
        
        const meta = document.createElement('div');
        meta.className = 'diary-meta';
        const diaryDate = new Date(diary.timestamp);
        meta.textContent = formatDateTime(diaryDate);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'diary-delete';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = '삭제';
        deleteBtn.addEventListener('click', () => {
            if (confirm('이 일기를 삭제하시겠습니까?')) {
                storage.deleteDiary(diary.id);
                loadDiaries();
            }
        });
        
        item.appendChild(content);
        item.appendChild(meta);
        item.appendChild(deleteBtn);
        diaryList.appendChild(item);
    });
}

// 사진 모달 열기
function openPhotoModal(capture) {
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('modalImage');
    const modalMemo = document.getElementById('modalMemo');
    const modalDownload = document.getElementById('modalDownload');
    const modalDelete = document.getElementById('modalDelete');
    
    if (!modal) return;
    
    // 이미지 설정
    modalImage.src = capture.imageData;
    modalMemo.value = capture.memo || '';
    
    // 다운로드 링크 설정
    const captureDate = new Date(capture.timestamp);
    const filename = `capture_${captureDate.getFullYear()}${(captureDate.getMonth()+1).toString().padStart(2,'0')}${captureDate.getDate().toString().padStart(2,'0')}_${captureDate.getHours().toString().padStart(2,'0')}${captureDate.getMinutes().toString().padStart(2,'0')}.png`;
    modalDownload.href = capture.imageData;
    modalDownload.download = filename;
    
    // 메모 업데이트
    modalMemo.addEventListener('change', () => {
        storage.updateCaptureMemo(capture.id, modalMemo.value);
        loadPhotos();
    });
    
    // 삭제 버튼
    modalDelete.onclick = () => {
        if (confirm('이 사진을 삭제하시겠습니까?')) {
            storage.deleteCapture(capture.id);
            closePhotoModal();
            loadPhotos();
        }
    };
    
    // 모달 표시
    modal.style.display = 'flex';
    
    // 닫기 이벤트
    const closeElements = modal.querySelectorAll('[data-close]');
    closeElements.forEach(el => {
        el.addEventListener('click', closePhotoModal);
    });
}

// 사진 모달 닫기
function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 날짜 포맷 (YYYY.MM.DD)
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
}

// 날짜+시간 포맷 (YYYY.MM.DD HH:MM)
function formatDateTime(date) {
    const dateStr = formatDate(date);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}`;
}
