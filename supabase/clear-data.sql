-- Clear All Test Data
-- This script removes all data but keeps the table structure intact.
-- Run with: supabase db execute --file supabase/clear-data.sql
--
-- WARNING: This will delete ALL users and game data!

-- Clear game data (order matters due to foreign key constraints)
TRUNCATE TABLE hot_take_reactions CASCADE;
TRUNCATE TABLE hot_take_votes CASCADE;
TRUNCATE TABLE hot_takes CASCADE;
TRUNCATE TABLE two_truths_reactions CASCADE;
TRUNCATE TABLE two_truths_guesses CASCADE;
TRUNCATE TABLE two_truths_submissions CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- Clear auth users (removes all login accounts)
DELETE FROM auth.users;

-- Confirm completion
SELECT 'All data cleared successfully!' AS status;
