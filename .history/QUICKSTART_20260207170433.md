# Quick Start Guide - AI Interior Architect

## What is this?

An AI-powered interior design app that:
- Takes a room image URL
- Accepts a furniture prompt (e.g., "add a grey sofa and coffee table")
- Generates an AI-furnished room image
- Provides matching IKEA products with article numbers and buy links

## Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open browser
# Navigate to http://localhost:3000
```

## Testing the App

### Option 1: DevTools UI (Easiest)
1. Open `http://localhost:3000` in your browser
2. You'll see the Skybridge DevTools interface
3. Start a conversation with the assistant
4. Try these example prompts:

   **Example 1:**
   ```
   I want to furnish my living room with a grey sofa and coffee table
   in scandinavian style with a budget of 800 euros.
   ```

   **Example 2:**
   ```
   Design a modern bedroom with a platform bed and minimalist desk.
   Use this room image: https://images.unsplash.com/photo-1616486338812-3dadae4b4ace
   ```

   **Example 3:**
   ```
   Show me industrial style furniture for my loft - 
   leather armchair, metal shelving, and a dining table.
   ```

### Option 2: Direct Widget Access
The widget name is `interior-architect`. Use it with:
- `imageUrl`: URL of room photo
- `prompt`: What furniture to add
- `style`: (optional) scandinavian, modern, industrial, minimalist, classic
- `budget`: (optional) max budget in EUR

### Option 3: MCP Tools
You can call these tools directly:

**Search IKEA Products:**
```
search-ikea-products({
  query: "sofa",
  style: "scandinavian",
  maxPrice: 700
})
```

**Generate Furnished Room:**
```
generate-furnished-room({
  imageUrl: "https://example.com/room.jpg",
  prompt: "add modern grey sofa and glass coffee table",
  style: "modern"
})
```

## What You'll Get

1. **AI-Generated Image**: Shows your room with furniture added
2. **IKEA Product Grid**: Up to 8 matching products with:
   - Product name
   - IKEA article number
   - Price in EUR
   - Dimensions
   - Direct IKEA buy link
   - Product image

## Current IKEA Catalog

The app includes 15 IKEA products:
- Sofas: KIVIK, EKTORP
- Tables: LACK, STOCKHOLM, EKEDALEN
- Chairs: POÄNG, STRANDMON
- Storage: BILLY, BESTÅ
- Beds: MALM
- Desks: MICKE
- Rugs: STOCKHOLM
- Lamps: RANARP
- Mirrors: STOCKHOLM
- Plants: FEJKA

## Styles Available

- `scandinavian` - Clean, minimalist Nordic design
- `modern` - Contemporary, sleek furniture
- `industrial` - Raw materials, metal, exposed elements
- `minimalist` - Simple, uncluttered, functional
- `classic` - Traditional, timeless pieces

## Categories

sofa, table, chair, shelf, lamp, rug, bed, desk, armchair, mirror, storage, dining, decoration

## Architecture

```
┌─────────────────────────────────────┐
│  User uploads image + prompt       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  LLM calls interior-architect       │
│  widget with imageUrl & prompt      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Server:                            │
│  1. Searches IKEA catalog           │
│  2. Generates AI image via          │
│     Pollinations.ai                 │
│  3. Returns widget with data        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Widget displays:                   │
│  - Furnished room image             │
│  - Product grid                     │
│  - Buy links to IKEA                │
└─────────────────────────────────────┘
```

## File Structure

```
server/src/server.ts          → Backend logic, IKEA catalog, tools
web/src/widgets/interior-architect.tsx  → Frontend React component
web/src/index.css             → Styles
```

## Customization

### Add More IKEA Products
Edit `server/src/server.ts` → `IKEA_CATALOG` array:
```typescript
{
  id: "product-id",
  name: "Product Name",
  description: "Description...",
  price: 99.99,
  currency: "EUR",
  articleNumber: "123.456.78",
  width: 100,
  depth: 50,
  height: 80,
  imageUrl: "https://...",
  buyUrl: "https://www.ikea.com/...",
  category: "sofa",
  style: "modern"
}
```

### Change AI Image Provider
Edit `server/src/server.ts` → `furnishedImageUrl` generation
Currently uses: `https://image.pollinations.ai/...`

### Modify Widget UI
Edit `web/src/widgets/interior-architect.tsx`

### Adjust Styles
Edit `web/src/index.css`

## Deployment

```bash
# Build for production
npm run build

# Deploy to Alpic (if configured)
npm run deploy
```

## Troubleshooting

**Build fails?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Widget not showing?**
- Ensure widget name matches: `interior-architect`
- Check server is running on port 3000
- Check browser console for errors

**No products returned?**
- Check search query matches product catalog
- Try broader search terms
- Check style/category filters

## Next Steps

1. ✅ Test the app locally
2. 🔄 Replace mock IKEA data with real API
3. 📸 Add file upload support
4. 🎨 Improve AI image generation
5. 🌍 Add more retailers
6. 💾 Add save/share features

---

**Need Help?**
- Check `README.md` for detailed docs
- Check `SPEC.md` for product specification
- Check `CHANGELOG.md` for what changed
