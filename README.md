# 내 근무 증명 - 관리자 모드

HRM(인사관리) 시스템의 관리자 모드 애플리케이션입니다. Mock 데이터를 사용하여 완전히 동작하는 프로토타입을 제공합니다.

## 🚀 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속하세요.

### 빌드

```bash
npm run build
```

## 📋 테스트 계정

### Super Admin (Level 1)
- 이메일: `superadmin@bdgen.co.kr`
- 비밀번호: `pass1234`
- 권한: 시스템 전체 설정 및 관리

### Admin (Level 2)
- 이메일: `admin@bdgen.co.kr`
- 비밀번호: `pass1234`
- 권한: 직원 및 근태 관리 (부서 필터 자동 적용)

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── auth/           # 인증 관련 컴포넌트
│   ├── common/         # 공통 컴포넌트 (Button, Input, Modal, Toast 등)
│   └── layout/         # 레이아웃 컴포넌트 (Header, Sidebar, Layout)
├── mocks/              # Mock 데이터 및 스토어
│   ├── data.ts        # 초기 Mock 데이터
│   └── index.ts       # Mock 데이터 관리 스토어
├── pages/              # 페이지 컴포넌트
│   ├── Dashboard.tsx  # 대시보드
│   ├── Employees.tsx  # 직원 관리
│   ├── Attendances.tsx # 전사 근태 관리
│   ├── Reports.tsx    # 통계 및 리포트
│   ├── ActivityLogs.tsx # 활동 로그
│   ├── Settings.tsx   # 시스템 설정 (Super Admin만)
│   ├── MyAccount.tsx  # 내 정보
│   └── Login.tsx      # 로그인
├── services/           # API 서비스 레이어
│   └── api.ts         # Mock API 구현
├── store/              # 상태 관리
│   └── authStore.ts   # 인증 상태 관리
├── types/              # TypeScript 타입 정의
│   └── index.ts
├── App.tsx             # 메인 앱 컴포넌트
├── main.tsx            # 진입점
└── index.css           # 전역 스타일
```

## 🎯 주요 기능

### 1. 로그인 (Mock 인증)
- 이메일/비밀번호 검증
- Mock 로그인 성공 시 토큰/유저 저장
- 실패 케이스 분기 처리

### 2. 대시보드
- 오늘 전사 근태 요약 카드
- 출근율 차트 (오늘/이번 주/이번 달)
- 부서별 출근율
- 이상 근태 알림 리스트
- 최근 활동 로그 5건
- 5분 자동 갱신

### 3. 직원 관리
- 검색/필터/정렬/페이지네이션
- 신규 직원 초대 (이메일/사번 중복 체크)
- 직원 정보 수정
- 비활성/재활성화
- 비밀번호 초기화
- Excel 다운로드
- Admin 권한일 때 부서 필터 자동 적용

### 4. 전사 근태 관리
- 기간 선택, 상태 필터, 검색
- 근태 수정 모달:
  - 수정 사유 필수 (10~200자)
  - 권한별 수정 가능 기간 제한 (Admin: 7일, Super Admin: 30일)
- Excel 다운로드
- CAPS 업로드 (Super Admin만):
  - 파일 선택 → 파싱 시뮬레이션
  - 적용 옵션 (신규/덮어쓰기/전체삭제)

### 5. 통계/리포트
- 리포트 생성 (기간 선택)
- 리포트 다운로드
- 이메일 발송 (준비 중)

### 6. 활동 로그
- 주요 액션 로그 기록
- Admin은 본인 로그만 조회
- 필터링 (대상 유형별)

### 7. 시스템 설정 (Super Admin만)
- 근무 정책 설정
- 블록체인 연동 설정
- CAPS 연동 설정
- 알림 설정

## 🔐 권한 정책

### Level 1: Super Admin
- 시스템 전체 설정 및 관리
- 모든 직원 정보 조회/수정/삭제
- 전사 근태 데이터 조회/수정 (최근 30일)
- CAPS 데이터 업로드
- 관리자 계정 생성/권한 변경
- 활동 로그 전체 조회

### Level 2: Admin
- 담당 부서 직원 정보 조회/수정 (부서 필터 자동 적용)
- 전사 근태 데이터 조회
- 담당 부서 근태 데이터 수정 (최근 7일)
- 부서별 통계
- 본인 활동 로그만 조회

## 🎨 스타일링

- **테마**: 다크 테마 + 민트 컬러
- **반응형**: Desktop/Tablet/Mobile 지원
- **CSS 프레임워크**: Tailwind CSS

## 📝 Mock 데이터

모든 데이터는 `src/mocks/` 디렉토리에서 관리됩니다:

- **직원 데이터**: `mockUsers`
- **근태 데이터**: `mockAttendances` (최근 60일간 자동 생성)
- **활동 로그**: `mockActivityLogs`
- **시스템 설정**: `mockSystemSettings`

Mock 데이터는 메모리에서 관리되며, 페이지 새로고침 시 초기 상태로 돌아갑니다.

## 🔄 실 API 연동

실제 API로 전환하려면:

1. `src/services/api.ts`의 `USE_MOCK` 변수를 `false`로 변경
2. 각 API 함수의 실제 구현 추가
3. `apiClient` 설정 (axios 등)

## 📦 주요 의존성

- **React 18**: UI 라이브러리
- **TypeScript**: 타입 안정성
- **Vite**: 빌드 도구
- **React Router**: 라우팅
- **Zustand**: 상태 관리
- **Tailwind CSS**: 스타일링
- **date-fns**: 날짜 처리
- **xlsx**: Excel 파일 생성

## 🧪 테스트 시나리오

### 1. 로그인 테스트
1. `/login` 접속
2. Super Admin 계정으로 로그인
3. 대시보드로 자동 이동 확인

### 2. 직원 관리 테스트
1. 직원 관리 메뉴 클릭
2. 검색/필터 동작 확인
3. 직원 초대 → 중복 체크 확인
4. 직원 수정 → 저장 후 리스트 반영 확인
5. Excel 다운로드 확인

### 3. 근태 관리 테스트
1. 전사 근태 관리 메뉴 클릭
2. 기간 선택 및 조회
3. 근태 수정 → 수정 사유 입력 필수 확인
4. 권한별 수정 가능 기간 제한 확인
5. Super Admin으로 CAPS 업로드 확인

### 4. 권한 테스트
1. Admin 계정으로 로그인
2. 시스템 설정 메뉴 비표시 확인
3. 부서 필터 자동 적용 확인
4. 근태 수정 7일 제한 확인

## 📄 라이선스

이 프로젝트는 내부 사용을 위한 프로토타입입니다.




