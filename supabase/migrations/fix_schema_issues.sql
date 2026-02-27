-- ===================================
-- Fix Schema Issues for Payment Flow
-- ===================================

-- 1. Add plan_activated_at to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS plan_activated_at TIMESTAMP WITH TIME ZONE;

-- 2. Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_type TEXT NOT NULL,
  event_id TEXT NOT NULL,
  asaas_payment_id TEXT,
  status TEXT NOT NULL,
  payload JSONB,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create index for webhook logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_asaas_payment_id ON webhook_logs(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_logs(event_id);

-- 4. Update payments.status constraint to include OVERDUE
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED', 'OVERDUE'));

-- 5. Add UPDATE policy for Edge Functions to update profiles
CREATE POLICY IF NOT EXISTS "Service role can update any profile" ON profiles
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- 6. Add UPDATE policy for payments
CREATE POLICY IF NOT EXISTS "Service role can update payments" ON payments
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- 7. Add RLS to webhook_logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- 8. Add RLS policies for audit_log (security fix)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can view audit logs" ON audit_log
  FOR SELECT
  USING (auth.role() = 'service_role' OR auth.uid() = admin_id);

CREATE POLICY IF NOT EXISTS "Service role can insert audit logs" ON audit_log
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
