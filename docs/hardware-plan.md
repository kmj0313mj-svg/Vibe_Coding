# 하드웨어 연동 계획서

## 1. 개요

라즈베리파이를 중심으로 반려동물 모니터링 시스템의 하드웨어 구성 및 연동 방안을 정리합니다.

---

## 2. 필요 하드웨어 목록

### 핵심 장비
| 장비 | 용도 | 예상 비용 |
|------|------|----------|
| Raspberry Pi 4 (4GB) | 메인 컨트롤러 | ₩80,000 |
| Pi Camera Module 3 | 영상 스트리밍 | ₩45,000 |
| MicroSD 32GB+ | OS 및 저장소 | ₩15,000 |
| 전원 어댑터 (5V 3A) | 전원 공급 | ₩15,000 |

### 선택 장비
| 장비 | 용도 | 예상 비용 |
|------|------|----------|
| 서보모터 (SG90) | 카메라 팬/틸트 | ₩5,000 |
| 마이크 모듈 | 음성 감지 | ₩10,000 |
| 스피커 | 음성 송출 | ₩15,000 |
| 적외선 LED | 야간 촬영 | ₩5,000 |
| 모션 센서 (PIR) | 움직임 감지 | ₩3,000 |

**예상 총 비용**: ₩150,000 ~ ₩200,000

---

## 3. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                    웹 브라우저                        │
│              (dashboard.html)                        │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP/WebSocket
                      ▼
┌─────────────────────────────────────────────────────┐
│                라즈베리파이 서버                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Flask/     │  │   Camera    │  │   GPIO      │  │
│  │  FastAPI    │  │   Stream    │  │   Control   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│         │               │               │           │
│         ▼               ▼               ▼           │
│  ┌─────────────────────────────────────────────┐   │
│  │              하드웨어 인터페이스               │   │
│  │   카메라  │  모터  │  마이크  │  스피커      │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 4. API 엔드포인트 설계

### 4.1 영상 스트리밍
```
GET /api/stream
- 실시간 MJPEG 스트리밍
- 응답: multipart/x-mixed-replace

GET /api/capture
- 정지 이미지 캡처
- 응답: image/jpeg
```

### 4.2 모터 제어
```
POST /api/motor/pan
- Body: { "angle": 0-180 }
- 좌우 회전

POST /api/motor/tilt
- Body: { "angle": 0-90 }
- 상하 회전
```

### 4.3 음성 통신
```
POST /api/audio/speak
- Body: { "text": "..." } 또는 audio file
- TTS 또는 오디오 재생

WebSocket /api/audio/stream
- 양방향 오디오 스트리밍
```

### 4.4 상태 조회
```
GET /api/status
- 응답: { "pet_detected": true, "last_motion": "...", "temperature": 25 }
```

---

## 5. 라즈베리파이 소프트웨어 구성

### 5.1 운영체제
- **Raspberry Pi OS Lite** (64-bit)
- 또는 **Ubuntu Server 22.04**

### 5.2 필요 패키지
```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Python 및 필수 패키지
sudo apt install python3-pip python3-venv -y

# 카메라 관련
sudo apt install libcamera-apps python3-picamera2 -y

# GPIO 제어
pip3 install RPi.GPIO gpiozero

# 웹 서버
pip3 install flask flask-cors

# 영상 처리
pip3 install opencv-python-headless
```

### 5.3 예제 서버 코드

```python
# app.py
from flask import Flask, Response, jsonify
from flask_cors import CORS
from picamera2 import Picamera2
import cv2

app = Flask(__name__)
CORS(app)

camera = Picamera2()
camera.configure(camera.create_video_configuration(main={"size": (640, 480)}))
camera.start()

def generate_frames():
    while True:
        frame = camera.capture_array()
        _, buffer = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

@app.route('/api/stream')
def stream():
    return Response(generate_frames(), 
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/status')
def status():
    return jsonify({
        'pet_detected': False,
        'streaming': True
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

---

## 6. 프론트엔드 연동

### 6.1 설정 페이지 수정
```javascript
// js/config.js에 추가
const HARDWARE_CONFIG = {
    RASPBERRY_PI_URL: 'http://raspberrypi.local:5000',
    // 또는 IP 주소: 'http://192.168.1.100:5000'
};
```

### 6.2 대시보드 영상 연동
```javascript
// dashboard.js 수정
const videoElement = document.getElementById('petVideo');
videoElement.src = `${HARDWARE_CONFIG.RASPBERRY_PI_URL}/api/stream`;
```

---

## 7. 구현 단계

### Phase 1: 기본 연결 (1주)
1. [ ] 라즈베리파이 OS 설치
2. [ ] 카메라 모듈 연결 및 테스트
3. [ ] Flask 서버 구축
4. [ ] 기본 스트리밍 구현

### Phase 2: 모터 제어 (1주)
1. [ ] 서보모터 연결
2. [ ] GPIO 제어 코드 작성
3. [ ] API 엔드포인트 구현
4. [ ] 프론트엔드 컨트롤 UI 추가

### Phase 3: 고급 기능 (2주)
1. [ ] 모션 감지 (OpenCV)
2. [ ] 음성 송수신
3. [ ] 야간 모드 (IR LED)
4. [ ] 알림 연동

---

## 8. 보안 고려사항

1. **네트워크 보안**
   - 로컬 네트워크 내에서만 접근 가능하도록 설정
   - 외부 접근 시 VPN 또는 Cloudflare Tunnel 사용

2. **인증**
   - API 엔드포인트에 간단한 토큰 인증 추가
   - 프론트엔드에서 토큰을 설정 페이지에서 입력

3. **HTTPS**
   - Let's Encrypt 인증서 또는 자체 서명 인증서 사용

---

*문서 작성일: 2026-03-25*
