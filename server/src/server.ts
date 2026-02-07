import { McpServer } from "skybridge/server";
import { z } from "zod";

// Type definitions for room analysis
interface SceneGeometry {
  walls: Array<{ name: string; normal: number[]; points: number[][] }>;
  floor: { area: number; corners: number[][] };
  ceiling: { height: number };
  surfaces: string[];
  existing_furniture: string[];
  camera_angle: number;
  scale_ratio: number;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  dimensions?: { length: number; width: number; height: number; unit: "m" | "cm" | "in" };
  url: string;
  image: string;
  materials: string[];
  availability: string;
  model_3d_url?: string;
}

// Server setup
const server = new McpServer(
  {
    name: "interior-design-orchestrator",
    version: "0.1.0",
  },
  { capabilities: {} },
);

// Helper function to wrap tool responses in MCP format
function toolResponse(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data),
      },
    ],
    structuredContent: data,
  };
}

type ErrorDetails = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

function ok<T>(data: T) {
  return toolResponse({ ok: true, data });
}

function fail(error: ErrorDetails) {
  return toolResponse({ ok: false, error });
}

type RoomDimensions = {
  length: number;
  width: number;
  height: number;
  unit: "m" | "cm" | "ft";
};

function normalizeDimensions(dimensions: RoomDimensions) {
  const { length, width, height, unit } = dimensions;
  const scale = unit === "m" ? 1 : unit === "cm" ? 0.01 : 0.3048;
  return {
    length: length * scale,
    width: width * scale,
    height: height * scale,
    unit: "m" as const,
  };
}

function assertPositive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number`);
  }
}

const INCH_TO_M = 0.0254;
const CM_TO_M = 0.01;

function parseDimensionsFromText(text: string) {
  const normalized = text.toLowerCase().replace(/×/g, "x");
  const match = normalized.match(
    /(\d+(?:\.\d+)?)\s*(cm|in|inch|inches|m|mm|ft)\s*x\s*(\d+(?:\.\d+)?)\s*(cm|in|inch|inches|m|mm|ft)\s*x\s*(\d+(?:\.\d+)?)\s*(cm|in|inch|inches|m|mm|ft)/,
  );

  if (!match) {
    const altMatch = normalized.match(
      /(\d+(?:\.\d+)?)\s*(cm|in|inch|inches|m|mm|ft|")\s*x\s*(\d+(?:\.\d+)?)\s*(cm|in|inch|inches|m|mm|ft|")\s*x\s*(\d+(?:\.\d+)?)\s*(cm|in|inch|inches|m|mm|ft|")/,
    );
    if (!altMatch) return null;
    const values = [altMatch[1], altMatch[3], altMatch[5]].map((value) =>
      Number.parseFloat(value),
    );
    const unitRaw = altMatch[2];
    const unitNormalized =
      unitRaw === "\"" || unitRaw === "inch" || unitRaw === "inches"
        ? "in"
        : unitRaw === "mm"
        ? "cm"
        : unitRaw;

    if (values.some((v) => !Number.isFinite(v))) return null;
    return {
      length: values[0],
      width: values[1],
      height: values[2],
      unit: unitNormalized as "m" | "cm" | "in",
    };
  }

  const values = [match[1], match[3], match[5]].map((value) =>
    Number.parseFloat(value),
  );
  const unit = match[2];
  const unitNormalized =
    unit === "inch" || unit === "inches" ? "in" : unit === "mm" ? "cm" : unit;

  if (values.some((v) => !Number.isFinite(v))) return null;

  return {
    length: values[0],
    width: values[1],
    height: values[2],
    unit: unitNormalized as "m" | "cm" | "in",
  };
}

function parseDimensionsFromAttributes(
  attributes: Record<string, unknown> | undefined,
) {
  if (!attributes) return null;
  const length = Number(attributes.length ?? attributes.l ?? attributes.depth);
  const width = Number(attributes.width ?? attributes.w);
  const height = Number(attributes.height ?? attributes.h);
  const unitRaw = String(attributes.unit ?? attributes.units ?? "in");
  if (!Number.isFinite(length) || !Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }
  const unitNormalized =
    unitRaw === "inch" || unitRaw === "inches" ? "in" : unitRaw === "mm" ? "cm" : unitRaw;
  if (!["m", "cm", "in"].includes(unitNormalized)) return null;
  return {
    length,
    width,
    height,
    unit: unitNormalized as "m" | "cm" | "in",
  };
}

function normalizeDimensionsToMeters(dimensions: {
  length: number;
  width: number;
  height: number;
  unit: "m" | "cm" | "in";
}) {
  if (dimensions.unit === "m") return dimensions;
  const scale = dimensions.unit === "cm" ? CM_TO_M : INCH_TO_M;
  return {
    length: dimensions.length * scale,
    width: dimensions.width * scale,
    height: dimensions.height * scale,
    unit: "m" as const,
  };
}

// ============================================
// TOOL 1: Analyze Room Image
// ============================================
server.registerTool(
  "analyzeRoomImage",
  {
    description:
      "Analyze room geometry, surfaces, and free spaces from an image",
    inputSchema: {
      image_base64: z
        .string()
        .describe("Base64 encoded image of the room"),
      room_dimensions: z
        .object({
          length: z.number(),
          width: z.number(),
          height: z.number(),
          unit: z.enum(["m", "cm", "ft"]),
        })
        .describe("Room dimensions for scale calibration"),
    },
  },
  async ({ room_dimensions }) => {
    try {
      assertPositive(room_dimensions.length, "Room length");
      assertPositive(room_dimensions.width, "Room width");
      assertPositive(room_dimensions.height, "Room height");

      const normalized = normalizeDimensions(room_dimensions);

      // Mock implementation: In production, call AWS Rekognition or OpenAI Vision API
      const sceneGeometry: SceneGeometry = {
        walls: [
          {
            name: "wall_north",
            normal: [0, -1, 0],
            points: [
              [0, 0, 0],
              [normalized.length, 0, 0],
            ],
          },
          {
            name: "wall_south",
            normal: [0, 1, 0],
            points: [
              [0, normalized.width, 0],
              [normalized.length, normalized.width, 0],
            ],
          },
          {
            name: "wall_east",
            normal: [1, 0, 0],
            points: [
              [normalized.length, 0, 0],
              [normalized.length, normalized.width, 0],
            ],
          },
          {
            name: "wall_west",
            normal: [-1, 0, 0],
            points: [
              [0, 0, 0],
              [0, normalized.width, 0],
            ],
          },
        ],
        floor: {
          area: normalized.length * normalized.width,
          corners: [
            [0, 0],
            [normalized.length, 0],
            [normalized.length, normalized.width],
            [0, normalized.width],
          ],
        },
        ceiling: {
          height: normalized.height,
        },
        surfaces: [
          "wall_north",
          "wall_south",
          "wall_east",
          "wall_west",
          "floor",
        ],
        existing_furniture: [],
        camera_angle: 45,
        scale_ratio: 1.0,
      };

      // Calculate free spaces (simplified: areas not occupied by walls)
      const freeSpaces = [
        {
          name: "center",
          bounds: [
            normalized.length * 0.1,
            normalized.width * 0.1,
            normalized.length * 0.9,
            normalized.width * 0.9,
          ],
          area: normalized.length * normalized.width * 0.64,
        },
      ];

      return ok({
        scene_geometry: sceneGeometry,
        free_spaces: freeSpaces,
        camera_model: {
          angle: 45,
          position: [
            normalized.length / 2,
            normalized.width / 2,
            normalized.height * 0.8,
          ],
        },
        depth_map: "encoded_placeholder",
      });
    } catch (error) {
      return fail({
        code: "ANALYZE_ROOM_FAILED",
        message: "Failed to analyze room",
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  },
);

// ============================================
// TOOL 2: Design Profiler
// ============================================
server.registerTool(
  "designProfiler",
  {
    description: "Generate design profile from style and preferences",
    inputSchema: {
      style: z
        .string()
        .describe(
          "Design style (e.g., Scandinavian, Industrial, Minimalist, Eclectic)",
        ),
      budget: z.number().optional().describe("Total budget in USD"),
      preferences: z
        .object({
          colors: z.array(z.string()).optional(),
          materials: z.array(z.string()).optional(),
          brands: z.array(z.string()).optional(),
          constraints: z.array(z.string()).optional(),
        })
        .optional(),
    },
  },
  async ({ style, budget, preferences }) => {
    try {
      // Define style profiles
      const styleProfiles: Record<
        string,
        {
          colors: string[];
          materials: string[];
          principles: string[];
          mood: string[];
        }
      > = {
        scandinavian: {
          colors: ["#f5f5f5", "#e8e8e8", "#333333", "#c0a080"],
          materials: ["light wood", "metal", "linen", "wool"],
          principles: ["minimalism", "functionality", "natural light"],
          mood: ["clean", "bright", "calm"],
        },
        industrial: {
          colors: ["#2a2a2a", "#666666", "#888888", "#cc4400"],
          materials: ["metal", "brick", "concrete", "dark wood"],
          principles: ["raw materials", "exposed structure", "utilitarian"],
          mood: ["bold", "edgy", "urban"],
        },
        minimalist: {
          colors: ["#ffffff", "#000000", "#cccccc"],
          materials: ["steel", "glass", "light wood"],
          principles: ["essential elements only", "negative space"],
          mood: ["zen", "spacious", "peaceful"],
        },
        eclectic: {
          colors: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"],
          materials: ["mixed", "vintage", "colorful textiles"],
          principles: ["personality", "mix and match", "artistic"],
          mood: ["vibrant", "creative", "unique"],
        },
      };

      const normalizedStyle = style.toLowerCase();
      const profile =
        styleProfiles[normalizedStyle] || styleProfiles.scandinavian;

      const preferredColors = preferences?.colors?.length
        ? preferences.colors
        : profile.colors;
      const preferredMaterials = preferences?.materials?.length
        ? preferences.materials
        : profile.materials;

      return ok({
        style: normalizedStyle,
        color_palette: preferredColors,
        material_profile: preferredMaterials,
        design_principles: profile.principles,
        brand_affinity: preferences?.brands || [],
        mood_keywords: profile.mood,
        budget_guidelines: budget
          ? {
              total: budget,
              per_category: {
                seating: budget * 0.25,
                tables: budget * 0.15,
                storage: budget * 0.2,
                lighting: budget * 0.1,
                decor: budget * 0.3,
              },
            }
          : null,
      });
    } catch (error) {
      return fail({
        code: "DESIGN_PROFILE_FAILED",
        message: "Failed to create design profile",
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  },
);

// ============================================
// TOOL 3: Search Products
// ============================================
server.registerTool(
  "searchProducts",
  {
    description: "Search for furniture products matching criteria",
    inputSchema: {
      category: z
        .string()
        .describe("Furniture category (sofa, table, chair, etc.)"),
      style: z.string().describe("Design style"),
      budget_per_item: z.number().describe("Budget for this item in USD"),
      constraints: z
        .record(z.string(), z.any())
        .optional()
        .describe("Size, color, or other constraints"),
    },
  },
  async ({ category, style, budget_per_item, constraints }) => {
    try {
      assertPositive(budget_per_item, "Budget per item");

      const apiKey = process.env.SERPAPI_API_KEY;
      const normalizedCategory = category.toLowerCase();
      const materials =
        Array.isArray(constraints?.materials) && constraints?.materials.length
          ? (constraints?.materials as string[]).join(" ")
          : "";
      const colors =
        Array.isArray(constraints?.colors) && constraints?.colors.length
          ? (constraints?.colors as string[]).join(" ")
          : "";
      const query = [style, normalizedCategory, materials, colors]
        .filter(Boolean)
        .join(" ");

      if (apiKey) {
        const url = new URL("https://serpapi.com/search.json");
        url.searchParams.set("engine", "google_shopping");
        url.searchParams.set("q", query);
        url.searchParams.set("location", "United States");
        url.searchParams.set("hl", "en");
        url.searchParams.set("gl", "us");
        url.searchParams.set("num", "20");
        url.searchParams.set("max_price", String(budget_per_item));
        url.searchParams.set("api_key", apiKey);

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`SerpApi request failed: ${response.status}`);
        }

        const payload = (await response.json()) as Record<string, unknown>;
        const results = (payload.shopping_results ??
          payload.inline_shopping_results ??
          []) as Array<Record<string, unknown>>;

        const products: Product[] = results
          .map((item, index) => {
            const title = String(item.title ?? "Unknown Product");
            const extractedPrice = Number(item.extracted_price ?? 0);
            const price =
              Number.isFinite(extractedPrice) && extractedPrice > 0
                ? extractedPrice
                : budget_per_item;
            const image =
              (item.thumbnail as string) ||
              (Array.isArray(item.thumbnails) ? item.thumbnails[0] : "") ||
              "";
            const url =
              (item.product_link as string) ||
              (item.link as string) ||
              (item.serpapi_product_api as string) ||
              "";
            const brand = String(item.source ?? item.seller ?? "Unknown");
            const attributes = (item.attributes ?? item.product_attributes ?? {}) as
              | Record<string, unknown>
              | undefined;
            const parsedFromAttributes = parseDimensionsFromAttributes(attributes);
            const dimensionsSource = String(
              item.snippet ?? item.description ?? item.snippet_highlighted_words ?? title,
            );
            const parsedFromText = parseDimensionsFromText(dimensionsSource);
            const parsedDimensions = parsedFromAttributes ?? parsedFromText;
            const normalizedDimensions = parsedDimensions
              ? normalizeDimensionsToMeters(parsedDimensions)
              : undefined;

            return {
              id: String(item.product_id ?? `${normalizedCategory}-${index}`),
              name: title,
              brand,
              price,
              currency: "USD",
              dimensions: normalizedDimensions,
              url,
              image,
              materials:
                Array.isArray(constraints?.materials) &&
                constraints?.materials.length
                  ? (constraints?.materials as string[])
                  : [],
              availability: "unknown",
            };
          })
          .filter((product) => product.image && product.url && product.dimensions);

        if (products.length > 0) {
          return ok({
            products: products.slice(0, 6),
            total_results: products.length,
            category: normalizedCategory,
            style,
            source: "serpapi",
          });
        }
      }

      if (!apiKey) {
        console.warn("SERPAPI_API_KEY is not set. Falling back to mock data.");
      } else {
        console.warn(
          "SerpApi returned no products with dimensions. Falling back to mock data.",
        );
      }

      // Mock product database. In production: integrate Furniture APIs, scrapers, etc.
      const mockProducts: Record<string, Product[]> = {
        sofa: [
          {
            id: "sofa-001",
            name: "Oslo Loveseat",
            brand: "BoConcept",
            price: 450,
            currency: "USD",
            dimensions: { length: 1.8, width: 0.9, height: 0.75, unit: "m" },
            url: "https://www.boconcept.com/en/oslo-loveseat",
            image: "https://via.placeholder.com/400x300?text=Oslo+Loveseat",
            materials: ["oak", "fabric"],
            availability: "in_stock",
          },
          {
            id: "sofa-002",
            name: "Kivik Sectional",
            brand: "IKEA",
            price: 399,
            currency: "USD",
            dimensions: { length: 2.6, width: 1.6, height: 0.84, unit: "m" },
            url: "https://www.ikea.com/kivik",
            image: "https://via.placeholder.com/400x300?text=Kivik+Sectional",
            materials: ["fabric", "wood"],
            availability: "in_stock",
          },
          {
            id: "sofa-003",
            name: "Norsborg Sofa",
            brand: "IKEA",
            price: 299,
            currency: "USD",
            dimensions: { length: 2.2, width: 0.9, height: 0.82, unit: "m" },
            url: "https://www.ikea.com/norsborg",
            image: "https://via.placeholder.com/400x300?text=Norsborg+Sofa",
            materials: ["fabric"],
            availability: "in_stock",
          },
        ],
        table: [
          {
            id: "table-001",
            name: "Ekedalen Dining Table",
            brand: "IKEA",
            price: 199,
            currency: "USD",
            dimensions: { length: 1.8, width: 0.9, height: 0.74, unit: "m" },
            url: "https://www.ikea.com/ekedalen",
            image: "https://via.placeholder.com/400x300?text=Ekedalen+Table",
            materials: ["solid wood"],
            availability: "in_stock",
          },
          {
            id: "table-002",
            name: "Strand Coffee Table",
            brand: "West Elm",
            price: 349,
            currency: "USD",
            dimensions: { length: 1.2, width: 0.6, height: 0.45, unit: "m" },
            url: "https://www.westelm.com/strand",
            image: "https://via.placeholder.com/400x300?text=Strand+Coffee+Table",
            materials: ["walnut", "metal"],
            availability: "in_stock",
          },
        ],
        chair: [
          {
            id: "chair-001",
            name: "Eames Lounge Chair",
            brand: "Herman Miller",
            price: 1295,
            currency: "USD",
            dimensions: { length: 1.3, width: 1.03, height: 1.0, unit: "m" },
            url: "https://www.hermanmiller.com/eames-lounge",
            image: "https://via.placeholder.com/400x300?text=Eames+Chair",
            materials: ["plywood", "leather", "aluminum"],
            availability: "in_stock",
          },
          {
            id: "chair-002",
            name: "Vilto Dining Chair",
            brand: "IKEA",
            price: 89,
            currency: "USD",
            dimensions: { length: 0.55, width: 0.56, height: 0.9, unit: "m" },
            url: "https://www.ikea.com/vilto",
            image: "https://via.placeholder.com/400x300?text=Vilto+Chair",
            materials: ["solid wood"],
            availability: "in_stock",
          },
        ],
      };

      const products = mockProducts[normalizedCategory] || [];

      const maxLength = Number(constraints?.max_length) || Number.POSITIVE_INFINITY;
      const maxWidth = Number(constraints?.max_width) || Number.POSITIVE_INFINITY;
      const maxHeight = Number(constraints?.max_height) || Number.POSITIVE_INFINITY;
      const maxPrice = Number(constraints?.max_price) || budget_per_item;
      const allowedMaterials = Array.isArray(constraints?.materials)
        ? new Set((constraints?.materials as string[]).map((m) => m.toLowerCase()))
        : null;
      const allowedBrands = Array.isArray(constraints?.brands)
        ? new Set((constraints?.brands as string[]).map((b) => b.toLowerCase()))
        : null;

      const filtered = products.filter((p) => {
        if (p.price > maxPrice) return false;
        if (p.dimensions) {
          if (p.dimensions.length > maxLength) return false;
          if (p.dimensions.width > maxWidth) return false;
          if (p.dimensions.height > maxHeight) return false;
        }
        if (allowedMaterials) {
          const hasMaterial = p.materials.some((m) =>
            allowedMaterials.has(m.toLowerCase()),
          );
          if (!hasMaterial) return false;
        }
        if (allowedBrands && !allowedBrands.has(p.brand.toLowerCase())) {
          return false;
        }
        return true;
      });

      return ok({
        products: filtered.slice(0, 5),
        total_results: filtered.length,
        category: normalizedCategory,
        style,
        source: "mock",
        notice:
          "Using mock data because no real products with dimensions were found.",
      });
    } catch (error) {
      return fail({
        code: "PRODUCT_SEARCH_FAILED",
        message: "Product search failed",
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  },
);

// ============================================
// TOOL 4: Validate Layout
// ============================================
server.registerTool(
  "validateLayout",
  {
    description:
      "Validate furniture placement for collisions and safety standards",
    inputSchema: {
      room_geometry: z
        .record(z.string(), z.any())
        .describe("Room geometry object"),
      placements: z
        .array(
          z.object({
            product_id: z.string(),
            position: z.array(z.number()),
            rotation: z.number(),
          }),
        )
        .describe("List of furniture placements"),
    },
  },
  async ({ placements }) => {
    try {
      // Simplified validation: no collision checking in mock
      return ok({
        valid: true,
        conflicts: [],
        walking_paths_clear: true,
        door_clearance_ok: true,
        validated_placements: placements,
        ergonomic_notes: [
          "Ensure minimum 60cm clearance for seating",
          "Keep walkways at least 90cm wide",
        ],
      });
    } catch (error) {
      return fail({
        code: "LAYOUT_VALIDATION_FAILED",
        message: "Layout validation failed",
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  },
);

// ============================================
// TOOL 5: Generate 3D Scene
// ============================================
server.registerTool(
  "generate3DScene",
  {
    description: "Generate 3D scene with furniture and lighting",
    inputSchema: {
      room_geometry: z
        .record(z.string(), z.any())
        .describe("Room geometry"),
      validated_layout: z
        .array(z.record(z.string(), z.any()))
        .describe("Valid placements"),
      lighting_preset: z
        .enum(["natural", "warm", "cool", "accent"])
        .optional()
        .describe("Lighting style"),
    },
  },
  async ({ lighting_preset }) => {
    try {
      // Mock 3D generation: In production, use THREE.js, Babylon.js, or 3D API
      return ok({
        gltf_scene: "base64_encoded_3d_model_placeholder",
        rendered_image: "base64_encoded_preview_image",
        preview_url:
          "https://via.placeholder.com/800x600?text=3D+Scene+Preview",
        metadata: {
          polygon_count: 120000,
          render_time_ms: 850,
          lighting: lighting_preset || "natural",
          file_size_bytes: 2500000,
        },
      });
    } catch (error) {
      return fail({
        code: "SCENE_GENERATION_FAILED",
        message: "3D scene generation failed",
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  },
);

// ============================================
// TOOL 6: Generate Product List & Cost Summary
// ============================================
server.registerTool(
  "generateProductList",
  {
    description: "Prepare final product list with cost breakdown",
    inputSchema: {
      selected_products: z
        .array(
          z.object({
            product_id: z.string(),
            name: z.string(),
            price: z.number(),
            quantity: z.number().optional().default(1),
          }),
        )
        .describe("Selected products"),
      layout: z
        .record(z.string(), z.any())
        .optional()
        .describe("Layout plan"),
    },
  },
  async ({ selected_products }) => {
    try {
      let totalCost = 0;
      const productsByCategory: Record<string, number> = {};
      const taxRate = 0.1;

      const products = selected_products.map((p) => {
        const cost = p.price * (p.quantity || 1);
        totalCost += cost;
        const category = p.product_id.split("-")[0];
        productsByCategory[category] =
          (productsByCategory[category] || 0) + cost;

        return {
          id: p.product_id,
          name: p.name,
          price: p.price,
          quantity: p.quantity || 1,
          subtotal: cost,
          url: `https://example.com/product/${p.product_id}`,
        };
      });

      return ok({
        products,
        total_cost: totalCost,
        cost_breakdown: productsByCategory,
        item_count: selected_products.length,
        average_item_cost:
          selected_products.length > 0
            ? totalCost / selected_products.length
            : 0,
        tax_estimate: totalCost * taxRate,
        final_total: totalCost * (1 + taxRate),
      });
    } catch (error) {
      return fail({
        code: "PRODUCT_LIST_FAILED",
        message: "Failed to generate product list",
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  },
);

// ============================================
// Main Widget
// ============================================
server.registerWidget(
  "interior-design",
  {
    description: "Interior Design AI Orchestrator",
    _meta: {
      ui: {
        csp: {
          resourceDomains: [
            "https://via.placeholder.com",
            "https://serpapi.com",
            "https://encrypted-tbn0.gstatic.com",
            "https://encrypted-tbn1.gstatic.com",
            "https://encrypted-tbn2.gstatic.com",
            "https://encrypted-tbn3.gstatic.com",
            "https://tbn0.gstatic.com",
            "https://tbn1.gstatic.com",
            "https://tbn2.gstatic.com",
            "https://tbn3.gstatic.com",
            "https://www.ikea.com",
            "https://www.boconcept.com",
            "https://www.hermanmiller.com",
            "https://www.westelm.com",
          ],
          redirectDomains: [
            "https://www.ikea.com",
            "https://www.boconcept.com",
            "https://www.hermanmiller.com",
            "https://www.westelm.com",
          ],
        },
      },
    },
  },
  {
    description:
      "Transform room images into interactive 3D furniture visualizations",
    inputSchema: {
      room_image: z.string().optional().describe("Base64 image or placeholder"),
      room_dimensions: z
        .object({
          length: z.number(),
          width: z.number(),
          height: z.number(),
          unit: z.enum(["m", "cm", "ft"]),
        })
        .optional(),
      style: z
        .string()
        .optional()
        .describe("Design style (Scandinavian, Industrial, etc.)"),
      budget: z.number().optional().describe("Total budget in USD"),
      preferences: z
        .object({
          colors: z.array(z.string()).optional(),
          materials: z.array(z.string()).optional(),
        })
        .optional(),
    },
  },
  async ({ room_dimensions, style, budget }) => {
    try {
      // Widget orchestrates the tool calls and returns structured content
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "ready",
              message: "Interior Design Orchestrator ready for analysis",
              has_dimensions: !!room_dimensions,
              selected_style: style || "not selected",
              total_budget: budget || 0,
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  },
);

export default server;
export type AppType = typeof server;
