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
    // Strategy 1: Look for JSON-LD structured data
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
    
    if (jsonLdMatches) {
      console.log(`📋 Found ${jsonLdMatches.length} JSON-LD blocks`);
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
    
    // Strategy 2: Look for window.__NEXT_DATA__ or window.__INITIAL_STATE__
    if (products.length === 0) {
      console.log("🔄 Trying to find inline JavaScript data...");
      
      const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
      if (nextDataMatch) {
        try {
          const data = JSON.parse(nextDataMatch[1]);
          console.log("📦 Found __NEXT_DATA__");
          
          // Navigate through Next.js data structure to find products
          const pageProps = data?.props?.pageProps;
          if (pageProps) {
            const searchResults = pageProps.searchResults || pageProps.products || pageProps.items;
            if (Array.isArray(searchResults)) {
              console.log(`✅ Found ${searchResults.length} products in __NEXT_DATA__`);
              for (const item of searchResults.slice(0, limit)) {
                const product = normalizeIkeaProduct(item);
                if (product) products.push(product);
              }
            }
          }
        } catch (e) {
          console.error("Failed to parse __NEXT_DATA__:", e);
        }
      }
    }
    
    // Strategy 3: Look for data-* attributes in product cards
    if (products.length === 0) {
      console.log("🔄 Trying to find product cards with data attributes...");
      
      const productCardRegex = /<div[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/div>/gis;
      const matches = html.match(productCardRegex);
      
      if (matches) {
        console.log(`📋 Found ${matches.length} potential product cards`);
      }
    }
    
  } catch (error) {
    console.error("Failed to parse IKEA HTML:", error);
  }
  
  return products;
}

/**
 * Normalize IKEA product data from various formats
 */
function normalizeIkeaProduct(item: any): IkeaProduct | null {
  try {
    return {
      id: item.id || item.itemNo || item.productId || `ikea-${Date.now()}`,
      name: item.name || item.productName || item.title || 'Unknown Product',
      description: item.description || item.subtitle || item.name || '',
      price: parseFloat(item.price?.value || item.price || item.priceNumeral || 0),
      currency: item.price?.currency || item.currency || 'EUR',
      articleNumber: item.itemNo || item.articleNumber || item.id || '00000000',
      width: item.width || item.measurements?.width || 100,
      depth: item.depth || item.measurements?.depth || 50,
      height: item.height || item.measurements?.height || 80,
      imageUrl: item.imageUrl || item.image || item.mainImage?.url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
      buyUrl: item.url || item.link || `https://www.ikea.com/se/en/p/${item.itemNo || item.id}`,
      category: item.category?.name || item.categoryName || 'Furniture',
      style: 'scandinavian',
    };
  } catch {
    return null;
  }
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
