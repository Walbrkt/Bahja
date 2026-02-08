import { McpServer } from "skybridge/server";
import { z } from "zod";
import { editRoomImage } from "./services/fal-service.js";
import { searchIkeaProducts as searchIkeaProductsAPI } from "./services/ikea-service.js";

const server = new McpServer(
  { name: "interior-architect", version: "1.0.0" },
  { capabilities: {} },
)
  .registerWidget(
    "interior-architect",
    {
      description:
        "Browse IKEA furniture and visualize it in rooms. Widget handles image uploads and product selection.",
      _meta: {
        ui: {
          csp: {
            connectDomains: ["https://image.pollinations.ai", "https://fal.run", "https://api.fal.ai", "https://v3.fal.media", "https://fal.media"],
            resourceDomains: ["https://images.unsplash.com", "https://image.pollinations.ai", "https://v3.fal.media", "https://fal.media", "data:"],
            redirectDomains: ["https://www.ikea.com"],
          },
        },
      },
    },
    {
      description:
        "Interior design tool that shows IKEA furniture catalogue. When user shares a room image URL and mentions furniture (e.g., pastes image URL then says 'add a red sofa'), immediately call this tool with imageUrl (the URL they shared) and prompt (the furniture description like 'red sofa'). Widget shows matching IKEA products for user to click. DO NOT ask user for product details - show catalogue immediately.",
      inputSchema: {
        imageUrl: z.string().optional().describe("Room image URL from user's message (e.g., https://... .jpg or data: URI)"),
        productImageUrl: z.string().optional().describe("INTERNAL: Extract 'Product Image:' URL when user sends 'Generate room with this furniture' message from widget"),
        prompt: z.string().optional().describe("The furniture description with adjectives (e.g., 'red sofa', 'modern chandelier', 'wooden table'). For initial user message: extract furniture description ('add a red sofa' → 'red sofa'). For widget messages: extract from 'User wants:' line which contains the original description."),
        style: z.string().optional().describe("Style filter"),
        budget: z.number().optional().describe("Budget in EUR"),
        selectedProductId: z.string().optional().describe("INTERNAL: Extract 'Product ID:' from widget-generated messages to trigger image generation"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async ({ imageUrl, productImageUrl, prompt, style, budget, selectedProductId }) => {
      try {
        console.log("\n" + "=".repeat(80));
        console.log("🔍 INTERIOR ARCHITECT TOOL CALLED");
        console.log("=".repeat(80));
        console.log("Parameters received:", {
          imageUrl: imageUrl ? `${imageUrl.substring(0, 100)}... (${imageUrl.length} chars)` : '❌ NOT PROVIDED',
          imageUrlType: imageUrl?.startsWith('data:') ? 'DATA-URI' : imageUrl?.startsWith('http') ? 'HTTP-URL' : imageUrl ? 'UNKNOWN' : 'MISSING',
          productImageUrl: productImageUrl ? productImageUrl.substring(0, 80) : 'none',
          selectedProductId: selectedProductId || 'none',
          prompt: prompt || 'none',
          style: style || 'none',
          budget: budget || 'none',
        });
        console.log("=".repeat(80));

        // PHASE 1: Need room image first
        if (!imageUrl) {
          // Widget shows upload interface - just return empty state
          console.log("❌ No image provided in imageUrl parameter");
          return {
            content: [{
              type: "text" as const,
              text: "I need the room image URL. When the user uploads an image, please call this tool again and pass the image URL in the imageUrl parameter.",
            }],
            _meta: {
              mode: "needImage",
            },
          };
        }

        console.log("✅ Room image received:", imageUrl.substring(0, 100) + "...");
        console.log("   Type:", imageUrl.startsWith('data:') ? 'DATA URI' : imageUrl.startsWith('http') ? 'URL' : 'UNKNOWN');
        console.log("   Length:", imageUrl.length, "chars");
        console.log("   Source: imageUrl parameter");

        // PHASE 2: Show catalogue (have imageUrl, no product selected yet)
        if (!selectedProductId) {
          // Create specific search query from prompt
          const searchQuery = prompt 
            ? prompt  // Use exact prompt if provided (e.g., "table and chairs")
            : style 
            ? `${style} style furniture`  // Or search by style
            : "furniture";  // Fallback to general

          console.log("🔍 Building search query:");
          console.log("   prompt parameter:", prompt || 'NONE');
          console.log("   style parameter:", style || 'NONE');
          console.log("   Final searchQuery:", searchQuery);

          const products = await searchIkeaProductsAPI({
            query: searchQuery,
            style,
            maxPrice: budget,
            limit: 12,
          });

          const response = {
            content: [{
              type: "text" as const,
              text: `Browse ${products.length} IKEA products. Click any product to instantly generate your furnished room!`,
            }],
            _meta: {
              products: products.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                price: p.price,
                currency: p.currency,
                articleNumber: p.articleNumber,
                width: p.width,
                depth: p.depth,
                height: p.height,
                imageUrl: p.imageUrl,
                buyUrl: p.buyUrl,
                category: p.category,
                style: p.style,
              })),
              mode: "selection",
              roomImageUrl: imageUrl,
              userPrompt: searchQuery,
            },
          };
          console.log("✅ Returning catalogue with metadata:", {
            productsCount: products.length,
            mode: 'selection',
            roomImageUrlStored: imageUrl.substring(0, 100) + '...',
          });
          return response;
        }

        // PHASE 3: Generate image immediately (have both imageUrl + selectedProductId)
        // Use the same search query logic as PHASE 2 for consistency
        const imagePrompt = prompt 
          ? prompt  // Use furniture type extracted by AI (e.g., "chandelier", "sofa")
          : style 
          ? `${style} style furniture`
          : "furniture";

        console.log("🎨 PHASE 3: Generating image");
        console.log("   prompt parameter:", prompt || 'NONE');
        console.log("   style parameter:", style || 'NONE');
        console.log("   imagePrompt for fal.ai:", imagePrompt);

        let furnishedImageUrl: string;
        let processingTime = 0;

        if (process.env.FAL_API_KEY) {
          const result = await editRoomImage({
            imageUrl,
            productImageUrl, // Use passed product image URL
            prompt: imagePrompt,
            style,
          });
          furnishedImageUrl = result.furnishedImageUrl;
          processingTime = result.processingTime;
        } else {
          const encoded = encodeURIComponent(`Interior design: ${imagePrompt}, ${style || "modern"} style`);
          furnishedImageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=768&seed=${Date.now()}&nologo=true`;
        }

        // Get products for display in result (optional, for showing related items)
        const products = await searchIkeaProductsAPI({
          query: imagePrompt,  // Use same query as image generation
          style,
          maxPrice: budget,
          limit: 8,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `✨ **Your furnished room is ready!**\n\n![Generated Room](${furnishedImageUrl})\n\n⏱️ Processing time: ${processingTime}ms\n\n👇 Check the widget below to browse more IKEA products.`,
            }
          ],
          _meta: {
            furnishedImageUrl,
            originalImageUrl: imageUrl,
            mode: "result",
            products: products.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.price,
              currency: p.currency,
              articleNumber: p.articleNumber,
              width: p.width,
              depth: p.depth,
              height: p.height,
              imageUrl: p.imageUrl,
              buyUrl: p.buyUrl,
              category: p.category,
              style: p.style,
            })),
          },
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: `Error: ${error}` }],
          isError: true,
        };
      }
    },
  );

export type AppType = typeof server;
export default server;
