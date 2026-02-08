/**
 * IKEA Product Search Service
 * Uses SerpAPI (Google Search) to find real IKEA products intelligently
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
 * Search IKEA products using SerpAPI (Google Search with structured data)
 * Sign up at https://serpapi.com/ for free API key (100 free searches/month)
 */
export async function searchIkeaProducts({
  query,
  limit = 10,
}: IkeaSearchParams): Promise<IkeaProduct[]> {
  const serpApiKey = process.env.SERPAPI_KEY;
  
  if (!serpApiKey) {
    console.warn("⚠️ SERPAPI_KEY not set. Get free key at https://serpapi.com (100 free searches/month)");
    throw new Error("SERPAPI_KEY required for IKEA search");
  }

  try {
    // Use Google Shopping to find IKEA products with images
    const searchQuery = `${query} IKEA`;
    console.log("🔍 Searching Google Shopping (SerpAPI) for:", searchQuery);

    const params = new URLSearchParams({
      api_key: serpApiKey,
      engine: "google_shopping",
      q: searchQuery,
      num: Math.max(limit * 2, 20).toString(), // Request more results to filter for relevance
      gl: "us",
      hl: "en",
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
    
    console.log(`📦 Found ${results.length} Google Shopping results for IKEA`);

    if (results.length === 0) {
      console.warn("⚠️ No IKEA products found for query:", query);
      return [];
    }

    // Filter for IKEA products only
    const ikeaResults = results.filter((r: any) => 
      r.link?.includes('ikea.com') || 
      r.source?.toLowerCase().includes('ikea')
    );

    console.log(`🛍️ Found ${ikeaResults.length} IKEA products`);

    // Extract product details from Shopping results
    const products: IkeaProduct[] = [];
    for (const result of ikeaResults) {
      const product = extractProductFromShoppingResult(result);
      if (product) {
        products.push(product);
      }
    }

    // Score products by relevance to the search query
    const scoredProducts = products.map(product => ({
      product,
      relevanceScore: calculateRelevance(query, product),
    }));

    // Sort by relevance score (highest first) and keep top 10
    const topProducts = scoredProducts
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, Math.min(limit, 10))
      .map(item => item.product);

    console.log(`✅ Extracted ${topProducts.length} IKEA products (top 10 most relevant)`);
    return topProducts;
  } catch (error) {
    console.error("❌ IKEA product search failed:", error);
    throw error;
  }
}

/**
 * Extract IKEA product from Google Shopping result
 */
function extractProductFromShoppingResult(result: any): IkeaProduct | null {
  try {
    const url = result.link || result.product_link || '';
    const title = result.title || '';
    const price = parseFloat(result.extracted_price || result.price?.replace(/[^0-9.]/g, '') || '0');
    
    // Google Shopping provides product thumbnail
    const imageUrl = result.thumbnail || result.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop';
    
    // Extract article number from URL if available
    const articleMatch = url.match(/\/p\/[^/]+-(\d{8})\//);
    const articleNumber = articleMatch ? articleMatch[1] : `IKEA-${Date.now()}`;
    
    // Clean product name
    const name = title.replace(/\s*-\s*IKEA.*$/i, '').replace(/\s*\|.*$/i, '').trim();
    
    // If no URL from shopping result, construct IKEA search URL
    const buyUrl = url || `https://www.ikea.com/us/en/search/?q=${encodeURIComponent(name)}`;
    
    console.log(`🛍️ Product: ${name}`);
    console.log(`   💰 Price: $${price}`);
    console.log(`   🖼️ Image: ${imageUrl}`);
    console.log(`   🔗 URL: ${buyUrl}`);
    
    return {
      id: articleNumber,
      name,
      description: result.snippet || `${name} from IKEA`,
      price: price || 99,
      currency: 'USD',
      articleNumber,
      width: 100,
      depth: 50,
      height: 80,
      imageUrl,
      buyUrl,
      category: extractCategory(title, result.snippet || ''),
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

/**
 * Calculate relevance score for a product based on search query match
 * Scores higher for exact matches in name/description
 */
function calculateRelevance(query: string, product: IkeaProduct): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const productText = `${product.name} ${product.description}`.toLowerCase();
  
  let score = 0;
  
  // Exact phrase match in name (highest priority)
  if (product.name.toLowerCase().includes(query.toLowerCase())) {
    score += 100;
  }
  
  // Individual term matches in product name
  for (const term of queryTerms) {
    if (term.length > 2) { // Ignore short words like "a", "to", etc
      if (product.name.toLowerCase().includes(term)) {
        score += 30;
      } else if (productText.includes(term)) {
        score += 10;
      }
    }
  }
  
  // Bonus for having a valid image
  if (product.imageUrl && !product.imageUrl.includes('unsplash')) {
    score += 5;
  }
  
  return score;
}
