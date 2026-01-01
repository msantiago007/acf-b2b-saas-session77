-- HIGH RISK TABLE: organization_members
-- ML-Guided Generation: Enhanced validation for multi-tenant bug prevention
-- Generated: 2025-12-12T15:26:40.636203
-- Risk Level: HIGH
-- Features: RLS policies, tenant isolation, comprehensive validation

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id uuid DEFAULT gen_random_uuid(),
  organization_id uuid,
  user_id uuid,
  role enum DEFAULT 'member',
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



-- Row-Level Security (CRITICAL for multi-tenancy)
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policy: Organization-level isolation (for the organizations table itself)
CREATE POLICY organization_members_tenant_isolation ON organization_members
  FOR ALL
  USING (
    id = current_setting('app.current_organization_id')::UUID
  );

-- Policy: Service role has full access (for migrations, admin operations)
CREATE POLICY organization_members_service_role ON organization_members
  FOR ALL
  TO service_role
  USING (true);

-- Indexes for performance
CREATE INDEX idx_organization_members_['organization_id'] ON organization_members(['organization_id']);
CREATE INDEX idx_organization_members_['user_id'] ON organization_members(['user_id']);


-- Trigger: Auto-update updated_at timestamp
CREATE TRIGGER organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table documentation
COMMENT ON TABLE organization_members IS 'HIGH RISK: . Generated with ML-guided defensive patterns (RLS, validation, triggers).';