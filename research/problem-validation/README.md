# 문제 검증 연구 (Problem Validation)

> **Research Question:** 조음음운장애 아동의 언어재활에서 가장 큰 사회적 문제는 무엇인가?

HOPE 서비스 설계의 **데이터 기반 근거**를 수집·분석하는 연구 폴더입니다.

## 연구 설계

```
공공데이터 → 현황 분석
뉴스      → 사회적 이슈
논문      → 학술적 근거
     ↓
텍스트마이닝 (TF-IDF, LDA, Network)
     ↓
공통 키워드 → Pain Point → HOPE 기능 매핑
```

## 빠른 시작

```bash
cd research/problem-validation
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python scripts/00_setup_check.py
python scripts/run_pipeline.py
```

## 재현 순서 (scripts/)

| 단계 | 스크립트 | 설명 |
|------|----------|------|
| 0 | `00_setup_check.py` | 의존성·KoNLPy 확인 |
| 1 | `01_collect_news.py` | 뉴스 수집 (RSS 또는 CSV) |
| 2 | `02_collect_papers.py` | 논문 CSV import |
| 3 | `03_collect_public.py` | 공공데이터 CSV 확인 |
| 4 | `04_preprocess.py` | 명사 추출·토큰화 |
| 5 | `05_tfidf_keywords.py` | TF-IDF + 워드클라우드 |
| 6 | `06_lda_topics.py` | LDA 토픽 모델링 |
| 7 | `07_network_analysis.py` | 공출현 네트워크 |
| 8 | `08_public_viz.py` | 공공데이터 시각화 |
| 9 | `09_cross_compare.py` | 교차 비교표 |

또는 한 번에: `python scripts/run_pipeline.py`

## 데이터

| 경로 | 내용 |
|------|------|
| `data/raw/news/` | 뉴스 원본 CSV (`sample_news.csv` 포함) |
| `data/raw/papers/` | 논문 export CSV |
| `data/raw/public/` | 공공데이터 CSV |
| `data/processed/` | 전처리 토큰 |
| `outputs/figures/` | PNG (PPT용) |
| `outputs/tables/` | CSV |
| `outputs/reports/` | MD 리포트 |

`data/raw/**` 대용량 파일은 gitignore. 샘플 CSV만 커밋.

## API 키 (선택)

`.env.example` 참고:

- `BIGKINDS_API_KEY` — BIGKinds
- `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` — 네이버 뉴스

키 없이도 `sample_*.csv`로 파이프라인 테스트 가능.

## PPT 추천 그래프

1. `outputs/figures/news_wordcloud.png`
2. `outputs/reports/news_lda_topics.md` (토픽별 키워드)
3. `outputs/figures/news_keyword_network.png`
4. `outputs/figures/public_trends.png`
5. `outputs/tables/cross_source_matrix.csv`

## 합성 문서

- [`synthesis/research-design.md`](synthesis/research-design.md)
- [`synthesis/cross-source-matrix.md`](synthesis/cross-source-matrix.md)
- [`synthesis/pain-points.md`](synthesis/pain-points.md)
- [`synthesis/hope-mapping.md`](synthesis/hope-mapping.md)

## 윤리·인용

- 뉴스/논문 원문 인용 시 출처·기간 명시
- 자동 크롤링 대신 API·수동 export 우선
- 정성 인터뷰는 추후 `interviews/` 추가 예정

## KoNLPy

Java 미설치 시 **fallback 토크나이저**(한글 2글자 이상 추출)로 동작합니다.  
정확한 형태소 분석을 위해 Java + KoNLPy 설치를 권장합니다.
