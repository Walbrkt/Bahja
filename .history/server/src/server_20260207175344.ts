import { McpServer } from "skybridge/server";
import { z } from "zod";
import { editRoomImage, generateRoomImage } from "./services/fal-service.js";
import { analyzeRoomWithGroq, matchProductsWithGroq } from "./services/groq-service.js";
import { searchIkeaProducts as searchIkeaProductsAPI } from "./services/ikea-service.js";

const server = new McpServer(
  { name: "interior-architect", version: "1.0.0" },
  { capabilities: {} },
)
  .registerWidget(
    "interior-architect",
    {
      description:
        "AI-powered interior design tool. Upload a room photo, get IKEA product suggestions first, then generate furnished room image.",
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
        "Upload a room image and describe desired furniture. Returns IKEA product suggestions. Click 'Generate Room' on any product to see it in your space.",
      inputSchema: {
        imageUrl: z.string().describe("URL of the room image"),
        prompt: z.string().describe("Furniture description (e.g., 'add a grey sofa')"),
        style: z.string().optional().describe("Style: scandinavian, modern, industrial, minimalist"),
        budget: z.number().optional().describe("Budget in EUR"),
        selectedProductId: z.string().optional().describe("Product ID to generate image with"),
        generateImage: z.boolean().optional().describe("If true, generate furnished image. Default: false (show products only)"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ imageUrl, prompt, style, budget, selectedProductId, generateImage = false }) => {
      try {
        // Step 1: Analyze room with Groq (FREE)
        if (imageUrl && process.env.GROQ_API_KEY) {
          try {
            await analyzeRoomWithGroq(imageUrl);
          } catch (error) {
            console.warn("Room analysis failed:", error);
          }
        }

        // Step 2: Use Groq (FREE) to match products
        let aiRecommendations: string[] = [];
        if (process.env.GROQ_API_KEY) {
          try {
            aiRecommendations = await matchProductsWithGroq({
              userPrompt: prompt,
              budget,
              style,
            });
          } catch (error) {
            console.warn("AI product matching failed:", error);
          }
        }

        // Step 3: Search IKEA products
        const products = await searchIkeaProductsAPI({
          query: aiRecommendations.length > 0 ? aiRecommendations.join(" ") : prompt,
          style,
          maxPrice: budget,
          limit: 8,
        });

        // PHASE 1: Product Selection (no image generation)
        if (!generateImage && !selectedProductId) {
          const _meta = {
            originalImageUrl: imageUrl,
            products: products.slice(0, 8).map((p) => ({
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
            prompt,
            style,
            mode: "selection",
          };

          return {
            content: [
              {
                type: "text" as const,
                text: `Found ${products.length} matching IKEA products for: "${prompt}"${style ? ` (${style} style)` : ""}${budget ? ` within €${budget}` : ""}. Click 'Generate Room' on any product to see it in your space.`,
              },
            ],
            _meta,
          };
        }

        // PHASE 2: Image Generation (when product selected)
        let furnishedImageUrl: string;
        let processingTime = 0;
        
        // Build prompt with selected product
        let imagePrompt = prompt;
        if (selectedProductId) {
          const selectedProduct = products.find(p => p.id === selectedProductId);
          if (selectedProduct) {
            imagePrompt = `Add ${selectedProduct.name} (${selectedProduct.description}) to this room. ${prompt}`;
          }
        }
        
        if (imageUrl && process.env.FAL_API_KEY) {
          const result = await editRoomImage({
            imageUrl,
            prompt: imagePrompt,
            style,
          });
          furnishedImageUrl = result.furnishedImageUrl;
          processingTime = result.processingTime;
        } else if (process.env.FAL_API_KEY) {
          const result = await generateRoomImage({
            prompt: imagePrompt,
            style,
          });
          furnishedImageUrl = result.furnishedImageUrl;
          processingTime = result.processingTime;
        } else {
          // Fallback to Pollinations.ai
          const furnishedPrompt = [
            `Interior design photography`,
            imagePrompt,
            style ? `${style} style` : "",
            `Professional photography, realistic`,
          ].filter(Boolean).join(", ");
          const encodedPrompt = encodeURIComponent(furnishedPrompt);
          furnishedImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${Date.now()}&nologo=true&enhance=true`;
        }

        const _meta = {
          furnishedImageUrl,
          originalImageUrl: imageUrl,
          mode: "result",
          products: products.slice(0, 8).map((p) => ({
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
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Generated furnished room image with ${products.length} IKEA products. Processing time: ${processingTime}ms.`,
            },
          ],
          _meta,
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
      description:
        "Search IKEA catalog for furniture. Returns products with images, prices, article numbers, and buy links.",
      inputSchema: {
        query: z.string().describe("Search query: furniture type or description"),
        category: z.string().optional().describe("Category: sofa, table, chair, shelf, lamp, etc."),
        style: z.string().optional().describe("Style: scandinavian, modern, industrial, minimalist"),
        maxPrice: z.number().optional().describe("Maximum price in EUR"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
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
              text: `Found ${products.length} IKEA products matching: "${query}"${category ? ` in category ${category}` : ""}${style ? ` with ${style} style` : ""}${maxPrice ? ` under €${maxPrice}` : ""}`,
            },
            ...products.map((p) => ({
              type: "text" as const,
              text: `${p.name} - €${p.price} - ${p.description} - Article: ${p.articleNumber} - ${p.width}×${p.depth}×${p.height}cm - Buy: ${p.buyUrl}`,
            })),
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: `Error searching products: ${error}` }],
          isError: true,
        };
      }
    },
  )

  .registerTool(
    "generate-furnished-room",
    {
      description:
        "Generate AI-furnished room image using fal.ai. Can edit existing room photo or create from scratch.",
      inputSchema: {
        imageUrl: z.string().optional().describe("Original room image URL (for editing)"),
        prompt: z.string().describe("Furniture to add (e.g., 'add modern grey sofa and coffee table')"),
        style: z.string().optional().describe("Design style: scandinavian, modern, industrial, minimalist"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ imageUrl, prompt, style }) => {
      try {
        let result;
        
        if (imageUrl && process.env.FAL_API_KEY) {
          result = await editRoomImage({ imageUrl, prompt, style });
        } else if (process.env.FAL_API_KEY) {
          result = await generateRoomImage({ prompt, style });
        } else {
          // Fallback
          const enhancedPrompt = [
            "Interior design photography",
            prompt,
            style ? `${style} style` : "",
            "realistic, professional",
          ].filter(Boolean).join(", ");
          const encodedPrompt = encodeURIComponent(enhancedPrompt);
          result = {
            furnishedImageUrl: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${Date.now()}&nologo=true`,
            processingTime: 0,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Generated furnished room image: ${result.furnishedImageUrl}`,
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
          content: [{ type: "text" as const, text: `Error generating image: ${error}` }],
          isError: true,
        };
      }
    },
  );

export default server;
