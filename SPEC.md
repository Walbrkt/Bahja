# RoomCraft — AI Interior Design Assistant

## Value Proposition

Design and furnish rooms through conversation. Target: anyone moving, redecorating, or renovating who wants to visualize their space before buying.

**Pain today:** Measuring rooms, browsing dozens of furniture sites, guessing if items fit, imagining how paint colors look — all disconnected manual steps.

**Core actions:** Describe room → get furniture & paint recommendations that fit → visualize the result → select items to buy.

## Why LLM?

**Conversational win:** "I want a cozy Scandinavian living room, warm tones, budget €2000" → instant curated results vs. hours of browsing.

**LLM adds:** Understands style intent, reasons about spatial constraints (will this 2m sofa fit a 3m wall?), generates coherent design suggestions, adapts to feedback ("make it more minimal").

**What LLM lacks:** Real product catalog data, image generation capability, room rendering — provided by our tools.

## UI Overview

**First view (inline):** Room setup form — enter dimensions (L×W×H), optionally upload room photos, describe design preferences (style, colors, budget, vibe).

**Design results (fullscreen):** Generated room visualization at top, scrollable grid of recommended furniture and paint items below. Each card shows image, name, price, dimensions, short description.

**Item detail (modal):** Expanded view of one item — larger image, full description, dimensions, price, and "Buy" link to the retailer.

**Selections sidebar:** Running list of items the user has selected, with total price and "Open store" links.

**Visualize Tab:** Interactive 3D room viewer and AI-generated photorealistic room image. Users can toggle between the two views.

## UX Flows

### Design a Room
1. Enter room dimensions and preferences (conversational + widget form)
2. LLM calls `search-furniture` and `search-paint` tools to find matching items
3. LLM calls `generate-room-render` to create a visualization
4. Widget displays the render + item grid
5. User browses, selects items, views details
6. User clicks "Buy" links to visit retailer sites

### Visualize a Room
1. Select furniture and paint items from the grid.
2. Navigate to the "Visualize" tab.
3. **3D Viewer**: View an interactive 3D representation of the room with selected items placed.
4. **AI Image Generation**: Generate a photorealistic image of the room using AI.

## API Design

### Widget: `design-room`
- **Input:** `{ roomWidth, roomLength, roomHeight, style, budget, preferences, imageUrl? }`
- **Output:** `{ renderUrl, furniture[], paint[] }`
- **Views:** Setup form → Results gallery → Visualize tab → Item detail (modal)
- **State:** `selectedItems[]` (persisted, visible to LLM)

### Tool: `search-furniture`
- **Input:** `{ query, style?, maxWidth?, maxDepth?, maxHeight?, budget?, category? }`
- **Output:** `{ items[]: { id, name, description, price, currency, width, depth, height, imageUrl, buyUrl, retailer } }`
- **Annotations:** readOnlyHint: true

### Tool: `search-paint`
- **Input:** `{ query, color?, finish?, brand?, roomType? }`
- **Output:** `{ items[]: { id, name, description, price, currency, color, colorHex, finish, coverage, imageUrl, buyUrl, retailer } }`
- **Annotations:** readOnlyHint: true

### Tool: `generate-room-render`
- **Input:** `{ roomWidth, roomLength, roomHeight, style, furniture[], paintColor?, description? }`
- **Output:** `{ renderUrl, description }` 
- **Annotations:** readOnlyHint: true

### Tool: `generate-room-image`
- **Input:** `{ roomWidth, roomLength, roomHeight, style, furnitureNames[], paintColor?, paintHex?, roomType?, userPrompt? }`
- **Output:** `{ imageUrl, prompt, style, roomType, furnitureIncluded[], wallColor }`
- **Annotations:** readOnlyHint: true

### Tool: `get-3d-room-data`
- **Input:** `{ roomWidth, roomLength, roomHeight, furnitureIds[], paintHex?, floorColor? }`
- **Output:** `{ room: { width, length, height, wallColor, floorColor }, furniture: [{ id, name, category, position: { x, y, z } }], itemCount }`
- **Annotations:** readOnlyHint: true

## Product Context
- **APIs:** Furniture/paint search via curated catalog data; AI image generation via **fal.ai Recraft V3** (SOTA prompt adherence, photorealistic)
- **Partner Technologies:** Alpic/Skybridge (MCP framework), fal.ai (AI image generation), OpenAI/ChatGPT (LLM orchestration)
- **Auth:** None required (FAL_KEY managed server-side)
- **Image Proxy:** Server-side proxy at `/api/image-proxy` to bypass CSP restrictions in widget iframes
- **Constraints:** Hackathon scope — curated catalog, server-side image proxy; real API integration planned post-hackathon
