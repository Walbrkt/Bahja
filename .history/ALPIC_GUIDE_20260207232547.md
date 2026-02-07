# Alpic Platform Integration Guide

## Using the Chat Interface

On Alpic (https://bahja-6c438cb0.alpic.live/try), you can interact with the AI Interior Architect via chat:

### Method 1: Upload Image in Chat
1. In the chat interface, click the attachment/upload button
2. Select your room image file
3. The AI will process the uploaded image
4. Browse furniture options that appear
5. Click "Generate Room with This" on any product

### Method 2: Paste Image URL
1. Type or paste an image URL in the input field
2. Press Enter or click "Browse Furniture"
3. Select a product and generate

## Features

✅ **Direct image upload** via chat (data URIs supported)
✅ **URL input** for remote images
✅ **Real IKEA products** from Google Shopping
✅ **AI-powered furniture placement** with fal.ai
✅ **Instant generation** - click product → see furnished room

## Debugging Generated Images

If generated images don't appear:

1. **Check browser console** (F12):
   - Look for: `✅ Generated image URL received: ...`
   - Check for CORS or CSP errors

2. **Verify CSP settings**:
   - fal.ai domains are whitelisted: `v3.fal.media`, `fal.media`
   - Data URIs are allowed: `data:`

3. **Check API response**:
   - Open Network tab (F12)
   - Look for fal.ai API call
   - Verify response contains `images[0].url`

4. **Common issues**:
   - **CSP blocking**: Added fal.media domains to whitelist ✅
   - **Mode not switching**: Check `mode === "result"` condition
   - **Image URL undefined**: Check `_meta.furnishedImageUrl` in response

## Environment Variables (Required)

Set these in Alpic dashboard:

```
FAL_API_KEY=your_fal_key
SERPAPI_KEY=your_serpapi_key
GROQ_API_KEY=your_groq_key (optional)
```

## Local Testing

```bash
# Copy env template
cp .env.example .env

# Add your keys to .env
# Then run:
npm install
npm run dev
```

## Deployment Checklist

- [ ] API keys set in Alpic environment variables
- [ ] `.env` not committed (check .gitignore)
- [ ] CSP domains include fal.ai CDNs
- [ ] Test image upload in chat
- [ ] Test image URL input
- [ ] Test product selection
- [ ] Verify generated image displays
