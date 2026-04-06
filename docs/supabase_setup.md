# Supabase 데이터베이스 설정 (리뷰 시스템 추가)

아래 SQL 명령어를 Supabase 대시보드의 **SQL Editor**에 복사하여 실행해주세요.

## 1. `reviews` 테이블 생성 및 RLS 정책
이 테이블은 갤러리 영상 생성을 위한 사용자 후기를 저장합니다.

```sql
-- 리뷰 테이블 생성
CREATE TABLE reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) 활성화
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 리뷰 작성 정책: 모두가 읽을 수 있고, 인증된 사용자만 작성 가능
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 2. 권한 설정
```sql
GRANT ALL ON TABLE reviews TO authenticated;
GRANT ALL ON TABLE reviews TO service_role;
```

---

> 이 스크립트를 실행하시면, 이후 웹에서 후기를 작성하고 무료 영상 생성을 진행할 수 있게 됩니다.
