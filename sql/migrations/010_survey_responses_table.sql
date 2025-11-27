-- Create survey_responses table
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  user_type TEXT,
  household_size INTEGER,
  expiry_forgetfulness INTEGER,
  cooking_stress INTEGER,
  duplicate_buying BOOLEAN,
  grocery_management INTEGER,
  wants_expiry_alerts BOOLEAN,
  wants_multilingual BOOLEAN,
  wants_voice_assistant BOOLEAN,
  wants_shopping_list BOOLEAN,
  feature_ratings JSONB DEFAULT '{}'::jsonb,
  additional_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON survey_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_type ON survey_responses(user_type);

-- Enable Row Level Security
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert
CREATE POLICY survey_responses_insert_policy
  ON survey_responses FOR INSERT
  WITH CHECK (true);

-- Policy: Allow authenticated users to view all (for admin)
CREATE POLICY survey_responses_select_policy
  ON survey_responses FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_survey_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER survey_responses_updated_at_trigger
  BEFORE UPDATE ON survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_survey_responses_updated_at();
