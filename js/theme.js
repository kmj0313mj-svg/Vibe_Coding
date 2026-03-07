// 테마 관리
const theme = {
    DARK: 'dark',
    LIGHT: 'light',
    
    // 현재 테마 가져오기
    get() {
        return localStorage.getItem('theme') || this.DARK;
    },
    
    // 테마 설정
    set(themeName) {
        localStorage.setItem('theme', themeName);
        document.documentElement.setAttribute('data-theme', themeName);
    },
    
    // 테마 토글
    toggle() {
        const current = this.get();
        const next = current === this.DARK ? this.LIGHT : this.DARK;
        this.set(next);
        return next;
    },
    
    // 초기화
    init() {
        const savedTheme = this.get();
        this.set(savedTheme);
    }
};

// 페이지 로드 시 테마 적용
theme.init();
