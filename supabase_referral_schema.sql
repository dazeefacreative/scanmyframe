-- ============================================
-- Referral & Partnership Program Schema
-- Run this in Supabase SQL Editor (after supabase_schema.sql)
-- ============================================

-- ============================================
-- 1. USERS TABLE ADDITIONS
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'standard'; -- 'standard' | 'partner'
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_type TEXT; -- NULL | 'standard' | 'partner'
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE; -- slug ('jolly-vibes') or promo code ('JOLLYVIBES')
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code_type TEXT; -- 'link' | 'promo_code'
ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,4) DEFAULT 0.10;
ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_window_months INT DEFAULT 12;
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_status TEXT; -- 'pending' | 'approved' | 'rejected'
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_paid_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 2. PARTNER APPLICATIONS (agreement form)
-- ============================================

CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_years INT NOT NULL,
  requested_commission_rate NUMERIC(5,4) NOT NULL,
  approved_commission_rate NUMERIC(5,4),
  confidence_level TEXT NOT NULL,            -- 'low' | 'medium' | 'high'
  estimated_monthly_referrals TEXT NOT NULL, -- '<20' | '20-50' | '>50'
  audience_fit TEXT NOT NULL,
  preferred_code_type TEXT NOT NULL,         -- 'link' | 'promo_code'
  preferred_referral_code TEXT NOT NULL,
  applicant_type TEXT NOT NULL DEFAULT 'individual', -- 'individual' | 'team'
  team_size INT,                             -- number of people, only set when applicant_type = 'team'
  status TEXT DEFAULT 'pending',             -- pending, approved, rejected
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS applicant_type TEXT NOT NULL DEFAULT 'individual'; -- 'individual' | 'team'
ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS team_size INT; -- number of people, only set when applicant_type = 'team'

-- ============================================
-- 3. REFERRAL COMMISSIONS (monthly ledger)
-- ============================================

CREATE TABLE IF NOT EXISTS referral_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_month DATE NOT NULL,
  total_amount_kobo BIGINT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, paid, failed
  paystack_transfer_code TEXT,
  failure_reason TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, period_month)
);

CREATE TABLE IF NOT EXISTS referral_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  period_month DATE NOT NULL,         -- first day of the month this commission applies to
  base_amount_kobo BIGINT NOT NULL,   -- after-tax (VAT-exclusive) revenue this commission is based on
  commission_rate NUMERIC(5,4) NOT NULL,
  commission_kobo BIGINT NOT NULL,
  month_number INT NOT NULL,          -- 1..commission_window_months, since referred user's first paid sub
  status TEXT DEFAULT 'pending',      -- pending, approved, paid, void
  payout_id UUID REFERENCES referral_payouts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_user_id, period_month)
);

-- ============================================
-- 4. PAYOUT BANK ACCOUNTS
-- ============================================

CREATE TABLE IF NOT EXISTS referral_payout_accounts (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bank_code TEXT NOT NULL,
  bank_name TEXT,
  account_number TEXT NOT NULL,
  account_name TEXT,
  paystack_recipient_code TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON referral_commissions(referrer_id, period_month);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referred_user ON referral_commissions(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_referrer ON referral_payouts(referrer_id, period_month);
CREATE INDEX IF NOT EXISTS idx_partner_applications_user ON partner_applications(user_id);

-- ============================================
-- TRIGGERS (auto-update timestamps)
-- ============================================

CREATE TRIGGER update_referral_payout_accounts_updated_at
BEFORE UPDATE ON referral_payout_accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SCHEDULED PAYOUT JOB (one-time setup)
-- ============================================
-- Requires the pg_cron and pg_net extensions (enable via
-- Database -> Extensions in the Supabase dashboard), then run:
--
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- SELECT cron.schedule(
--   'referral-payout-monthly',
--   '0 6 1 * *', -- 06:00 UTC on the 1st of every month
--   $$
--   SELECT net.http_post(
--     url := 'https://<project-ref>.supabase.co/functions/v1/referral-payout',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'x-payout-secret', '<REFERRAL_PAYOUT_SECRET>'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
