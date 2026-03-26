// 공통 네비게이션 스크립트
document.addEventListener('DOMContentLoaded', () => {
    const _mobileThemeBtn = document.getElementById('themeToggleMobile');
    if (_mobileThemeBtn) {
        _mobileThemeBtn.textContent = theme.get() === theme.DARK ? '🌙' : '☀️';
        _mobileThemeBtn.addEventListener('click', function() {
            const next = theme.toggle();
            this.textContent = next === theme.DARK ? '🌙' : '☀️';
            const desktopBtn = document.getElementById('themeToggle');
            if (desktopBtn) desktopBtn.textContent = next === theme.DARK ? '🌙' : '☀️';
        });
    }

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileNavDrawer = document.getElementById('mobileNavDrawer');
    const mobileNavClose = document.getElementById('mobileNavClose');

    function openMobileMenu() {
        if (mobileNavOverlay) mobileNavOverlay.classList.add('open');
        if (mobileNavDrawer) mobileNavDrawer.classList.add('open');
        if (mobileMenuBtn) {
            mobileMenuBtn.classList.add('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'true');
        }
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        if (mobileNavOverlay) mobileNavOverlay.classList.remove('open');
        if (mobileNavDrawer) mobileNavDrawer.classList.remove('open');
        if (mobileMenuBtn) {
            mobileMenuBtn.classList.remove('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
        document.body.style.overflow = '';
    }

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileMenu);
    if (mobileNavClose) mobileNavClose.addEventListener('click', closeMobileMenu);
    if (mobileNavOverlay) mobileNavOverlay.addEventListener('click', closeMobileMenu);

    document.querySelectorAll('.mobile-accordion-trigger').forEach(function(trigger) {
        trigger.addEventListener('click', function() {
            const panel = document.getElementById(this.dataset.target);
            const arrow = this.querySelector('.mobile-accordion-arrow');
            const isOpen = panel && panel.classList.contains('open');

            document.querySelectorAll('.mobile-accordion-panel').forEach(function(p) {
                p.classList.remove('open');
            });
            document.querySelectorAll('.mobile-accordion-arrow').forEach(function(a) {
                a.style.transform = '';
            });

            if (!isOpen && panel) {
                panel.classList.add('open');
                if (arrow) arrow.style.transform = 'rotate(180deg)';
            }
        });
    });

    const activityTrigger = document.querySelector('[data-target="mobileActivityMenu"]');
    if (activityTrigger) {
        const arrow = activityTrigger.querySelector('.mobile-accordion-arrow');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
    }

    document.querySelectorAll('.gnb-item.has-dropdown > .gnb-link').forEach(function(el) {
        el.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const item = this.closest('.gnb-item');
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.gnb-item.has-dropdown').forEach(function(i) {
                i.classList.remove('open');
                const link = i.querySelector('.gnb-link');
                if (link) link.setAttribute('aria-expanded', 'false');
            });
            if (!isOpen) {
                item.classList.add('open');
                this.setAttribute('aria-expanded', 'true');
            }
        });
    });

    document.querySelectorAll('.gnb-dropdown-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });

    document.addEventListener('click', function() {
        document.querySelectorAll('.gnb-item.has-dropdown').forEach(function(i) {
            i.classList.remove('open');
            const link = i.querySelector('.gnb-link');
            if (link) link.setAttribute('aria-expanded', 'false');
        });
    });

    const logoutBtnMobile = document.getElementById('logoutBtnMobile');
    if (logoutBtnMobile) {
        logoutBtnMobile.addEventListener('click', function() {
            auth.logout();
        });
    }
});
