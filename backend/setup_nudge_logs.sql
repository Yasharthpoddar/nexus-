-- SQL Script to set up Nudge System Architecture
-- Please run this directly in the Supabase SQL Editor

-- 1. Create the Nudge Logs table to prevent spamming
CREATE TABLE IF NOT EXISTS public.nudge_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,
    document_count INTEGER NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We used a lightweight implementation in cronJobs.js that works purely 
-- with the documents table's 'date' (upload date) to calculate staleness, 
-- dodging the need to add last_nudge_sent_at directly to the applications/notifications 
-- tables, minimizing disruption to your existing schema.

-- Add an index for quick lookups on nudge logs
CREATE INDEX IF NOT EXISTS idx_nudge_logs_lookup ON public.nudge_logs(to_user_id, sent_at);
