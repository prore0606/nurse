-- video_subjects 테이블에 description_html 컬럼 추가
-- 디자이너가 작성한 전체 HTML 페이지를 그대로 저장하여 상세 페이지로 렌더링
ALTER TABLE video_subjects ADD COLUMN description_html TEXT;
