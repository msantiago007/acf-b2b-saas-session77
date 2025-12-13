-- MEDIUM RISK TABLE: teams
-- ML-Guided Generation: Standard validation
-- Generated: 2025-12-12T14:46:14.511046
-- Risk Level: MEDIUM
-- Features: Basic constraints, indexes, standard patterns

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



-- Indexes for performance
CREATE INDEX idx_teams_organization_id ON teams(organization_id);


-- Table documentation
COMMENT ON TABLE teams IS 'MEDIUM RISK: Sub-organization grouping within a tenant. Generated with standard patterns.';