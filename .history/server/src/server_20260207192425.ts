import { McpServer } from "skybridge/server";
import { z } from "zod";
import { editRoomImage, generateRoomImage } from "./services/fal-service.js";
import { searchIkeaProducts as searchIkeaProductsAPI } from "./services/ikea-service.js";

const server = new McpServer(
  { name: "interior-architect", version: "1.0.0" },
  { capabilities: {} },
)
  .registerWidget(
    "interior-architect",
    {
      description:
        "Browse IKEA furniture catalogue. Select a product, then provide your room image to see it furnished.",
      _meta: {
        ui: {
          csp: {
            connectDomains: ["https://image.pollinations.ai", "https://fal.run"],
            resourceDomains: ["https://images.unsplash.com", "https://image.pollinations.ai"],
            redirectDomains: ["https://www.ikea.com"],
          },
        },
      },
    },
    {
      description:
        "Step 1: Provide room image. Step 2: Browse furniture catalogue. Step 3: Click product to generate instantly.",
      inputSchema: {
        imageUrl: z.string().optional().describe("Your room image URL (required first)"),
        prompt: z.string().optional().describe("Furniture to add (e.g., 'table and chairs')"),
        style: z.string().optional().describe("Style filter: scandinavian, modern, industrial, minimalist"),
        budget: z.number().optional().describe("Budget in EUR"),
        selectedProductId: z.string().optional().describe("Product ID - triggers immediate generation"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ imageUrl, prompt, style, budget, selectedProductId }) => {
      try {
        // PHASE 1: Need room image first
        if (!imageUrl) {
          return {
            content: [{
              type: "text" as const,
              text: "Please provide your room image URL first. Then I'll show you furniture options to add.",
            }],
            _meta: {
              mode: "needImage",
            },
          };
        }

        // PHASE 2: Show catalogue (have imageUrl, no product selected yet)
        if (!selectedProductId) {
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

          return {
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
        }

        // PHASE 3: Generate image immediately (have both imageUrl + selectedProductId)
        const products = await searchIkeaProductsAPI({
          query: prompt || style || "furniture",
          style,
          maxPrice: budget,
          limit: 8,
        });

        const selectedProduct = products.find(p => p.id === selectedProductId);
        const imagePrompt = selectedProduct
          ? `Add ${selectedProduct.name} to this room`
          : "furnished room";

        let furnishedImageUrl: string;
        let processingTime = 0;

        if (process.env.FAL_API_KEY) {
          const result = await editRoomImage({
            imageUrl,
            prompt: imagePrompt,
            style,
          });
          furnishedImageUrl = result.furnishedImageUrl;
          processingTime = result.processingTime;
        } else {
          const encoded = encodeURIComponent(`Interior design: ${imagePrompt}, ${style || "modern"} style`);
          furnishedImageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=768&seed=${Date.now()}&nologo=true`;
        }

        return {
          content: [{
            type: "text" as const,
            text: `Generated furnished room with ${selectedProduct?.name}. Processing: ${processingTime}ms.`,
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
  )

  .registerTool(
    "search-ikea-products",
    {
      description: "Search IKEA catalogue for furniture.",
      inputSchema: {
        query: z.string().describe("Search query"),
        category: z.string().optional().describe("Category filter"),
        style: z.string().optional().describe("Style filter"),
        maxPrice: z.number().optional().describe("Max price in EUR"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ query, category, style, maxPrice }) => {
      try {
        const products = await searchIkeaProductsAPI({
          query,
          category,
          style,
          maxPrice,
          limit: 10,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${products.length} IKEA products`,
            },
            ...products.map(p => ({
              type: "text" as const,
              text: `${p.name} - €${p.price} - ${p.articleNumber}`,
            })),
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: `Error: ${error}` }],
          isError: true,
        };
      }
    },
  )

  .registerTool(
    "generate-furnished-room",
    {
      description: "Generate furnished room image using fal.ai.",
      inputSchema: {
        imageUrl: z.string().optional().describe("Original room image"),
        prompt: z.string().describe("Furniture to add"),
        style: z.string().optional().describe("Design style"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ imageUrl, prompt, style }) => {
      try {
        let result;

        if (imageUrl && process.env.FAL_API_KEY) {
          result = await editRoomImage({ imageUrl, prompt, style });
        } else if (process.env.FAL_API_KEY) {
          result = await generateRoomImage({ prompt, style });
        } else {
          const encoded = encodeURIComponent(`Interior: ${prompt}, ${style || "modern"}`);
          result = {
            furnishedImageUrl: `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=768`,
            processingTime: 0,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Generated: ${result.furnishedImageUrl}`,
            },
            {
              type: "image" as const,
              data: result.furnishedImageUrl,
              mimeType: "image/jpeg",
            },
          ],
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
