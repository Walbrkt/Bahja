/**
 * IKEA Product Search Service
 * Uses Serper API (Google Search) to find real IKEA products intelligently
 */

interface IkeaProduct {
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
  category: string;
  style: string;
}

interface IkeaSearchParams {
  query: string;
  category?: string;
  style?: string;
  maxPrice?: number;
  limit?: number;
}

/**
 * Search IKEA products using Serper API (Google Search with AI extraction)
 * Sign up at https://serper.dev/ for free API key (2,500 free searches)
 */
export async function searchIkeaProducts({
  query,
  limit = 8,
}: IkeaSearchParams): Promise<IkeaProduct[]> {
  const serperKey = process.env.SERPER_API_KEY;
  
  if (!serperKey) {
    console.warn("⚠️ SERPER_API_KEY not set. Get free key at https://serper.dev (2,500 free searches)");
    throw new Error("SERPER_API_KEY required for IKEA search");
  }

  try {
    // Use Google Search to find IKEA products
    const searchQuery = `${query} site:ikea.com`;
    console.log("🔍 Searching Google for:", searchQuery);

    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": serperKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: searchQuery,
        num: limit,
        gl: "us",
        hl: "en",
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.organic || [];
    
    console.log(`📦 Found ${results.length} Google results from IKEA.com`);

    if (results.length === 0) {
      console.warn("⚠️ No IKEA products found for query:", query);
      return [];
    }

    // Extract product details from Google results
    const products: IkeaProduct[] = [];
    for (const result of results) {
      const product = extractProductFromGoogleResult(result);
      if (product) {
        products.push(product);
      }
    }

    console.log(`✅ Extracted ${products.length} IKEA products`);
    return products;
  } catch (error) {
    console.error("❌ IKEA product search failed:", error);
    throw error;
  }
}

/**
 * Extract IKEA product from Google search result
 */
function extractProductFromGoogleResult(result: any): IkeaProduct | null {
  try {
    const url = result.link || '';
    const title = result.title || '';
    const snippet = result.snippet || '';
    
    // Extract article number from URL (format: /p/product-name-00123456/)
    const articleMatch = url.match(/\/p\/[^/]+-(\d{8})\//);
    const articleNumber = articleMatch ? articleMatch[1] : `${Date.now()}`;
    
    // Extract product name (remove "- IKEA" suffix)
    const name = title.replace(/\s*-\s*IKEA.*$/i, '').trim();
    
    // Extract price from snippet if available
    let price = 0;
    const priceMatch = snippet.match(/\$(\d+(?:\.\d{2})?)/);
    if (priceMatch) {
      price = parseFloat(priceMatch[1]);
    }
    
    // Generate image URL (use IKEA's image CDN pattern)
    const imageUrl = `https://www.ikea.com/us/en/images/products/${name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    
    return {
      id: articleNumber,
      name,
      description: snippet.substring(0, 150),
      price: price || 99, // Default price if not found
      currency: 'USD',
      articleNumber,
      width: 100,
      depth: 50,
      height: 80,
      imageUrl,
      buyUrl: url,
      category: extractCategory(title, snippet),
      style: 'scandinavian',
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
  
  if (text.includes('chair') || text.includes('seating')) return 'Chairs';
  if (text.includes('table') || text.includes('desk')) return 'Tables';
  if (text.includes('sofa') || text.includes('couch')) return 'Sofas';
  if (text.includes('bed') || text.includes('mattress')) return 'Beds';
  if (text.includes('storage') || text.includes('shelf') || text.includes('cabinet')) return 'Storage';
  if (text.includes('lamp') || text.includes('light')) return 'Lighting';
  
  return 'Furniture';
}
