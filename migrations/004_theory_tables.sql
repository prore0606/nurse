-- ─── 이론 챕터 (video_sections와 동일 패턴) ───
-- video_subjects.id가 TEXT 타입이므로 subject_id도 TEXT로 맞춤
CREATE TABLE theory_chapters (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  subject_id TEXT NOT NULL REFERENCES video_subjects(id) ON DELETE CASCADE,
  number     INT NOT NULL,
  title      TEXT NOT NULL,
  order_num  INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_theory_chapters_subject ON theory_chapters(subject_id);

-- ─── 이론 토픽 (video_lectures와 동일 패턴) ───
CREATE TABLE theory_topics (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chapter_id   TEXT NOT NULL REFERENCES theory_chapters(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'file' CHECK (content_type IN ('file', 'text', 'mixed')),
  content_urls TEXT[] NOT NULL DEFAULT '{}',
  body         TEXT NOT NULL DEFAULT '',
  has_note     BOOLEAN NOT NULL DEFAULT false,
  order_num    INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_theory_topics_chapter ON theory_topics(chapter_id);

-- ─── Supabase Storage 버킷 (Supabase 대시보드에서 직접 생성) ───
-- Storage > New bucket > 이름: theory-content > Public: ON
-- 또는 SQL로:
INSERT INTO storage.buckets (id, name, public)
VALUES ('theory-content', 'theory-content', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: 인증 없이 읽기 허용, 인증된 사용자만 업로드
CREATE POLICY "theory-content public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'theory-content');

CREATE POLICY "theory-content authenticated upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'theory-content');

CREATE POLICY "theory-content authenticated update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'theory-content');

CREATE POLICY "theory-content authenticated delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'theory-content');
