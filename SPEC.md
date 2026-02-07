# Interior Design AI Orchestrator - App Specification

**Status**: In Development
**Version**: 0.1.0  
**Framework**: SkyBridge + MCP + React

---

## 1. Overview

An AI-powered interior design assistant that transforms room photos and preferences into interactive, realistic 3D-furnished visualizations using web-sourced real products.

**Core Value Proposition:**
- Analyze any room from a photo
- Discover real furniture products matching style & budget
- Visualize layout in 3D
- Get instant product details, pricing, and purchase links
- Refinement loop for design iterations

---

## 2. User Flow

```
1. User uploads room photo
   ↓
2. Specify dimensions, style, budget, preferences
   ↓
3. AI analyzes room geometry and free spaces
   ↓
4. AI searches for compatible products
   ↓
5. AI validates layout and generates 3D scene
   ↓
6. Widget displays interactive visualization
   ↓
7. User explores products, refines selections
   ↓
8. Final layout + product list + cost summary
```

---

## 3. Input Schema

```json
{
  "room_image": "base64 or URL",
  "room_dimensions": {
    "length": 5.5,
    "width": 4.2,
    "height": 2.8,
    "unit": "m"
  },
  "style": "Scandinavian|Industrial|Minimalist|Eclectic|...",
  "budget": 2000,
  "preferences": {
    "colors": ["white", "light wood"],
    "materials": ["natural", "eco-friendly"],
    "brands": [],
    "constraints": ["pet-friendly", "no dark colors"]
  }
}
```

---

## 4. MCP Tools (Server-Side)

### Tool 1: `analyzeRoomImage`
**Purpose:** Extract room geometry, surfaces, free spaces.

**Input:**
```json
{
  "image": "base64",
  "color_theme": "object",
  "existing_furniture": "array"
}
```

**Output:**
```json
{
  "scene_geometry": {...},
  "surfaces": ["wall_north", "wall_south", ...],
  "free_spaces": [...],
  "camera_model": {...},
  "depth_map": "encoded"
}
```

---

### Tool 2: `designProfiler`
**Purpose:** Interpret style and generate design constraints.

**Input:**
```json
{
  "style": "Scandinavian",
  "mood": "minimal",
  "preferences": {...}
}
```

**Output:**
```json
{
  "color_palette": ["#f5f5f5", ...],
  "material_profile": ["light wood", "metal", ...],
  "design_principles": ["minimalism", "natural light", ...],
  "brand_affinity": [...],
  "mood_keywords": [...]
}
```

---

### Tool 3: `searchProducts`
**Purpose:** Query web APIs for matching furniture.

**Input:**
```json
{
  "category": "sofa",
  "style": "Scandinavian",
  "budget_per_item": 500,
  "constraints": {"size": "medium", "color": "neutral"}
}
```

**Output:**
```json
{
  "products": [
    {
      "id": "sku-123",
      "name": "Oslo Loveseat",
      "brand": "BoConcept",
      "price": 450,
      "currency": "USD",
      "dimensions": {"length": 1.8, "width": 0.9, "height": 0.75},
      "url": "https://...",
      "image": "...",
      "materials": ["oak", "fabric"],
      "availability": "in_stock",
      "model_3d_url": "..."
    },
    ...
  ],
  "total_results": 42
}
```

---

### Tool 4: `validateLayout`
**Purpose:** Check spatial feasibility and collisions.

**Input:**
```json
{
  "room_geometry": {...},
  "placements": [
    {"product_id": "sku-123", "position": [1, 2], "rotation": 0}
  ]
}
```

**Output:**
```json
{
  "valid": true,
  "conflicts": [],
  "walking_paths_clear": true,
  "door_clearance_ok": true,
  "ergonomic_notes": [...]
}
```

---

### Tool 5: `generate3DScene`
**Purpose:** Compose full 3D environment with textures and lighting.

**Input:**
```json
{
  "room_geometry": {...},
  "validated_layout": [...],
  "lighting_preset": "natural",
  "camera_align": true
}
```

**Output:**
```json
{
  "gltf_scene": "base64",
  "rendered_image": "base64",
  "metadata": {
    "polygon_count": 120000,
    "render_time_ms": 850
  }
}
```

---

### Tool 6: `generateProductList`
**Purpose:** Prepare final product list with metadata.

**Input:**
```json
{
  "selected_products": ["sku-123", "sku-456", ...],
  "layout": {...}
}
```

**Output:**
```json
{
  "products": [
    {
      "id": "sku-123",
      "name": "Oslo Loveseat",
      "price": 450,
      "url": "...",
      "dimensions": {...},
      "position_in_scene": [1.2, 2.1],
      "notes": "..."
    }
  ],
  "total_cost": 2150,
  "cost_breakdown": {...}
}
```

---

## 5. Widget Output Format

```json
{
  "final_image": "base64",
  "interactive_3d_view": "gltf_base64",
  "product_list": [...],
  "layout_plan": {...},
  "cost_summary": {
    "items": 5,
    "total": 2150,
    "by_category": {...}
  },
  "confidence_score": 0.87,
  "refinement_suggestions": [...]
}
```

---

## 6. React Widget Features

1. **Image Upload Section**
   - Drag & drop or file picker
   - Preview + confirmation

2. **Input Form**
   - Room dimensions (with unit selector)
   - Style selector (dropdown)
   - Budget input
   - Multi-select preferences

3. **Processing Indicator**
   - Progress steps (analyzing → searching → validating → rendering)
   - Live feedback

4. **3D Viewer**
   - THREE.js or Babylon.js
   - Hoverable furniture with metadata
   - Rotate, zoom, pan
   - Wireframe toggle

5. **Product Panel**
   - Scrollable list with images, prices, links
   - Click to explore on product site
   - Filter/sort options

6. **Cost Summary**
   - Total budget vs. actual
   - Category breakdown
   - Payment options links

7. **Export/Share**
   - Download 3D model
   - Share design link
   - Export product list (CSV)

---

## 7. Architecture

```
Frontend (React Widget)
  ├── ImageUploader
  ├── InputForm
  ├── ProcessingIndicator
  ├── 3DViewer (THREE.js)
  ├── ProductPanel
  ├── CostSummary
  └── ExportSection

       ↕ (MCP tools calls via ChatGPT)

Backend (MCP Server)
  ├── Tool: analyzeRoomImage
  ├── Tool: designProfiler
  ├── Tool: searchProducts
  ├── Tool: validateLayout
  ├── Tool: generate3DScene
  └── Tool: generateProductList

       ↕ (REST/API calls)

External Services
  ├── Vision API (room analysis)
  ├── Furniture e-commerce APIs
  ├── 3D model database
  └── Pricing aggregator
```

---

## 8. Implementation Phases

### Phase 1: MVP (Current)
- ✅ SPEC.md
- MCP server with tool stubs
- React widget scaffold
- Local development setup

### Phase 2: Integration
- Vision API integration (AWS Rekognition / OpenAI Vision)
- Furniture API integration (e.g., Furniture API, Shopify, custom scrapers)
- Basic 3D geometry from room analysis
- Static 3D rendering

### Phase 3: Polish
- Real product search optimization
- Advanced layout validation
- Interactive 3D viewer with WebGL
- Cost breakdown and financing options

### Phase 4: Production
- Alpic deployment
- ChatGPT app store listing
- Performance tuning
- Analytics & user feedback

---

## 9. Success Criteria

- [ ] Accept room photo + dimensions
- [ ] Detect room geometry with ≥80% accuracy
- [ ] Find 5+ matching products per category
- [ ] Validate layout without collisions
- [ ] Render interactive 3D scene
- [ ] Show product details (price, link, dimensions)
- [ ] Total latency < 10s (end-to-end)
- [ ] Cost accuracy ≤ 5% error

---

## 10. Design Decisions

1. **Why SkyBridge MCP?**
   - Native ChatGPT integration
   - Rich widget support (3D viewers, forms)
   - Stateful interactions
   - Streaming support for long operations

2. **Why Web-sourced Products?**
   - Real pricing and availability
   - Actual SKUs and images
   - No hallucinated products
   - Trust and verification

3. **Why 3D Overlay?**
   - Photorealistic expectations
   - Better spatial understanding
   - Enables "before/after" comparison
   - Improves decision confidence

4. **Why Modular Tools?**
   - Each tool is independently testable
   - LLM can chain tools intelligently
   - Easy to swap implementations
   - Reusable across products

---

## 11. Error Handling Strategy

| Scenario | Fallback | User Message |
|---|---|---|
| Image too blurry | Use manual room sketch | "Please provide a clearer photo or sketched floor plan" |
| No 3D model available | Generate procedural mesh | "Using estimated 3D model" |
| Product unavailable | Suggest alternative | "This item is out of stock, here are alternatives" |
| Budget exceeded | Suggest cheaper items | "Over budget by $X, consider these options" |
| API rate limit | Queue and retry | "Processing queue... ETA 2 min" |

---

## 12. Security & Privacy

- [ ] Encrypt uploaded images
- [ ] GDPR compliance (no user data stored)
- [ ] No 3rd-party tracking pixels
- [ ] Validated SSL/TLS in production
- [ ] Rate limiting on tools
- [ ] Input validation on all APIs

---

## 13. Open Questions / Future Work

1. Real-time collaborative design (multiple users)
2. AR preview on mobile (phone camera)
3. Augmented reality furniture preview
4. Integration with interior designer marketplace
5. AI style transfer (apply reference style to room)
6. Sustainability scoring
7. DIY furniture / modular system recommendations

---

**Next Steps:**
1. Implement MCP server with tool definitions
2. Build React widget with image upload & form
3. Create mock API responses for end-to-end testing
4. Integrate real APIs (vision, furniture catalogs)
5. Local testing with dev server
6. Prepare for Alpic deployment
