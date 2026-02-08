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
        "Interior design widget. CRITICAL: When user uploads/shares a room image, extract the image URL and pass it as imageUrl parameter. Call this tool immediately when user mentions furniture, decorating, or room design.",
      inputSchema: {
        imageUrl: z.string().optional().describe("CRITICAL: When user uploads/shares an image, extract the image URL from chat context and pass it here. Required for all operations. Can be https:// URL or data:image URI. If user uploaded an image in the conversation, YOU MUST extract and pass it."),
        productImageUrl: z.string().optional().describe("Product image URL from selected product"),
        prompt: z.string().optional().describe("Furniture to add (e.g., 'table and chairs')"),
        style: z.string().optional().describe("Style filter: scandinavian, modern, industrial, minimalist"),
        budget: z.number().optional().describe("Budget in EUR"),
        selectedProductId: z.string().optional().describe("Product ID - triggers immediate generation"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async ({ imageUrl, productImageUrl, prompt, style, budget, selectedProductId }, context) => {
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

        // Try to extract image from context if not provided
        let extractedImageUrl = imageUrl;
        if (!extractedImageUrl && context?.attachments) {
          console.log("🔍 No imageUrl provided, checking context attachments...");
          for (const attachment of context.attachments) {
            if (attachment.mimeType?.startsWith('image/')) {
              extractedImageUrl = attachment.uri || attachment.url;
              console.log("✅ Found image in attachments:", extractedImageUrl?.substring(0, 100));
              break;
            }
          }
        }

        // PHASE 1: Need room image first
        if (!extractedImageUrl) {
          // Widget shows upload interface - just return empty state
          console.log("❌ No image found in parameters or context");
          return {
            content: [{
              type: "text" as const,
              text: "Please upload a room image so I can help you visualize furniture. You can upload directly in chat or use the widget above.",
            }],
            _meta: {
              mode: "needImage",
            },
          };
        }

        console.log("✅ Room image received:", extractedImageUrl.substring(0, 100) + "...");
        console.log("   Type:", extractedImageUrl.startsWith('data:') ? 'DATA URI' : extractedImageUrl.startsWith('http') ? 'URL' : 'UNKNOWN');
        console.log("   Length:", extractedImageUrl.length, "chars");
        console.log("   Source:", imageUrl ? 'parameter' : 'context.attachments');

        // PHASE 2: Show catalogue (have imageUrl, no product selected yet)
        if (!selectedProductId) {
          console.log("📋 PHASE 2: Showing product catalogue");
          console.log("   💾 Storing room image in _meta.roomImageUrl for later use");
          // Create specific search query from prompt
          const searchQuery = prompt 
            ? prompt  // Use exact prompt if provided (e.g., "table and chairs")
            : style 
            ? `${style} style furniture`  // Or search by style
            : "furniture";  // Fallback to general

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
        console.log(`🎨 Generating furnished room`);
        console.log(`   🖼️ Product image: ${productImageUrl}`);
        console.log(`   🏠 Room image: ${extractedImageUrl}`);

        const imagePrompt = prompt || "Add furniture to this room";

        let furnishedImageUrl: string;
        let processingTime = 0;

        if (process.env.FAL_API_KEY) {
          const result = await editRoomImage({
            imageUrl: extractedImageUrl,
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
          query: prompt || style || "furniture",
          style,
          maxPrice: budget,
          limit: 8,
        });

        return {
          content: [{
            type: "text" as const,
            text: `Generated furnished room. Processing: ${processingTime}ms.`,
          }],
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
