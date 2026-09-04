디지털 사이니지 제작기 V1.5.1 · NOTICE FRAME

한양대학교 ERICA의 9:16 세로형 안내 화면을 브라우저에서 만들고 PNG로 저장하는 정적 웹 앱입니다.
설치나 서버 없이 index.html을 열어 사용할 수 있으며, GitHub Pages 공개 버전은 아래 주소에서 제공합니다.

https://erakeun.github.io/digital-signage-maker/

작업 규격
- 편집 캔버스: 1080 × 1920 (9:16)
- FHD PNG: 1080 × 1920
- 4K PNG: 2160 × 3840
- 브라우저 로컬 저장 및 작업 JSON 저장/불러오기
- 좌측 상단과 작업 저장 영역의 “전체 초기화”로 현재 편집 상태와 재생목록만 삭제하고 브라운 클래식 기본화면으로 복귀
- V1.0.1 / V1.3.0 / V1.3.1 작업 JSON도 기본값을 보완해 불러오기

주요 기능
- QUICK START에서 행사명, 일시, 장소 3개만 입력해 기본 사이니지 제작
- 디자이너 제공 공지사항 3종·행사 3종은 배경뿐 아니라 예시의 문구 구조, 색상, 크기, 위치, 행간·자간까지 함께 적용
- 디자이너 공지 프리셋에서는 QUICK START가 공지 제목·안내 문구·변경 일정 입력으로 자동 전환
- QUICK START와 고급 편집이 제목, 부제목, 본문 상태를 함께 사용해 전환 후에도 입력값 유지
- 제목, 부제목, 본문, 강조문, 하단 문구 입력 및 직접 드래그
- 부분 굵게와 부분 글자색, 글꼴, 크기, 기본 색상, 정렬
- 제목·부제목·본문·강조문·하단 문구별 행간과 자간 조절 및 기본값 복원
- 자동 텍스트 색상: 실제 글자 배치 영역을 분석해 WCAG 4.5:1 이상을 목표로 White, ERICA Navy, Dark Charcoal, Light Gold 중 안전색 선택. 기준 통과 후보에서는 템플릿의 ERICA 권장색을 우선
- 한 공통색으로 대비를 확보하기 어려운 이미지·그라데이션에서는 항목별 안전색을 적용하고, 기준 미달 시 최고 대비색과 경고 사용
- 기본색 또는 부분색을 직접 바꾼 항목은 수동 상태로 보존하며 “자동 색상 사용”으로 다시 자동 전환
- 사진 1개와 로고 2개 업로드, 크기 조절, 직접 드래그
- 로고 원본 종횡비를 미리보기와 FHD/4K 출력에서 보존
- 안전영역 표시와 텍스트·사진·로고 간 충돌 감지
- 충돌이 있는 화면은 문제 요소를 알리고 PNG/ZIP 출력을 차단
- 여러 화면을 재생목록에 저장한 뒤 순번이 붙은 PNG로 일괄 출력
- 모바일 QUICK START의 “빠른 미리보기” 또는 하단의 “미리보기 열기” 버튼으로 9:16 오버레이 확인

템플릿 32종
- 기본 시안 7종: 브라운 클래식 웰컴보드 + 기존 6종 코드 내 그라데이션 배경
  - templates/signage_vertical_06_brown_classic_frame.svg
- 디자이너 제공 프리셋 9종: 본관 1층용 공지사항 3종 + 행사 3종 + 시그니처 Black·Blue·White 3종
  - templates/designer_notice_01.png
  - templates/designer_notice_02.png
  - templates/designer_notice_03.png
  - templates/designer_event_01.png
  - templates/designer_event_02.png
  - templates/designer_event_03.png
  - templates/designer_signage_black.png
  - templates/designer_signage_blue.png
  - templates/designer_signage_white.png
- 이미지 시안 10종:
  - templates/signage_01.png
  - templates/signage_02.png
  - templates/signage_03.png
  - templates/signage_04.png
  - templates/signage_05.png
  - templates/signage_vertical_01_navy_gold_letterhead.png
  - templates/signage_vertical_02_navy_gold_border.png
  - templates/signage_vertical_03_blue_wave.png
  - templates/signage_vertical_04_navy_gold_curve_frame.png
  - templates/signage_vertical_05_ivory_gold_frame.png
- 한양 공식색 그라데이션 6종: Blue를 중심으로 Silver, Gold, Retro Mint, Retro Coral, Orange, Yellow Green 조합

템플릿 파일명은 대소문자를 포함해 코드와 정확히 같아야 합니다. `npm test`는 코드에 등록된 모든 이미지 템플릿 경로가 실제로 존재하는지 검사하며 하나라도 없으면 실패합니다.

V1.5.1 · NOTICE FRAME
공지사항 카드·클래식·엠블럼 프리셋의 관련 문의 프레임을 같은 반투명 한양 블루로 통일했습니다.
- 디자이너가 지정한 공지사항 클래식의 옅은 블루 색상과 투명도 사용
- 공지사항 엠블럼의 불투명한 파란 프레임을 반투명 프레임으로 교체
- 공지사항 카드의 투명도를 클래식과 동일하게 미세 조정

V1.5.0 · SIGNATURE TYPE
디자이너의 시그니처 Black·Blue·White 빈 템플릿 3종과 예시안의 타이포그래피 감각을 프리셋으로 추가했습니다.
- 행사 정보, 대형 행사명, 일시·장소의 위계와 위치를 시안 기준으로 적용
- 대형 행사명은 촘촘한 행간과 넓은 자간을 함께 사용
- Blue·White 정보 행에는 시안과 같은 ERICA 블루 라벨 표시
- 배경에 맞춘 흰색/컬러 ERICA 로고를 하단 중앙에 자동 배치
- 모든 값은 기존 고급 편집의 글꼴·크기·행간·자간·위치 컨트롤에서 다시 조정 가능

V1.4.0 · WARM WELCOME
기존 웰컴보드의 브라운 클래식 양식을 9:16 세로형으로 다시 구성했습니다. 짙은 브라운 배경에 골드 이중선, 곡선 코너와 네 모서리 별 장식을 넣고 FHD/4K에서 선명하게 확장되는 SVG 자산으로 제작했습니다.
- 첫 시안: 브라운 클래식 (#302A27 → #201C1A), 골드 프레임, 흰 글자
- 기존 ERICA 블루는 두 번째로 이동; 저장 파일의 내부 템플릿 ID 1~22는 그대로 보존
- 기본 행사명: OOO대학 OOO방문단의 / ERICA 방문을 환영합니다 (실제 두 줄)
- 기본 일시: 20XX년 X월 X일
- 기본 장소: 본관 2층 프라임 컨퍼런스 홀
- 중앙 정렬 안내 블록: 제목 y=30%, 일시 y=47%, 장소 y=53.5%
- 기존 ERICA 흰색 로고를 하단 중앙 x=50%, y=89%, 너비 42%에 배치
- 행사명 최대 104px, 일시 60px, 장소 58px에서 실제 글꼴과 명시적 줄바꿈을 기준으로 폭 84%에 맞춤
- 자동 축소 하한은 제목 64px, 일시·장소 50px; 이보다 긴 문구는 줄바꿈을 허용하고 기존 충돌·안전영역 검사 적용
- 고급 편집 크기를 직접 조절하면 해당 항목의 자동 축소를 해제해 수동 크기를 존중
- 폰트 로딩 후와 출력 전에 같은 렌더링으로 재계산하므로 FHD/4K 비율과 줄바꿈 유지
- 기존 로컬 작업 및 JSON은 기존 시안·문구·크기·위치·색상·로고를 복원; 새 기본값은 신규 작업/전체 초기화에만 적용

QUICK START
첫 화면에서 행사명, 일시, 장소를 입력하면 각각 고급 편집의 제목, 부제목, 본문에 즉시 반영됩니다. “고급 편집”으로 전환해 부분 굵게, 부분 색상, 글꼴, 크기, 사진과 로고를 조정한 뒤 QUICK START로 돌아와도 같은 상태가 유지됩니다. QUICK START 입력은 일반 텍스트 편집이므로 해당 항목을 다시 입력하면 그 항목의 부분 서식은 일반 텍스트로 정리됩니다.

자동 텍스트 색상
새 작업과 전체 초기화 후에는 다섯 텍스트 항목이 자동 모드로 시작합니다. 템플릿 이미지 전체 평균이 아니라 미리보기에 실제로 표시된 각 텍스트 줄의 배경 픽셀을 샘플링하고, WCAG 상대휘도와 대비율을 계산합니다. 미리보기에서 확정된 색은 FHD, 4K, 재생목록 PNG와 MagicInfoSlide ZIP 생성 전에 다시 검증됩니다.

고급 편집의 수동 기본색과 부분 글자색 기능은 그대로 유지됩니다. 수동 상태의 항목은 배경이나 템플릿을 바꿔도 자동으로 덮어쓰지 않습니다. 다시 자동 모드를 선택하면 해당 항목의 부분 색상을 정리하고 계산된 자동색을 일관되게 적용합니다. V1.3.0 이하 형식처럼 자동/수동 정보가 없는 작업 JSON은 기존 외관을 보존하기 위해 저장된 기본색을 수동 상태로 복원합니다.

디자이너 제공 프리셋
`빈 템플릿` 원본 9종은 4501 × 8001 해상도를 그대로 사용합니다. 각 카드를 선택하면 같은 이름의 `내용 삽입 예시안`을 기준으로 제목·안내·일정/장소·문의 문구와 색상, 글자 크기, 위치, 굵기, 행간·자간, 라벨 배경이 함께 적용됩니다. 공지형과 행사형에 맞춰 QUICK START의 제목과 입력 라벨도 자동으로 바뀌며, 적용 후에는 기존 고급 편집에서 모든 문구와 스타일을 다시 조정할 수 있습니다. 디자이너 권장 색을 보존하기 위해 처음 적용할 때는 각 항목이 수동 색상으로 시작하고, 사용자가 원하면 기존 “자동 색상 사용”으로 전환할 수 있습니다.

MagicInfoSlide ZIP의 의미
생성되는 ZIP은 MagicINFO 서버에 곧바로 가져오는 manifest/playlist/schedule 완성 패키지가 아닙니다. 아래처럼 번호가 붙은 PNG 파일을 한 폴더에 모은 전달용 묶음입니다.

MagicInfoSlide/
  001_제목.png
  002_제목.png
  003_제목.png

파일명은 Unicode NFC로 정규화하고 Windows/macOS/Samsung 환경에서 문제가 되는 문자와 예약 장치명을 정리합니다. 재생 순서를 안정적으로 유지하기 위해 기존 `001_`, `002_` 순번 구조를 유지합니다.

MagicINFO 등록 기본 절차
1. ZIP을 풀고 MagicInfoSlide 폴더의 PNG를 확인합니다.
2. MagicINFO 서버의 콘텐츠/미디어 메뉴에 PNG를 업로드합니다.
3. 업로드한 미디어로 재생목록을 만들고 순서를 확인합니다.
4. 재생목록을 대상 디스플레이의 스케줄에 배정합니다.
5. 실제 장비에서 해상도, 전환, 표시 영역을 최종 확인합니다.

브라우저가 File System Access API를 지원하면 선택한 위치에 MagicInfoSlide 폴더를 직접 만들 수도 있습니다. 이 기능도 PNG만 저장하며 재생목록이나 스케줄을 생성하지 않습니다. 이 프로젝트에서는 실제 MagicINFO 서버 import 또는 장비 재생 검증을 수행하지 않았습니다.

저장소 구조
digital-signage-maker/
├─ index.html
├─ README.txt
├─ package.json
├─ tests/
│  ├─ verify.mjs
│  └─ fixtures/work-v1.0.1.json
├─ templates/              이미지 템플릿 19종 + 기본 시안 SVG 1종
└─ logos/                  기본 로고 8종

검증
- `npm test`: JavaScript 문법, 템플릿 32종 구성과 디자이너 프리셋 9종 및 자산 존재, 중복 DOM ID, APP_VERSION, QUICK START 3개 입력과 편집 모드 상태 공유, 저장 JSON 버전, V1.0.1/V1.3.0/V1.3.1 복원과 웜 웰컴 기본값·왕복 저장, 자동 축소 하한과 수동 크기 보존, WCAG 대비 계산, 자동/수동 색상 및 출력 전 재검증 계약, README 자산 목록, signage/sinage 오타를 검사합니다.
- 브라우저 회귀 테스트 권장 폭: Desktop 1440px, Tablet 768px, Mobile 390px
- `git diff --check`: 공백 오류를 검사합니다.

외부 라이브러리
웹 폰트와 html2canvas, JSZip은 CDN에서 불러옵니다. 따라서 최초 실행과 PNG/ZIP 출력에는 네트워크 연결이 필요할 수 있습니다.
