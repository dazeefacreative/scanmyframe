-- ============================================
-- ScanFrame Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  profile_picture_url TEXT,
  qr_codes_remaining INT DEFAULT 10,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  is_suspended BOOLEAN DEFAULT FALSE,
  is_disabled BOOLEAN DEFAULT FALSE,
  is_vendor BOOLEAN DEFAULT FALSE,
  known_devices JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Frames table (main content)
CREATE TABLE IF NOT EXISTS frames (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  qr_code_url TEXT UNIQUE,
  frame_slug TEXT UNIQUE NOT NULL, -- URL: /frame/frame_slug
  status TEXT DEFAULT 'active', -- active, archived, deleted
  comments_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Run on existing DB: ALTER TABLE frames ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN DEFAULT TRUE;

-- 4. Media table (photos and videos)
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  frame_id UUID NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL, -- 'photo', 'video'
  media_url TEXT NOT NULL,
  caption TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Comments table (visitor comments - no login required)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  frame_id UUID NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visitor_email TEXT,
  comment_text TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Analytics table (QR code scans)
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  frame_id UUID NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
  total_scans INT DEFAULT 0,
  unique_scans INT DEFAULT 0, -- Track unique visitors
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Scan logs table (track individual scans)
CREATE TABLE IF NOT EXISTS scan_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  frame_id UUID NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
  user_agent TEXT,
  ip_address TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  country TEXT,
  city TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Payment records table (QR code purchases)
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL, -- in NGN
  qr_codes_purchased INT NOT NULL,
  payment_reference TEXT UNIQUE, -- Paystack reference
  payment_status TEXT DEFAULT 'pending', -- pending, completed, failed
  payment_method TEXT DEFAULT 'paystack',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 9. QR Code Usage table (track free vs paid)
CREATE TABLE IF NOT EXISTS qr_code_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  free_allocation INT DEFAULT 10,
  free_used INT DEFAULT 0,
  paid_allocation INT DEFAULT 0,
  paid_used INT DEFAULT 0,
  total_remaining INT GENERATED ALWAYS AS ((free_allocation - free_used) + (paid_allocation - paid_used)) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES (for performance)
-- ============================================

CREATE INDEX idx_frames_vendor_id ON frames(vendor_id);
CREATE INDEX idx_frames_frame_slug ON frames(frame_slug);
CREATE INDEX idx_media_frame_id ON media(frame_id);
CREATE INDEX idx_comments_frame_id ON comments(frame_id);
CREATE INDEX idx_analytics_frame_id ON analytics(frame_id);
CREATE INDEX idx_scan_logs_frame_id ON scan_logs(frame_id);
CREATE INDEX idx_payment_records_vendor_id ON payment_records(vendor_id);

-- ============================================
-- TRIGGERS (auto-update timestamps)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_frames_updated_at
BEFORE UPDATE ON frames
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_updated_at
BEFORE UPDATE ON analytics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_code_usage_updated_at
BEFORE UPDATE ON qr_code_usage
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (optional - delete after testing)
-- ============================================

-- Insert sample users (will be replaced with real auth users)
-- INSERT INTO users (id, email, full_name, is_vendor) VALUES 
-- ('00000000-0000-0000-0000-000000000001', 'vendor@example.com', 'John Vendor', true);
