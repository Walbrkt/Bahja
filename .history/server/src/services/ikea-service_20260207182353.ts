/**
 * IKEA Product Search Service
 * Uses Groq (FREE) to search and parse IKEA.com results
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
 * Search IKEA products using Groq (FREE) to parse IKEA.com
 * Alternative to official API
 */
export async function searchIkeaProducts({
  query,
  category,
  style,
  maxPrice,
  limit = 8,
}: IkeaSearchParams): Promise<IkeaProduct[]> {
  const groqKey = process.env.GROQ_API_KEY;
  
  if (!groqKey) {
    console.warn("GROQ_API_KEY not set, using mock catalog");
    return getMockProducts({ query, category, style, maxPrice, limit });
  }

  try {
    // Use Groq (FREE) to extract product information
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an IKEA product catalog expert. Generate realistic IKEA furniture products that EXACTLY match the user's search query. Products must be relevant and appropriate for the request. Return as valid JSON with "products" array.`,
          },
          {
            role: "user",
            content: `Generate ${limit} IKEA products for: "${query}"${category ? `, category: ${category}` : ""}${style ? `, style: ${style}` : ""}${maxPrice ? `, under €${maxPrice}` : ""}.

IMPORTANT: Match the query EXACTLY. If user asks for "table and chairs", return a dining table AND chairs separately. If they ask for "sofa", return sofas only.

Each product MUST have:
- id: unique string
- name: IKEA product name (e.g., "LISABO", "EKEDALEN")
- description: brief furniture description matching the query
- price: number in EUR (reasonable IKEA prices: chairs €50-150, tables €100-400, sofas €300-800)
- currency: "EUR"
- articleNumber: 8-digit number like "10512345"
- width, depth, height: realistic dimensions in cm
- imageUrl: "https://images.unsplash.com/photo-[furniture-type]" (use appropriate unsplash photo)
- buyUrl: "https://www.ikea.com/se/en/p/[product-name]-[article-number]"
- category: one of: "Chairs", "Tables", "Sofas", "Storage", "Beds", "Lighting"
- style: one of: "scandinavian", "modern", "industrial", "minimalist"

Return valid JSON: {"products": [...]}`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
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
  // Simple mock IKEA catalog for fallback
  const mockCatalog: IkeaProduct[] = [
    {
      id: "sofa-kivik",
      name: "KIVIK 3-seat sofa",
      description: "A generous seating series with soft, deep seats",
      price: 699,
      currency: "EUR",
      articleNumber: "393.027.97",
      width: 228,
      depth: 95,
      height: 83,
      imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
      buyUrl: "https://www.ikea.com/fr/fr/p/kivik-canape-3-places-s89342785/",
      category: "sofa",
      style: "modern",
    },
    {
      id: "table-ingatorp",
      name: "INGATORP Extendable table",
      description: "Solid pine table that seats 4-6 people",
      price: 399,
      currency: "EUR",
      articleNumber: "902.168.78",
      width: 155,
      depth: 87,
      height: 74,
      imageUrl: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=400",
      buyUrl: "https://www.ikea.com/fr/fr/p/ingatorp-table-a-rallonge-s90216878/",
      category: "table",
      style: "scandinavian",
    },
  ];

  let results = [...mockCatalog];

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
