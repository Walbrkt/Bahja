/**
 * IKEA Product Search Service
 * Scrapes IKEA.com for real product data
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
 * Search IKEA products by scraping IKEA.com search results
 */
export async function searchIkeaProducts({
  query,
  limit = 8,
}: IkeaSearchParams): Promise<IkeaProduct[]> {
  // Build IKEA search URL
  const searchQuery = encodeURIComponent(query);
  const ikeaUrl = `https://www.ikea.com/se/en/search/?q=${searchQuery}`;
  
  console.log("🔍 Scraping IKEA.com:", ikeaUrl);

  try {
    // Fetch IKEA search page
    const response = await fetch(ikeaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
      },
    });

    if (!response.ok) {
      throw new Error(`IKEA fetch failed: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`📄 Received HTML (${html.length} chars)`);
    
    // Parse products from HTML using regex (IKEA uses JSON in script tags)
    const products = parseIkeaHtml(html, limit);
    
    if (products.length === 0) {
      console.warn("⚠️ No products found in IKEA HTML");
      return [];
    }

    console.log(`✅ Scraped ${products.length} real IKEA products`);
    return products;
  } catch (error) {
    console.error("❌ IKEA scraping failed:", error);
    throw new Error(`Failed to scrape IKEA: ${error}`);
  }
}

/**
 * Parse IKEA HTML to extract product data
 */
function parseIkeaHtml(html: string, limit: number): IkeaProduct[] {
  const products: IkeaProduct[] = [];
  
  try {
    // IKEA embeds product data in <script type="application/ld+json">
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
    
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        try {
          const data = JSON.parse(jsonContent);
          
          if (data['@type'] === 'Product' || data.itemListElement) {
            const items = data.itemListElement || [data];
            
            for (const item of items) {
              if (products.length >= limit) break;
              
              const product = extractProductFromJsonLd(item);
              if (product) products.push(product);
            }
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  } catch (error) {
    console.error("Failed to parse IKEA HTML:", error);
  }
  
  return products;
}

/**
 * Extract product from JSON-LD data
 */
function extractProductFromJsonLd(data: any): IkeaProduct | null {
  try {
    const product = data.item || data;
    
    if (!product.name) return null;
    
    return {
      id: product.sku || product.productID || `ikea-${Date.now()}`,
      name: product.name,
      description: product.description || product.name,
      price: parseFloat(product.offers?.price || product.price || 0),
      currency: product.offers?.priceCurrency || 'EUR',
      articleNumber: product.sku || product.productID || '00000000',
      width: 100,
      depth: 50,
      height: 80,
      imageUrl: product.image || product.image?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
      buyUrl: product.url || `https://www.ikea.com/se/en/p/${product.sku}`,
      category: product.category || 'Furniture',
      style: 'scandinavian',
    };
  } catch {
    return null;
  }
}
