-- Trigger Function: update_updated_at_column
-- MUST BE RUN FIRST before any table migrations
-- Purpose: Auto-update 'updated_at' timestamp on table updates

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function documentation
COMMENT ON FUNCTION update_updated_at_column IS 'Trigger function to automatically update the updated_at timestamp on row updates. Run this before all table migrations.';
