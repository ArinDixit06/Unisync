-- migrations/001_init.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'done', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE email_category AS ENUM ('primary', 'updates', 'promotions', 'social', 'forums');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS linked_accounts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  email_address TEXT NOT NULL,
  display_name TEXT,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT,
  subscription_id TEXT,
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES linked_accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  message_id TEXT NOT NULL,
  thread_id TEXT,
  subject TEXT,
  sender_name TEXT,
  sender_email TEXT NOT NULL,
  preview_snippet TEXT,
  body_html TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  -- State
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  is_snoozed BOOLEAN DEFAULT FALSE,
  snoozed_until TIMESTAMPTZ,
  has_attachments BOOLEAN DEFAULT FALSE,
  attachment_count INTEGER DEFAULT 0,
  -- AI enrichment
  processing_status processing_status DEFAULT 'pending',
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_error TEXT,
  summary_bullets JSONB,
  risk_level risk_level,
  risk_reasons TEXT[],
  priority_level priority_level,
  priority_reason TEXT,
  category email_category DEFAULT 'primary',
  -- Raw data
  raw_headers JSONB,
  body_expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  -- Search
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, message_id)
);

CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#64748b',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS email_labels (
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  label_id UUID REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (email_id, label_id)
);

CREATE TABLE IF NOT EXISTS suggested_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  location TEXT,
  description TEXT,
  gcal_event_id TEXT,
  confirmed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  display_name TEXT,
  interaction_count INTEGER DEFAULT 1,
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_address)
);

CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  detail JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES linked_accounts(id) ON DELETE CASCADE,
  to_list TEXT[] NOT NULL,
  cc_list TEXT[],
  bcc_list TEXT[],
  subject TEXT,
  body_html TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emails_user_received ON emails(user_id, received_at DESC)
  WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_emails_user_thread ON emails(user_id, thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_user_risk ON emails(user_id, risk_level)
  WHERE risk_level = 'high';
CREATE INDEX IF NOT EXISTS idx_emails_user_priority ON emails(user_id, priority_level);
CREATE INDEX IF NOT EXISTS idx_emails_snoozed ON emails(snoozed_until)
  WHERE is_snoozed = TRUE;
CREATE INDEX IF NOT EXISTS idx_emails_processing ON emails(processing_status)
  WHERE processing_status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_emails_search ON emails USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id, interaction_count DESC);

CREATE OR REPLACE FUNCTION update_email_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.subject, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.sender_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.sender_email, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.preview_snippet, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_search_update ON emails;
CREATE TRIGGER email_search_update
BEFORE INSERT OR UPDATE OF subject, sender_name, sender_email, preview_snippet
ON emails
FOR EACH ROW EXECUTE FUNCTION update_email_search_vector();
