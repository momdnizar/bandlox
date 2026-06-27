-- ============================================================
-- Migration 007: Admin Users & Role-Based Access Control
-- ============================================================

-- 1. Create admin_users table
-- This links Supabase Auth users to internal roles/permissions.
CREATE TABLE IF NOT EXISTS admin_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'staff')) DEFAULT 'staff',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_admin_users_updated_at ON admin_users;
CREATE TRIGGER trigger_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

COMMENT ON TABLE  admin_users IS 'Links Supabase Auth users to admin roles for the Bandlox admin panel.';
COMMENT ON COLUMN admin_users.user_id IS 'References auth.users(id) — the Supabase Auth user.';
COMMENT ON COLUMN admin_users.role     IS 'Role for RBAC: super_admin, admin, or staff.';

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role   ON admin_users(role);

-- 3. Enable Row-Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- 4a. Users can read their own admin record (for middleware & profile checks)
CREATE POLICY "admin_users_select_own" ON admin_users
  FOR SELECT
  USING (user_id = auth.uid());

-- 4b. super_admins can read all admin_users (manage team)
CREATE POLICY "admin_users_select_super_admin" ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- 4c. super_admins can insert new admin users
CREATE POLICY "admin_users_insert_super_admin" ON admin_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- 4d. super_admins can update admin users (change roles)
CREATE POLICY "admin_users_update_super_admin" ON admin_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- 4e. super_admins can delete admin users
CREATE POLICY "admin_users_delete_super_admin" ON admin_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- 5. Helper function: check if a user is an admin
-- Returns the role or NULL if not an admin.
-- Usage: SELECT is_admin();  -- for current user
--        SELECT is_admin(some_uuid);
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT role FROM admin_users WHERE user_id = check_user_id;
$$;

COMMENT ON FUNCTION is_admin IS 'Returns the admin role for a user, or NULL if they are not an admin.';

-- 6. Seed a super_admin user (run this AFTER creating the auth user)
-- Replace the email with your actual admin email.
-- To use: first sign up / create the user in Supabase Auth, get their UUID,
-- then uncomment and run:
--
-- INSERT INTO admin_users (user_id, role)
-- VALUES ('<AUTH_USER_UUID>', 'super_admin');
--
-- Or use the API endpoint: POST /api/admin/users/invite