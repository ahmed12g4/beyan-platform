-- Add stats columns to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS enrolled_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Function to update enrolled_count
CREATE OR REPLACE FUNCTION update_course_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE courses
    SET enrolled_count = enrolled_count + 1
    WHERE id = NEW.course_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE courses
    SET enrolled_count = enrolled_count - 1
    WHERE id = OLD.course_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for enrollments
DROP TRIGGER IF EXISTS on_enrollment_change ON enrollments;
CREATE TRIGGER on_enrollment_change
AFTER INSERT OR DELETE ON enrollments
FOR EACH ROW
EXECUTE FUNCTION update_course_enrollment_count();

-- Function to update rating_avg and review_count
CREATE OR REPLACE FUNCTION update_course_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_course_id UUID;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    target_course_id := OLD.course_id;
  ELSE
    target_course_id := NEW.course_id;
  END IF;

  -- Verify this is a course review (not a general comment or lesson comment if applicable)
  -- Assuming comments table has course_id and rating columns
  -- Adjust check based on your schema if comments are polymorphic
  
  UPDATE courses
  SET 
    review_count = (SELECT count(*) FROM comments WHERE course_id = target_course_id AND rating IS NOT NULL),
    rating_avg = COALESCE((SELECT avg(rating) FROM comments WHERE course_id = target_course_id AND rating IS NOT NULL), 0)
  WHERE id = target_course_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reviews/comments
DROP TRIGGER IF EXISTS on_review_change ON comments;
CREATE TRIGGER on_review_change
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_course_rating_stats();

-- Populate initial data
UPDATE courses c
SET 
  enrolled_count = (SELECT count(*) FROM enrollments e WHERE e.course_id = c.id),
  review_count = (SELECT count(*) FROM comments cm WHERE cm.course_id = c.id AND cm.rating IS NOT NULL),
  rating_avg = COALESCE((SELECT avg(rating) FROM comments cm WHERE cm.course_id = c.id AND cm.rating IS NOT NULL), 0);
