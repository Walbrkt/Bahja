# Hackathon Partner Setup Guide

This guide shows how to set up the 3 required partner APIs for your Interior Architect app.

## ✅ Required Partners (Use All 3)

### 1. 🎨 fal.ai - Image Editing & Generation

**Purpose**: Edit actual room images to add furniture (core functionality)

**Setup**:
1. Go to [fal.ai](https://fal.ai)
2. Create an account
3. Claim voucher on billing page with code: **techeurope-paris**
4. Get $20 worth of credits
5. Get your API key from [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)
6. Add to `.env`:
   ```
   FAL_API_KEY=your_fal_api_key_here
   ```

**Usage in App**:
- Image-to-image editing (add furniture to real room photos)
- High-quality image generation (FLUX model)
- ~$0.04 per image = 500 images with $20 credit

---

### 2. 🤖 OpenAI - Room Analysis & Product Matching

**Purpose**: 
- Analyze room images with GPT-4 Vision
- Intelligently match furniture to user requirements
- Search and parse IKEA.com results

**Setup**:
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create account / sign in
3. Find your Organization ID:
   - Click on your profile (top right)
   - Go to Settings → Organization → General
   - Copy your Organization ID
4. Submit your Org ID [here](https://forms.techeurope.io/credits/open-ai-paris) to get hackathon credits
5. Get your API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
6. Add to `.env`:
   ```
   OPENAI_API_KEY=sk-proj-...
   OPENAI_ORG_ID=org-...
   ```

**Usage in App**:
- GPT-4o for room analysis
- GPT-4o for product matching
- GPT-4o to search/scrape IKEA.com

---

### 3. 🔧 Dify or Dust - Workflow Orchestration (Choose One)

**Purpose**: Advanced workflow orchestration (optional but recommended for judging)

#### Option A: Dify (Recommended - Open Source)

**Setup**:
1. Get your promo code from [this spreadsheet](https://docs.google.com/spreadsheets/d/1kTd1zC1g2hOrRxdtx1ZEk_NyjM0qMu7aqMIhPtD20Rc/edit?usp=sharing)
2. Go to [cloud.dify.ai](https://cloud.dify.ai)
3. Click Upgrade → Professional plan → Get Started
4. On payment page, click "Add promotion code"
5. Paste your code (payment will be $0)
6. Add payment method (won't be charged this month)
7. Subscribe to complete redemption
8. Get API key from Dify dashboard
9. Add to `.env`:
   ```
   DIFY_API_KEY=your_dify_api_key_here
   ```

#### Option B: Dust

**Setup**:
1. Follow [Dust Guide](https://www.notion.so/2ff28599d9418052ad10f796ee1ea7c6?pvs=21)
2. Get 2 months Premium access
3. Create workflows for room analysis → product search → image editing

---

## 📝 Environment Variables Setup

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```env
   # fal.ai - REQUIRED for image editing
   FAL_API_KEY=fal-xxx...
   
   # OpenAI - REQUIRED for room analysis & product search
   OPENAI_API_KEY=sk-proj-xxx...
   OPENAI_ORG_ID=org-xxx...
   
   # Dify - OPTIONAL for workflow orchestration
   DIFY_API_KEY=dify-xxx...
   ```

3. **Important**: Add `.env` to `.gitignore` (already done)

---

## 🚀 Quick Test

After setting up, test each API:

### Test fal.ai
```bash
curl -X POST "https://fal.run/fal-ai/flux-pro/v1.1-ultra" \
  -H "Authorization: Key YOUR_FAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "modern living room", "image_size": "landscape_16_9"}'
```

### Test OpenAI
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_OPENAI_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "Hello"}]}'
```

---

## 💰 Cost Tracking

With hackathon credits:
- **fal.ai**: $20 = ~500 images
- **OpenAI**: Varies by org credits
- **Dify**: 1 month free

Typical usage per request:
- 1 room analysis (OpenAI): ~$0.01
- 1 product search (OpenAI): ~$0.005
- 1 image edit (fal.ai): ~$0.04
- **Total per request**: ~$0.055

With $20 fal + OpenAI credits, you can process **300-400 room designs**.

---

## 🎯 API Integration Status

Once you add the keys to `.env`:

✅ **With fal.ai key**: Real image editing (adds furniture to actual photos)
✅ **With OpenAI key**: Smart room analysis & IKEA product search
✅ **Without keys**: Falls back to Pollinations.ai (demo mode)

---

## 🔍 Verification

Check if your APIs are working:

1. Start the app:
   ```bash
   npm run dev
   ```

2. Check console output - you should see:
   ```
   ✓ fal.ai configured
   ✓ OpenAI configured
   ✓ Ready for real image editing
   ```

3. Test with a request - the response will include:
   ```json
   {
     "usedRealAPIs": {
       "fal": true,
       "openai": true
     },
     "processingTime": 2500
   }
   ```

---

## 🆘 Troubleshooting

**fal.ai not working?**
- Check API key is correct
- Verify you claimed the voucher
- Check credits at [fal.ai/dashboard/billing](https://fal.ai/dashboard/billing)

**OpenAI not working?**
- Verify Org ID was submitted for hackathon credits
- Check API key hasn't expired
- Ensure you're using gpt-4o (not gpt-4)

**Rate limits?**
- fal.ai: 120 requests/minute
- OpenAI: Varies by org tier

---

## ✨ You're Ready!

Once all 3 partners are set up, your app will:
1. ✅ Analyze room images with GPT-4 Vision
2. ✅ Edit actual photos to add furniture (fal.ai)
3. ✅ Search real IKEA products with GPT-4
4. ✅ Provide smart product recommendations

**Demo vs Production Mode:**
- **Without keys**: Demo with Pollinations.ai (mock data)
- **With keys**: Full production mode with real APIs

Good luck with the hackathon! 🚀
