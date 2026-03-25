// 브라우저 알림 시스템
const Notification_ = {
    permission: 'default',

    async init() {
        if (!('Notification' in window)) {
            console.warn('이 브라우저는 알림을 지원하지 않습니다.');
            return false;
        }

        this.permission = Notification.permission;
        return this.permission === 'granted';
    },

    async requestPermission() {
        if (!('Notification' in window)) {
            Toast.warning('이 브라우저는 알림을 지원하지 않습니다.');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                Toast.success('알림이 활성화되었습니다!');
                return true;
            } else if (permission === 'denied') {
                Toast.error('알림 권한이 거부되었습니다. 브라우저 설정에서 변경할 수 있습니다.');
                return false;
            }
            return false;
        } catch (error) {
            console.error('알림 권한 요청 실패:', error);
            return false;
        }
    },

    send(title, options = {}) {
        if (this.permission !== 'granted') {
            console.warn('알림 권한이 없습니다.');
            return null;
        }

        const defaultOptions = {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [200, 100, 200],
            tag: 'pet-monitor',
            renotify: true,
            requireInteraction: false,
            ...options
        };

        try {
            const notification = new Notification(title, defaultOptions);
            
            notification.onclick = () => {
                window.focus();
                notification.close();
                if (options.onClick) options.onClick();
            };

            return notification;
        } catch (error) {
            console.error('알림 전송 실패:', error);
            return null;
        }
    },

    petDetected() {
        const petName = localStorage.getItem('petName') || '반려동물';
        return this.send(`${petName}이(가) 감지되었습니다! 🐾`, {
            body: '카메라에서 반려동물이 감지되었습니다.',
            tag: 'pet-detected'
        });
    },

    petAbsent() {
        const petName = localStorage.getItem('petName') || '반려동물';
        const delay = localStorage.getItem('mailDelay') || '10';
        return this.send(`${petName}이(가) 보이지 않습니다`, {
            body: `${delay}분 동안 카메라에서 감지되지 않았습니다.`,
            tag: 'pet-absent',
            requireInteraction: true
        });
    },

    diaryReminder() {
        return this.send('오늘의 일기를 작성해보세요! 📝', {
            body: '반려동물과의 하루를 기록해보세요.',
            tag: 'diary-reminder'
        });
    },

    custom(title, body, onClick = null) {
        return this.send(title, { body, onClick });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Notification_.init();
});
