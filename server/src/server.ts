import { McpServer } from "skybridge/server";
import { z } from "zod";

// ─── Mock Furniture Catalog ──────────────────────────────────────────────────

const FURNITURE_CATALOG = [
  {
    id: "sofa-scandi-01",
    name: "Nordic Comfort 3-Seater Sofa",
    description: "Minimalist Scandinavian sofa with oak legs and linen upholstery. Perfect for living rooms.",
    price: 899,
    currency: "EUR",
    width: 210,
    depth: 85,
    height: 80,
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/cat/canapes-fu003/",
    retailer: "IKEA",
    category: "sofa",
    style: "scandinavian",
  },
  {
    id: "sofa-modern-01",
    name: "Milano Velvet Sofa",
    description: "Luxurious deep-green velvet sofa with gold-tipped legs. Statement piece for modern interiors.",
    price: 1299,
    currency: "EUR",
    width: 220,
    depth: 90,
    height: 75,
    imageUrl: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/canapes/",
    retailer: "Maisons du Monde",
    category: "sofa",
    style: "modern",
  },
  {
    id: "table-scandi-01",
    name: "Oslo Round Coffee Table",
    description: "Light oak round coffee table with tapered legs. Timeless Scandinavian design.",
    price: 249,
    currency: "EUR",
    width: 80,
    depth: 80,
    height: 45,
    imageUrl: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/cat/tables-basses-10382/",
    retailer: "IKEA",
    category: "table",
    style: "scandinavian",
  },
  {
    id: "table-indus-01",
    name: "Factory Loft Dining Table",
    description: "Industrial-style dining table with reclaimed wood top and black metal legs. Seats 6.",
    price: 699,
    currency: "EUR",
    width: 180,
    depth: 90,
    height: 76,
    imageUrl: "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/tables/",
    retailer: "Maisons du Monde",
    category: "table",
    style: "industrial",
  },
  {
    id: "chair-scandi-01",
    name: "Copenhagen Dining Chair (set of 2)",
    description: "Curved plywood shell chair with wool cushion. Mid-century Scandinavian classic.",
    price: 349,
    currency: "EUR",
    width: 50,
    depth: 52,
    height: 80,
    imageUrl: "https://images.unsplash.com/photo-1503602642458-232111445657?w=400&h=300&fit=crop",
    buyUrl: "https://www.habitat.fr/chaises/",
    retailer: "Habitat",
    category: "chair",
    style: "scandinavian",
  },
  {
    id: "shelf-modern-01",
    name: "Geometric Wall Shelf Unit",
    description: "Asymmetric floating shelf unit in matte white. Ideal for books and decor display.",
    price: 179,
    currency: "EUR",
    width: 120,
    depth: 25,
    height: 180,
    imageUrl: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/cat/etageres-st002/",
    retailer: "IKEA",
    category: "shelf",
    style: "modern",
  },
  {
    id: "lamp-boho-01",
    name: "Rattan Floor Lamp",
    description: "Handwoven rattan shade floor lamp with warm-tone LED bulb. Bohemian accent lighting.",
    price: 129,
    currency: "EUR",
    width: 40,
    depth: 40,
    height: 160,
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/lampadaires/",
    retailer: "Maisons du Monde",
    category: "lamp",
    style: "bohemian",
  },
  {
    id: "rug-modern-01",
    name: "Abstract Wool Area Rug 200×300",
    description: "Hand-tufted wool rug with abstract geometric pattern in neutral tones.",
    price: 459,
    currency: "EUR",
    width: 200,
    depth: 300,
    height: 2,
    imageUrl: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/cat/tapis-10653/",
    retailer: "IKEA",
    category: "rug",
    style: "modern",
  },
  {
    id: "bed-scandi-01",
    name: "Stockholm Platform Bed Frame",
    description: "Solid birch platform bed with integrated headboard. Clean Scandinavian lines. Queen size.",
    price: 599,
    currency: "EUR",
    width: 160,
    depth: 200,
    height: 35,
    imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/cat/lits-bm003/",
    retailer: "IKEA",
    category: "bed",
    style: "scandinavian",
  },
  {
    id: "desk-modern-01",
    name: "Aura Standing Desk",
    description: "Electric height-adjustable desk with bamboo top. Ideal for home offices.",
    price: 549,
    currency: "EUR",
    width: 140,
    depth: 70,
    height: 120,
    imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=300&fit=crop",
    buyUrl: "https://www.autonomous.ai/standing-desks",
    retailer: "Autonomous",
    category: "desk",
    style: "modern",
  },
  {
    id: "armchair-classic-01",
    name: "Chesterfield Leather Armchair",
    description: "Classic button-tufted Chesterfield armchair in cognac leather. Timeless elegance.",
    price: 849,
    currency: "EUR",
    width: 95,
    depth: 85,
    height: 78,
    imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/fauteuils/",
    retailer: "Maisons du Monde",
    category: "armchair",
    style: "classic",
  },
  {
    id: "mirror-boho-01",
    name: "Sunburst Rattan Mirror",
    description: "Large round mirror with handwoven rattan sunburst frame. 90cm diameter.",
    price: 159,
    currency: "EUR",
    width: 90,
    depth: 5,
    height: 90,
    imageUrl: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/miroirs/",
    retailer: "Maisons du Monde",
    category: "mirror",
    style: "bohemian",
  },
];

// ─── Mock Paint Catalog ──────────────────────────────────────────────────────

const PAINT_CATALOG = [
  {
    id: "paint-white-01",
    name: "Snow White Matte",
    description: "Pure bright white matte wall paint. Clean, fresh, and versatile for any room.",
    price: 45,
    currency: "EUR",
    color: "White",
    colorHex: "#FAFAFA",
    finish: "Matte",
    coverage: "12m²/L",
    imageUrl: "https://images.unsplash.com/photo-1562184552-997c461abbe6?w=400&h=300&fit=crop",
    buyUrl: "https://www.leroymerlin.fr/produits/peinture/",
    retailer: "Leroy Merlin",
  },
  {
    id: "paint-sage-01",
    name: "Sage Garden",
    description: "Soft sage green with gray undertones. Calming and natural — perfect for bedrooms and living rooms.",
    price: 52,
    currency: "EUR",
    color: "Sage Green",
    colorHex: "#B2BDA0",
    finish: "Eggshell",
    coverage: "11m²/L",
    imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop",
    buyUrl: "https://www.leroymerlin.fr/produits/peinture/",
    retailer: "Leroy Merlin",
  },
  {
    id: "paint-navy-01",
    name: "Midnight Navy",
    description: "Deep navy blue with a satin sheen. Bold accent wall color for a dramatic effect.",
    price: 58,
    currency: "EUR",
    color: "Navy Blue",
    colorHex: "#1B2A4A",
    finish: "Satin",
    coverage: "10m²/L",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    buyUrl: "https://www.castorama.fr/peinture/",
    retailer: "Castorama",
  },
  {
    id: "paint-terracotta-01",
    name: "Tuscan Terracotta",
    description: "Warm earthy terracotta. Brings Mediterranean warmth and character to any space.",
    price: 49,
    currency: "EUR",
    color: "Terracotta",
    colorHex: "#C67B5C",
    finish: "Matte",
    coverage: "11m²/L",
    imageUrl: "https://images.unsplash.com/photo-1525909002-1b05e0c869d8?w=400&h=300&fit=crop",
    buyUrl: "https://www.leroymerlin.fr/produits/peinture/",
    retailer: "Leroy Merlin",
  },
  {
    id: "paint-blush-01",
    name: "Rose Blush",
    description: "Delicate pink blush with warm undertones. Soft, elegant, and contemporary.",
    price: 55,
    currency: "EUR",
    color: "Blush Pink",
    colorHex: "#E8C4C4",
    finish: "Matte",
    coverage: "12m²/L",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    buyUrl: "https://www.castorama.fr/peinture/",
    retailer: "Castorama",
  },
  {
    id: "paint-charcoal-01",
    name: "Smoky Charcoal",
    description: "Deep charcoal gray with blue undertones. Sophisticated and modern for accent walls.",
    price: 54,
    currency: "EUR",
    color: "Charcoal",
    colorHex: "#36454F",
    finish: "Eggshell",
    coverage: "10m²/L",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    buyUrl: "https://www.leroymerlin.fr/produits/peinture/",
    retailer: "Leroy Merlin",
  },
  {
    id: "paint-cream-01",
    name: "Warm Cream",
    description: "Soft warm cream with yellow undertones. Inviting and cozy, works with any style.",
    price: 42,
    currency: "EUR",
    color: "Cream",
    colorHex: "#F5F0E1",
    finish: "Matte",
    coverage: "13m²/L",
    imageUrl: "https://images.unsplash.com/photo-1562184552-997c461abbe6?w=400&h=300&fit=crop",
    buyUrl: "https://www.castorama.fr/peinture/",
    retailer: "Castorama",
  },
  {
    id: "paint-olive-01",
    name: "Olive Grove",
    description: "Rich olive green. Earthy, grounding, and pairs beautifully with natural wood furniture.",
    price: 51,
    currency: "EUR",
    color: "Olive Green",
    colorHex: "#6B7C3E",
    finish: "Satin",
    coverage: "11m²/L",
    imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop",
    buyUrl: "https://www.leroymerlin.fr/produits/peinture/",
    retailer: "Leroy Merlin",
  },
];

// ─── Search Helpers ──────────────────────────────────────────────────────────

function searchFurniture(params: {
  query: string;
  style?: string;
  maxWidth?: number;
  maxDepth?: number;
  maxHeight?: number;
  budget?: number;
  category?: string;
}) {
  let results = [...FURNITURE_CATALOG];

  if (params.category) {
    results = results.filter((f) =>
      f.category.toLowerCase().includes(params.category!.toLowerCase()),
    );
  }

  if (params.style) {
    const style = params.style.toLowerCase();
    results = results.filter(
      (f) =>
        f.style.toLowerCase().includes(style) ||
        f.description.toLowerCase().includes(style),
    );
  }

  if (params.maxWidth) results = results.filter((f) => f.width <= params.maxWidth!);
  if (params.maxDepth) results = results.filter((f) => f.depth <= params.maxDepth!);
  if (params.maxHeight) results = results.filter((f) => f.height <= params.maxHeight!);
  if (params.budget) results = results.filter((f) => f.price <= params.budget!);

  if (params.query) {
    const q = params.query.toLowerCase();
    const keywords = q.split(/\s+/);
    results = results.filter((f) => {
      const searchable = `${f.name} ${f.description} ${f.category} ${f.style}`.toLowerCase();
      return keywords.some((kw) => searchable.includes(kw));
    });
  }

  return results;
}

function searchPaint(params: {
  query: string;
  color?: string;
  finish?: string;
  brand?: string;
  roomType?: string;
}) {
  let results = [...PAINT_CATALOG];

  if (params.color) {
    const c = params.color.toLowerCase();
    results = results.filter(
      (p) =>
        p.color.toLowerCase().includes(c) ||
        p.name.toLowerCase().includes(c),
    );
  }

  if (params.finish) {
    results = results.filter(
      (p) => p.finish.toLowerCase() === params.finish!.toLowerCase(),
    );
  }

  if (params.brand) {
    results = results.filter(
      (p) => p.retailer.toLowerCase().includes(params.brand!.toLowerCase()),
    );
  }

  if (params.query) {
    const q = params.query.toLowerCase();
    const keywords = q.split(/\s+/);
    results = results.filter((p) => {
      const searchable = `${p.name} ${p.description} ${p.color} ${p.finish}`.toLowerCase();
      return keywords.some((kw) => searchable.includes(kw));
    });
  }

  return results;
}

// ─── MCP Server ──────────────────────────────────────────────────────────────

const server = new McpServer(
  { name: "roomcraft", version: "0.1.0" },
  { capabilities: {} },
)
  // ── Main Widget: design-room ─────────────────────────────────────────────
  .registerWidget(
    "design-room",
    {
      description:
        "Interactive room designer. Shows furniture and paint recommendations that fit the user's room dimensions, style, and budget. Users can browse items, select them, and access buy links.",
      _meta: {
        ui: {
          csp: {
            resourceDomains: ["https://images.unsplash.com"],
            redirectDomains: [
              "https://www.ikea.com",
              "https://www.maisonsdumonde.com",
              "https://www.habitat.fr",
              "https://www.leroymerlin.fr",
              "https://www.castorama.fr",
              "https://www.autonomous.ai",
            ],
          },
        },
      },
    },
    {
      description:
        "Design a room: provide dimensions, style preferences, and budget. Returns matching furniture and paint options with images, prices, and buy links.",
      inputSchema: {
        roomWidth: z.number().describe("Room width in cm"),
        roomLength: z.number().describe("Room length in cm"),
        roomHeight: z.number().describe("Room height in cm, default ~250"),
        style: z.string().describe("Design style: scandinavian, modern, industrial, bohemian, classic, minimal"),
        budget: z.number().optional().describe("Total budget in EUR"),
        preferences: z.string().optional().describe("Additional preferences: colors, vibe, specific items wanted"),
        roomType: z.string().optional().describe("Room type: living room, bedroom, office, dining room"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ roomWidth, roomLength, roomHeight, style, budget, preferences, roomType }) => {
      try {
        const furnitureQuery = `${style} ${roomType || ""} ${preferences || ""}`.trim();
        let furniture = searchFurniture({
          query: furnitureQuery,
          style,
          maxWidth: roomWidth,
          maxDepth: roomLength,
          budget: budget ? Math.round(budget * 0.7) : undefined,
        });

        // Broaden search if too few results
        if (furniture.length < 3) {
          furniture = searchFurniture({
            query: furnitureQuery,
            maxWidth: roomWidth,
            maxDepth: roomLength,
            budget,
          });
        }
        // If still too few, return all that fit
        if (furniture.length < 2) {
          furniture = FURNITURE_CATALOG.filter(
            (f) => f.width <= roomWidth && f.depth <= roomLength,
          );
        }

        const paintQuery = `${preferences || ""} ${style}`.trim();
        let paint = searchPaint({ query: paintQuery });
        if (paint.length < 2) {
          paint = [...PAINT_CATALOG];
        }

        const structuredContent = {
          roomDimensions: { width: roomWidth, length: roomLength, height: roomHeight },
          style,
          budget: budget || null,
          roomType: roomType || null,
          furnitureCount: furniture.length,
          paintCount: paint.length,
          furniture: furniture.map((f) => ({
            id: f.id,
            name: f.name,
            price: f.price,
            currency: f.currency,
            dimensions: `${f.width}×${f.depth}×${f.height}cm`,
            category: f.category,
          })),
          paint: paint.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            currency: p.currency,
            color: p.color,
            finish: p.finish,
          })),
        };

        const _meta = {
          furniture: furniture.map((f) => ({
            id: f.id,
            name: f.name,
            description: f.description,
            price: f.price,
            currency: f.currency,
            width: f.width,
            depth: f.depth,
            height: f.height,
            imageUrl: f.imageUrl,
            buyUrl: f.buyUrl,
            retailer: f.retailer,
            category: f.category,
            style: f.style,
          })),
          paint: paint.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            currency: p.currency,
            color: p.color,
            colorHex: p.colorHex,
            finish: p.finish,
            coverage: p.coverage,
            imageUrl: p.imageUrl,
            buyUrl: p.buyUrl,
            retailer: p.retailer,
          })),
        };

        return {
          structuredContent,
          content: [
            {
              type: "text" as const,
              text: `Found ${furniture.length} furniture items and ${paint.length} paint options for a ${roomWidth}×${roomLength}cm ${style} ${roomType || "room"}${budget ? ` within €${budget} budget` : ""}.`,
            },
          ],
          _meta,
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: `Error: ${error}` }],
          isError: true,
        };
      }
    },
  )

  // ── Tool: search-furniture ───────────────────────────────────────────────
  .registerTool(
    "search-furniture",
    {
      description:
        "Search for furniture items by query, style, dimensions, budget, or category. Returns items with images, prices, dimensions, and buy links.",
      inputSchema: {
        query: z.string().describe("Search query: style, type, or description"),
        style: z.string().optional().describe("Design style filter"),
        maxWidth: z.number().optional().describe("Max width in cm"),
        maxDepth: z.number().optional().describe("Max depth in cm"),
        maxHeight: z.number().optional().describe("Max height in cm"),
        budget: z.number().optional().describe("Max price in EUR"),
        category: z.string().optional().describe("Category: sofa, table, chair, shelf, lamp, rug, bed, desk, armchair, mirror"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (params) => {
      const items = searchFurniture(params);
      return {
        structuredContent: {
          items: items.map((f) => ({
            id: f.id,
            name: f.name,
            description: f.description,
            price: f.price,
            currency: f.currency,
            dimensions: `${f.width}×${f.depth}×${f.height}cm`,
            width: f.width,
            depth: f.depth,
            height: f.height,
            imageUrl: f.imageUrl,
            buyUrl: f.buyUrl,
            retailer: f.retailer,
            category: f.category,
          })),
        },
        content: [
          {
            type: "text" as const,
            text: `Found ${items.length} furniture item(s) matching "${params.query}".`,
          },
        ],
      };
    },
  )

  // ── Tool: search-paint ───────────────────────────────────────────────────
  .registerTool(
    "search-paint",
    {
      description:
        "Search for wall paint by color, finish, brand, or room type. Returns paints with color swatches, prices, coverage, and buy links.",
      inputSchema: {
        query: z.string().describe("Search query: color, style, or description"),
        color: z.string().optional().describe("Color name or shade"),
        finish: z.string().optional().describe("Paint finish: Matte, Eggshell, Satin, Gloss"),
        brand: z.string().optional().describe("Brand/retailer filter"),
        roomType: z.string().optional().describe("Room type for recommendations"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (params) => {
      const items = searchPaint(params);
      return {
        structuredContent: {
          items: items.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            currency: p.currency,
            color: p.color,
            colorHex: p.colorHex,
            finish: p.finish,
            coverage: p.coverage,
            imageUrl: p.imageUrl,
            buyUrl: p.buyUrl,
            retailer: p.retailer,
          })),
        },
        content: [
          {
            type: "text" as const,
            text: `Found ${items.length} paint option(s) matching "${params.query}".`,
          },
        ],
      };
    },
  )

  // ── Tool: generate-room-render ───────────────────────────────────────────
  .registerTool(
    "generate-room-render",
    {
      description:
        "Generate a visualization/render of a room with specified furniture and paint. Returns a render image URL and description.",
      inputSchema: {
        roomWidth: z.number().describe("Room width in cm"),
        roomLength: z.number().describe("Room length in cm"),
        roomHeight: z.number().describe("Room height in cm"),
        style: z.string().describe("Design style"),
        furnitureNames: z.array(z.string()).optional().describe("Names of furniture to include"),
        paintColor: z.string().optional().describe("Wall paint color"),
        description: z.string().optional().describe("Additional render description"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ roomWidth, roomLength, roomHeight, style, furnitureNames, paintColor, description }) => {
      const renderUrl = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop";

      const renderDescription = [
        `${style.charAt(0).toUpperCase() + style.slice(1)} room (${roomWidth}×${roomLength}×${roomHeight}cm)`,
        furnitureNames?.length ? `with ${furnitureNames.join(", ")}` : "",
        paintColor ? `and ${paintColor} walls` : "",
        description || "",
      ]
        .filter(Boolean)
        .join(" ");

      return {
        structuredContent: { renderUrl, description: renderDescription },
        content: [
          {
            type: "text" as const,
            text: `Generated room render: ${renderDescription}`,
          },
        ],
      };
    },
  );

export default server;
export type AppType = typeof server;
