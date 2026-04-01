CREATE INDEX IF NOT EXISTS idx_linked_accounts_outlook_subscription
ON linked_accounts(provider, subscription_id);
