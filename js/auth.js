// 인증 관리
const auth = {
    // 로그인 체크
    isLoggedIn() {
        return localStorage.getItem('isLoggedIn') === 'true';
    },
    
    // 로그인 처리
    login(username, password) {
        // 저장된 사용자 정보 가져오기
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        
        // 데모 계정 또는 등록된 사용자 확인
        if ((username === 'admin' && password === '1234') || 
            (users[username] && users[username].password === password)) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            localStorage.setItem('currentUser', username); // currentUser도 함께 저장
            return true;
        }
        return false;
    },
    
    // 로그아웃 처리
    logout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    },
    
    // 현재 사용자 정보
    getCurrentUser() {
        return localStorage.getItem('username') || localStorage.getItem('currentUser') || null;
    },
    
    // 회원가입 처리
    signup(username, password, email) {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        
        // 중복 아이디 체크
        if (users[username]) {
            return { success: false, message: '이미 존재하는 아이디입니다.' };
        }
        
        // 사용자 정보 저장
        users[username] = {
            password: password,
            email: email,
            joinDate: new Date().toISOString()
        };
        localStorage.setItem('users', JSON.stringify(users));
        
        return { success: true };
    },
    
    // 페이지 보호 (로그인 필요)
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'index.html';
        }
    }
};

// 대시보드, 설정, 갤러리 페이지에서 로그인 체크
if (document.body.classList.contains('dashboard') || 
    window.location.pathname.includes('settings.html') || 
    window.location.pathname.includes('gallery.html')) {
    auth.requireAuth();
}
