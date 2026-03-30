-- Add total_lessons column to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0;

-- Function to update total_lessons
CREATE OR REPLACE FUNCTION update_course_lessons_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE courses
    SET total_lessons = total_lessons + 1
    WHERE id = NEW.course_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE courses
    SET total_lessons = total_lessons - 1
    WHERE id = OLD.course_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for lessons
DROP TRIGGER IF EXISTS on_lesson_change ON lessons;
CREATE TRIGGER on_lesson_change
AFTER INSERT OR DELETE ON lessons
FOR EACH ROW
EXECUTE FUNCTION update_course_lessons_count();

-- Populate initial data
UPDATE courses c
SET total_lessons = (SELECT count(*) FROM lessons l WHERE l.course_id = c.id);
