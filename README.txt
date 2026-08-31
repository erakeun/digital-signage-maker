디지털 사이니지 제작기 V1.0

목적
- ERICA 세로형 디지털 사이니지(9:16) 안내 화면 제작
- 기본 작업 크기: 1080 × 1920
- FHD / 4K PNG 출력
- 자동재생용 폴더명: MagicInfoSlide

핵심 기능
- 제목 / 부제목 / 본문 / 강조문 / 하단 문구
- 부분 볼드 + 부분 글자색
- 텍스트 블록 직접 드래그
- 사진 1개, 로고 2개 업로드 및 직접 드래그
- 재생목록에 여러 화면 저장 후 일괄 출력
- MagicInfoSlide ZIP:
  ZIP을 풀면 MagicInfoSlide 폴더 안에 PNG가 들어 있습니다.
- MagicInfoSlide 폴더 직접 저장:
  지원 브라우저(주로 Chrome/Edge)에서는 선택한 상위 위치에
  MagicInfoSlide 폴더를 자동 생성하여 PNG를 직접 저장합니다.
  사용자가 이미 MagicInfoSlide 폴더 자체를 선택한 경우 그 폴더에 바로 저장합니다.
- 작업파일 JSON 저장 / 불러오기

GitHub Pages 권장 구조
digital-signage-maker/
├─ index.html
├─ templates/
│  ├─ signage_01.png
│  ├─ signage_02.png
│  ├─ signage_03.png
│  ├─ signage_04.png
│  ├─ signage_05.png
│  └─ signage_06.png
└─ logos/
   ├─ hyu_white.png
   ├─ hyu_erica_white.png
   ├─ hyu_round_white.png
   └─ hyu_lion_white.png

템플릿 이미지
- 권장 비율: 9:16
- 권장 원본: 1080 × 1920 또는 2160 × 3840
- 위 파일이 없어도 제작기는 임시 배경색/그라데이션으로 동작합니다.
- 추후 디자인 확정 후 동일 파일명으로 templates 폴더에 업로드하면 자동 적용됩니다.

주의
- 일반 브라우저의 보통 다운로드는 보안상 폴더 자체를 생성해 내려보낼 수 없습니다.
  따라서 ZIP 방식에서는 ZIP 내부에 MagicInfoSlide 폴더를 생성합니다.
- Chrome/Edge의 File System Access API를 사용할 수 있는 환경에서는
  'MagicInfoSlide 폴더로 바로 저장' 기능을 사용할 수 있습니다.
