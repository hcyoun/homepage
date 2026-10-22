# Driftwatch

> 설정 드리프트를 배포 전에 잡아내는 오픈소스 CLI

개발·스테이징·운영 환경의 설정 파일(JSON, TOML, INI/CFG, `.env`)을 스냅샷으로 남기고,
환경 간 차이를 추가/삭제/변경으로 분류해 보여줍니다. 런타임 의존성은 없습니다.

🌐 홈페이지: https://hcyoun.github.io/homepage/

## 설치

```bash
pipx install driftwatch
# 또는 소스에서
python -m pip install -e .
```

## 사용법

```bash
# 기준 스냅샷 저장
driftwatch snapshot ./prod -o baseline.json

# 두 디렉터리(또는 스냅샷) 비교
driftwatch diff ./staging ./prod --format markdown

# CI: 기준에서 벗어나면 exit 1
driftwatch check ./prod --baseline baseline.json
```

`password`, `secret`, `token`, `api_key` 등이 포함된 키의 값은 기본으로 마스킹됩니다 (`--no-mask`로 해제).

## 저장소 구조

```
src/driftwatch/   CLI 도구 소스
tests/            pytest 테스트
index.html        홈페이지 (정적, 빌드 불필요)
assets/           홈페이지 CSS · JS · 이미지
```

## 개발

```bash
python -m pip install -e . pytest
pytest
```

홈페이지 미리보기:

```bash
python -m http.server 8000   # http://localhost:8000
```

## 라이선스

MIT
