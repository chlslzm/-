// 조이스틱 컨트롤러 구현
class JoystickController {
    constructor() {
        this.container = document.getElementById('joystickContainer');
        this.handle = document.getElementById('joystickHandle');
        this.isDragging = false;
        this.startY = 0;
        this.currentY = 0;
        this.containerRect = null;
        this.maxDistance = 30; // 조이스틱 최대 이동 거리
        this.jumpThreshold = 15; // 점프 트리거 임계값

        this.setupEventListeners();
    }

    setupEventListeners() {
        // 터치 이벤트
        this.container.addEventListener('touchstart', (e) => this.handleStart(e));
        this.container.addEventListener('touchmove', (e) => this.handleMove(e));
        this.container.addEventListener('touchend', () => this.handleEnd());

        // 마우스 이벤트 (테스트용)
        this.container.addEventListener('mousedown', (e) => this.handleStart(e));
        document.addEventListener('mousemove', (e) => this.handleMove(e));
        document.addEventListener('mouseup', () => this.handleEnd());
    }

    handleStart(e) {
        this.isDragging = true;
        this.containerRect = this.container.getBoundingClientRect();
        
        if (e.type === 'touchstart') {
            this.startY = e.touches[0].clientY;
            this.currentY = this.startY;
        } else {
            this.startY = e.clientY;
            this.currentY = this.startY;
        }

        // 조이스틱 시작 위치 설정
        this.updateHandlePosition(0);
    }

    handleMove(e) {
        if (!this.isDragging) return;

        e.preventDefault();
        
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        this.currentY = clientY;

        // 조이스틱 이동 거리 계산
        let deltaY = this.startY - this.currentY;
        deltaY = Math.max(-this.maxDistance, Math.min(this.maxDistance, deltaY));

        // 조이스틱 위치 업데이트
        this.updateHandlePosition(deltaY);

        // 점프 트리거 체크
        if (deltaY >= this.jumpThreshold && game.state === GameState.PLAYING) {
            jump();
            // 점프 후 조이스틱 리셋
            this.handleEnd();
        }
    }

    handleEnd() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // 조이스틱 중앙으로 리셋
        this.updateHandlePosition(0);
    }

    updateHandlePosition(deltaY) {
        // 조이스틱 핸들 위치 업데이트
        this.handle.style.transform = `translate(-50%, calc(-50% - ${deltaY}px))`;
    }
}

// 모바일 환경 감지
function isMobileDevice() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

// 페이지 로드 시 조이스틱 초기화
window.addEventListener('load', () => {
    if (isMobileDevice()) {
        new JoystickController();
    }
});