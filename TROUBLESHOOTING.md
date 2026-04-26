# Troubleshooting Log

---

## [2026-04-25] CSS @import 순서 오류

### 증상
```
Parsing CSS source code failed
@import rules must precede all rules aside from @charset and @layer statements
```

### 원인
`app/globals.css`에서 `@import "tailwindcss"` 다음에 Google Fonts `@import url(...)` 를 작성.
CSS 스펙 및 PostCSS는 모든 `@import` 구문이 다른 규칙보다 **먼저** 위치해야 한다는 것을 강제함.

### 해결
`@import url(...)` (Google Fonts) 를 `@import "tailwindcss"` **앞으로** 이동.

이후 Google Fonts는 `app/layout.tsx`의 `<head>` 내 `<link>` 태그 방식으로 변경하고, `globals.css`에서는 `@import url(...)` 자체를 제거함.

### 재발 방지
CSS 파일 작성 시 모든 `@import` 를 파일 최상단에 한 곳에 묶어 배치. 어떤 선택자/규칙보다 먼저 와야 함.

---

## [2026-04-25] Supabase schema.sql 실행 오류 ①

### 증상
```
ERROR: 42P07: relation "profiles" already exists
```

### 원인
`schema.sql` 최초 실행 시 도중에 오류로 중단되었으나 `profiles` 테이블은 이미 생성된 상태.
이후 재실행 시 `CREATE TABLE` 구문이 중복 생성을 시도하여 충돌.

### 해결 시도 1 — IF NOT EXISTS 추가 (실패)
`CREATE TABLE` → `CREATE TABLE IF NOT EXISTS` 로 변경.
테이블 문제는 해결됐으나 이어서 다음 오류 발생.

---

## [2026-04-25] Supabase schema.sql 실행 오류 ②

### 증상
```
ERROR: 42601: syntax error at or near "not"
LINE 18: create policy if not exists "본인 프로필만 조회" ...
```

### 원인
`CREATE POLICY IF NOT EXISTS` 문법은 **PostgreSQL 15+** 에서만 지원됨.
해당 Supabase 프로젝트의 PostgreSQL 버전이 이를 지원하지 않음.

### 최종 해결 — DROP → 재생성 방식으로 전환
`schema.sql` 상단에 `DROP ... CASCADE` 블록을 추가하여 실행 전 완전 초기화 후 재생성.
- 버전 의존성 없는 표준 SQL만 사용
- 개발 환경에서 반복 실행 가능한 구조

```sql
-- 초기화 블록 (의존성 역순)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.search_keywords cascade;
drop table if exists public.feedback cascade;
drop table if exists public.video_logs cascade;
drop table if exists public.profiles cascade;
```

### 주의
이 방식은 기존 데이터를 모두 삭제함. 프로덕션 전환 시 DROP 블록을 제거하고 마이그레이션 방식으로 전환 필요.
