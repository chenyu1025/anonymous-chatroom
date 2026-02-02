-- Add type and file_url columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'audio')),
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Update existing messages to be text type
UPDATE messages SET type = 'text' WHERE type IS NULL;
