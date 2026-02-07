/**
 * Groq Integration - FREE & FAST Alternative to OpenAI
 * Get API key from: https://console.groq.com
 */

export interface RoomAnalysis {
  roomType: string;
  style: string;
  dimensions?: {
    width?: number;
    length?: number;
    height?: number;
  };
  existingFurniture: string[];
  colors: string[];
  lighting: string;
  recommendations: string[];
}

/**
 * Analyze a room using Groq's Llama 3.3 70B (FREE)
 */
export async function analyzeRoomWithGroq(imageUrl: string): Promise<RoomAnalysis> {
  const groqKey = process.env.GROQ_API_KEY;
  
  if (!groqKey) {
    // Return basic analysis as fallback
    return {
      roomType: "living room",
      style: "modern",
      existingFurniture: [],
      colors: ["neutral", "white"],
      lighting: "natural",
      recommendations: ["Add a sofa", "Add decorative items"],
    };
  }

  try {
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
            content: "You are an expert interior designer. Analyze room descriptions and provide detailed insights in JSON format.",
          },
          {
            role: "user",
            content: `Based on this room image URL: ${imageUrl}
            
Provide a JSON analysis with:
- roomType (living room, bedroom, kitchen, etc.)
- style (modern, traditional, minimalist, etc.)
- existingFurniture (array of furniture items visible)
- colors (array of dominant colors)
- lighting (natural, warm, cool, bright, dim)
- recommendations (array of furniture/decor suggestions)`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from Groq");
    }

    return JSON.parse(content) as RoomAnalysis;
  } catch (error) {
    console.error("Groq analysis failed:", error);
    // Return sensible defaults
    return {
      roomType: "living room",
      style: "modern",
      existingFurniture: [],
      colors: ["neutral"],
      lighting: "natural",
      recommendations: ["Add comfortable seating", "Add storage solutions"],
    };
  }
}

/**
 * Match IKEA products using Groq (FREE)
 */
export async function matchProductsWithGroq({
  userPrompt,
  budget,
  style,
}: {
  userPrompt: string;
  budget?: number;
  style?: string;
}): Promise<string[]> {
  const groqKey = process.env.GROQ_API_KEY;

  const searchTerms = userPrompt
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3);

  if (!groqKey) {
    return searchTerms.slice(0, 3);
  }

  try {
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
            content: "You are an IKEA product expert. Generate search terms for IKEA.com based on user requests.",
          },
          {
            role: "user",
            content: `User wants: "${userPrompt}"
${style ? `Style: ${style}` : ""}
${budget ? `Budget: $${budget}` : ""}

Provide 3-5 search terms for IKEA.com as a JSON array of strings.
Example: ["sofa bed", "kallax shelf", "led lighting"]`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return searchTerms.slice(0, 3);
    }

    const parsed = JSON.parse(content);
    return parsed.searchTerms || parsed.terms || searchTerms.slice(0, 3);
  } catch (error) {
    console.error("Groq product matching failed:", error);
    return searchTerms.slice(0, 3);
  }
}
