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
        "Step 1: Browse furniture catalogue. Step 2: Click 'Generate Room' on a product. Step 3: Provide your room image.",
      inputSchema: {
        imageUrl: z.string().optional().describe("Your room image URL (provide after selecting product)"),
        prompt: z.string().optional().describe("Optional: additional furniture description"),
        style: z.string().optional().describe("Style filter: scandinavian, modern, industrial, minimalist"),
        budget: z.number().optional().describe("Budget in EUR"),
        selectedProductId: z.string().optional().describe("Product ID from catalogue"),
        generateImage: z.boolean().optional().describe("Internal: trigger image generation"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ imageUrl, prompt, style, budget, selectedProductId, generateImage = false }) => {
      try {
        // PHASE 1: Show catalogue (no inputs = browse mode)
        if (!selectedProductId && !generateImage) {
          const products = await searchIkeaProductsAPI({
            query: prompt || style || "furniture",
            style,
            maxPrice: budget,
            limit: 12,
          });

          return {
            content: [{
              type: "text" as const,
              text: `Browse ${products.length} IKEA products. Click 'Generate Room' on any product to continue.`,
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
            },
          };
        }

        // Get products for later phases
        const products = await searchIkeaProductsAPI({
          query: prompt || style || "furniture",
          style,
          maxPrice: budget,
          limit: 8,
        });

        // PHASE 2: Product selected, need room image
        if (selectedProductId && !imageUrl && !generateImage) {
          const selected = products.find(p => p.id === selectedProductId);
          return {
            content: [{
              type: "text" as const,
              text: `Selected: ${selected?.name}. Now provide your room image URL to generate the furnished version.`,
            }],
          };
        }

        // PHASE 3: Generate image (must have both product + room image)
        if (!imageUrl || !selectedProductId) {
          return {
            content: [{
              type: "text" as const,
              text: "Please select a product first, then provide a room image URL.",
            }],
            isError: true,
          };
        }

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
