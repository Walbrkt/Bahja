/**
 * fal.ai Integration for Image Editing
 * Uses image-to-image generation to add furniture to rooms
 */

interface FalImageEditRequest {
  imageUrl: string;
  productImageUrl?: string;
  prompt: string;
  style?: string;
}

interface FalImageEditResponse {
  furnishedImageUrl: string;
  processingTime: number;
}

/**
 * Edit a room image to add furniture using fal.ai
 */
export async function editRoomImage({
  imageUrl,
  productImageUrl,
  prompt,
  style,
}: FalImageEditRequest): Promise<FalImageEditResponse> {
  const falApiKey = process.env.FAL_API_KEY;
  
  if (!falApiKey) {
    throw new Error("FAL_API_KEY not configured. Get your key from fal.ai with code: techeurope-paris");
  }

  const startTime = Date.now();

  // Build detailed prompt for adding furniture to room
  const enhancedPrompt = productImageUrl 
    ? [
        "Interior room photograph with new furniture added",
        `Add a ${prompt.toLowerCase()} into this room`,
        "Place it in an empty area with natural perspective and scale",
        "Match the room's existing lighting, shadows, and color temperature",
        "The furniture should look like it belongs in this space",
        "Keep all existing room elements unchanged (walls, floor, existing furniture)",
        style ? `${style} interior design aesthetic` : "realistic interior design",
      ].filter(Boolean).join(". ")
    : [
        prompt,
        "Natural placement with proper perspective",
        "Match existing room lighting",
        style ? `${style} style` : "",
      ].filter(Boolean).join(", ");

  console.log(`🖼️ Generating room with furniture:`);
  console.log(`   📍 Base room image: ${imageUrl}`);
  if (productImageUrl) console.log(`   🛋️ Furniture to add: ${prompt}`);
  console.log(`   💬 Prompt: ${enhancedPrompt}`);

  try {
    // Use flux-pro v1.1 image-to-image (room as base, product described in prompt)
    const response = await fetch("https://fal.run/fal-ai/flux-pro/v1.1", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        image_url: imageUrl, // Use room as the base image
        strength: 0.45, // Lower strength to preserve the room better
        num_inference_steps: 40,
        guidance_scale: 4.5,
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`fal.ai API error: ${error}`);
    }

    const result = await response.json();
    
    return {
      furnishedImageUrl: result.images[0].url,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error("fal.ai image editing failed:", error);
    
    // Fallback to Pollinations.ai if fal.ai fails
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    return {
      furnishedImageUrl: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${Date.now()}&nologo=true&enhance=true`,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Alternative: Generate a new furnished room image from scratch
 * Use this when user doesn't provide an image
 */
export async function generateRoomImage({
  prompt,
  style,
}: Omit<FalImageEditRequest, "imageUrl">): Promise<FalImageEditResponse> {
  const falApiKey = process.env.FAL_API_KEY;
  
  if (!falApiKey) {
    throw new Error("FAL_API_KEY not configured");
  }

  const startTime = Date.now();

  const enhancedPrompt = [
    "Interior design photography of a furnished room",
    prompt,
    style ? `${style} style` : "modern style",
    "professional architectural photography, natural daylight",
    "realistic furniture placement, 8k quality, wide angle",
  ].join(", ");

  try {
    const response = await fetch("https://fal.run/fal-ai/flux-pro/v1.1-ultra", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        image_size: "landscape_16_9",
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`fal.ai API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      furnishedImageUrl: result.images[0].url,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error("fal.ai image generation failed:", error);
    
    // Fallback to Pollinations.ai
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    return {
      furnishedImageUrl: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${Date.now()}&nologo=true&enhance=true`,
      processingTime: Date.now() - startTime,
    };
  }
}
