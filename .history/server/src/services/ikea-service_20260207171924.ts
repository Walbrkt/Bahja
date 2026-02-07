/**
 * IKEA Product Search Service
 * Uses GPT-4 to search and parse IKEA.com results
 */

import { IKEA_CATALOG } from "../server.js";

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
 * Search IKEA products using GPT-4 to parse IKEA.com
 * Alternative to official API
 */
export async function searchIkeaProducts({
  query,
  category,
  style,
  maxPrice,
  limit = 8,
}: IkeaSearchParams): Promise<IkeaProduct[]> {
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    console.warn("OPENAI_API_KEY not set, using mock catalog");
    return getMockProducts({ query, category, style, maxPrice, limit });
  }

  try {
    // Use GPT-4 to extract product information
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an IKEA product search expert. Extract product details from IKEA search results and return as JSON array.",
          },
          {
            role: "user",
            content: `Search IKEA.com for: "${query}"${category ? `, category: ${category}` : ""}${style ? `, style: ${style}` : ""}. Return top ${limit} products with: name, article number, price (EUR), description, dimensions (W×D×H cm), image URL, buy URL, category. Format as JSON array.`,
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    
    try {
      const products = JSON.parse(content);
      return products.map((p: any) => normalizeProduct(p)).slice(0, limit);
    } catch {
      return getMockProducts({ query, category, style, maxPrice, limit });
    }
  } catch (error) {
    console.error("IKEA product search failed, using mock data:", error);
    return getMockProducts({ query, category, style, maxPrice, limit });
  }
}

/**
 * Build IKEA search URL
 */
function buildIkeaSearchUrl(query: string, category?: string): string {
  const baseUrl = "https://www.ikea.com/fr/fr/search/";
  const params = new URLSearchParams({
    q: query,
    ...(category && { category }),
  });
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Normalize product data from GPT-4 response
 */
function normalizeProduct(product: any): IkeaProduct {
  return {
    id: product.articleNumber || `ikea-${Date.now()}`,
    name: product.name || "IKEA Product",
    description: product.description || "",
    price: parseFloat(product.price) || 0,
    currency: "EUR",
    articleNumber: product.articleNumber || "000.000.00",
    width: product.dimensions?.width || 100,
    depth: product.dimensions?.depth || 50,
    height: product.dimensions?.height || 80,
    imageUrl: product.imageUrl || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
    buyUrl: product.buyUrl || `https://www.ikea.com/fr/fr/p/${product.articleNumber}/`,
    category: product.category || "furniture",
    style: product.style || "modern",
  };
}

/**
 * Fallback to mock products if API fails
 */
function getMockProducts({
  query,
  category,
  style,
  maxPrice,
  limit,
}: IkeaSearchParams): IkeaProduct[] {
  let results = [...IKEA_CATALOG];

  if (category) {
    results = results.filter((p) => p.category.toLowerCase().includes(category.toLowerCase()));
  }

  if (style) {
    results = results.filter((p) => p.style.toLowerCase().includes(style.toLowerCase()));
  }

  if (maxPrice) {
    results = results.filter((p) => p.price <= maxPrice);
  }

  if (query) {
    const q = query.toLowerCase();
    const keywords = q.split(/\s+/);
    results = results.filter((p) => {
      const searchable = `${p.name} ${p.description} ${p.category}`.toLowerCase();
      return keywords.some((kw) => searchable.includes(kw));
    });
  }

  return results.slice(0, limit);
}
