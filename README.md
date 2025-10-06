# 🥕 Vegetable Guardians - 채소 수호자

고퀄리티 웹 기반 진행형 슈팅 게임입니다. 채소 수호자가 되어 무한히 밀려오는 적들을 물리치세요!

![Game Screenshot](https://img.shields.io/badge/Game-Playable-brightgreen)
![HTML5](https://img.shields.io/badge/HTML5-Canvas-orange)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)

## 🎮 게임 특징

### 핵심 기능
- **진행형 난이도 시스템**: 레벨이 올라갈수록 적의 속도와 생성 빈도가 증가
- **다양한 적 패턴**: 직선, 사인파, 지그재그 등 다양한 이동 패턴
- **파워업 시스템**: 4가지 파워업 아이템 (체력, 연사, 보호막, 더블샷)
- **화려한 이펙트**: 폭발, 파티클, 텍스트 이펙트
- **반응형 컨트롤**: 부드러운 플레이어 이동과 발사

### 게임 시스템
- ✨ **체력 시스템**: 체력이 0이 되면 게임 오버
- 🎯 **점수 시스템**: 적 처치 시 점수 획득, 레벨에 따라 점수 배율 증가
- 💎 **파워업**: 
  - ❤️ 체력 회복
  - ⚡ 연사 능력 (발사 속도 2배)
  - 🛡️ 보호막 (데미지 무효화)
  - ✨ 더블샷 (2발 동시 발사)
- 🌟 **레벨 시스템**: 500점마다 레벨 업

## 🕹️ 조작법

| 키 | 동작 |
|---|---|
| ⬅️ ➡️ 화살표 또는 A/D | 좌우 이동 |
| ⬆️ ⬇️ 화살표 또는 W/S | 상하 이동 |
| 스페이스바 | 발사 |
| P | 일시정지/재개 |

## 🚀 실행 방법

### 1. 로컬 서버로 실행 (권장)

Python을 사용하는 경우:
```bash
# Python 3
python -m http.server 8000

# 또는 Python 2
python -m SimpleHTTPServer 8000
```

Node.js를 사용하는 경우:
```bash
# http-server 설치 (최초 1회)
npm install -g http-server

# 서버 실행
http-server -p 8000
```

그런 다음 브라우저에서 `http://localhost:8000` 접속

### 2. VS Code Live Server

1. VS Code에서 `index.html` 열기
2. 우클릭 → "Open with Live Server"

### 3. 직접 열기 (ES6 모듈 오류 발생 가능)

ES6 모듈을 사용하므로 로컬 서버 실행을 권장합니다.

## 📁 프로젝트 구조

```
Vegitable-Guadians/
├── index.html          # 메인 HTML 파일
├── styles.css          # 스타일시트
├── README.md           # 프로젝트 문서
└── js/
    ├── main.js         # 메인 진입점
    ├── Game.js         # 게임 메인 클래스
    ├── GameObject.js   # 기본 게임 객체
    ├── Player.js       # 플레이어 클래스
    ├── Enemy.js        # 적 클래스
    ├── Bullet.js       # 발사체 클래스
    ├── PowerUp.js      # 파워업 클래스
    ├── Particle.js     # 파티클 효과 클래스
    ├── config.js       # 게임 설정
    └── utils.js        # 유틸리티 함수
```

## 🎨 기술 스택

- **HTML5 Canvas**: 게임 렌더링
- **JavaScript ES6+**: 게임 로직 및 객체 지향 프로그래밍
- **CSS3**: 모던 UI 및 애니메이션
- **Module System**: ES6 모듈을 사용한 깔끔한 코드 구조

## 🔧 게임 설정 커스터마이징

`js/config.js` 파일에서 다양한 게임 설정을 변경할 수 있습니다:

```javascript
// 예시: 플레이어 속도 변경
PLAYER: {
    SPEED: 6,  // 이 값을 조정
    // ...
}

// 예시: 적 생성 간격 변경
ENEMY: {
    SPAWN_INTERVAL: 2000,  // 밀리초 단위
    // ...
}
```

## 🎯 게임 팁

1. **파워업 우선순위**: 체력이 낮을 때는 ❤️를, 적이 많을 때는 ⚡ 연사를 우선 수집
2. **위치 선정**: 화면 중앙보다 좌우로 이동하며 플레이하는 것이 유리
3. **보호막 활용**: 🛡️ 보호막을 획득하면 적극적으로 전진
4. **레벨 업 대비**: 레벨이 오르기 전에 적들을 미리 정리
5. **적 패턴 학습**: 각 적의 이동 패턴을 파악하여 대응

## 🐛 알려진 이슈

현재 알려진 주요 이슈는 없습니다. 버그를 발견하시면 이슈로 등록해주세요!

## 📝 라이선스

이 프로젝트는 교육 및 개인적 사용을 위한 것입니다.

## 🙏 크레딧

- 이모지: Unicode Emoji
- 디자인 영감: 클래식 슈팅 게임들

## 🎮 즐거운 게임 되세요!

채소 수호자가 되어 세상을 지켜주세요! 🥕✨

