# 🏠 Interior Architect AI

Transform your living space with AI-powered interior design. Share a room image URL, describe your furniture vision, and instantly visualize the result with real IKEA products.

[![Deploy on Alpic](https://img.shields.io/badge/Deploy%20on-Alpic-blue)](https://bahja-4f406929.alpic.live/try)

## ✨ Features

- **🎨 AI Image Generation**: Photorealistic room visualization using fal.ai's nano-banana/edit model
- **🛋️ IKEA Catalogue Integration**: Real-time product search via SerpAPI
- **💬 Natural Language Interface**: "Add a red sofa" - that's all you need to say
- **🎯 Smart Furniture Placement**: AI understands room perspective, lighting, and proper orientation
- **📱 Interactive Widget**: Browse products, compare prices, and generate instantly
- **🔗 URL-Based**: No file uploads required - just share your room image URL

## 🚀 Quick Start

### Try it Now

Visit [bahja-4f406929.alpic.live/try](https://bahja-4f406929.alpic.live/try)

1. Start a conversation
2. Say what furniture you want: `"I want to add a modern chandelier"`
3. Share your room image URL
4. Browse IKEA recommendations
5. Click to generate - results in 10-30 seconds

### Demo Video Script

> "Want to redecorate but can't visualize the result? Try Interior Architect. Tell the AI what you want, share your room image link, browse personalized IKEA recommendations, click generate, and in seconds - see your room transformed."

## 🛠️ Tech Stack

- **Backend**: TypeScript, Skybridge MCP v0.30.0, Express
- **Frontend**: React, Vite
- **AI**: fal.ai (nano-banana/edit model for multi-image generation)
- **Data**: SerpAPI (Google Shopping engine)
- **LLM**: Groq Llama 3.3 70B
- **Deployment**: Alpic Cloud Platform

## 📦 Installation

### Prerequisites

- Node.js 22+
- npm/yarn/pnpm
- API Keys:
  - `FAL_API_KEY` - [Get it here](https://fal.ai/)
  - `SERPAPI_API_KEY` - [Get it here](https://serpapi.com/)

### Local Development

```bash
# Clone the repository
git clone https://github.com/Walbrkt/Bahja.git
cd Bahja

# Install dependencies
npm install

# Set up environment variables
# Add your FAL_API_KEY and SERPAPI_API_KEY to your environment

# Build the project
npm run build

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Environment Variables

```env
FAL_API_KEY=your_fal_api_key_here
SERPAPI_API_KEY=your_serpapi_key_here
PORT=3000
```

## 🏗️ Project Structure

```
Bahja/
├── server/
│   └── src/
│       ├── index.ts              # Express server entry point
│       ├── server.ts             # MCP server with widget tool
│       ├── middleware.ts         # CORS and security middleware
│       └── services/
│           ├── fal-service.ts    # fal.ai image generation
│           └── ikea-service.ts   # SerpAPI IKEA product search
├── web/
│   └── src/
│       ├── widgets/
│       │   └── interior-architect.tsx  # Main React widget
│       └── helpers.ts            # Widget utilities
├── dist/                         # Build output
├── alpic.json                    # Alpic deployment config
└── tsconfig.json                 # TypeScript configuration
```

## 🎯 How It Works

### 1. Conversation Flow

```
User: "I want a red sofa"
User: [shares room image URL]
  ↓
AI calls interior-architect tool with imageUrl + prompt
  ↓
Server searches IKEA via SerpAPI for "red sofa"
  ↓
Widget displays product catalogue
  ↓
User clicks a product
  ↓
fal.ai generates room image with furniture
  ↓
Widget shows result + related products
```

### 2. Tool Phases

**Phase 1: Initial Call**
- No `imageUrl` provided
- Returns: "Share a room image URL to get started"

**Phase 2: Catalogue**
- Has `imageUrl`, no `selectedProductId`
- Searches IKEA products matching user's prompt
- Returns: Product grid in widget `_meta`

**Phase 3: Generation**
- Has both `imageUrl` and `selectedProductId`
- Calls fal.ai with enhanced furniture placement prompt
- Returns: Generated image URL + related products

### 3. AI Image Generation Prompt

```
Image 1 is the room base - preserve all existing elements exactly
Image 2 shows the [furniture] to add
Seamlessly integrate the [furniture] into the room's largest open floor area
Orient the [furniture] to face toward the camera/viewer
If it's a sofa/chair/bed: align parallel to the back wall
If it's a table/desk: align parallel or perpendicular to walls
Match lighting direction, shadow depth, intensity, and color temperature
Ensure zero overlap with existing furniture, walls, or objects
```

## 🔧 API Reference

### Tool: `interior-architect`

**Input Parameters:**
- `imageUrl` (optional): Room image URL from chat
- `prompt` (optional): Furniture description (e.g., "red sofa", "modern chandelier")
- `style` (optional): Style filter (scandinavian, modern, industrial, etc.)
- `budget` (optional): Max price in EUR
- `selectedProductId` (optional): IKEA product ID for generation
- `productImageUrl` (optional): Product image URL for generation

**Output:**
- `content`: Text for AI + optional markdown image
- `_meta`: Widget data (products, mode, images, etc.)

## 🌐 Deployment

### Deploy to Alpic

1. Fork/clone this repository
2. Connect to [Alpic](https://app.alpic.ai/)
3. Create new project from GitHub repo
4. Add environment variables (FAL_API_KEY, SERPAPI_API_KEY)
5. Deploy - Alpic auto-detects build commands

Your app will be live at: `https://your-app-name.alpic.live`

### Connect to ChatGPT

1. Go to ChatGPT Settings → Connectors
2. Click "Create"
3. Enter your MCP server URL: `https://your-app-name.alpic.live`
4. Save and select in new conversations

## 🧪 Testing

### Manual Testing Checklist

- [ ] Widget loads on conversation start
- [ ] Image URL triggers catalogue display
- [ ] Products show correct prices/images
- [ ] Product selection triggers generation
- [ ] Generated image displays correctly
- [ ] Result shows related products
- [ ] "Buy on IKEA" links work

### Test Image URLs

Use public image hosting:
- Imgur: `https://i.imgur.com/YOUR_IMAGE.jpg`
- Unsplash: `https://images.unsplash.com/photo-...`

## 📝 Configuration

### fal.ai Parameters

```typescript
{
  guidance_scale: 3.5,
  num_inference_steps: 30,
  strength: 0.5
}
```

### SerpAPI Search

```typescript
{
  engine: "google_shopping",
  query: "${prompt} IKEA",
  gl: "fr",  // France
  hl: "fr"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Live Demo**: [bahja-4f406929.alpic.live/try](https://bahja-4f406929.alpic.live/try)
- **GitHub**: [github.com/Walbrkt/Bahja](https://github.com/Walbrkt/Bahja)
- **Alpic Platform**: [alpic.ai](https://alpic.ai)
- **fal.ai**: [fal.ai](https://fal.ai)
- **SerpAPI**: [serpapi.com](https://serpapi.com)

## 🙏 Acknowledgments

- Built with [Skybridge MCP Framework](https://github.com/alpic-ai/skybridge)
- Powered by [fal.ai](https://fal.ai) image generation
- IKEA data via [SerpAPI](https://serpapi.com)
- Deployed on [Alpic Cloud](https://alpic.ai)

---

**Made with ❤️ for interior design enthusiasts**
