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
        "ONLY use this when user explicitly wants to: 1) Upload a room image and browse IKEA furniture, 2) Visualize furniture in their room. Do NOT use for general questions about furniture or interior design.",
      _meta: {
        ui: {
          csp: {
            connectDomains: ["https://image.pollinations.ai", "https://fal.run", "https://v3.fal.media", "https://fal.media"],
            resourceDomains: ["https://images.unsplash.com", "https://image.pollinations.ai", "https://v3.fal.media", "https://fal.media", "data:"],
            redirectDomains: ["https://www.ikea.com"],
          },
        },
      },
    },
    {
      description:
        "Step 1: Provide room image. Step 2: Browse furniture catalogue. Step 3: Click product to generate instantly.",
      inputSchema: {
        imageUrl: z.string().optional().describe("Your room image URL or data URI (required first)"),
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
    async ({ imageUrl, productImageUrl, prompt, style, budget, selectedProductId }) => {
      try {
        console.log("🔍 Interior Architect called with:", {
          hasImageUrl: !!imageUrl,
          imageUrlType: imageUrl?.startsWith('data:') ? 'data-uri' : imageUrl?.startsWith('http') ? 'url' : 'unknown',
          hasProductImageUrl: !!productImageUrl,
          hasSelectedProductId: !!selectedProductId,
          prompt,
        });

        // PHASE 1: Need room image first
        if (!imageUrl) {
          return {
            content: [{
              type: "text" as const,
              text: "Please upload your room image or provide an image URL. Then I'll show you furniture options to add.",
            }],
            _meta: {
              mode: "needImage",
            },
          };
        }

        console.log("✅ Room image received:", imageUrl.substring(0, 100) + "...");

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
        console.log(`   🏠 Room image: ${imageUrl}`);

        const imagePrompt = prompt || "Add furniture to this room";

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
