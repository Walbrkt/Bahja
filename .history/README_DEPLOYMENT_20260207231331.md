# Deployment Guide for Alpic Platform

## Environment Variables Setup

This app requires the following API keys to function:

### 1. **FAL_API_KEY** (Required for image generation)
- Sign up at https://fal.ai
- Use code: `techeurope-paris` for credits
- Go to Settings → API Keys
- Copy your key

### 2. **SERPAPI_KEY** (Required for IKEA product search)
- Sign up at https://serpapi.com
- Free tier: 100 searches/month
- Go to Dashboard → API Key
- Copy your key

### 3. **GROQ_API_KEY** (Optional - for AI analysis)
- Sign up at https://console.groq.com
- Free tier available
- Go to API Keys section
- Create and copy key

## Alpic Platform Setup

### Option 1: Using Alpic Dashboard (Recommended)
1. Go to your Alpic project settings
2. Navigate to "Environment Variables" section
3. Add each key:
   - `FAL_API_KEY` = your_fal_key
   - `SERPAPI_KEY` = your_serpapi_key
   - `GROQ_API_KEY` = your_groq_key
4. Save and redeploy

### Option 2: Using alpic.json
If your platform supports it, add to `alpic.json`:
```json
{
  "env": {
    "FAL_API_KEY": "${FAL_API_KEY}",
    "SERPAPI_KEY": "${SERPAPI_KEY}",
    "GROQ_API_KEY": "${GROQ_API_KEY}"
  }
}
```

Then set secrets in Alpic dashboard.

### Option 3: Using CLI
If Alpic has a CLI:
```bash
alpic env set FAL_API_KEY=your_key_here
alpic env set SERPAPI_KEY=your_key_here
alpic env set GROQ_API_KEY=your_key_here
```

## Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your API keys in `.env`

3. Never commit `.env` (already in .gitignore)

## Verification

After setting environment variables, check if they're loaded:
- Server logs should show: "✅ FAL_API_KEY configured"
- Product search should work without "API key required" errors
- Image generation should complete without fallback to Pollinations

## Troubleshooting

**Issue**: "FAL_API_KEY not configured"
- Solution: Ensure env var is set in platform and app is redeployed

**Issue**: "SERPAPI_KEY required"
- Solution: Add SERPAPI_KEY to environment variables

**Issue**: Products load but images don't generate
- Solution: Check FAL_API_KEY is valid and has credits
