/**
 * fal.ai Integration for Image Editing
 * Uses the official @fal-ai/client SDK for reliable uploads and API calls.
 */
import { fal } from "@fal-ai/client";

// Configure fal client once
let falConfigured = false;
function configureFal() {
  if (falConfigured) return;
  const key = process.env.FAL_API_KEY || process.env.FAL_KEY;
  if (!key) throw new Error("FAL_API_KEY not configured");
  fal.config({ credentials: key });
  falConfigured = true;
}

interface FalImageEditRequest {
  imageUrl: string;
  productImageUrl?: string;
  prompt: string;
  style?: string;
  placementHint?: string;
}

interface FalImageEditResponse {
  furnishedImageUrl: string;
  processingTime: number;
}

/**
 * Upload any image (URL, data URI, or buffer) to fal.ai storage via the SDK.
 * Returns a fal.ai-hosted URL that all fal models can access.
 */
async function uploadToFalStorage(imageUrl: string): Promise<string> {
  configureFal();

  // If it's already a fal.media URL, no need to re-upload
  if (imageUrl.includes("fal.media/files")) {
    console.log(`   ✅ Already a fal.ai URL, skipping upload`);
    return imageUrl;
  }

  console.log(`\n🔄 Uploading to fal.ai storage: ${imageUrl.substring(0, 80)}...`);

  try {
    if (imageUrl.startsWith("data:")) {
      // Data URI → extract buffer → upload as File
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) throw new Error("Invalid data URI format");
      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], "base64");
      const ext = mimeType.includes("png") ? "png" : "jpg";
      const file = new File([buffer], `upload-${Date.now()}.${ext}`, { type: mimeType });
      const url = await fal.storage.upload(file);
      console.log(`   ✅ Uploaded data URI → ${url}`);
      return url;
    }

    // HTTP URL → download → upload as File
    console.log(`   📥 Downloading image...`);
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const file = new File([arrayBuffer], `upload-${Date.now()}.${ext}`, { type: contentType });
    console.log(`   📤 Uploading ${arrayBuffer.byteLength} bytes to fal.ai...`);
    const url = await fal.storage.upload(file);
    console.log(`   ✅ Uploaded → ${url}`);
    return url;
  } catch (err) {
    console.error(`   ❌ Upload failed: ${err}`);
    console.warn(`   ⚠️ FALLBACK: Using original URL`);
    return imageUrl;
  }
}

/**
 * Edit a room image to add furniture using fal.ai
 */
export async function editRoomImage({
  imageUrl,
  productImageUrl,
  prompt,
  style,
  placementHint,
}: FalImageEditRequest): Promise<FalImageEditResponse> {
  configureFal();

  const startTime = Date.now();

  // Build placement instruction — crucial for avoiding overlap
  const placementInstruction = placementHint
    ? `Place the furniture ${placementHint}. Do NOT place it on top of or overlapping any existing furniture`
    : "Place the furniture in an open, empty area of the room. Do NOT place it on top of or overlapping any existing furniture";

  // Build prompt for furniture editing with reference
  const enhancedPrompt = productImageUrl 
    ? [
        "Image 1 is the base room - keep this room EXACTLY as is including all existing furniture, walls, floor, lighting",
        `Image 2 shows ${prompt} - extract ONLY this single furniture item from image 2`,
        placementInstruction,
        "CRITICAL: Find an EMPTY space in the room where no furniture currently exists",
        "Do NOT move, remove, or alter any furniture already present in image 1",
        "Match the room's perspective vanishing point, floor plane, and scale",
        "Ensure furniture sits flat on the floor, aligned with walls and architecture",
        "Match lighting direction, shadow angles, and color temperature of the room",
        "Maintain the original image resolution and quality",
        style ? `${style} interior design style` : "",
      ].filter(Boolean).join(". ")
    : [
        prompt,
        "Natural placement with proper perspective",
        "Match existing room lighting",
        style ? `${style} style` : "",
      ].filter(Boolean).join(", ");

  console.log(`🖼️ Generating with nano-banana/edit:`);
  console.log(`   📍 Base room: ${imageUrl.substring(0, 100)}...`);
  if (productImageUrl) console.log(`   🛋️ Reference product: ${productImageUrl.substring(0, 100)}...`);
  console.log(`   💬 Prompt: ${enhancedPrompt.substring(0, 150)}...`);

  try {
    // Upload images to fal.ai storage via SDK
    console.log(`🔄 Uploading images to fal.ai storage...`);
    const roomImageUrl = await uploadToFalStorage(imageUrl);
    const productUrl = productImageUrl ? await uploadToFalStorage(productImageUrl) : undefined;
    
    const images = productUrl ? [roomImageUrl, productUrl] : [roomImageUrl];
    
    console.log(`📤 Sending ${images.length} images to fal.ai nano-banana/edit`);
    console.log(`   Image 1 (room): ${roomImageUrl}`);
    if (productUrl) console.log(`   Image 2 (product): ${productUrl}`);

    configureFal();
    const result = await fal.run("fal-ai/nano-banana/edit", {
      input: {
        image_urls: images,
        prompt: enhancedPrompt,
        num_images: 1,
      },
    });

    const data = result.data as any;
    console.log(`✅ fal.ai response received:`, data.images ? `${data.images.length} image(s) generated` : 'ERROR: no images in response');
    if (data.images?.[0]) {
      console.log(`   🎨 Result URL: ${data.images[0].url}`);
    }
    
    console.log(`✅ Generated successfully in ${Date.now() - startTime}ms`);
    
    return {
      furnishedImageUrl: data.images[0].url,
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
  configureFal();

  const startTime = Date.now();

  const enhancedPrompt = [
    "Interior design photography of a furnished room",
    prompt,
    style ? `${style} style` : "modern style",
    "professional architectural photography, natural daylight",
    "realistic furniture placement, 8k quality, wide angle",
  ].join(", ");

  try {
    const result = await fal.run("fal-ai/flux-pro/v1.1-ultra", {
      input: {
        prompt: enhancedPrompt,
        aspect_ratio: "16:9",
        num_images: 1,
        enable_safety_checker: true,
      },
    });

    const data = result.data as any;

    return {
      furnishedImageUrl: data.images[0].url,
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
