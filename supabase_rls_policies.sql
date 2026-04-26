-- ============================================
-- Row-Level Security (RLS) Policies
-- Run these in Supabase SQL Editor after schema
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_code_usage ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- FRAMES TABLE POLICIES
-- ============================================

-- Anyone can view active frames
CREATE POLICY "Anyone can view active frames"
ON frames FOR SELECT
USING (status = 'active');

-- Vendors can view their own frames (including archived)
CREATE POLICY "Vendors can view own frames"
ON frames FOR SELECT
USING (auth.uid() = vendor_id);

-- Vendors can insert frames
CREATE POLICY "Vendors can insert frames"
ON frames FOR INSERT
WITH CHECK (auth.uid() = vendor_id);

-- Vendors can update their own frames
CREATE POLICY "Vendors can update own frames"
ON frames FOR UPDATE
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

-- Vendors can delete their own frames
CREATE POLICY "Vendors can delete own frames"
ON frames FOR DELETE
USING (auth.uid() = vendor_id);

-- ============================================
-- MEDIA TABLE POLICIES
-- ============================================

-- Anyone can view media for active frames
CREATE POLICY "Anyone can view media for active frames"
ON media FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM frames 
    WHERE frames.id = media.frame_id 
    AND frames.status = 'active'
  )
);

-- Vendors can insert media for their frames
CREATE POLICY "Vendors can insert media for own frames"
ON media FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM frames 
    WHERE frames.id = media.frame_id 
    AND frames.vendor_id = auth.uid()
  )
);

-- Vendors can delete media for their frames
CREATE POLICY "Vendors can delete media for own frames"
ON media FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM frames 
    WHERE frames.id = media.frame_id 
    AND frames.vendor_id = auth.uid()
  )
);

-- ============================================
-- COMMENTS TABLE POLICIES
-- ============================================

-- Anyone can view approved comments
CREATE POLICY "Anyone can view approved comments"
ON comments FOR SELECT
USING (is_approved = TRUE);

-- Vendors can view all comments on their frames
CREATE POLICY "Vendors can view comments on own frames"
ON comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM frames 
    WHERE frames.id = comments.frame_id 
    AND frames.vendor_id = auth.uid()
  )
);

-- Anyone can insert comments (no auth required)
CREATE POLICY "Anyone can insert comments"
ON comments FOR INSERT
WITH CHECK (TRUE);

-- Vendors can approve/delete comments on their frames
CREATE POLICY "Vendors can update comments on own frames"
ON comments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM frames 
    WHERE frames.id = comments.frame_id 
    AND frames.vendor_id = auth.uid()
  )
);

CREATE POLICY "Vendors can delete comments on own frames"
ON comments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM frames 
    WHERE frames.id = comments.frame_id 
    AND frames.vendor_id = auth.uid()
  )
);

-- ============================================
-- ANALYTICS TABLE POLICIES
-- ============================================

-- Vendors can view analytics for their frames
CREATE POLICY "Vendors can view own analytics"
ON analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM frames 
    WHERE frames.id = analytics.frame_id 
    AND frames.vendor_id = auth.uid()
  )
);

-- System can update analytics (via trigger or backend)
-- We'll use service_role for this in backend functions

-- ============================================
-- SCAN LOGS TABLE POLICIES
-- ============================================

-- Vendors can view scan logs for their frames
CREATE POLICY "Vendors can view scan logs for own frames"
ON scan_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM frames 
    WHERE frames.id = scan_logs.frame_id 
    AND frames.vendor_id = auth.uid()
  )
);

-- System can insert scan logs (via backend)
-- We'll use service_role for this in backend functions

-- ============================================
-- PAYMENT RECORDS TABLE POLICIES
-- ============================================

-- Vendors can view their own payment records
CREATE POLICY "Vendors can view own payments"
ON payment_records FOR SELECT
USING (auth.uid() = vendor_id);

-- System can insert payments (via backend)
-- We'll use service_role for this in backend functions

-- ============================================
-- QR CODE USAGE TABLE POLICIES
-- ============================================

-- Vendors can view their QR code usage
CREATE POLICY "Vendors can view own QR usage"
ON qr_code_usage FOR SELECT
USING (auth.uid() = vendor_id);

-- System can update QR usage (via backend)
-- We'll use service_role for this in backend functions
