-- HIGH RISK TABLE: organizations
-- ML-Guided Generation: Enhanced validation for multi-tenant bug prevention
-- Generated: 2025-12-12T14:46:14.508043
-- Risk Level: HIGH
-- Features: RLS policies, tenant isolation, comprehensive validation

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enum constraints (prevent ENUM_FIELD_TEXT_INPUT bug)
ALTER TABLE organizations ADD CONSTRAINT chk_organizations_plan CHECK (plan IN ('free', 'pro', 'enterprise'));


-- Row-Level Security (CRITICAL for multi-tenancy)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Organization-level isolation (for the organizations table itself)
CREATE POLICY organizations_tenant_isolation ON organizations
  FOR ALL
  USING (
    id = current_setting('app.current_organization_id')::UUID
  );

-- Policy: Service role has full access (for migrations, admin operations)
CREATE POLICY organizations_service_role ON organizations
  FOR ALL
  TO service_role
  USING (true);

-- Indexes for performance
CREATE INDEX idx_organizations_slug ON organizations(slug);


-- Trigger: Auto-update updated_at timestamp
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table documentation
COMMENT ON TABLE organizations IS 'HIGH RISK: Multi-tenant organization/company entity (top-level tenant). Generated with ML-guided defensive patterns (RLS, validation, triggers).';