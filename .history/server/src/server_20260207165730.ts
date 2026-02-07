import { McpServer } from "skybridge/server";
import { z } from "zod";

// ─── Mock IKEA Product Catalog ───────────────────────────────────────────────

const IKEA_CATALOG = [
  {
    id: "sofa-kivik",
    name: "KIVIK 3-seat sofa",
    description: "A generous seating series with soft, deep seats and a timeless design. Available in various covers.",
    price: 699,
    currency: "EUR",
    articleNumber: "393.027.97",
    width: 228,
    depth: 95,
    height: 83,
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/p/kivik-canape-3-places-hillared-anthracite-s89342785/",
    category: "sofa",
    style: "modern",
  },
  {
    id: "sofa-ektorp",
    name: "EKTORP 3-seat sofa",
    description: "Timeless design with a plump, soft seat. Removable, washable cover.",
    price: 599,
    currency: "EUR",
    articleNumber: "004.824.54",
    width: 218,
    depth: 88,
    height: 88,
    imageUrl: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/p/ektorp-canape-3-places-vittaryd-blanc-s89421511/",
    category: "sofa",
    style: "scandinavian",
  },
  {
    id: "table-lack",
    name: "LACK Coffee table",
    description: "Simple, practical design. Easy to assemble and place anywhere.",
    price: 29.99,
    currency: "EUR",
    articleNumber: "402.114.20",
    width: 90,
    depth: 55,
    height: 45,
    imageUrl: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/p/lack-table-basse-blanc-20011413/",
    category: "table",
    style: "minimalist",
  },
  {
    id: "table-stockholm",
    name: "STOCKHOLM Coffee table",
    description: "Made of walnut veneer with a distinctive grain pattern. Each piece is unique.",
    price: 249,
    currency: "EUR",
    articleNumber: "203.888.38",
    width: 180,
    depth: 60,
    height: 40,
    imageUrl: "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/p/stockholm-table-basse-plaque-noyer-s19327535/",
    category: "table",
    style: "scandinavian",
  },
  {
    id: "chair-poang",
    name: "POÄNG Armchair",
    description: "Layer-glued bent birch frame provides comfortable resilience. Classic IKEA design.",
    price: 99,
    currency: "EUR",
    articleNumber: "398.305.87",
    width: 68,
    depth: 82,
    height: 100,
    imageUrl: "https://images.unsplash.com/photo-1503602642458-232111445657?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/p/poaeng-fauteuil-plaque-bouleau-knisa-noir-s69179571/",
    category: "chair",
    style: "scandinavian",
  },
  {
    id: "shelf-billy",
    name: "BILLY Bookcase",
    description: "The iconic BILLY bookcase. Timeless design that fits almost anywhere.",
    price: 69,
    currency: "EUR",
    articleNumber: "603.857.43",
    width: 80,
    depth: 28,
    height: 202,
    imageUrl: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/p/billy-bibliotheque-blanc-s99325710/",
    category: "shelf",
    style: "modern",
  },
  {
    id: "lamp-ranarp",
    name: "RANARP Floor lamp",
    description: "Reminiscent of the past, yet fully up to date. Adjustable for direct lighting.",
    price: 79.99,
    currency: "EUR",
    articleNumber: "703.563.13",
    width: 30,
    depth: 26,
    height: 151,
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/p/ranarp-lampadaire-liseuse-blanc-casse-s90328069/",
    category: "lamp",
    style: "industrial",
  },
  {
    id: "rug-stockholm",
    name: "STOCKHOLM Rug, flatwoven",
    description: "Handwoven by skilled craftspeople. Each rug is unique with natural color variations.",
    price: 299,
    currency: "EUR",
    articleNumber: "302.290.80",
    width: 250,
    depth: 350,
    height: 1,
    imageUrl: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/p/stockholm-tapis-tisse-a-plat-fait-main-raye-gris-s79161347/",
    category: "rug",
    style: "scandinavian",
  },
  {
    id: "bed-malm",
    name: "MALM Bed frame, high",
    description: "Clean design with adjustable bed sides. Spacious storage boxes underneath.",
    price: 299,
    currency: "EUR",
    articleNumber: "191.759.85",
    width: 160,
    depth: 209,
    height: 38,
    imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/p/malm-cadre-de-lit-haut-brun-noir-s89187568/",
    category: "bed",
    style: "modern",
  },
  {
    id: "desk-micke",
    name: "MICKE Desk",
    description: "Compact desk with cable management. Perfect for small spaces.",
    price: 79.99,
    currency: "EUR",
    articleNumber: "802.447.47",
    width: 105,
    depth: 50,
    height: 75,
    imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/p/micke-bureau-blanc-s49305604/",
    category: "desk",
    style: "minimalist",
  },
  {
    id: "armchair-strandmon",
    name: "STRANDMON Wing chair",
    description: "Classic wing chair with a modern twist. Supportive high back.",
    price: 279,
    currency: "EUR",
    articleNumber: "904.198.84",
    width: 82,
    depth: 96,
    height: 101,
    imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/p/strandmon-fauteuil-oreilles-nordvalla-gris-fonce-s59154968/",
    category: "armchair",
    style: "classic",
  },
  {
    id: "mirror-stockholm",
    name: "STOCKHOLM Mirror",
    description: "Timeless design with walnut veneer frame. Makes rooms feel larger and brighter.",
    price: 149,
    currency: "EUR",
    articleNumber: "503.058.34",
    width: 60,
    depth: 3,
    height: 80,
    imageUrl: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/p/stockholm-miroir-plaque-noyer-s29327535/",
    category: "mirror",
    style: "scandinavian",
  },
  {
    id: "sideboard-besta",
    name: "BESTÅ Storage combination",
    description: "Flexible storage with doors and shelves. Modern clean lines.",
    price: 185,
    currency: "EUR",
    articleNumber: "992.478.12",
    width: 180,
    depth: 40,
    height: 74,
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/p/besta-combinaison-rangement-avec-portes-blanc-s69247812/",
    category: "storage",
    style: "modern",
  },
  {
    id: "dining-ekedalen",
    name: "EKEDALEN Extendable table",
    description: "A durable dining table that seats 4-6 people. Extends when you need more space.",
    price: 299,
    currency: "EUR",
    articleNumber: "903.408.07",
    width: 120,
    depth: 80,
    height: 75,
    imageUrl: "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/p/ekedalen-table-a-rallonge-blanc-s89340807/",
    category: "dining",
    style: "scandinavian",
  },
  {
    id: "plant-fejka",
    name: "FEJKA Artificial potted plant",
    description: "Lifelike artificial plant that stays green. No watering needed.",
    price: 14.99,
    currency: "EUR",
    articleNumber: "004.339.42",
    width: 12,
    depth: 12,
    height: 45,
    imageUrl: "https://images.unsplash.com/photo-1463320726281-696a485928c7?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/p/fejka-plante-artificielle-en-pot-00433942/",
    category: "decoration",
    style: "modern",
  },
];

// ─── Search Helper ───────────────────────────────────────────────────────────

function searchIkeaProducts(params: {
  query: string;
  category?: string;
  style?: string;
  maxPrice?: number;
}) {
  let results = [...IKEA_CATALOG];

  if (params.category) {
    results = results.filter((p) =>
      p.category.toLowerCase().includes(params.category!.toLowerCase()),
    );
  }

  if (params.style) {
    const style = params.style.toLowerCase();
    results = results.filter(
      (p) =>
        p.style.toLowerCase().includes(style) ||
        p.description.toLowerCase().includes(style),
    );
  }

  if (params.maxPrice) {
    results = results.filter((p) => p.price <= params.maxPrice!);
  }

  if (params.query) {
    const q = params.query.toLowerCase();
    const keywords = q.split(/\s+/);
    results = results.filter((p) => {
      const searchable = `${p.name} ${p.description} ${p.category} ${p.style}`.toLowerCase();
      return keywords.some((kw) => searchable.includes(kw));
    });
  }

  return results;
}

// ─── MCP Server ──────────────────────────────────────────────────────────────

const server = new McpServer(
  { name: "interior-architect", version: "1.0.0" },
  { capabilities: {} },
)
  // ── Main Widget: interior-architect ──────────────────────────────────────
  .registerWidget(
    "interior-architect",
    {
      description:
        "AI-powered interior design tool. Upload a room photo, describe desired furniture, get AI-edited image with IKEA product recommendations.",
      _meta: {
        ui: {
          csp: {
            connectDomains: ["https://image.pollinations.ai"],
            resourceDomains: ["https://images.unsplash.com", "https://image.pollinations.ai"],
            redirectDomains: ["https://www.ikea.com"],
          },
        },
      },
    },
    {
      description:
        "Upload a room image and describe desired furniture. Returns AI-furnished image with matching IKEA products.",
      inputSchema: {
        imageUrl: z.string().describe("URL of the room image to furnish"),
        prompt: z.string().describe("Description of desired furniture (e.g., 'add a grey sofa and round coffee table')"),
        style: z.string().optional().describe("Design style preference: scandinavian, modern, industrial, minimalist, classic"),
        budget: z.number().optional().describe("Budget in EUR (optional constraint)"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ imageUrl, prompt, style, budget }) => {
      try {
        // Search for matching IKEA products
        const products = searchIkeaProducts({
          query: prompt,
          style,
          maxPrice: budget,
        });

        // Generate furnished room image using AI
        const furnishedPrompt = [
          `Interior design photography of furnished room`,
          `Add furniture based on: ${prompt}`,
          style ? `${style} style` : "",
          `Professional photography, natural lighting, realistic furniture placement`,
          `8k, high quality, architectural visualization`,
        ]
          .filter(Boolean)
          .join(", ");

        const encodedPrompt = encodeURIComponent(furnishedPrompt);
        const furnishedImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${Date.now()}&nologo=true&enhance=true`;

        const structuredContent = {
          originalImageUrl: imageUrl,
          furnishedImageUrl,
          prompt,
          style: style || "modern",
          budget: budget || null,
          productCount: products.length,
          products: products.slice(0, 8).map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            currency: p.currency,
            articleNumber: p.articleNumber,
            category: p.category,
          })),
        };

        const _meta = {
          furnishedImageUrl,
          products: products.slice(0, 8).map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            currency: p.currency,
            articleNumber: p.articleNumber,
            width: p.width,
            depth: p.depth,
            height: p.height,
            imageUrl: p.imageUrl,
            buyUrl: p.buyUrl,
            category: p.category,
            style: p.style,
          })),
        };

        return {
          structuredContent,
          content: [
            {
              type: "text" as const,
              text: `Generated furnished room image with ${products.length} matching IKEA products for: "${prompt}"${style ? ` in ${style} style` : ""}${budget ? ` within €${budget} budget` : ""}.`,
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

  // ── Tool: search-ikea-products ───────────────────────────────────────────
  .registerTool(
    "search-ikea-products",
    {
      description:
        "Search IKEA product catalog for furniture and home items. Returns products with images, prices, article numbers, and direct IKEA buy links.",
      inputSchema: {
        query: z.string().describe("Search query: furniture type, style, or description"),
        category: z
          .string()
          .optional()
          .describe("Category filter: sofa, table, chair, shelf, lamp, rug, bed, desk, armchair, mirror, storage, dining, decoration"),
        style: z.string().optional().describe("Style filter: scandinavian, modern, industrial, minimalist, classic"),
        maxPrice: z.number().optional().describe("Maximum price in EUR"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (params) => {
      const products = searchIkeaProducts(params);
      return {
        structuredContent: {
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            currency: p.currency,
            articleNumber: p.articleNumber,
            dimensions: `${p.width}×${p.depth}×${p.height}cm`,
            width: p.width,
            depth: p.depth,
            height: p.height,
            imageUrl: p.imageUrl,
            buyUrl: p.buyUrl,
            category: p.category,
            style: p.style,
          })),
        },
        content: [
          {
            type: "text" as const,
            text: `Found ${products.length} IKEA product(s) matching "${params.query}".`,
          },
        ],
      };
    },
  )

  // ── Tool: generate-furnished-room ────────────────────────────────────────
  .registerTool(
    "generate-furnished-room",
    {
      description:
        "Generate an AI-edited image of a room with furniture added based on user prompt. Creates photorealistic visualization of the furnished space.",
      inputSchema: {
        imageUrl: z.string().describe("URL of the original room image"),
        prompt: z.string().describe("Furniture to add (e.g., 'add modern grey sofa and glass coffee table')"),
        productNames: z.array(z.string()).optional().describe("Specific IKEA product names to visualize"),
        style: z.string().optional().describe("Design style: scandinavian, modern, industrial, minimalist, classic"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async ({ imageUrl, prompt, productNames, style }) => {
      // Build AI prompt for image generation
      const furnitureList = productNames && productNames.length > 0 ? productNames.join(", ") : "furniture from prompt";

      const aiPrompt = [
        `Photorealistic interior design of a furnished room`,
        `Add: ${prompt}`,
        productNames ? `Including: ${furnitureList}` : "",
        style ? `${style} style` : "modern style",
        `Professional architectural photography, natural daylight, realistic furniture placement`,
        `8k quality, wide angle, ambient lighting`,
      ]
        .filter(Boolean)
        .join(", ");

      const encodedPrompt = encodeURIComponent(aiPrompt);
      const furnishedImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${Date.now()}&nologo=true&enhance=true`;

      return {
        structuredContent: {
          originalImageUrl: imageUrl,
          furnishedImageUrl,
          prompt: aiPrompt,
          style: style || "modern",
          productsPlaced: productNames || [],
        },
        content: [
          {
            type: "text" as const,
            text: `Generated furnished room image: ${prompt}${style ? ` in ${style} style` : ""}.`,
          },
        ],
      };
    },
  );

export default server;
export type AppType = typeof server;
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
            connectDomains: ["https://image.pollinations.ai"],
            resourceDomains: ["https://images.unsplash.com", "https://image.pollinations.ai"],
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
  )

  // ── Tool: generate-room-image ────────────────────────────────────────────
  .registerTool(
    "generate-room-image",
    {
      description:
        "Generate an AI-rendered photorealistic image of a designed room using the selected furniture and paint colors. Uses AI image generation to create a visual preview of what the room will look like.",
      inputSchema: {
        roomWidth: z.number().describe("Room width in cm"),
        roomLength: z.number().describe("Room length in cm"),
        roomHeight: z.number().describe("Room height in cm"),
        style: z.string().describe("Design style: scandinavian, modern, industrial, bohemian, classic"),
        furnitureNames: z.array(z.string()).describe("Names of selected furniture items to include"),
        paintColor: z.string().optional().describe("Wall paint color name"),
        paintHex: z.string().optional().describe("Wall paint hex color"),
        roomType: z.string().optional().describe("Room type: living room, bedroom, office, dining room"),
        userPrompt: z.string().optional().describe("Additional user description or instructions for the image"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async ({ roomWidth, roomLength, roomHeight, style, furnitureNames, paintColor, roomType, userPrompt }) => {
      // Build a detailed prompt for AI image generation
      const furnitureList = furnitureNames.length > 0
        ? furnitureNames.join(", ")
        : "minimal furniture";

      const prompt = [
        `Photorealistic interior design render of a ${style} ${roomType || "room"}`,
        `${roomWidth / 100}m × ${roomLength / 100}m × ${roomHeight / 100}m`,
        `with ${paintColor || "white"} walls`,
        `furnished with: ${furnitureList}`,
        `professional interior photography, wide angle lens, natural daylight`,
        `8k, architectural visualization, warm ambient lighting`,
        userPrompt ? userPrompt : "",
      ].filter(Boolean).join(", ");

      // Use Pollinations.ai free API for image generation
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${Date.now()}&nologo=true`;

      return {
        structuredContent: {
          imageUrl,
          prompt,
          style,
          roomType: roomType || "room",
          furnitureIncluded: furnitureNames,
          wallColor: paintColor || "white",
        },
        content: [
          {
            type: "text" as const,
            text: `Generated AI room visualization: ${style} ${roomType || "room"} with ${furnitureList} and ${paintColor || "white"} walls. Image is being rendered.`,
          },
        ],
      };
    },
  )

  // ── Tool: get-3d-room-data ───────────────────────────────────────────────
  .registerTool(
    "get-3d-room-data",
    {
      description:
        "Generate 3D scene data for an interactive room visualization. Returns furniture positions, dimensions, colors, and room geometry for rendering in a 3D viewer.",
      inputSchema: {
        roomWidth: z.number().describe("Room width in cm"),
        roomLength: z.number().describe("Room length in cm"),
        roomHeight: z.number().describe("Room height in cm"),
        furnitureIds: z.array(z.string()).describe("IDs of selected furniture items"),
        paintHex: z.string().optional().describe("Wall paint hex color, e.g. #B2BDA0"),
        floorColor: z.string().optional().describe("Floor hex color"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ roomWidth, roomLength, roomHeight, furnitureIds, paintHex, floorColor }) => {
      // Look up furniture from catalog
      const selectedFurniture = FURNITURE_CATALOG.filter((f) =>
        furnitureIds.includes(f.id),
      );

      // Auto-place furniture along walls and in room
      const placements: Array<{
        id: string;
        name: string;
        category: string;
        width: number;
        depth: number;
        height: number;
        x: number;
        y: number;
        z: number;
        color: string;
        rotation: number;
      }> = [];

      // Category-based colors
      const categoryColors: Record<string, string> = {
        sofa: "#8B7355",
        table: "#DEB887",
        chair: "#CD853F",
        shelf: "#F5F5DC",
        lamp: "#FFD700",
        rug: "#BC8F8F",
        bed: "#D2B48C",
        desk: "#A0522D",
        armchair: "#8B4513",
        mirror: "#C0C0C0",
      };

      // Simple placement algorithm — distribute furniture around the room
      const wallOffset = 10; // cm from wall
      const centerX = roomWidth / 2;
      const centerZ = roomLength / 2;

      selectedFurniture.forEach((f, i) => {
        let x = 0,
          y = f.height / 2,
          z = 0,
          rotation = 0;

        switch (f.category) {
          case "sofa":
          case "bed":
            // Against back wall, centered
            x = centerX;
            z = f.depth / 2 + wallOffset;
            rotation = 0;
            break;
          case "table":
            // Center of room
            x = centerX;
            z = centerZ;
            break;
          case "desk":
            // Against right wall
            x = roomWidth - f.depth / 2 - wallOffset;
            z = centerZ;
            rotation = Math.PI / 2;
            break;
          case "chair":
            // Near table
            x = centerX + 60;
            z = centerZ + 40;
            rotation = -Math.PI / 4;
            break;
          case "shelf":
          case "mirror":
            // Against left wall
            x = f.depth / 2 + wallOffset;
            z = 50 + i * 120;
            rotation = Math.PI / 2;
            break;
          case "lamp":
            // Corner
            x = roomWidth - 50;
            z = wallOffset + 30;
            break;
          case "rug":
            // Center floor
            x = centerX;
            y = 1;
            z = centerZ;
            break;
          case "armchair":
            // Angled in corner
            x = roomWidth - f.width / 2 - wallOffset - 20;
            z = f.depth / 2 + wallOffset + 20;
            rotation = -Math.PI / 6;
            break;
          default:
            x = wallOffset + 60 + i * 80;
            z = wallOffset + 60;
        }

        placements.push({
          id: f.id,
          name: f.name,
          category: f.category,
          width: f.width,
          depth: f.depth,
          height: f.height,
          x,
          y,
          z,
          color: categoryColors[f.category] || "#999999",
          rotation,
        });
      });

      return {
        structuredContent: {
          room: {
            width: roomWidth,
            length: roomLength,
            height: roomHeight,
            wallColor: paintHex || "#FAFAFA",
            floorColor: floorColor || "#DEB887",
          },
          furniture: placements.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            position: { x: p.x, y: p.y, z: p.z },
          })),
          itemCount: placements.length,
        },
        content: [
          {
            type: "text" as const,
            text: `3D scene ready with ${placements.length} furniture items placed in a ${roomWidth}×${roomLength}cm room.`,
          },
        ],
      };
    },
  );

export default server;
export type AppType = typeof server;
