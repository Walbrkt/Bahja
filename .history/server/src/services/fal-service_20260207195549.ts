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

  // Build prompt emphasizing the room as primary context
  const enhancedPrompt = productImageUrl 
    ? [
        "A realistic interior photograph:",
        "The main scene is the room from the first image",
        "Add the furniture item from the second image into this room",
        "Integrate it naturally as if it was always there",
        "Keep the room's original lighting, walls, floor, and atmosphere",
        "Match perspective and scale correctly",
        style ? `${style} interior design` : "",
      ].filter(Boolean).join(". ")
    : [
        prompt,
        "Natural placement with proper perspective",
        "Match existing room lighting",
        style ? `${style} style` : "",
      ].filter(Boolean).join(", ");

  console.log(`🖼️ Generating with ${productImageUrl ? 2 : 1} images:`);
  console.log(`   📍 Room (primary): ${imageUrl}`);
  if (productImageUrl) console.log(`   🛋️ Product (reference): ${productImageUrl}`);
  console.log(`   💬 Prompt: ${enhancedPrompt}`);

  try {
    // Use standard FLUX image-to-image with primary room image
    const response = await fetch("https://fal.run/fal-ai/flux-pro/v1.1", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        image_url: imageUrl, // Primary room image
        strength: 0.55, // Lower strength to preserve more of the room
        num_inference_steps: 35,
        guidance_scale: 4.0,
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
