# OpenAI API Setup Instructions

## Issue
You mentioned that you're not seeing requests in your OpenAI account. This is because the application is falling back to regex parsing instead of using OpenAI.

## Solution
You need to add your OpenAI API key to your environment variables.

### Step 1: Get your OpenAI API Key
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Log in to your OpenAI account
3. Click "Create new secret key"
4. Copy the generated key (starts with `sk-`)

### Step 2: Add the API Key to your Environment
Create or update your `.env.local` file in the project root:

```bash
# Add this line to your .env.local file
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### Step 3: Restart your Development Server
After adding the API key, restart your development server:

```bash
npm run dev
```

## How to Test
1. Go to the "Add Listing" page
2. Use the AI tab with some property text
3. You should now see API calls in your OpenAI dashboard

## Current Fallback System
Don't worry! The app is designed to work even without OpenAI:
- **With OpenAI**: Uses advanced AI parsing for better accuracy
- **Without OpenAI**: Uses regex-based fallback parsing (still functional)

Both methods now support the new area and building name fields you requested!

## Billing
- Make sure you have credits in your OpenAI account
- The app uses `gpt-4o-mini` model which is very cost-effective
- Each parsing request costs only a few cents

## Security
- Never commit your `.env.local` file to Git
- The file is already in `.gitignore` for security