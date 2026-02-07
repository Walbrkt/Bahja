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

  // Build prompt for furniture editing with reference
  const enhancedPrompt = productImageUrl 
    ? [
        "Image 1 is the base room - keep this room exactly as is (walls, floor, lighting, furniture already there)",
        `Image 2 shows ${prompt} - extract ONLY this furniture item`,
        "Place the extracted furniture from image 2 into the room from image 1",
        "Position it at a natural viewing distance (not too close to camera, not in foreground)",
        "Place it against a wall or in the middle ground of the room with realistic depth",
        "Match the perspective: furniture should recede with the room's vanishing point",
        "Scale proportionally: the furniture size must match the room's scale and other objects",
        "Align with the floor plane and maintain vertical orientation",
        "Match lighting direction, shadow angles, and color temperature of the room",
        "Do not change the room itself, only add the new furniture piece naturally integrated",
        style ? `${style} interior design style` : "",
      ].filter(Boolean).join(". ")
    : [
        prompt,
        "Natural placement with proper perspective",
        "Match existing room lighting",
        style ? `${style} style` : "",
      ].filter(Boolean).join(", ");

  console.log(`🖼️ Generating with nano-banana/edit (2 images):`);
  console.log(`   📍 Base room: ${imageUrl}`);
  if (productImageUrl) console.log(`   🛋️ Reference product: ${productImageUrl}`);
  console.log(`   💬 Prompt: ${enhancedPrompt}`);

  try {
    // Use nano-banana/edit with control/reference image
    const requestBody: any = {
      image_url: imageUrl, // Room image as base
      prompt: enhancedPrompt,
      guidance_scale: 3.5,
      num_inference_steps: 30,
      strength: 0.5,
      num_images: 1,
      enable_safety_checker: true,
    };

    // Add product image as control/reference if available
    if (productImageUrl) {
      requestBody.control_image_url = productImageUrl;
    }

    const response = await fetch("https://fal.run/fal-ai/nano-banana/edit", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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
