import { McpServer } from "skybridge/server";
import { z } from "zod";
import { editRoomImage, generateRoomImage } from "./services/fal-service.js";
import { analyzeRoomImage, matchProducts } from "./services/openai-service.js";
import { searchIkeaProducts as searchIkeaProductsAPI } from "./services/ikea-service.js";

// ─── Mock IKEA Product Catalog ───────────────────────────────────────────────
// Exported for use as fallback in ikea-service.ts

export const IKEA_CATALOG = [
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
        // Step 1: Analyze the room image with GPT-4 Vision (OpenAI partner)
        let roomAnalysis;
        if (imageUrl && process.env.OPENAI_API_KEY) {
          try {
            roomAnalysis = await analyzeRoomImage(imageUrl);
          } catch (error) {
            console.warn("Room analysis failed:", error);
          }
        }

        // Step 2: Use GPT-4 to intelligently match products (OpenAI partner)
        let aiRecommendations: string[] = [];
        if (process.env.OPENAI_API_KEY) {
          try {
            aiRecommendations = await matchProducts({
              userPrompt: prompt,
              roomAnalysis,
              budget,
              style,
            });
          } catch (error) {
            console.warn("AI product matching failed:", error);
          }
        }

        // Step 3: Search for matching IKEA products (uses OpenAI for real search)
        const products = await searchIkeaProductsAPI({
          query: aiRecommendations.length > 0 ? aiRecommendations.join(" ") : prompt,
          style,
          maxPrice: budget,
          limit: 8,
        });

        // Step 4: Generate/edit room image using fal.ai (fal.ai partner)
        let furnishedImageUrl: string;
        let processingTime = 0;
        
        if (imageUrl && process.env.FAL_API_KEY) {
          // Use fal.ai to edit the actual room image
          const result = await editRoomImage({
            imageUrl,
            prompt,
            style,
          });
          furnishedImageUrl = result.furnishedImageUrl;
          processingTime = result.processingTime;
        } else if (process.env.FAL_API_KEY) {
          // Generate new image with fal.ai
          const result = await generateRoomImage({
            prompt,
            style,
          });
          furnishedImageUrl = result.furnishedImageUrl;
          processingTime = result.processingTime;
        } else {
          // Fallback to Pollinations.ai
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
          furnishedImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${Date.now()}&nologo=true&enhance=true`;
        }

        const structuredContent = {
          originalImageUrl: imageUrl,
          furnishedImageUrl,
          prompt,
          style: style || "modern",
          budget: budget || null,
          productCount: products.length,
          processingTime,
          roomAnalysis,
          usedRealAPIs: {
            fal: !!process.env.FAL_API_KEY,
            openai: !!process.env.OPENAI_API_KEY,
          },
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
      const products = await searchIkeaProductsAPI({
        query: params.query,
        category: params.category,
        style: params.style,
        maxPrice: params.maxPrice,
        limit: 20,
      });
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

      let furnishedImageUrl: string;
      let processingTime = 0;

      if (imageUrl && process.env.FAL_API_KEY) {
        // Use fal.ai to edit actual image
        const result = await editRoomImage({
          imageUrl,
          prompt: `${prompt}. Including: ${furnitureList}`,
          style,
        });
        furnishedImageUrl = result.furnishedImageUrl;
        processingTime = result.processingTime;
      } else if (process.env.FAL_API_KEY) {
        // Generate new image
        const result = await generateRoomImage({
          prompt: `${prompt}. Including: ${furnitureList}`,
          style,
        });
        furnishedImageUrl = result.furnishedImageUrl;
        processingTime = result.processingTime;
      } else {
        // Fallback
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
        furnishedImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${Date.now()}&nologo=true&enhance=true`;
      }

      return {
        structuredContent: {
          originalImageUrl: imageUrl,
          furnishedImageUrl,
          prompt: prompt,
          style: style || "modern",
          productsPlaced: productNames || [],
          processingTime,
          usedFalAI: !!process.env.FAL_API_KEY,
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
