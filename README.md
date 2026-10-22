# 툴박스

브라우저에서 바로 쓰는 작은 도구 모음입니다. 빌드 과정 없는 정적 사이트라 GitHub Pages에 그대로 게시할 수 있습니다.

| 페이지 | 파일 | 설명 |
|---|---|---|
| 홈 | `index.html` | 도구 목록 |
| 계산기 | `calculator.html` | 괄호·백분율 지원, 키보드 입력, 계산 기록 |
| 노트 | `notes.html` | 자동 저장 메모장, 검색·고정·내보내기 |
| 타이머 | `timer.html` | 스톱워치(랩), 카운트다운, 뽀모도로 |
| 단위 변환 | `converter.html` | 길이·무게·온도·넓이(평)·데이터·속도 |
| 비밀번호 생성 | `password.html` | `crypto.getRandomValues` 기반, 강도 표시 |

상단 메뉴는 `assets/js/common.js`의 `TOOLS` 배열에서 만들어집니다. 도구를 추가하려면 HTML 페이지를 하나 만들고(`<body data-page="아이디">`) 이 배열에 항목을 추가하세요.

## 로컬 미리보기

```bash
python -m http.server 8000   # http://localhost:8000
```

데이터(노트, 계산 기록, 테마)는 브라우저 `localStorage`에만 저장됩니다.
