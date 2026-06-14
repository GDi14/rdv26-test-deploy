# 🔧 FIX: RLS Policy Error 42501

## Problem
Got error: `NEW ROW VIOLATES ROW-LEVEL SECURITY POLICY`

This happened because the previous RLS policy was using `auth.role() = 'authenticated'` which blocks anonymous (public) users.

## Solution
Run the **corrected** SQL file: `backend/supabase_rls_fix_corrected.sql`

### Steps:
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Open and copy entire contents of: **`backend/supabase_rls_fix_corrected.sql`**
4. Paste into SQL editor
5. Click **Execute**
6. Wait for completion message

### What This Does:
✅ Drops old problematic policies  
✅ Enables RLS properly  
✅ Creates NEW policies that allow:
  - **Public INSERT** (registration form)
  - **Public SELECT** (view submissions)
  - **Blocks DELETE/UPDATE** (prevents data tampering)

## Test After Fix
In your frontend, try registering again. Should work now!

## Why This Works
The key difference:
```sql
-- ❌ OLD (WRONG): Blocks anonymous users
FOR INSERT WITH CHECK (auth.role() = 'authenticated')

-- ✅ NEW (CORRECT): Allows anyone
FOR INSERT WITH CHECK (true)
```

Anonymous users (using public key) don't have an 'authenticated' role, so they need simpler policies.
