-- ─── 문제풀이 섹션 (prore-app ProblemSection과 동일 구조) ───
-- video_subjects.id가 TEXT 타입이므로 subject_id도 TEXT로 맞춤
CREATE TABLE problem_sections (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  subject_id TEXT NOT NULL REFERENCES video_subjects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,              -- "01. 의학용어 기초"
  order_num  INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_problem_sections_subject ON problem_sections(subject_id);

-- ─── 개별 문제 (prore-app Question과 동일 + admin 확장 필드) ───
CREATE TABLE problem_questions (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  section_id        TEXT NOT NULL REFERENCES problem_sections(id) ON DELETE CASCADE,
  number            INT NOT NULL,                  -- 섹션 내 문제 번호
  text              TEXT NOT NULL,                  -- 문제 텍스트
  text_image        TEXT NOT NULL DEFAULT '',        -- 문제 이미지 URL (admin 확장)
  choices           JSONB NOT NULL DEFAULT '[]',     -- [{id, text, image?}]
  correct_answer    TEXT NOT NULL,                   -- choice id (prore-app과 동일)
  explanation       TEXT NOT NULL DEFAULT '',         -- 해설
  explanation_image TEXT NOT NULL DEFAULT '',         -- 해설 이미지 (admin 확장)
  difficulty        TEXT NOT NULL DEFAULT 'medium'   -- easy/medium/hard (admin 확장)
                    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  order_num         INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_problem_questions_section ON problem_questions(section_id);

-- ─── RLS 정책 ───
ALTER TABLE problem_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_questions ENABLE ROW LEVEL SECURITY;

-- 공개 읽기
CREATE POLICY "problem_sections public read"
  ON problem_sections FOR SELECT USING (true);

CREATE POLICY "problem_questions public read"
  ON problem_questions FOR SELECT USING (true);

-- 인증된 사용자 쓰기
CREATE POLICY "problem_sections authenticated write"
  ON problem_sections FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "problem_questions authenticated write"
  ON problem_questions FOR ALL
  USING (true) WITH CHECK (true);
