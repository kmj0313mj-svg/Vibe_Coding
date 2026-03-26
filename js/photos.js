// 사진첩 페이지 기능
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

    const photoUploadBtn = document.getElementById('photoUploadBtn');
    const photoUploadInput = document.getElementById('photoUploadInput');

    if (photoUploadBtn && photoUploadInput) {
        photoUploadBtn.addEventListener('click', () => {
            photoUploadInput.click();
        });

        photoUploadInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            let processed = 0;
            files.forEach(file => {
                if (!file.type.startsWith('image/')) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    storage.saveCapture(event.target.result, file.name);
                    processed++;
                    if (processed === files.length) {
                        loadPhotos();
                        Toast.success(`${processed}장의 사진이 업로드되었습니다!`);
                    }
                };
                reader.readAsDataURL(file);
            });

            photoUploadInput.value = '';
        });
    }

    const photoSearch = document.getElementById('photoSearch');
    if (photoSearch) {
        photoSearch.addEventListener('input', () => {
            loadPhotos(photoSearch.value.trim());
        });
    }

    const emptyUploadBtn = document.getElementById('emptyUploadBtn');
    if (emptyUploadBtn && photoUploadInput) {
        emptyUploadBtn.addEventListener('click', () => {
            photoUploadInput.click();
        });
    }

    loadPhotos();
    });
});

function loadPhotos(keyword) {
    const photoGrid = document.getElementById('photoGrid');
    const photoEmpty = document.getElementById('photoEmpty');
    let captures = storage.getCaptures();

    if (keyword) {
        const kw = keyword.toLowerCase();
        captures = captures.filter(c => (c.memo || '').toLowerCase().includes(kw));
    }
    
    if (!photoGrid || !photoEmpty) return;
    
    if (captures.length === 0) {
        photoGrid.style.display = 'none';
        photoEmpty.style.display = 'flex';
        return;
    }
    
    photoGrid.style.display = 'grid';
    photoEmpty.style.display = 'none';
    photoGrid.innerHTML = '';
    
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
        
        card.addEventListener('click', () => {
            openPhotoModal(capture);
        });
        
        photoGrid.appendChild(card);
    });
}

function openPhotoModal(capture) {
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('modalImage');
    const modalMemo = document.getElementById('modalMemo');
    const modalDownload = document.getElementById('modalDownload');
    const modalDelete = document.getElementById('modalDelete');
    
    if (!modal) return;
    
    modalImage.src = capture.imageData;
    modalMemo.value = capture.memo || '';
    
    const captureDate = new Date(capture.timestamp);
    const filename = `capture_${captureDate.getFullYear()}${(captureDate.getMonth()+1).toString().padStart(2,'0')}${captureDate.getDate().toString().padStart(2,'0')}_${captureDate.getHours().toString().padStart(2,'0')}${captureDate.getMinutes().toString().padStart(2,'0')}.png`;
    modalDownload.href = capture.imageData;
    modalDownload.download = filename;
    
    modalMemo.addEventListener('change', () => {
        storage.updateCaptureMemo(capture.id, modalMemo.value);
        loadPhotos();
    });
    
    modalDelete.onclick = () => {
        if (confirm('이 사진을 삭제하시겠습니까?')) {
            storage.deleteCapture(capture.id);
            closePhotoModal();
            loadPhotos();
            Toast.success('사진이 삭제되었습니다.');
        }
    };
    
    modal.style.display = 'flex';
    
    const closeElements = modal.querySelectorAll('[data-close]');
    closeElements.forEach(el => {
        el.addEventListener('click', closePhotoModal);
    });
}

function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
}
