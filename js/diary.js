// 기록장 페이지 기능
document.addEventListener('DOMContentLoaded', () => {
    auth.init().then(() => {
    if (!auth.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = theme.toggle();
            themeToggle.textContent = next === theme.DARK ? '🌙' : '☀️';
        });
        themeToggle.textContent = theme.get() === theme.DARK ? '🌙' : '☀️';
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('로그아웃 하시겠습니까?')) {
                auth.logout();
            }
        });
    }

    const diaryAddBtn = document.getElementById('diaryAddBtn');
    const diaryInput = document.getElementById('diaryInput');
    
    if (diaryAddBtn && diaryInput) {
        diaryAddBtn.addEventListener('click', () => {
            const content = diaryInput.value.trim();
            if (content) {
                storage.saveDiary(content);
                diaryInput.value = '';
                loadDiaries();
                Toast.success('일기가 저장되었습니다!');
            } else {
                Toast.warning('일기 내용을 입력해주세요.');
            }
        });
    }

    const diarySearch = document.getElementById('diarySearch');
    if (diarySearch) {
        diarySearch.addEventListener('input', () => {
            loadDiaries(diarySearch.value.trim());
        });
    }

    const emptyDiaryBtn = document.getElementById('emptyDiaryBtn');
    if (emptyDiaryBtn && diaryInput) {
        emptyDiaryBtn.addEventListener('click', () => {
            diaryInput.focus();
        });
    }

    loadDiaries();
    });
});

function loadDiaries(keyword) {
    const diaryList = document.getElementById('diaryList');
    const diaryEmpty = document.getElementById('diaryEmpty');
    let diaries = storage.getDiaries();

    if (keyword) {
        const kw = keyword.toLowerCase();
        diaries = diaries.filter(d => (d.content || '').toLowerCase().includes(kw));
    }
    
    if (!diaryList || !diaryEmpty) return;
    
    if (diaries.length === 0) {
        diaryList.style.display = 'none';
        diaryEmpty.style.display = 'flex';
        return;
    }
    
    diaryList.style.display = 'flex';
    diaryEmpty.style.display = 'none';
    diaryList.innerHTML = '';
    
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
                Toast.success('일기가 삭제되었습니다.');
            }
        });
        
        item.appendChild(content);
        item.appendChild(meta);
        item.appendChild(deleteBtn);
        diaryList.appendChild(item);
    });
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
}

function formatDateTime(date) {
    const dateStr = formatDate(date);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}`;
}
