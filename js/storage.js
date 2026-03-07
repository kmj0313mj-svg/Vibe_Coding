// 로컬 스토리지 관리
const storage = {
    // 캡처 이미지 저장
    saveCapture(imageData, memo = '') {
        const captures = this.getCaptures();
        const newCapture = {
            id: Date.now(),
            imageData: imageData,
            memo: memo,
            timestamp: new Date().toISOString()
        };
        captures.push(newCapture);
        localStorage.setItem('captures', JSON.stringify(captures));
        return newCapture;
    },
    
    // 모든 캡처 가져오기
    getCaptures() {
        const data = localStorage.getItem('captures');
        return data ? JSON.parse(data) : [];
    },
    
    // 캡처 삭제
    deleteCapture(id) {
        const captures = this.getCaptures();
        const filtered = captures.filter(c => c.id !== id);
        localStorage.setItem('captures', JSON.stringify(filtered));
    },
    
    // 캡처 메모 업데이트
    updateCaptureMemo(id, memo) {
        const captures = this.getCaptures();
        const capture = captures.find(c => c.id === id);
        if (capture) {
            capture.memo = memo;
            localStorage.setItem('captures', JSON.stringify(captures));
        }
    },
    
    // 일기 저장
    saveDiary(content) {
        const diaries = this.getDiaries();
        const newDiary = {
            id: Date.now(),
            content: content,
            timestamp: new Date().toISOString()
        };
        diaries.push(newDiary);
        localStorage.setItem('diaries', JSON.stringify(diaries));
        return newDiary;
    },
    
    // 모든 일기 가져오기
    getDiaries() {
        const data = localStorage.getItem('diaries');
        return data ? JSON.parse(data) : [];
    },
    
    // 일기 삭제
    deleteDiary(id) {
        const diaries = this.getDiaries();
        const filtered = diaries.filter(d => d.id !== id);
        localStorage.setItem('diaries', JSON.stringify(filtered));
    }
};
