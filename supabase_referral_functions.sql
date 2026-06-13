-- ============================================
-- Referral & Partnership Program — RPC Functions
-- Run this in Supabase SQL Editor (after supabase_referral_schema.sql)
-- All functions are SECURITY DEFINER so they can read/write across
-- users that RLS would otherwise hide, while validating input themselves.
-- ============================================

-- ============================================
-- resolve_referral_code
-- Public lookup: given a referral_code (link slug or promo code),
-- returns the referrer's id and code type, if active.
-- ============================================

CREATE OR REPLACE FUNCTION resolve_referral_code(p_code TEXT)
RETURNS TABLE(referrer_id UUID, code_type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.referral_code_type
  FROM users u
  WHERE upper(u.referral_code) = upper(p_code)
    AND u.referral_type IS NOT NULL
    AND (u.referral_type = 'standard' OR u.partner_status = 'approved');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION resolve_referral_code(TEXT) TO anon, authenticated;

-- ============================================
-- apply_referral_code
-- Called once after a new user signs up (from a ?ref= link or a promo
-- code entered at signup). Sets referred_by/referred_at if not already set.
-- Silently no-ops on invalid codes or self-referral.
-- ============================================

CREATE OR REPLACE FUNCTION apply_referral_code(p_code TEXT)
RETURNS VOID AS $$
DECLARE
  v_referrer_id UUID;
  v_code_type TEXT;
  v_bonus_qr INT;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND referred_by IS NOT NULL) THEN
    RETURN;
  END IF;

  SELECT referrer_id, code_type INTO v_referrer_id, v_code_type
  FROM resolve_referral_code(trim(p_code));

  IF v_referrer_id IS NULL OR v_referrer_id = auth.uid() THEN
    RETURN;
  END IF;

  UPDATE users
  SET referred_by = v_referrer_id,
      referred_at = NOW()
  WHERE id = auth.uid();

  -- If the referrer (e.g. an approved partner) has a configured signup
  -- bonus, grant it to the new user's QR allocation (skip if unlimited).
  SELECT signup_bonus_qr INTO v_bonus_qr FROM users WHERE id = v_referrer_id;
  IF v_bonus_qr IS NOT NULL AND v_bonus_qr > 0 THEN
    UPDATE subscriptions
    SET qr_allocated = qr_allocated + v_bonus_qr
    WHERE user_id = auth.uid() AND qr_allocated != -1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION apply_referral_code(TEXT) TO authenticated;

-- ============================================
-- get_my_signup_bonus
-- Returns the bonus QR code count (if any) granted by the referrer the
-- current user signed up through. Used to show the user what extra
-- credits they received on top of the standard trial allocation.
-- ============================================

CREATE OR REPLACE FUNCTION get_my_signup_bonus()
RETURNS INT AS $$
DECLARE
  v_referrer_id UUID;
  v_bonus INT;
BEGIN
  SELECT referred_by INTO v_referrer_id FROM users WHERE id = auth.uid();
  IF v_referrer_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT signup_bonus_qr INTO v_bonus FROM users WHERE id = v_referrer_id;
  RETURN COALESCE(v_bonus, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_my_signup_bonus() TO authenticated;

-- ============================================
-- set_standard_referral_code
-- Self-serve opt-in for regular vendors: pick a referral link slug,
-- become a 'standard' referrer at the fixed 10% / 12-month terms.
-- ============================================

CREATE OR REPLACE FUNCTION set_standard_referral_code(p_code TEXT)
RETURNS VOID AS $$
DECLARE
  v_code TEXT := lower(trim(p_code));
BEGIN
  IF v_code !~ '^[a-z0-9-]{3,30}$' THEN
    RAISE EXCEPTION 'Referral link must be 3-30 characters: lowercase letters, numbers, and hyphens only';
  END IF;

  IF EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND account_type = 'partner') THEN
    RAISE EXCEPTION 'Partner accounts cannot change their referral code here';
  END IF;

  IF EXISTS (SELECT 1 FROM users WHERE referral_code = v_code AND id != auth.uid()) THEN
    RAISE EXCEPTION 'That referral link is already taken';
  END IF;

  UPDATE users
  SET referral_type = 'standard',
      referral_code = v_code,
      referral_code_type = 'link',
      commission_rate = 0.10,
      commission_window_months = 12
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION set_standard_referral_code(TEXT) TO authenticated;

-- ============================================
-- submit_partner_application
-- Called right after a partner signs up. Marks the account as a
-- pending partner and stores the agreement-form answers for admin review.
-- ============================================

DROP FUNCTION IF EXISTS submit_partner_application(INT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION submit_partner_application(
  p_contract_years INT,
  p_requested_commission_rate NUMERIC,
  p_confidence_level TEXT,
  p_estimated_monthly_referrals TEXT,
  p_audience_fit TEXT,
  p_preferred_code_type TEXT,
  p_preferred_referral_code TEXT,
  p_applicant_type TEXT DEFAULT 'individual',
  p_team_size INT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_code TEXT;
  v_application_id UUID;
  v_team_size INT;
BEGIN
  IF p_contract_years IS NULL OR p_contract_years < 1 OR p_contract_years > 10 THEN
    RAISE EXCEPTION 'Contract length must be between 1 and 10 years';
  END IF;

  IF p_requested_commission_rate IS NULL OR p_requested_commission_rate < 0.10 OR p_requested_commission_rate > 0.20 THEN
    RAISE EXCEPTION 'Requested commission must be between 10%% and 20%%';
  END IF;

  IF p_applicant_type NOT IN ('individual', 'team') THEN
    RAISE EXCEPTION 'Applicant type must be "individual" or "team"';
  END IF;

  IF p_applicant_type = 'team' THEN
    IF p_team_size IS NULL OR p_team_size < 2 OR p_team_size > 1000 THEN
      RAISE EXCEPTION 'Team size must be between 2 and 1000';
    END IF;
    v_team_size := p_team_size;
  ELSE
    v_team_size := NULL;
  END IF;

  IF p_preferred_code_type NOT IN ('link', 'promo_code') THEN
    RAISE EXCEPTION 'Preferred code type must be "link" or "promo_code"';
  END IF;

  IF p_preferred_code_type = 'link' THEN
    v_code := lower(trim(p_preferred_referral_code));
    IF v_code !~ '^[a-z0-9-]{3,30}$' THEN
      RAISE EXCEPTION 'Referral link must be 3-30 characters: lowercase letters, numbers, and hyphens only';
    END IF;
  ELSE
    v_code := upper(trim(p_preferred_referral_code));
    IF v_code !~ '^[A-Z0-9]{4,20}$' THEN
      RAISE EXCEPTION 'Promo code must be 4-20 characters: uppercase letters and numbers only';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM users WHERE referral_code = v_code AND id != auth.uid()) THEN
    RAISE EXCEPTION 'That referral code is already taken';
  END IF;

  UPDATE users
  SET account_type = 'partner',
      referral_type = 'partner',
      partner_status = 'pending',
      is_vendor = FALSE,
      onboarding_completed = TRUE
  WHERE id = auth.uid();

  INSERT INTO partner_applications (
    user_id, contract_years, requested_commission_rate, confidence_level,
    estimated_monthly_referrals, audience_fit, preferred_code_type, preferred_referral_code,
    applicant_type, team_size
  ) VALUES (
    auth.uid(), p_contract_years, p_requested_commission_rate, p_confidence_level,
    p_estimated_monthly_referrals, p_audience_fit, p_preferred_code_type, v_code,
    p_applicant_type, v_team_size
  )
  RETURNING id INTO v_application_id;

  RETURN v_application_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION submit_partner_application(INT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT) TO authenticated;

-- ============================================
-- generate_referral_commissions
-- Called right after a payment is marked 'success' (from
-- activateSubscription in paystackService.js). Computes the
-- VAT-exclusive commission for the referrer, splitting yearly
-- payments evenly across 12 monthly periods, and stops once the
-- referrer's commission window (12 months, or contract_years*12
-- for partners) has elapsed since the referred user's first payment.
-- ============================================

CREATE OR REPLACE FUNCTION generate_referral_commissions(p_payment_id UUID)
RETURNS VOID AS $$
DECLARE
  v_payment RECORD;
  v_payer RECORD;
  v_referrer RECORD;
  v_base_total BIGINT;
  v_monthly_base BIGINT;
  v_periods INT;
  v_paid_month DATE;
  v_period_month DATE;
  v_month_number INT;
  v_commission BIGINT;
  i INT;
BEGIN
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id AND status = 'success';
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT id, referred_by, first_paid_at INTO v_payer FROM users WHERE id = v_payment.user_id;
  IF v_payer.referred_by IS NULL OR v_payer.first_paid_at IS NULL THEN
    RETURN;
  END IF;

  SELECT id, referral_type, partner_status, commission_rate, commission_window_months
  INTO v_referrer FROM users WHERE id = v_payer.referred_by;

  IF v_referrer.referral_type IS NULL THEN
    RETURN;
  END IF;

  IF v_referrer.referral_type = 'partner' AND v_referrer.partner_status IS DISTINCT FROM 'approved' THEN
    RETURN;
  END IF;

  -- VAT-exclusive (after-tax) revenue base, 7.5% Nigerian VAT
  v_base_total := round(v_payment.amount_kobo / 1.075);

  v_paid_month := date_trunc('month', COALESCE(v_payment.paid_at, NOW()))::date;

  IF v_payment.billing_cycle = 'yearly' THEN
    v_periods := 12;
    v_monthly_base := round(v_base_total / 12.0);
  ELSE
    v_periods := 1;
    v_monthly_base := v_base_total;
  END IF;

  FOR i IN 0..(v_periods - 1) LOOP
    v_period_month := (v_paid_month + (i || ' months')::interval)::date;
    v_month_number := (
      (date_part('year', v_period_month) - date_part('year', v_payer.first_paid_at)) * 12
      + (date_part('month', v_period_month) - date_part('month', v_payer.first_paid_at))
    )::int + 1;

    IF v_month_number >= 1 AND v_month_number <= v_referrer.commission_window_months THEN
      v_commission := round(v_monthly_base * v_referrer.commission_rate);

      INSERT INTO referral_commissions (
        referrer_id, referred_user_id, payment_id, period_month,
        base_amount_kobo, commission_rate, commission_kobo, month_number
      ) VALUES (
        v_referrer.id, v_payer.id, p_payment_id, v_period_month,
        v_monthly_base, v_referrer.commission_rate, v_commission, v_month_number
      )
      ON CONFLICT (referred_user_id, period_month) DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION generate_referral_commissions(UUID) TO authenticated;

-- ============================================
-- get_my_referrals
-- Returns the list of users referred by the caller, with limited
-- display fields (RLS normally hides other users' rows entirely).
-- ============================================

CREATE OR REPLACE FUNCTION get_my_referrals()
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  signed_up_at TIMESTAMP WITH TIME ZONE,
  first_paid_at TIMESTAMP WITH TIME ZONE,
  plan_id TEXT,
  subscription_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id,
         COALESCE(NULLIF(u.full_name, ''), split_part(u.email, '@', 1)) AS display_name,
         u.created_at,
         u.first_paid_at,
         s.plan_id,
         s.status
  FROM users u
  LEFT JOIN subscriptions s ON s.user_id = u.id
  WHERE u.referred_by = auth.uid()
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_my_referrals() TO authenticated;

-- ============================================
-- get_my_commissions
-- Returns the caller's commission ledger with the referred user's
-- display name attached.
-- ============================================

CREATE OR REPLACE FUNCTION get_my_commissions()
RETURNS TABLE(
  id UUID,
  referred_user_id UUID,
  referred_display_name TEXT,
  period_month DATE,
  base_amount_kobo BIGINT,
  commission_rate NUMERIC,
  commission_kobo BIGINT,
  month_number INT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT rc.id, rc.referred_user_id,
         COALESCE(NULLIF(u.full_name, ''), split_part(u.email, '@', 1)) AS referred_display_name,
         rc.period_month, rc.base_amount_kobo, rc.commission_rate, rc.commission_kobo,
         rc.month_number, rc.status
  FROM referral_commissions rc
  JOIN users u ON u.id = rc.referred_user_id
  WHERE rc.referrer_id = auth.uid()
  ORDER BY rc.period_month DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_my_commissions() TO authenticated;
