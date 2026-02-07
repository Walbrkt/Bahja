/**
 * OpenAI Integration for Room Analysis and Product Matching
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

interface ProductMatchingRequest {
  userPrompt: string;
  roomAnalysis?: RoomAnalysis;
  budget?: number;
  style?: string;
}

/**
 * Analyze a room image using GPT-4 Vision
 */
export async function analyzeRoomImage(imageUrl: string): Promise<RoomAnalysis> {
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    throw new Error("OPENAI_API_KEY not configured. Submit your Org ID to get credits.");
  }

  try {
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
            content: "You are an expert interior designer. Analyze room images and provide detailed insights.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this room image and provide: 1) Room type, 2) Current style, 3) Estimated dimensions if possible, 4) Existing furniture, 5) Color palette, 6) Lighting conditions, 7) Recommendations for improvement. Return as JSON.",
              },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    
    // Try to parse JSON response
    try {
      return JSON.parse(content);
    } catch {
      // Fallback if GPT doesn't return valid JSON
      return {
        roomType: "living room",
        style: "modern",
        existingFurniture: [],
        colors: ["neutral"],
        lighting: "natural",
        recommendations: ["Add furniture based on user request"],
      };
    }
  } catch (error) {
    console.error("OpenAI room analysis failed:", error);
    
    // Return default analysis
    return {
      roomType: "room",
      style: "modern",
      existingFurniture: [],
      colors: ["neutral"],
      lighting: "natural",
      recommendations: [],
    };
  }
}

/**
 * Use GPT-4 to intelligently match furniture products to user requirements
 * This can search IKEA.com or use the mock catalog
 */
export async function matchProducts({
  userPrompt,
  roomAnalysis,
  budget,
  style,
}: ProductMatchingRequest): Promise<string[]> {
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    return []; // Return empty if no API key
  }

  const systemPrompt = `You are an IKEA product expert. Given a user's furniture request, recommend specific IKEA products that would work well. Consider: style, budget, room type, and existing furniture.`;

  const userMessage = `
User wants: ${userPrompt}
${style ? `Style preference: ${style}` : ""}
${budget ? `Budget: €${budget}` : ""}
${roomAnalysis ? `Room analysis: ${JSON.stringify(roomAnalysis)}` : ""}

Recommend 5-8 IKEA products (name only) that would match this request. Return as a JSON array of product names.
  `;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      return [];
    }
  } catch (error) {
    console.error("OpenAI product matching failed:", error);
    return [];
  }
}
