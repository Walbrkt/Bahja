/**
 * Furniture Product Search Service
 * Uses SerpAPI (Google Shopping) to find real furniture products from
 * multiple retailers: IKEA, Maisons du Monde, Leroy Merlin, La Redoute,
 * Amazon, Habitat, Conforama, BUT, etc.
 */

export interface FurnitureProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  articleNumber: string;
  width: number;
  depth: number;
  height: number;
  imageUrl: string;
  buyUrl: string;
  retailer: string;
  category: string;
  style: string;
}

interface FurnitureSearchParams {
  query: string;
  category?: string;
  style?: string;
  maxPrice?: number;
  limit?: number;
}

// ─── Retailer detection from URL / source ────────────────────────────────────

const RETAILER_PATTERNS: { match: RegExp; name: string }[] = [
  { match: /ikea\.com/i, name: "IKEA" },
  { match: /maisonsdumonde|maisons-du-monde/i, name: "Maisons du Monde" },
  { match: /leroymerlin|leroy-merlin/i, name: "Leroy Merlin" },
  { match: /laredoute|la-redoute/i, name: "La Redoute" },
  { match: /amazon\./i, name: "Amazon" },
  { match: /habitat\./i, name: "Habitat" },
  { match: /conforama\./i, name: "Conforama" },
  { match: /but\.fr/i, name: "BUT" },
  { match: /castorama/i, name: "Castorama" },
  { match: /alinea/i, name: "Alinéa" },
  { match: /made\.com/i, name: "MADE.com" },
  { match: /wayfair/i, name: "Wayfair" },
  { match: /westelm|west-elm/i, name: "West Elm" },
  { match: /cb2\.com/i, name: "CB2" },
  { match: /crateandbarrel|crate-and-barrel/i, name: "Crate & Barrel" },
  { match: /target\.com/i, name: "Target" },
  { match: /walmart\.com/i, name: "Walmart" },
  { match: /overstock/i, name: "Overstock" },
  { match: /potterybarn|pottery-barn/i, name: "Pottery Barn" },
  { match: /etsy\.com/i, name: "Etsy" },
];

function detectRetailer(url: string, source: string): string {
  const combined = `${url} ${source}`;
  for (const { match, name } of RETAILER_PATTERNS) {
    if (match.test(combined)) return name;
  }
  // Use the source field from Google Shopping as fallback retailer name
  if (source && source.length > 0) {
    return source;
  }
  return "Online Store";
}

/**
 * Search furniture products across all retailers via SerpAPI Google Shopping.
 */
export async function searchFurnitureProducts({
  query,
  limit = 12,
}: FurnitureSearchParams): Promise<FurnitureProduct[]> {
  const serpApiKey = process.env.SERPAPI_KEY;

  if (!serpApiKey) {
    console.warn("⚠️ SERPAPI_KEY not set. Get free key at https://serpapi.com (100 free searches/month)");
    throw new Error("SERPAPI_KEY required for furniture search");
  }

  try {
    // Search for furniture across all retailers — don't limit to one store
    const searchQuery = `${query} furniture`;
    console.log("🔍 Searching Google Shopping (SerpAPI) for:", searchQuery);

    const params = new URLSearchParams({
      api_key: serpApiKey,
      engine: "google_shopping",
      q: searchQuery,
      num: Math.min(limit * 2, 40).toString(), // fetch extra to have enough after filtering
      gl: "fr", // France for EU-centric retailers
      hl: "fr",
    });

    const response = await fetch(`https://serpapi.com/search?${params}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SerpAPI error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`SerpAPI error: ${data.error}`);
    }

    const results = data.shopping_results || [];

    console.log(`📦 Found ${results.length} Google Shopping results`);

    if (results.length === 0) {
      console.warn("⚠️ No products found for query:", query);
      return [];
    }

    // No retailer filter — accept ALL results
    const products: FurnitureProduct[] = [];
    for (let idx = 0; idx < results.length && products.length < limit; idx++) {
      const product = extractProductFromShoppingResult(results[idx], idx);
      if (product) {
        products.push(product);
      }
    }

    // Log retailer breakdown
    const retailers = [...new Set(products.map(p => p.retailer))];
    console.log(`✅ Extracted ${products.length} products from: ${retailers.join(", ")}`);

    return products;
  } catch (error) {
    console.error("❌ Furniture product search failed:", error);
    throw error;
  }
}

/**
 * Extract product from a Google Shopping result (any retailer)
 */
function extractProductFromShoppingResult(result: any, index: number): FurnitureProduct | null {
  try {
    const url = result.link || result.product_link || "";
    const title = result.title || "";
    const source = result.source || "";
    const price = parseFloat(
      result.extracted_price || result.price?.replace(/[^0-9.]/g, "") || "0",
    );

    // Google Shopping provides product thumbnail
    const imageUrl =
      result.thumbnail ||
      result.image ||
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop";

    // Generate unique ID using index + random suffix
    const id = `PROD-${index}-${Math.random().toString(36).slice(2, 8)}`;

    // Detect retailer from URL / source
    const retailer = detectRetailer(url, source);

    // Clean product name — strip common retailer suffixes
    const name = title
      .replace(/\s*[-–|].*?(IKEA|Amazon|Maisons du Monde|Leroy Merlin|La Redoute|Conforama|BUT|Habitat).*$/i, "")
      .replace(/\s*\|.*$/i, "")
      .trim();

    // Use the original URL; fallback to a Google search
    const buyUrl = url || `https://www.google.com/search?q=${encodeURIComponent(title)}&tbm=shop`;

    console.log(`🛍️ [${retailer}] ${name} — €${price}`);

    return {
      id,
      name,
      description: result.snippet || `${name} from ${retailer}`,
      price: price || 99,
      currency: "EUR",
      articleNumber: id,
      width: 100,
      depth: 50,
      height: 80,
      imageUrl,
      buyUrl,
      retailer,
      category: extractCategory(title, result.snippet || ""),
      style: "modern",
    };
  } catch (error) {
    console.error("Failed to extract product:", error);
    return null;
  }
}

/**
 * Determine product category from title/snippet
 */
function extractCategory(title: string, snippet: string): string {
  const text = `${title} ${snippet}`.toLowerCase();

  if (text.includes("chair") || text.includes("chaise") || text.includes("seating") || text.includes("fauteuil")) return "Chairs";
  if (text.includes("table") || text.includes("desk") || text.includes("bureau")) return "Tables";
  if (text.includes("sofa") || text.includes("couch") || text.includes("canapé") || text.includes("canape")) return "Sofas";
  if (text.includes("bed") || text.includes("lit") || text.includes("mattress") || text.includes("matelas")) return "Beds";
  if (text.includes("storage") || text.includes("shelf") || text.includes("cabinet") || text.includes("étagère") || text.includes("rangement")) return "Storage";
  if (text.includes("lamp") || text.includes("light") || text.includes("lampe") || text.includes("luminaire")) return "Lighting";
  if (text.includes("rug") || text.includes("carpet") || text.includes("tapis")) return "Rugs";
  if (text.includes("mirror") || text.includes("miroir")) return "Mirrors";

  return "Furniture";
}
