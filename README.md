<p align="center">
  <img src="https://img.shields.io/badge/Hackathon-Paris%202026-blueviolet?style=for-the-badge" alt="Hackathon Paris 2026" />
  <img src="https://img.shields.io/badge/Winner-FAL%20Challenge-gold?style=for-the-badge" alt="Winner - FAL Challenge" />
  <img src="https://img.shields.io/badge/Built%20with-Skybridge%20MCP-blue?style=for-the-badge" alt="Skybridge MCP" />
  <img src="https://img.shields.io/badge/AI-fal.ai-orange?style=for-the-badge" alt="fal.ai" />
</p>

# 🏠 Bahja — AI Interior Design Assistant

> **Design and furnish rooms through conversation.** Describe your dream room, browse real furniture products, and generate photorealistic AI visualizations — all in one conversational experience.

🏆 Winner — FAL Challenge

**Bahja** (بهجة — Arabic for "splendor, delight") transforms the painful, fragmented process of interior design into a single conversational flow. Tell the AI what you want, see curated products from real retailers, select your favorites, and watch AI paint them into your room.

---

## 🎯 Problem

Interior design today is a disconnected nightmare:
- Measuring rooms, browsing dozens of furniture sites
- Guessing if items fit, imagining how paint colors look
- No way to visualize the end result before buying
- Hours of manual comparison across retailers

## 💡 Solution

**Bahja** brings it all together:

1. **Describe** → "I want a cozy Moroccan living room, 400×300cm, budget €2000"
2. **Browse** → Instant curated grid of real furniture & paint from multiple retailers (IKEA, Maisons du Monde, La Redoute, Etsy, Amazon…)
3. **Select** → Pick items, see running total, access buy links
4. **Visualize** → AI generates a photorealistic room with your selected furniture composited in

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🛋️ **Multi-Retailer Search** | Real-time Google Shopping search via SerpAPI — products from IKEA, Maisons du Monde, Conforama, La Redoute, Etsy, Amazon, and more |
| 🎨 **AI Room Generation** | Photorealistic room images via fal.ai Flux Pro v1.1 Ultra |
| 🖼️ **Smart Compositing** | Each selected product is composited into the room one-by-one using fal.ai Nano-Banana image editing with unique spatial placement zones |
| 🎯 **Multi-Category Search** | "sofas, chairs, table, chandelier" → searches each category in parallel for targeted results |
| 🔍 **In-Widget Search** | Search for more furniture directly inside the widget without leaving the design flow |
| 🎨 **Paint Selection** | Browse paint colors with hex swatches, finishes, and coverage info |
| 🛒 **Buy Links** | Direct links to retailer product pages for every item |
| 📐 **3D Room Viewer** | Interactive Three.js 3D visualization with category-based furniture shapes |
| 🌍 **10 Design Styles** | Moroccan, Scandinavian, Modern, Industrial, Bohemian, Classic, Minimal, French, Japanese, Tropical |
| 💬 **Conversational** | Natural language input — the LLM understands style intent, spatial constraints, and budget |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ChatGPT / LLM Host                       │
│  User: "Design a moroccan living room, 400×300cm, budget €2k"   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ MCP Protocol
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Skybridge MCP Server                         │
│                    (Express + TypeScript)                       │
│                                                                 │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐  │
│  │   Widgets (UI)      │  │   Tools (Backend Logic)          │  │
│  │                     │  │                                  │  │
│  │  • design-room      │  │  • search-furniture (SerpAPI)    │  │
│  │  • interior-        │  │  • search-paint                  │  │
│  │    architect         │  │  • generate-room-image (fal.ai) │  │
│  │                     │  │  • generate-room-render          │  │
│  └─────────┬───────────┘  │  • get-3d-room-data              │  │
│            │              └──────────────┬───────────────────┘  │
│            │                             │                      │
│            ▼                             ▼                      │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐  │
│  │  React 19 Widgets   │  │  External Services               │  │
│  │  (Vite + TypeScript)│  │                                  │  │
│  │                     │  │  • SerpAPI (Google Shopping)     │  │
│  │  • Furniture grid   │  │  • fal.ai Flux Pro (base rooms)  │  │
│  │  • Paint swatches   │  │  • fal.ai Nano-Banana (editing)  │  │
│  │  • Selection bar    │  │  • fal.ai Storage (uploads)      │  │
│  │  • AI image viewer  │  │                                  │  │
│  │  • 3D room (Three)  │  └──────────────────────────────────┘  │
│  └─────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User describes room** → LLM calls `design-room` widget
2. **Widget handler** parses preferences → searches each furniture category in parallel via SerpAPI Google Shopping
3. **Widget renders** fullscreen furniture grid + paint swatches with real products, prices, and buy links
4. **User selects items** → clicks **✨ Generate Room Image**
5. **Widget calls** `generate-room-image` tool via `useCallTool` (component-initiated tool call)
6. **Tool generates** base room image with fal.ai Flux Pro, then composites each selected product one-by-one using Nano-Banana image editing with unique spatial placement zones
7. **Photorealistic result** displayed in widget with regenerate & back-to-selection options

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 24.13.0
- **npm** (included with Node.js)
- API keys (see Environment Setup below)

### 1. Clone & Install

```bash
git clone https://github.com/Walbrkt/Bahja.git
cd Bahja
npm install
```

### 2. Environment Setup

Create a `.env` file in the project root:

```env
# fal.ai — AI image generation (required)
# Sign up at https://fal.ai and get your API key
FAL_KEY=your_fal_key_here
FAL_API_KEY=your_fal_key_here

# SerpAPI — Real product search via Google Shopping (required)
# Sign up at https://serpapi.com (100 free searches/month)
SERPAPI_KEY=your_serpapi_key_here
```

### 3. Start Development Server

```bash
npm run dev
```

This starts:
- **Skybridge DevTools UI** at `http://localhost:3000/` — test your app locally
- **MCP Server** at `http://localhost:3000/mcp` — connect to ChatGPT or other MCP hosts

### 4. Test the App

1. Open `http://localhost:3000` in your browser
2. In the DevTools, run the `design-room` tool with parameters like:
   ```json
   {
     "roomWidth": 400,
     "roomLength": 300,
     "roomHeight": 250,
     "style": "moroccan",
     "budget": 2000,
     "preferences": "sofas, tables, chairs, lamps",
     "roomType": "living room"
   }
   ```
3. Browse the furniture grid, select items, click **✨ Generate Room Image**
4. View the AI-generated photorealistic room with your selected furniture

### 5. Connect to ChatGPT (optional)

```bash
# Make your local server accessible
ngrok http 3000

# Use the ngrok URL in ChatGPT's MCP connection:
# https://your-id.ngrok-free.app/mcp
```

---

## 📽️ Demo

https://github.com/Walbrkt/Bahja/raw/main/web/public/videos/demo-hero.mp4

---

## 📁 Project Structure

```
Bahja/
├── server/
│   └── src/
│       ├── index.ts                 # Express server, image proxy, static serving
│       ├── middleware.ts            # MCP Streamable HTTP transport middleware
│       ├── server.ts               # MCP server: widgets, tools, catalogs, prompts
│       └── services/
│           ├── fal-service.ts      # fal.ai SDK: Flux Pro generation + Nano-Banana editing
│           ├── furniture-service.ts # SerpAPI Google Shopping: multi-retailer search
│           ├── ikea-service.ts     # IKEA-specific product search
│           ├── groq-service.ts     # Groq LLM service (alternative)
│           └── openai-service.ts   # OpenAI service (alternative)
├── web/
│   └── src/
│       ├── widgets/
│       │   ├── design-room.tsx     # Main widget: furniture grid, selection, AI generation
│       │   ├── room-viewer-3d.tsx  # Three.js interactive 3D room viewer
│       │   └── interior-architect.tsx # Alternative IKEA-focused widget
│       ├── helpers.ts              # Typed Skybridge helpers (useToolInfo, useCallTool)
│       └── index.css               # Full CSS: cards, grid, tabs, buttons, loading states
├── SPEC.md                         # Product specification & API design
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript config (web)
├── tsconfig.server.json            # TypeScript config (server)
└── .env                            # API keys (not committed)
```

---

## 🔧 API Reference

### Widgets

#### `design-room` — Main Interactive Widget

The primary widget. Displays a fullscreen furniture & paint browser with AI room generation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `roomWidth` | `number` | ✅ | Room width in cm |
| `roomLength` | `number` | ✅ | Room length in cm |
| `roomHeight` | `number` | ✅ | Room height in cm (~250 default) |
| `style` | `string` | ✅ | Design style (see supported styles below) |
| `budget` | `number` | ❌ | Total budget in EUR |
| `preferences` | `string` | ❌ | Comma-separated furniture types (e.g. `"sofas, chairs, tables"`) |
| `roomType` | `string` | ❌ | `living room`, `bedroom`, `office`, `dining room` |

**Returns:**
- `structuredContent` — Room dimensions, furniture/paint counts, summary data
- `_meta` (→ `responseMetadata`) — Full product arrays with images, prices, buy URLs, dimensions, retailers

#### `interior-architect` — IKEA-Focused Widget

Alternative widget for room photo upload → IKEA product browsing → AI compositing.

---

### Tools

#### `search-furniture`

Search real furniture products across multiple retailers via Google Shopping (SerpAPI).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `string` | ✅ | Search query (style, type, description) |
| `style` | `string` | ❌ | Design style filter |
| `budget` | `number` | ❌ | Maximum price in EUR |

**Returns:** `structuredContent.items[]` — furniture with id, name, price, imageUrl, buyUrl, retailer, dimensions.

#### `search-paint`

Search for wall paint by color, finish, or room type.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `string` | ✅ | Color, style, or description |
| `color` | `string` | ❌ | Specific color name |
| `finish` | `string` | ❌ | `matte`, `satin`, `gloss` |

#### `generate-room-image`

Generate a photorealistic AI room with composited furniture. This is the core image pipeline.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `roomWidth` | `number` | ✅ | Room width in cm |
| `roomLength` | `number` | ✅ | Room length in cm |
| `roomHeight` | `number` | ✅ | Room height in cm |
| `style` | `string` | ✅ | Design style |
| `furnitureNames` | `string[]` | ✅ | Names of furniture to include |
| `furnitureImageUrls` | `string[]` | ❌ | Product image URLs for compositing |
| `furnitureCategories` | `string[]` | ❌ | Categories for smart spatial placement |
| `paintColor` | `string` | ❌ | Wall paint color name |
| `paintHex` | `string` | ❌ | Wall paint hex code (e.g. `#8B2500`) |
| `roomType` | `string` | ❌ | Room type |

**AI Pipeline:**
1. Generates base empty room via **fal.ai Flux Pro v1.1 Ultra** with style-specific prompt engineering
2. Uploads each product image to **fal.ai Storage**
3. Composites products one-by-one via **fal.ai Nano-Banana/Edit** with unique spatial zones (no overlap)
4. Returns final photorealistic image URL

#### `generate-room-render`

Quick room visualization without product compositing.

#### `get-3d-room-data`

Generates 3D scene data for the interactive Three.js room viewer. Auto-places furniture along walls with collision avoidance.

---

## 🎨 Supported Design Styles

| Style | Visual Description |
|-------|-------------------|
| 🇲🇦 **Moroccan** | Zellige tiles, carved cedar arches, brass lanterns, Berber rugs, tadelakt walls |
| 🇸🇪 **Scandinavian** | Clean white walls, light oak, organic shapes, wool throws, neutral palette |
| 🏙️ **Modern** | Geometric lines, sleek furniture, bold accents, glass and metal |
| 🏭 **Industrial** | Exposed brick, steel beams, concrete floor, Edison bulbs, reclaimed wood |
| 🌸 **Bohemian** | Macramé, rattan, hanging plants, Persian rugs, earthy jewel tones |
| 🏛️ **Classic** | Crown moldings, chandelier, wood paneling, wingback chairs, marble fireplace |
| ⬜ **Minimal** | Pure white, single statement piece, vast space, monochrome |
| 🇫🇷 **French** | Haussmann ceilings, herringbone parquet, Louis XVI furniture, gilded mirrors |
| 🇯🇵 **Japanese** | Tatami, shoji screens, low furniture, wabi-sabi, paper lanterns |
| 🌴 **Tropical** | Rattan, bamboo, lush plants, natural wood, ocean-inspired colors |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | [Skybridge](https://docs.skybridge.tech/) v0.30.0 | MCP server framework with widget UI support |
| **Protocol** | [MCP](https://modelcontextprotocol.io/) (Model Context Protocol) | Standardized LLM ↔ tool communication |
| **Frontend** | React 19 + TypeScript 5.9 | Interactive widget components |
| **3D Engine** | Three.js 0.182 | Interactive 3D room visualization |
| **Bundler** | Vite 7.3 | Widget build & hot module replacement |
| **Server** | Express 5 + Node.js 24 | HTTP server, image proxy, API routes |
| **AI Generation** | [fal.ai](https://fal.ai) | Flux Pro v1.1 Ultra + Nano-Banana/Edit |
| **Product Search** | [SerpAPI](https://serpapi.com) | Google Shopping real-time search |
| **Validation** | Zod 4.3 | Runtime input schema validation |
| **State** | Zustand (via Skybridge `createStore`) | Persisted widget state visible to LLM |

---

## 🔑 External Services & APIs

### fal.ai — AI Image Generation

| Model | Purpose | Usage |
|-------|---------|-------|
| **Flux Pro v1.1 Ultra** | Generate photorealistic base room images | Style-specific prompts with 10 design vocabularies |
| **Nano-Banana/Edit** | Composite product images into rooms | Reference-based editing with spatial placement |
| **fal.ai Storage** | Upload product images for model access | SDK-based upload with automatic format handling |

- **SDK:** `@fal-ai/client` v1.9+
- **Auth:** API key via `FAL_KEY` environment variable
- **Docs:** https://fal.ai/docs

### SerpAPI — Product Search

| Engine | Purpose | Configuration |
|--------|---------|---------------|
| **Google Shopping** | Real-time product search | `gl: "fr"`, `hl: "fr"`, EUR pricing |

- **Auto-detected retailers:** IKEA, Maisons du Monde, La Redoute, Conforama, Cdiscount, Etsy, Amazon, Habitat, and more
- **Rate:** 100 free searches/month
- **Docs:** https://serpapi.com/google-shopping-api

---

## 🧠 Key Implementation Details

### Smart Furniture Placement (Anti-Overlap)

The compositing pipeline uses a **unique zone tracker** to prevent furniture overlap:

```
Available zones (consumed sequentially):
1. center-left of room
2. against left wall
3. against right wall
4. far back wall centered
5. front-left area
6. front-right area
7. far-left corner
8. far-right corner
...
```

Category-aware hints (rugs → floor only, mirrors → walls, sofas → seating position, etc.)

### Multi-Category Parallel Search

When preferences contain multiple categories (e.g. `"sofas, chairs, tables, lamps"`), the system:
1. Splits into individual categories
2. Calculates per-category limit (`Math.floor(20 / numCategories)`)
3. Searches all categories in parallel via `Promise.all`
4. Deduplicates results by product ID

### Style-Specific Prompt Engineering

Each design style has a curated visual prompt vocabulary loaded into the AI generation pipeline for maximum prompt adherence and visual quality.

---

## 📦 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run deploy` | Deploy to Alpic cloud |

---

## 🚢 Deployment

### Deploy with Alpic (recommended)

1. Create an account at [app.alpic.ai](https://app.alpic.ai/)
2. Connect your GitHub repository
3. Auto-deploys on every push to `main`
4. Use your remote URL as MCP endpoint

### Connect to ChatGPT

1. Deploy or tunnel your server (`ngrok http 3000`)
2. In ChatGPT → Settings → Connected Apps → Add MCP Server
3. Enter: `https://your-domain.com/mcp`

---

## Example Prompts

```
"Design a moroccan living room, 400×300cm, budget €2000,
 I want sofas, a coffee table, lanterns, and a rug"

"Create a scandinavian bedroom, 350×400cm,
 with a bed, nightstands, and a reading lamp"

"Modern office, 300×250cm, industrial style,
 preferences: standing desk, ergonomic chair, bookshelf, floor lamp"

"French dining room, 500×400cm, budget €5000,
 with a dining table, 6 chairs, a buffet, and a chandelier"
```

---

## 👥 Team

**Bahja** — Built at the Paris Hackathon 2026

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- [Skybridge](https://docs.skybridge.tech/) by Alpic — MCP framework for building ChatGPT apps
- [fal.ai](https://fal.ai) — State-of-the-art AI image generation
- [SerpAPI](https://serpapi.com) — Real-time product search API
- [OpenAI](https://openai.com) — ChatGPT & Model Context Protocol
- [Three.js](https://threejs.org) — 3D visualization engine
