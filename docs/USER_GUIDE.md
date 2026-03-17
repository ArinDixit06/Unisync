# UniSync User Guide

## Welcome to UniSync
UniSync brings all your school inboxes into one calm, focused space. It helps you stay on top of deadlines, spot risky emails, and get the important stuff done faster.

## Getting Started

### Creating Your Account
1. Open UniSync and choose **Sign up**.
2. Enter your university email and a password.
3. Check your inbox to verify your email.

### Linking Your Gmail Account
1. Go to **Settings > Accounts**.
2. Click **Link Gmail**.
3. Sign in with your Google account and approve access.
4. You will be returned to UniSync and your Gmail appears in the inbox.

### Linking Your Outlook Account
1. Go to **Settings > Accounts**.
2. Click **Link Outlook**.
3. Sign in with your Microsoft account and approve access.

### Understanding the Onboarding Flow
UniSync shows a short setup flow the first time you log in. It helps you:
- Link accounts
- Choose notification preferences
- Learn the key shortcuts

You can skip steps and come back later.

## The Inbox

### Reading Emails
Your inbox lists the newest emails first. Click any email to read it on the right.

### Understanding the Email Row
Each row shows:
- Sender name and avatar
- Subject and preview
- Time received
- Provider badge (Gmail or Outlook)
- Risk and priority indicators

### Switching Between Accounts
Use the account switcher in the sidebar to view a single inbox or the unified view.

### Category Tabs
Categories group emails like Primary, Updates, Promotions, Social, and Forums. UniSync assigns these automatically.

### Filtering Your Inbox
Use filters like Unread, Starred, High Priority, or High Risk to focus fast.

### Threading
Emails with the same subject are grouped into a thread. Expand a thread to read the whole conversation.

### Marking as Read / Unread
Click the read icon on any email row. Changes sync back to Gmail or Outlook.

### Starring Emails
Use the star icon to mark an email as important.

## AI Features

### Email Summaries
UniSync shows a short, 3-bullet summary above longer emails.

### Priority Analysis
Each email gets a priority score: High, Medium, or Low. High priority is usually deadlines, grades, or financial items.

### Security & Phishing Detection
UniSync checks emails for suspicious signals.

#### Understanding Risk Scores
- Low: Looks safe
- Medium: Some concerns
- High: Dangerous signals

#### What to Do With a High-Risk Email
- Do not click links
- Verify the sender another way
- Report the email if it looks fake

#### Why Links Are Blocked
High-risk emails may mask dangerous links. UniSync blocks them until you dismiss the warning.

### Smart Categories
UniSync uses AI to decide which category an email belongs to.

## Organizing Your Inbox

### Archiving Emails
Archive removes an email from the inbox but keeps it searchable.

### Deleting Emails
Delete sends the message to trash in the original provider.

### Snoozing Emails
Pick a date and time. The email disappears and returns when you need it.

### Labels & Tags
Create custom labels for classes, clubs, or jobs. Apply them to any email.

### Searching Your Emails
Use the search bar or press Cmd+K (or Ctrl+K) to search instantly. You can filter by sender, subject, or labels.

## Composing Emails

### Writing a New Email
Click **Compose** to open a new message window.

### Replying and Replying All
Use the buttons above the email body.

### Forwarding
Forward sends the email content to someone else.

### Using the Rich Text Editor
Format text with bold, italics, lists, or links. The editor keeps formatting clean and readable.

### Adding Attachments
Drag files into the compose window or click the attachment button.

### CC and BCC
Use CC for visible recipients and BCC for private recipients.

### Undo Send
After clicking Send, you have 5 seconds to undo. The draft reopens if you cancel.

## Calendar Integration

### Connecting Google Calendar
When you link Gmail, UniSync can add events to your calendar.

### Understanding Suggested Events
UniSync detects dates and times in emails and shows a card.

### Adding Events to Your Calendar
Click **Add to Calendar** to confirm the suggestion.

### Editing Before Confirming
You can adjust the title or time before adding.

### Dismissing Suggestions
If it is not relevant, dismiss the card and it will not appear again.

## Keyboard Shortcuts
- Cmd+K / Ctrl+K: Open search
- /: Quick search
- C: Compose
- J/K: Move through emails
- R: Reply
- F: Forward

## Settings

### Profile Settings
Change your display name and avatar.

### Managing Linked Accounts
Link or unlink Gmail and Outlook.

### AI Preferences
Turn AI summaries or priority scoring on or off.

### Appearance
Switch between light and dark themes. Adjust font size.

### Notification Settings
Choose whether UniSync sends email or push notifications.

### Privacy & Data
See what UniSync stores and when it expires.

## Security & Privacy

### How UniSync Protects Your Data
- Tokens are encrypted at rest
- Access is limited by row-level security
- Webhooks are verified

### OAuth Permissions Explained
UniSync only requests email and calendar permissions needed for core features.

### Data Retention Policy
Raw email data expires automatically after 7 days.

### How to Revoke Access
You can revoke access in Google or Microsoft account settings.

## Troubleshooting

### Email Not Appearing
- Make sure the account is linked
- Check the webhook settings
- Trigger a manual sync in Settings

### AI Features Not Working
- Check the Gemini API key
- Review rate limits

### Calendar Sync Failed
- Re-link your Gmail account
- Confirm calendar permissions

### Cannot Link Outlook Account
- Confirm the tenant ID and redirect URI
- Make sure the app has Mail.ReadWrite permission

### How to Report a Bug
Use the **Help** link in Settings and include steps to reproduce.

## FAQ
1. Does UniSync read all my emails? It only processes the emails you link and stores minimal metadata.
2. Can I unlink an account? Yes, in Settings.
3. Does it work on mobile? Yes, the web app is responsive.
4. Do AI summaries cost money? They use your Gemini API key.
5. Can I turn AI off? Yes, in Settings.
6. How fast are new emails? Usually within seconds after delivery.
7. Are my attachments stored? Only if you attach them in UniSync.
8. Can I search old emails? Yes, full-text search is included.
9. What if a summary is wrong? You can read the full email directly.
10. Can I export my data? You can request a data export in Settings.
