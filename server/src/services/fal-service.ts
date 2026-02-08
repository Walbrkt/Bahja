/**
 * fal.ai Integration for Image Editing
 * Uses image-to-image generation to add furniture to rooms
 */

interface FalImageEditRequest {
  imageUrl: string;
  productImageUrl?: string;
  productImageUrls?: string[]; // Support multiple furniture images for accumulation
  prompt: string;
  style?: string;
}

interface FalImageEditResponse {
  furnishedImageUrl: string;
  processingTime: number;
}

/**
 * Upload a buffer to fal.ai storage and return a public URL
 */
async function uploadBufferToFal(buffer: Buffer, mimeType: string, falApiKey: string): Promise<string> {
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const fileName = `room-upload-${Date.now()}.${ext}`;
  
  const formData = new FormData();
  const uint8 = new Uint8Array(buffer);
  const blob = new Blob([uint8], { type: mimeType });
  formData.append('file_upload', blob, fileName);
  
  console.log(`   📤 Uploading to fal.ai: ${fileName} (${uint8.length} bytes)`);
  console.log(`   Endpoint: https://api.fal.ai/v1/serverless/files/file/local/uploads/${fileName}`);
  
  const response = await fetch(`https://api.fal.ai/v1/serverless/files/file/local/uploads/${fileName}`, {
    method: "POST",
    headers: {
      "Authorization": `Key ${falApiKey}`,
    },
    body: formData,
  });
  
  console.log(`   Response status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const error = await response.text();
    console.error(`   ❌ fal.ai upload FAILED:`);
    console.error(`      Status: ${response.status}`);
    console.error(`      Error: ${error}`);
    throw new Error(`fal.ai storage upload failed (${response.status}): ${error}`);
  }
  
  const result = await response.json();
  console.log(`   📋 fal.ai response body:`, JSON.stringify(result, null, 2));
  
  const uploadedUrl = result.url || result.file_url || result.access_url;
  if (!uploadedUrl) {
    console.error(`   ❌ No URL found in response`);
    console.error(`   Response keys:`, Object.keys(result));
    throw new Error(`fal.ai upload: no URL in response: ${JSON.stringify(result)}`);
  }
  
  console.log(`   ✅ Upload successful: ${uploadedUrl}`);
  return uploadedUrl;
}

/**
 * Convert any image source to fal.ai compatible public URL
 * - data: URIs → extract base64, upload to fal.ai
 * - http(s) URLs → download image, re-upload to fal.ai (ensures accessibility)
 */
async function ensureFalCompatibleUrl(imageUrl: string, falApiKey: string): Promise<string> {
  console.log(`\n🔄 ensureFalCompatibleUrl called with: ${imageUrl.substring(0, 100)}...`);
  
  if (imageUrl.startsWith('data:')) {
    console.log(`   Type: DATA URI`);
    console.log(`   Length: ${imageUrl.length} chars`);
    console.log(`   Action: Converting to fal.ai storage URL...`);
    
    const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      console.error(`   ❌ ERROR: Invalid data URI format`);
      throw new Error("Invalid data URI format");
    }
    
    const mimeType = matches[1];
    const base64Length = matches[2].length;
    console.log(`   MIME type: ${mimeType}`);
    console.log(`   Base64 length: ${base64Length} chars`);
    
    const buffer = Buffer.from(matches[2], 'base64');
    console.log(`   Buffer size: ${buffer.length} bytes`);
    
    const result = await uploadBufferToFal(buffer, mimeType, falApiKey);
    console.log(`   ✅ SUCCESS: Converted data URI to ${result}`);
    return result;
  }
  
  if (imageUrl.startsWith('http')) {
    console.log(`   Type: HTTP URL`);
    console.log(`   URL: ${imageUrl}`);
    console.log(`   Action: Downloading and re-uploading to fal.ai storage...`);
    
    try {
      console.log(`   📥 Fetching image...`);
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        console.error(`   ❌ ERROR: Failed to download - HTTP ${response.status} ${response.statusText}`);
        throw new Error(`Failed to download: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      console.log(`   Content-Type: ${contentType}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`   Downloaded: ${buffer.length} bytes`);
      
      const result = await uploadBufferToFal(buffer, contentType, falApiKey);
      console.log(`   ✅ SUCCESS: Re-uploaded to ${result}`);
      return result;
    } catch (err) {
      console.error(`   ❌ ERROR during download/re-upload: ${err}`);
      console.warn(`   ⚠️ FALLBACK: Using original URL (might fail if fal.ai can't access it)`);
      return imageUrl;
    }
  }
  
  console.warn(`   ⚠️ WARNING: Unknown URL format, returning as-is`);
  return imageUrl;
}

/**
 * Edit a room image to add furniture using fal.ai
 */
export async function editRoomImage({
  imageUrl,
  productImageUrl,
  productImageUrls,
  prompt,
  style,
}: FalImageEditRequest): Promise<FalImageEditResponse> {
  const falApiKey = process.env.FAL_API_KEY;
  
  if (!falApiKey) {
    throw new Error("FAL_API_KEY not configured. Get your key from fal.ai with code: techeurope-paris");
  }

  const startTime = Date.now();

  // Use multiple product URLs if provided, otherwise fall back to single productImageUrl
  const furnitureUrls = productImageUrls?.length ? productImageUrls : (productImageUrl ? [productImageUrl] : []);
  const hasFurniture = furnitureUrls.length > 0;

  // Build prompt for furniture editing with reference
  const enhancedPrompt = hasFurniture
    ? [
        "Image 1: base room (keep walls, floor, lighting as-is)",
        `Add the following items to the room: ${prompt}`,
        `Images 2+: reference furniture to add`,
        `Naturally place all furniture into the room`,
        `Position items in empty spaces to compose a coherent interior`,
        `Maintain room architecture and perspective`,
        `Match lighting and shadows`,
        style ? `${style} style` : "",
      ].filter(Boolean).join(". ")
    : [
        prompt,
        "Natural placement aligned with walls",
        "Match room lighting",
        style ? `${style} style` : "",
      ].filter(Boolean).join(", ");

  console.log(`🖼️ Generating with nano-banana/edit:`);
  console.log(`   📍 Base room: ${imageUrl.substring(0, 100)}...`);
  if (furnitureUrls.length > 0) {
    console.log(`   🛋️ Reference products: ${furnitureUrls.length} item(s)`);
    furnitureUrls.forEach((url, i) => console.log(`      ${i + 1}. ${url.substring(0, 80)}...`));
  }
  console.log(`   💬 Prompt: ${enhancedPrompt.substring(0, 150)}...`);

  try {
    // Convert data URIs to fal.ai compatible URLs (upload if needed)
    console.log(`🔄 Ensuring images are fal.ai compatible...`);
    const roomImageUrl = await ensureFalCompatibleUrl(imageUrl, falApiKey);
    const productUrls = await Promise.all(
      furnitureUrls.map(url => ensureFalCompatibleUrl(url, falApiKey))
    );
    
    const images = [roomImageUrl, ...productUrls];
    
    console.log(`📤 Sending ${images.length} images to fal.ai nano-banana/edit`);
    console.log(`   Image 1 (room): ${roomImageUrl}`);
    productUrls.forEach((url, i) => console.log(`   Image ${i + 2} (product): ${url}`));
    
    const response = await fetch("https://fal.run/fal-ai/nano-banana/edit", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_urls: images, // Array: [room, product]
        prompt: enhancedPrompt,
        guidance_scale: 3.5,
        num_inference_steps: 30,
        strength: 0.5, // Balance between preserving room and adding furniture
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`fal.ai API error: ${error}`);
    }

    const result = await response.json();
    
    console.log(`✅ fal.ai response received:`, result.images ? `${result.images.length} image(s) generated` : 'ERROR: no images in response');
    if (result.images?.[0]) {
      console.log(`   🎨 Result URL: ${result.images[0].url}`);
    }
    
    console.log(`✅ Generated successfully in ${Date.now() - startTime}ms`);
    
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
