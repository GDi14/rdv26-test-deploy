-- CRITICAL SECURITY FIX: Enable Row Level Security
-- Run this immediately in Supabase SQL Editor
-- Dashboard -> SQL Editor -> Paste this -> Execute

-- Enable RLS on all tables
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_checks ENABLE ROW LEVEL SECURITY;

-- Allow public to INSERT registrations but NOT read, update, or delete
CREATE POLICY "public_insert_registrations" ON registrations
  FOR INSERT WITH CHECK (true);

-- Only authenticated admin can READ registrations
CREATE POLICY "admin_read_registrations" ON registrations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Prevent public DELETE/UPDATE
CREATE POLICY "prevent_public_delete_registrations" ON registrations
  FOR DELETE USING (false);

CREATE POLICY "prevent_public_update_registrations" ON registrations
  FOR UPDATE USING (false);

-- Allow public to INSERT contact messages
CREATE POLICY "public_insert_contact" ON contact_messages
  FOR INSERT WITH CHECK (true);

-- Only authenticated admin can READ contact messages
CREATE POLICY "admin_read_contact" ON contact_messages
  FOR SELECT USING (auth.role() = 'authenticated');

-- Prevent public DELETE/UPDATE contact
CREATE POLICY "prevent_public_delete_contact" ON contact_messages
  FOR DELETE USING (false);

CREATE POLICY "prevent_public_update_contact" ON contact_messages
  FOR UPDATE USING (false);

-- Allow public READ on status_checks (non-sensitive)
CREATE POLICY "public_read_status" ON status_checks
  FOR SELECT USING (true);

-- Only authenticated admin can INSERT/UPDATE/DELETE status_checks
CREATE POLICY "admin_write_status" ON status_checks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "prevent_public_modify_status" ON status_checks
  FOR UPDATE USING (false);

CREATE POLICY "prevent_public_delete_status" ON status_checks
  FOR DELETE USING (false);
