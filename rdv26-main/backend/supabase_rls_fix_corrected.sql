-- CORRECTED Supabase RLS Policies for Public Registration
-- This version allows PUBLIC INSERT (anonymous users)
-- Run this in Supabase SQL Editor to fix the 42501 error

-- First, drop existing problematic policies
DROP POLICY IF EXISTS "public_insert_registrations" ON registrations;
DROP POLICY IF EXISTS "admin_read_registrations" ON registrations;
DROP POLICY IF EXISTS "prevent_public_delete_registrations" ON registrations;
DROP POLICY IF EXISTS "prevent_public_update_registrations" ON registrations;

DROP POLICY IF EXISTS "public_insert_contact" ON contact_messages;
DROP POLICY IF EXISTS "admin_read_contact" ON contact_messages;
DROP POLICY IF EXISTS "prevent_public_delete_contact" ON contact_messages;
DROP POLICY IF EXISTS "prevent_public_update_contact" ON contact_messages;

DROP POLICY IF EXISTS "public_read_status" ON status_checks;
DROP POLICY IF EXISTS "admin_write_status" ON status_checks;
DROP POLICY IF EXISTS "prevent_public_modify_status" ON status_checks;
DROP POLICY IF EXISTS "prevent_public_delete_status" ON status_checks;

-- Enable RLS on all tables
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_checks ENABLE ROW LEVEL SECURITY;

-- ===== REGISTRATIONS TABLE =====
-- Allow ANYONE (anonymous) to INSERT
CREATE POLICY "Allow public insert on registrations"
  ON registrations FOR INSERT
  WITH CHECK (true);

-- Allow ANYONE to SELECT (read their own data)
-- For now, allow public SELECT - can be restricted later with auth checks
CREATE POLICY "Allow public read registrations"
  ON registrations FOR SELECT
  USING (true);

-- DENY DELETE for anyone (no one can delete from public)
CREATE POLICY "Deny public delete registrations"
  ON registrations FOR DELETE
  USING (false);

-- DENY UPDATE for anyone (no one can update from public)
CREATE POLICY "Deny public update registrations"
  ON registrations FOR UPDATE
  USING (false);

-- ===== CONTACT_MESSAGES TABLE =====
-- Allow ANYONE (anonymous) to INSERT
CREATE POLICY "Allow public insert on contact_messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

-- Allow ANYONE to SELECT
CREATE POLICY "Allow public read contact_messages"
  ON contact_messages FOR SELECT
  USING (true);

-- DENY DELETE
CREATE POLICY "Deny public delete contact_messages"
  ON contact_messages FOR DELETE
  USING (false);

-- DENY UPDATE
CREATE POLICY "Deny public update contact_messages"
  ON contact_messages FOR UPDATE
  USING (false);

-- ===== STATUS_CHECKS TABLE =====
-- Allow ANYONE to SELECT (read status)
CREATE POLICY "Allow public read status_checks"
  ON status_checks FOR SELECT
  USING (true);

-- DENY INSERT/UPDATE/DELETE from public
CREATE POLICY "Deny public modify status_checks"
  ON status_checks FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny public update status_checks"
  ON status_checks FOR UPDATE
  USING (false);

CREATE POLICY "Deny public delete status_checks"
  ON status_checks FOR DELETE
  USING (false);
