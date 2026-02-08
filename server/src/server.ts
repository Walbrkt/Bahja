import { McpServer } from "skybridge/server";
import { z } from "zod";
import { editRoomImage, generateRoomImage } from "./services/fal-service.js";
import { searchIkeaProducts } from "./services/ikea-service.js";

/**
 * Generate an image using fal.ai flux-pro model (same as interior-architect).
 * Uses the generateRoomImage function from fal-service.ts.
 * Returns the raw fal.ai URL directly — whitelisted in CSP resourceDomains.
 */
async function generateImageWithFal(
  prompt: string,
  fallbackUrl: string,
): Promise<{ url: string; isFallback: boolean }> {
  try {
    console.log("[fal.ai] Generating image with flux-pro...");
    console.log("[fal.ai] Prompt:", prompt.substring(0, 300));
    
    const result = await generateRoomImage({ prompt });
    
    if (result.furnishedImageUrl) {
      console.log("[fal.ai] ✅ Image generated:", result.furnishedImageUrl.substring(0, 100));
      // Check if it's a pollinations fallback
      const isFallback = result.furnishedImageUrl.includes("pollinations.ai");
      return { url: result.furnishedImageUrl, isFallback };
    }

    return { url: fallbackUrl, isFallback: true };
  } catch (error: any) {
    console.error("[fal.ai] ❌ Generation failed:", error?.message || error);
    return { url: fallbackUrl, isFallback: true };
  }
}

// ─── Style-specific prompt enrichment ────────────────────────────────────────

const STYLE_VISUAL_PROMPTS: Record<string, string> = {
  moroccan: "Moroccan riad interior with zellige tile mosaics, carved cedar wood arches, pierced brass lanterns, handwoven Berber rugs on terracotta floor, tadelakt plaster walls, low cushioned seating, geometric Islamic patterns, warm golden ambient light, jewel tones",
  bohemian: "Bohemian eclectic interior with macramé wall hangings, rattan furniture, hanging plants, vintage Persian rugs, string lights, floor cushions, earthy tones with jewel colors",
  scandinavian: "Scandinavian minimalist interior with clean white walls, light oak wood floors, organic furniture shapes, large windows, wool throws, muted neutral palette, potted plants",
  modern: "Contemporary modern interior with clean geometric lines, sleek furniture, neutral palette with bold accents, statement art, polished floors, recessed lighting, glass and metal accents",
  industrial: "Industrial loft interior with exposed brick walls, steel beams, polished concrete floor, Edison bulb pendant lights, reclaimed wood furniture, leather seating, factory windows",
  classic: "Classic European interior with ornate crown moldings, elegant chandelier, wood paneling, wingback chairs, Persian silk rug, marble fireplace, oil paintings in gilded frames",
  minimal: "Ultra-minimal interior with pure white walls, single statement furniture, vast open space, concrete and natural materials, architectural light and shadow, monochrome palette",
  french: "French Parisian apartment with Haussmann tall ceilings, ornate plaster moldings, herringbone parquet oak floors, marble fireplace, Louis XVI furniture, crystal chandelier, gilded mirrors",
  japanese: "Japanese wabi-sabi interior with tatami mat floor, shoji screen doors, low wooden furniture, tokonoma alcove, natural wood and bamboo, paper lantern lighting, zen garden view",
  tropical: "Tropical resort interior with rattan and bamboo furniture, lush tropical plants, ceiling fan, woven jute rug, white linen curtains, natural wood and stone, ocean-inspired colors",
};

/**
 * Build a concise, style-first prompt for AI image generation.
 * Front-loads the style description for maximum prompt adherence.
 */
function buildImagePrompt(params: {
  style: string;
  roomType?: string | null;
  roomWidth: number;
  roomLength: number;
  roomHeight: number;
  paintColor?: string | null;
  paintHex?: string | null;
  furnitureNames?: string[];
  userPrompt?: string | null;
}): string {
  const { style, roomType, paintColor, paintHex, furnitureNames, userPrompt } = params;
  
  // Get style-specific visual description — THIS IS THE MOST IMPORTANT PART
  const styleKey = style.toLowerCase().replace(/[^a-z]/g, "");
  const styleVisuals = STYLE_VISUAL_PROMPTS[styleKey] 
    || STYLE_VISUAL_PROMPTS[Object.keys(STYLE_VISUAL_PROMPTS).find(k => styleKey.includes(k)) || ""] 
    || `${style} interior design`;

  // Build prompt with style FIRST (most important for adherence)
  const parts: string[] = [];
  
  // 1. Style description first — front-loaded for maximum adherence
  parts.push(styleVisuals);
  
  // 2. Room type
  parts.push(`${roomType || "living room"}`);
  
  // 3. Wall color
  if (paintColor && paintHex) {
    parts.push(`walls painted ${paintColor} (${paintHex})`);
  } else if (paintColor) {
    parts.push(`${paintColor} walls`);
  }

  // 4. Key furniture pieces (max 4 to keep prompt focused)
  if (furnitureNames && furnitureNames.length > 0) {
    const items = furnitureNames.slice(0, 4).join(", ");
    parts.push(`featuring ${items}`);
  }

  // 5. User's custom request
  if (userPrompt) {
    parts.push(userPrompt);
  }

  // 6. Photography quality — keep short
  parts.push("professional interior design photography, wide angle, natural daylight, photorealistic, high detail");

  return parts.join(". ") + ".";
}

// ─── Mock Furniture Catalog ──────────────────────────────────────────────────

const FURNITURE_CATALOG = [
  {
    id: "sofa-scandi-01",
    name: "Nordic Comfort 3-Seater Sofa",
    description: "Minimalist Scandinavian sofa with oak legs and linen upholstery. Perfect for living rooms.",
    price: 899,
    currency: "EUR",
    width: 210,
    depth: 85,
    height: 80,
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/cat/canapes-fu003/",
    retailer: "IKEA",
    category: "sofa",
    style: "scandinavian",
  },
  {
    id: "sofa-modern-01",
    name: "Milano Velvet Sofa",
    description: "Luxurious deep-green velvet sofa with gold-tipped legs. Statement piece for modern interiors.",
    price: 1299,
    currency: "EUR",
    width: 220,
    depth: 90,
    height: 75,
    imageUrl: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/canapes/",
    retailer: "Maisons du Monde",
    category: "sofa",
    style: "modern",
  },
  {
    id: "table-scandi-01",
    name: "Oslo Round Coffee Table",
    description: "Light oak round coffee table with tapered legs. Timeless Scandinavian design.",
    price: 249,
    currency: "EUR",
    width: 80,
    depth: 80,
    height: 45,
    imageUrl: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/cat/tables-basses-10382/",
    retailer: "IKEA",
    category: "table",
    style: "scandinavian",
  },
  {
    id: "table-indus-01",
    name: "Factory Loft Dining Table",
    description: "Industrial-style dining table with reclaimed wood top and black metal legs. Seats 6.",
    price: 699,
    currency: "EUR",
    width: 180,
    depth: 90,
    height: 76,
    imageUrl: "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/tables/",
    retailer: "Maisons du Monde",
    category: "table",
    style: "industrial",
  },
  {
    id: "chair-scandi-01",
    name: "Copenhagen Dining Chair (set of 2)",
    description: "Curved plywood shell chair with wool cushion. Mid-century Scandinavian classic.",
    price: 349,
    currency: "EUR",
    width: 50,
    depth: 52,
    height: 80,
    imageUrl: "https://images.unsplash.com/photo-1503602642458-232111445657?w=400&h=300&fit=crop",
    buyUrl: "https://www.habitat.fr/chaises/",
    retailer: "Habitat",
    category: "chair",
    style: "scandinavian",
  },
  {
    id: "shelf-modern-01",
    name: "Geometric Wall Shelf Unit",
    description: "Asymmetric floating shelf unit in matte white. Ideal for books and decor display.",
    price: 179,
    currency: "EUR",
    width: 120,
    depth: 25,
    height: 180,
    imageUrl: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/cat/etageres-st002/",
    retailer: "IKEA",
    category: "shelf",
    style: "modern",
  },
  {
    id: "lamp-boho-01",
    name: "Rattan Floor Lamp",
    description: "Handwoven rattan shade floor lamp with warm-tone LED bulb. Bohemian accent lighting.",
    price: 129,
    currency: "EUR",
    width: 40,
    depth: 40,
    height: 160,
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/lampadaires/",
    retailer: "Maisons du Monde",
    category: "lamp",
    style: "bohemian",
  },
  {
    id: "rug-modern-01",
    name: "Abstract Wool Area Rug 200×300",
    description: "Hand-tufted wool rug with abstract geometric pattern in neutral tones.",
    price: 459,
    currency: "EUR",
    width: 200,
    depth: 300,
    height: 2,
    imageUrl: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/cat/tapis-10653/",
    retailer: "IKEA",
    category: "rug",
    style: "modern",
  },
  {
    id: "bed-scandi-01",
    name: "Stockholm Platform Bed Frame",
    description: "Solid birch platform bed with integrated headboard. Clean Scandinavian lines. Queen size.",
    price: 599,
    currency: "EUR",
    width: 160,
    depth: 200,
    height: 35,
    imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/cat/lits-bm003/",
    retailer: "IKEA",
    category: "bed",
    style: "scandinavian",
  },
  {
    id: "desk-modern-01",
    name: "Aura Standing Desk",
    description: "Electric height-adjustable desk with bamboo top. Ideal for home offices.",
    price: 549,
    currency: "EUR",
    width: 140,
    depth: 70,
    height: 120,
    imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=300&fit=crop",
    buyUrl: "https://www.autonomous.ai/standing-desks",
    retailer: "Autonomous",
    category: "desk",
    style: "modern",
  },
  {
    id: "armchair-classic-01",
    name: "Chesterfield Leather Armchair",
    description: "Classic button-tufted Chesterfield armchair in cognac leather. Timeless elegance.",
    price: 849,
    currency: "EUR",
    width: 95,
    depth: 85,
    height: 78,
    imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/fauteuils/",
    retailer: "Maisons du Monde",
    category: "armchair",
    style: "classic",
  },
  {
    id: "mirror-boho-01",
    name: "Sunburst Rattan Mirror",
    description: "Large round mirror with handwoven rattan sunburst frame. 90cm diameter.",
    price: 159,
    currency: "EUR",
    width: 90,
    depth: 5,
    height: 90,
    imageUrl: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/miroirs/",
    retailer: "Maisons du Monde",
    category: "mirror",
    style: "bohemian",
  },
  // ── Moroccan / Traditional ──
  {
    id: "sofa-moroccan-01",
    name: "Marrakech Low Sofa Bench",
    description: "Traditional Moroccan low seating bench with carved cedar wood frame and embroidered cushions. Authentic riad style.",
    price: 1150,
    currency: "EUR",
    width: 200,
    depth: 70,
    height: 55,
    imageUrl: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/canapes/",
    retailer: "Maisons du Monde",
    category: "sofa",
    style: "moroccan",
  },
  {
    id: "table-moroccan-01",
    name: "Fez Brass Tray Table",
    description: "Hand-engraved brass tray table on folding wooden stand. Traditional Moroccan tea table.",
    price: 289,
    currency: "EUR",
    width: 60,
    depth: 60,
    height: 50,
    imageUrl: "https://images.unsplash.com/photo-1590422749897-47726d39daff?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/tables/",
    retailer: "Maisons du Monde",
    category: "table",
    style: "moroccan",
  },
  {
    id: "pouf-moroccan-01",
    name: "Leather Pouf Ottoman — Tan",
    description: "Hand-stitched Moroccan leather pouf with embroidered geometric patterns. Unstuffed — fill with textiles.",
    price: 89,
    currency: "EUR",
    width: 55,
    depth: 55,
    height: 35,
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/poufs/",
    retailer: "Maisons du Monde",
    category: "armchair",
    style: "moroccan",
  },
  {
    id: "pouf-moroccan-02",
    name: "Leather Pouf Ottoman — White",
    description: "White hand-stitched Moroccan leather pouf with traditional star pattern. Perfect accent seating.",
    price: 95,
    currency: "EUR",
    width: 55,
    depth: 55,
    height: 35,
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/poufs/",
    retailer: "Maisons du Monde",
    category: "armchair",
    style: "moroccan",
  },
  {
    id: "lamp-moroccan-01",
    name: "Moroccan Brass Lantern Floor Lamp",
    description: "Pierced brass lantern floor lamp casting intricate shadow patterns. Warm ambient lighting for traditional spaces.",
    price: 219,
    currency: "EUR",
    width: 30,
    depth: 30,
    height: 150,
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/lampadaires/",
    retailer: "Maisons du Monde",
    category: "lamp",
    style: "moroccan",
  },
  {
    id: "rug-moroccan-01",
    name: "Beni Ourain Wool Rug 200×300",
    description: "Authentic hand-knotted Moroccan Beni Ourain rug in cream with black geometric diamond pattern.",
    price: 799,
    currency: "EUR",
    width: 200,
    depth: 300,
    height: 3,
    imageUrl: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/tapis/",
    retailer: "Maisons du Monde",
    category: "rug",
    style: "moroccan",
  },
  {
    id: "rug-moroccan-02",
    name: "Azilal Colorful Berber Rug 170×240",
    description: "Vibrant hand-woven Moroccan Azilal rug with colorful abstract symbols on cream background.",
    price: 650,
    currency: "EUR",
    width: 170,
    depth: 240,
    height: 3,
    imageUrl: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/tapis/",
    retailer: "Maisons du Monde",
    category: "rug",
    style: "moroccan",
  },
  {
    id: "shelf-moroccan-01",
    name: "Carved Cedar Wall Shelf",
    description: "Hand-carved cedar wood wall shelf with traditional Moroccan geometric moucharabieh pattern.",
    price: 199,
    currency: "EUR",
    width: 100,
    depth: 20,
    height: 60,
    imageUrl: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/etageres/",
    retailer: "Maisons du Monde",
    category: "shelf",
    style: "moroccan",
  },
  {
    id: "mirror-moroccan-01",
    name: "Zellige Mosaic Frame Mirror",
    description: "Round mirror with handcrafted zellige mosaic tile frame in turquoise and gold. 80cm diameter.",
    price: 249,
    currency: "EUR",
    width: 80,
    depth: 5,
    height: 80,
    imageUrl: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/miroirs/",
    retailer: "Maisons du Monde",
    category: "mirror",
    style: "moroccan",
  },
  {
    id: "table-moroccan-02",
    name: "Carved Wood Side Table",
    description: "Small octagonal side table with intricate hand-carved Moroccan arabesque patterns. Dark walnut finish.",
    price: 179,
    currency: "EUR",
    width: 45,
    depth: 45,
    height: 55,
    imageUrl: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/tables/",
    retailer: "Maisons du Monde",
    category: "table",
    style: "moroccan",
  },
  // ── Minimalist ──
  {
    id: "sofa-minimal-01",
    name: "Muji-Style Linen Sofa",
    description: "Ultra-clean line sofa in natural linen. Japanese-inspired minimalism with low profile.",
    price: 780,
    currency: "EUR",
    width: 190,
    depth: 80,
    height: 65,
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
    buyUrl: "https://www.ikea.com/fr/fr/cat/canapes-fu003/",
    retailer: "IKEA",
    category: "sofa",
    style: "minimal",
  },
  {
    id: "table-minimal-01",
    name: "Concrete Coffee Table",
    description: "Raw concrete top coffee table with matte black steel legs. Brutalist minimalism.",
    price: 399,
    currency: "EUR",
    width: 100,
    depth: 60,
    height: 40,
    imageUrl: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400&h=300&fit=crop",
    buyUrl: "https://www.habitat.fr/tables/",
    retailer: "Habitat",
    category: "table",
    style: "minimal",
  },
  // ── Classic / Traditional ──
  {
    id: "sofa-classic-01",
    name: "Victorian Tufted Velvet Sofa",
    description: "Deep buttoned velvet sofa in royal blue with carved mahogany legs. Classic elegance.",
    price: 1890,
    currency: "EUR",
    width: 230,
    depth: 95,
    height: 90,
    imageUrl: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/canapes/",
    retailer: "Maisons du Monde",
    category: "sofa",
    style: "classic",
  },
  {
    id: "table-classic-01",
    name: "Louis XVI Marble Console Table",
    description: "Ornate console table with white marble top and gilded carved legs. French classic style.",
    price: 1290,
    currency: "EUR",
    width: 120,
    depth: 40,
    height: 85,
    imageUrl: "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/tables/",
    retailer: "Maisons du Monde",
    category: "table",
    style: "classic",
  },
  {
    id: "lamp-classic-01",
    name: "Crystal Chandelier Table Lamp",
    description: "Elegant crystal drops table lamp with brushed gold base. Classic luxury lighting.",
    price: 189,
    currency: "EUR",
    width: 30,
    depth: 30,
    height: 60,
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/lampadaires/",
    retailer: "Maisons du Monde",
    category: "lamp",
    style: "classic",
  },
  // ── Industrial ──
  {
    id: "shelf-indus-01",
    name: "Pipe & Wood Industrial Shelf",
    description: "Black iron pipe frame with reclaimed wood shelves. 5 tiers. Raw industrial charm.",
    price: 329,
    currency: "EUR",
    width: 100,
    depth: 30,
    height: 180,
    imageUrl: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=300&fit=crop",
    buyUrl: "https://www.maisonsdumonde.com/FR/fr/c/etageres/",
    retailer: "Maisons du Monde",
    category: "shelf",
    style: "industrial",
  },
  {
    id: "chair-indus-01",
    name: "Tolix Metal Dining Chair (set of 2)",
    description: "Iconic powder-coated steel stacking chairs in matte black. Industrial bistro classic.",
    price: 189,
    currency: "EUR",
    width: 44,
    depth: 44,
    height: 85,
    imageUrl: "https://images.unsplash.com/photo-1503602642458-232111445657?w=400&h=300&fit=crop",
    buyUrl: "https://www.habitat.fr/chaises/",
    retailer: "Habitat",
    category: "chair",
    style: "industrial",
  },
];

// ─── Mock Paint Catalog ──────────────────────────────────────────────────────

const PAINT_CATALOG = [
  {
    id: "paint-white-01",
    name: "Snow White Matte",
    description: "Pure bright white matte wall paint. Clean, fresh, and versatile for any room.",
    price: 45,
    currency: "EUR",
    color: "White",
    colorHex: "#FAFAFA",
    finish: "Matte",
    coverage: "12m²/L",
    imageUrl: "https://images.unsplash.com/photo-1562184552-997c461abbe6?w=400&h=300&fit=crop",
    buyUrl: "https://www.leroymerlin.fr/produits/peinture/",
    retailer: "Leroy Merlin",
  },
  {
    id: "paint-sage-01",
    name: "Sage Garden",
    description: "Soft sage green with gray undertones. Calming and natural — perfect for bedrooms and living rooms.",
    price: 52,
    currency: "EUR",
    color: "Sage Green",
    colorHex: "#B2BDA0",
    finish: "Eggshell",
    coverage: "11m²/L",
    imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop",
    buyUrl: "https://www.leroymerlin.fr/produits/peinture/",
    retailer: "Leroy Merlin",
  },
  {
    id: "paint-navy-01",
    name: "Midnight Navy",
    description: "Deep navy blue with a satin sheen. Bold accent wall color for a dramatic effect.",
    price: 58,
    currency: "EUR",
    color: "Navy Blue",
    colorHex: "#1B2A4A",
    finish: "Satin",
    coverage: "10m²/L",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    buyUrl: "https://www.castorama.fr/peinture/",
    retailer: "Castorama",
  },
  {
    id: "paint-terracotta-01",
    name: "Tuscan Terracotta",
    description: "Warm earthy terracotta. Brings Mediterranean warmth and character to any space.",
    price: 49,
    currency: "EUR",
    color: "Terracotta",
    colorHex: "#C67B5C",
    finish: "Matte",
    coverage: "11m²/L",
    imageUrl: "https://images.unsplash.com/photo-1525909002-1b05e0c869d8?w=400&h=300&fit=crop",
    buyUrl: "https://www.leroymerlin.fr/produits/peinture/",
    retailer: "Leroy Merlin",
  },
  {
    id: "paint-blush-01",
    name: "Rose Blush",
    description: "Delicate pink blush with warm undertones. Soft, elegant, and contemporary.",
    price: 55,
    currency: "EUR",
    color: "Blush Pink",
    colorHex: "#E8C4C4",
    finish: "Matte",
    coverage: "12m²/L",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    buyUrl: "https://www.castorama.fr/peinture/",
    retailer: "Castorama",
  },
  {
    id: "paint-charcoal-01",
    name: "Smoky Charcoal",
    description: "Deep charcoal gray with blue undertones. Sophisticated and modern for accent walls.",
    price: 54,
    currency: "EUR",
    color: "Charcoal",
    colorHex: "#36454F",
    finish: "Eggshell",
    coverage: "10m²/L",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    buyUrl: "https://www.leroymerlin.fr/produits/peinture/",
    retailer: "Leroy Merlin",
  },
  {
    id: "paint-cream-01",
    name: "Warm Cream",
    description: "Soft warm cream with yellow undertones. Inviting and cozy, works with any style.",
    price: 42,
    currency: "EUR",
    color: "Cream",
    colorHex: "#F5F0E1",
    finish: "Matte",
    coverage: "13m²/L",
    imageUrl: "https://images.unsplash.com/photo-1562184552-997c461abbe6?w=400&h=300&fit=crop",
    buyUrl: "https://www.castorama.fr/peinture/",
    retailer: "Castorama",
  },
  {
    id: "paint-olive-01",
    name: "Olive Grove",
    description: "Rich olive green. Earthy, grounding, and pairs beautifully with natural wood furniture.",
    price: 51,
    currency: "EUR",
    color: "Olive Green",
    colorHex: "#6B7C3E",
    finish: "Satin",
    coverage: "11m²/L",
    imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop",
    buyUrl: "https://www.leroymerlin.fr/produits/peinture/",
    retailer: "Leroy Merlin",
  },
  // ── Moroccan / Traditional colors ──
  {
    id: "paint-spicered-01",
    name: "Spice Market Red",
    description: "Deep warm red with earthy undertones. Traditional Moroccan riad color. Rich and enveloping.",
    price: 56,
    currency: "EUR",
    color: "Spice Red",
    colorHex: "#8B2500",
    finish: "Matte",
    coverage: "10m²/L",
    imageUrl: "https://images.unsplash.com/photo-1525909002-1b05e0c869d8?w=400&h=300&fit=crop",
    buyUrl: "https://www.leroymerlin.fr/produits/peinture/",
    retailer: "Leroy Merlin",
  },
  {
    id: "paint-saffron-01",
    name: "Saffron Gold",
    description: "Warm saffron yellow-gold. Brings sunlit warmth of Moroccan courtyards to any room.",
    price: 53,
    currency: "EUR",
    color: "Saffron Gold",
    colorHex: "#D4A017",
    finish: "Eggshell",
    coverage: "11m²/L",
    imageUrl: "https://images.unsplash.com/photo-1525909002-1b05e0c869d8?w=400&h=300&fit=crop",
    buyUrl: "https://www.castorama.fr/peinture/",
    retailer: "Castorama",
  },
  {
    id: "paint-turquoise-01",
    name: "Majorelle Blue",
    description: "Vibrant cobalt-turquoise inspired by Yves Saint Laurent's Majorelle Garden in Marrakech.",
    price: 62,
    currency: "EUR",
    color: "Majorelle Blue",
    colorHex: "#6050DC",
    finish: "Satin",
    coverage: "9m²/L",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    buyUrl: "https://www.leroymerlin.fr/produits/peinture/",
    retailer: "Leroy Merlin",
  },
  {
    id: "paint-tadelakt-01",
    name: "Tadelakt Sand",
    description: "Warm sandy beige with ochre undertones. Inspired by traditional Moroccan tadelakt plaster walls.",
    price: 48,
    currency: "EUR",
    color: "Sand",
    colorHex: "#D2B48C",
    finish: "Matte",
    coverage: "12m²/L",
    imageUrl: "https://images.unsplash.com/photo-1562184552-997c461abbe6?w=400&h=300&fit=crop",
    buyUrl: "https://www.leroymerlin.fr/produits/peinture/",
    retailer: "Leroy Merlin",
  },
  {
    id: "paint-emerald-01",
    name: "Emerald Jewel",
    description: "Deep emerald green. Luxurious jewel tone perfect for accent walls and traditional interiors.",
    price: 58,
    currency: "EUR",
    color: "Emerald Green",
    colorHex: "#046307",
    finish: "Satin",
    coverage: "10m²/L",
    imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop",
    buyUrl: "https://www.castorama.fr/peinture/",
    retailer: "Castorama",
  },
  {
    id: "paint-burgundy-01",
    name: "Royal Burgundy",
    description: "Deep wine-red burgundy. Classic, refined, perfect for cozy traditional and Moroccan spaces.",
    price: 55,
    currency: "EUR",
    color: "Burgundy",
    colorHex: "#722F37",
    finish: "Eggshell",
    coverage: "10m²/L",
    imageUrl: "https://images.unsplash.com/photo-1525909002-1b05e0c869d8?w=400&h=300&fit=crop",
    buyUrl: "https://www.leroymerlin.fr/produits/peinture/",
    retailer: "Leroy Merlin",
  },
  {
    id: "paint-ochre-01",
    name: "Moroccan Ochre",
    description: "Warm burnt ochre. Earthy and sun-baked, reminiscent of Marrakech medina walls.",
    price: 50,
    currency: "EUR",
    color: "Ochre",
    colorHex: "#CC7722",
    finish: "Matte",
    coverage: "11m²/L",
    imageUrl: "https://images.unsplash.com/photo-1525909002-1b05e0c869d8?w=400&h=300&fit=crop",
    buyUrl: "https://www.castorama.fr/peinture/",
    retailer: "Castorama",
  },
];

// ─── Search Helpers ──────────────────────────────────────────────────────────

// Style aliases — so "moroccan" also matches "bohemian", "traditional" also matches "classic", etc.
const STYLE_ALIASES: Record<string, string[]> = {
  moroccan: ["moroccan", "bohemian", "traditional", "riad", "marrakech"],
  bohemian: ["bohemian", "moroccan", "boho"],
  traditional: ["traditional", "classic", "moroccan"],
  classic: ["classic", "traditional"],
  scandinavian: ["scandinavian", "nordic", "scandi"],
  modern: ["modern", "contemporary", "minimal"],
  minimal: ["minimal", "modern", "contemporary", "minimalist"],
  industrial: ["industrial", "loft", "factory"],
};

function searchFurniture(params: {
  query: string;
  style?: string;
  maxWidth?: number;
  maxDepth?: number;
  maxHeight?: number;
  budget?: number;
  category?: string;
}) {
  let results = [...FURNITURE_CATALOG];

  if (params.category) {
    results = results.filter((f) =>
      f.category.toLowerCase().includes(params.category!.toLowerCase()),
    );
  }

  // Style filter with aliases
  if (params.style) {
    const styleKey = params.style.toLowerCase();
    const aliases = STYLE_ALIASES[styleKey] || [styleKey];
    const styleFiltered = results.filter(
      (f) =>
        aliases.some((a) => f.style.toLowerCase().includes(a)) ||
        aliases.some((a) => f.description.toLowerCase().includes(a)),
    );
    // Only apply style filter if it returns enough results
    if (styleFiltered.length >= 2) {
      results = styleFiltered;
    }
  }

  if (params.maxWidth) results = results.filter((f) => f.width <= params.maxWidth!);
  if (params.maxDepth) results = results.filter((f) => f.depth <= params.maxDepth!);
  if (params.maxHeight) results = results.filter((f) => f.height <= params.maxHeight!);
  if (params.budget) results = results.filter((f) => f.price <= params.budget!);

  if (params.query) {
    const q = params.query.toLowerCase();
    const keywords = q.split(/\s+/).filter((kw) => kw.length > 2);
    // Expand query keywords with style aliases
    const expandedKeywords = [...keywords];
    for (const kw of keywords) {
      const aliases = STYLE_ALIASES[kw];
      if (aliases) expandedKeywords.push(...aliases);
    }
    const uniqueKeywords = [...new Set(expandedKeywords)];

    if (uniqueKeywords.length > 0) {
      const scored = results.map((f) => {
        const searchable = `${f.name} ${f.description} ${f.category} ${f.style}`.toLowerCase();
        const score = uniqueKeywords.filter((kw) => searchable.includes(kw)).length;
        return { item: f, score };
      });
      // Keep items that match at least one keyword, sorted by relevance
      const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
      if (matched.length >= 2) {
        results = matched.map((s) => s.item);
      }
      // If too few matches, just return all results (don't over-filter)
    }
  }

  return results;
}

function searchPaint(params: {
  query: string;
  color?: string;
  finish?: string;
  brand?: string;
  roomType?: string;
}) {
  let results = [...PAINT_CATALOG];

  if (params.color) {
    const c = params.color.toLowerCase();
    const colorFiltered = results.filter(
      (p) =>
        p.color.toLowerCase().includes(c) ||
        p.name.toLowerCase().includes(c) ||
        p.description.toLowerCase().includes(c),
    );
    if (colorFiltered.length >= 1) {
      results = colorFiltered;
    }
  }

  if (params.finish) {
    const finishFiltered = results.filter(
      (p) => p.finish.toLowerCase() === params.finish!.toLowerCase(),
    );
    if (finishFiltered.length >= 1) {
      results = finishFiltered;
    }
  }

  if (params.brand) {
    results = results.filter(
      (p) => p.retailer.toLowerCase().includes(params.brand!.toLowerCase()),
    );
  }

  if (params.query) {
    const q = params.query.toLowerCase();
    const keywords = q.split(/\s+/).filter((kw) => kw.length > 2);
    // Expand with style aliases
    const expandedKeywords = [...keywords];
    for (const kw of keywords) {
      const aliases = STYLE_ALIASES[kw];
      if (aliases) expandedKeywords.push(...aliases);
    }
    const uniqueKeywords = [...new Set(expandedKeywords)];

    if (uniqueKeywords.length > 0) {
      const scored = results.map((p) => {
        const searchable = `${p.name} ${p.description} ${p.color} ${p.finish}`.toLowerCase();
        const score = uniqueKeywords.filter((kw) => searchable.includes(kw)).length;
        return { item: p, score };
      });
      const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
      if (matched.length >= 2) {
        results = matched.map((s) => s.item);
      }
    }
  }

  return results;
}

// ─── MCP Server ──────────────────────────────────────────────────────────────

const server = new McpServer(
  { name: "roomcraft", version: "0.1.0" },
  { capabilities: {} },
)
  // ── Main Widget: design-room ─────────────────────────────────────────────
  .registerWidget(
    "design-room",
    {
      description:
        "Interactive room designer. Shows furniture and paint recommendations that fit the user's room dimensions, style, and budget. Users can browse items, select them, and access buy links.",
      _meta: {
        ui: {
          csp: {
            connectDomains: [
              "https://fal.run",
              "https://queue.fal.run",
              "https://rest.alpha.fal.ai",
              "https://api.fal.ai",
            ],
            resourceDomains: [
              "https://images.unsplash.com",
              "https://v3b.fal.media",
              "https://v3.fal.media",
              "https://fal.media",
              "https://storage.googleapis.com",
              "https://encrypted-tbn0.gstatic.com",
              "https://image.pollinations.ai",
            ],
            redirectDomains: [
              "https://www.ikea.com",
              "https://www.maisonsdumonde.com",
              "https://www.habitat.fr",
              "https://www.leroymerlin.fr",
              "https://www.castorama.fr",
              "https://www.autonomous.ai",
            ],
          },
        },
      },
    },
    {
      description:
        "Design a room: provide dimensions, style preferences, and budget. Returns matching furniture and paint options with images, prices, and buy links.",
      inputSchema: {
        roomWidth: z.number().describe("Room width in cm"),
        roomLength: z.number().describe("Room length in cm"),
        roomHeight: z.number().describe("Room height in cm, default ~250"),
        style: z.string().describe("Design style: moroccan, scandinavian, modern, industrial, bohemian, classic, minimal, french, japanese, tropical"),
        budget: z.number().optional().describe("Total budget in EUR"),
        preferences: z.string().optional().describe("Additional preferences: colors, vibe, specific items wanted"),
        roomType: z.string().optional().describe("Room type: living room, bedroom, office, dining room"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ roomWidth, roomLength, roomHeight, style, budget, preferences, roomType }) => {
      try {
        // ── Search real IKEA products via SerpAPI (Google Shopping) ──
        const furnitureQuery = `${style} ${roomType || ""} ${preferences || ""}`.trim();
        let furniture: Array<{
          id: string; name: string; description: string; price: number; currency: string;
          width: number; depth: number; height: number; imageUrl: string; buyUrl: string;
          retailer: string; category: string; style: string;
        }> = [];

        try {
          const ikeaProducts = await searchIkeaProducts({
            query: furnitureQuery,
            style,
            maxPrice: budget ? Math.round(budget * 0.7) : undefined,
            limit: 12,
          });
          furniture = ikeaProducts.map(p => ({
            ...p,
            retailer: "IKEA",
          }));
          console.log(`[design-room] Found ${furniture.length} IKEA products via SERP`);
        } catch (serpError) {
          console.warn("[design-room] SERP search failed, falling back to curated catalog:", serpError);
          // Fallback to curated catalog
          furniture = searchFurniture({
            query: furnitureQuery,
            style,
            maxWidth: roomWidth,
            maxDepth: roomLength,
            budget: budget ? Math.round(budget * 0.7) : undefined,
          });
        }

        // If SERP returned too few results, supplement with curated catalog
        if (furniture.length < 3) {
          const catalogFurniture = searchFurniture({
            query: furnitureQuery,
            style,
            maxWidth: roomWidth,
            maxDepth: roomLength,
            budget,
          });
          // Merge without duplicates
          const existingIds = new Set(furniture.map(f => f.id));
          for (const cf of catalogFurniture) {
            if (!existingIds.has(cf.id)) {
              furniture.push(cf);
            }
          }
        }

        const paintQuery = `${preferences || ""} ${style}`.trim();
        let paint = searchPaint({ query: paintQuery });
        if (paint.length < 2) {
          paint = [...PAINT_CATALOG];
        }

        // ── No hero image — user selects items first, then generates ──
        // AI image generation happens when user clicks "Generate Room Image"
        // in the widget (calls generate-room-image tool with selected items)

        const structuredContent = {
          roomDimensions: { width: roomWidth, length: roomLength, height: roomHeight },
          style,
          budget: budget || null,
          roomType: roomType || null,
          furnitureCount: furniture.length,
          paintCount: paint.length,
          furniture: furniture.map((f) => ({
            id: f.id,
            name: f.name,
            price: f.price,
            currency: f.currency,
            dimensions: `${f.width}×${f.depth}×${f.height}cm`,
            category: f.category,
          })),
          paint: paint.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            currency: p.currency,
            color: p.color,
            finish: p.finish,
          })),
        };

        const _meta = {
          furniture: furniture.map((f) => ({
            id: f.id,
            name: f.name,
            description: f.description,
            price: f.price,
            currency: f.currency,
            width: f.width,
            depth: f.depth,
            height: f.height,
            imageUrl: f.imageUrl, // Raw Unsplash URL — whitelisted in CSP
            buyUrl: f.buyUrl,
            retailer: f.retailer,
            category: f.category,
            style: f.style,
          })),
          paint: paint.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            currency: p.currency,
            color: p.color,
            colorHex: p.colorHex,
            finish: p.finish,
            coverage: p.coverage,
            imageUrl: p.imageUrl, // Raw Unsplash URL — whitelisted in CSP
            buyUrl: p.buyUrl,
            retailer: p.retailer,
          })),
        };

        return {
          structuredContent,
          content: [
            {
              type: "text" as const,
              text: `Found ${furniture.length} furniture items and ${paint.length} paint options for a ${roomWidth}×${roomLength}cm ${style} ${roomType || "room"}${budget ? ` within €${budget} budget` : ""}.`,
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

  // ── Tool: search-furniture ───────────────────────────────────────────────
  .registerTool(
    "search-furniture",
    {
      description:
        "Search for furniture items by query, style, dimensions, budget, or category. Returns items with images, prices, dimensions, and buy links.",
      inputSchema: {
        query: z.string().describe("Search query: style, type, or description"),
        style: z.string().optional().describe("Design style filter"),
        maxWidth: z.number().optional().describe("Max width in cm"),
        maxDepth: z.number().optional().describe("Max depth in cm"),
        maxHeight: z.number().optional().describe("Max height in cm"),
        budget: z.number().optional().describe("Max price in EUR"),
        category: z.string().optional().describe("Category: sofa, table, chair, shelf, lamp, rug, bed, desk, armchair, mirror"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (params) => {
      try {
        // Use real IKEA search via SerpAPI (Google Shopping)
        const searchQuery = [params.query, params.style, params.category].filter(Boolean).join(" ");
        const items = await searchIkeaProducts({
          query: searchQuery,
          style: params.style,
          maxPrice: params.budget,
          limit: 12,
        });

        return {
          structuredContent: {
            items: items.map((f) => ({
              id: f.id,
              name: f.name,
              description: f.description,
              price: f.price,
              currency: f.currency,
              dimensions: `${f.width}×${f.depth}×${f.height}cm`,
              width: f.width,
              depth: f.depth,
              height: f.height,
              imageUrl: f.imageUrl,
              buyUrl: f.buyUrl,
              retailer: "IKEA",
              category: f.category,
            })),
          },
          content: [
            {
              type: "text" as const,
              text: `Found ${items.length} IKEA furniture item(s) matching "${params.query}" via Google Shopping.`,
            },
          ],
        };
      } catch (error) {
        // Fallback to curated catalog if SERP fails
        console.warn("[search-furniture] SERP failed, falling back to curated catalog:", error);
        const items = searchFurniture(params);
        return {
          structuredContent: {
            items: items.map((f) => ({
              id: f.id,
              name: f.name,
              description: f.description,
              price: f.price,
              currency: f.currency,
              dimensions: `${f.width}×${f.depth}×${f.height}cm`,
              width: f.width,
              depth: f.depth,
              height: f.height,
              imageUrl: f.imageUrl,
              buyUrl: f.buyUrl,
              retailer: f.retailer,
              category: f.category,
            })),
          },
          content: [
            {
              type: "text" as const,
              text: `Found ${items.length} furniture item(s) matching "${params.query}" (curated catalog).`,
            },
          ],
        };
      }
    },
  )

  // ── Tool: search-paint ───────────────────────────────────────────────────
  .registerTool(
    "search-paint",
    {
      description:
        "Search for wall paint by color, finish, brand, or room type. Returns paints with color swatches, prices, coverage, and buy links.",
      inputSchema: {
        query: z.string().describe("Search query: color, style, or description"),
        color: z.string().optional().describe("Color name or shade"),
        finish: z.string().optional().describe("Paint finish: Matte, Eggshell, Satin, Gloss"),
        brand: z.string().optional().describe("Brand/retailer filter"),
        roomType: z.string().optional().describe("Room type for recommendations"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (params) => {
      const items = searchPaint(params);
      return {
        structuredContent: {
          items: items.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            currency: p.currency,
            color: p.color,
            colorHex: p.colorHex,
            finish: p.finish,
            coverage: p.coverage,
            imageUrl: p.imageUrl, // Raw Unsplash URL — whitelisted in CSP
            buyUrl: p.buyUrl,
            retailer: p.retailer,
          })),
        },
        content: [
          {
            type: "text" as const,
            text: `Found ${items.length} paint option(s) matching "${params.query}".`,
          },
        ],
      };
    },
  )

  // ── Tool: generate-room-render ───────────────────────────────────────────
  .registerTool(
    "generate-room-render",
    {
      description:
        "Generate a visualization/render of a room with specified furniture and paint. Returns a render image URL and description.",
      inputSchema: {
        roomWidth: z.number().describe("Room width in cm"),
        roomLength: z.number().describe("Room length in cm"),
        roomHeight: z.number().describe("Room height in cm"),
        style: z.string().describe("Design style"),
        furnitureNames: z.array(z.string()).optional().describe("Names of furniture to include"),
        paintColor: z.string().optional().describe("Wall paint color"),
        description: z.string().optional().describe("Additional render description"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ roomWidth, roomLength, roomHeight, style, furnitureNames, paintColor, description }) => {
      const renderDescription = [
        `${style.charAt(0).toUpperCase() + style.slice(1)} room (${roomWidth}×${roomLength}×${roomHeight}cm)`,
        furnitureNames?.length ? `with ${furnitureNames.join(", ")}` : "",
        paintColor ? `and ${paintColor} walls` : "",
        description || "",
      ]
        .filter(Boolean)
        .join(" ");

      const prompt = buildImagePrompt({
        style,
        roomType: null,
        roomWidth,
        roomLength,
        roomHeight,
        paintColor: paintColor || null,
        paintHex: null,
        furnitureNames: furnitureNames || [],
        userPrompt: description || null,
      });
      const fallbackUrl = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop";
      const { url: renderUrl } = await generateImageWithFal(prompt, fallbackUrl);

      return {
        structuredContent: { renderUrl, description: renderDescription },
        content: [
          {
            type: "text" as const,
            text: `Generated room render: ${renderDescription}`,
          },
        ],
      };
    },
  )

  // ── Tool: generate-room-image ────────────────────────────────────────────
  .registerTool(
    "generate-room-image",
    {
      description:
        "Generate an AI-rendered photorealistic image of a designed room using the selected furniture and paint colors. Uses AI image generation to create a visual preview of what the room will look like.",
      inputSchema: {
        roomWidth: z.number().describe("Room width in cm"),
        roomLength: z.number().describe("Room length in cm"),
        roomHeight: z.number().describe("Room height in cm"),
        style: z.string().describe("Design style: moroccan, scandinavian, modern, industrial, bohemian, classic, minimal, french, japanese, tropical"),
        furnitureNames: z.array(z.string()).describe("Names of selected furniture items to include"),
        paintColor: z.string().optional().describe("Wall paint color name"),
        paintHex: z.string().optional().describe("Wall paint hex color"),
        roomType: z.string().optional().describe("Room type: living room, bedroom, office, dining room"),
        userPrompt: z.string().optional().describe("Additional user description or instructions for the image"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async ({ roomWidth, roomLength, roomHeight, style, furnitureNames, paintColor, paintHex, roomType, userPrompt }) => {
      // Build a detailed, style-aware prompt for AI image generation
      const furnitureList = furnitureNames.length > 0
        ? furnitureNames.join(", ")
        : "minimal furniture";

      const prompt = buildImagePrompt({
        style,
        roomType,
        roomWidth,
        roomLength,
        roomHeight,
        paintColor: paintColor || null,
        paintHex: paintHex || null,
        furnitureNames,
        userPrompt: userPrompt || null,
      });

      // Use fal.ai for AI image generation
      const fallbackUrl = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1024&h=768&fit=crop";
      const { url: imageUrl } = await generateImageWithFal(prompt, fallbackUrl);

      return {
        structuredContent: {
          imageUrl,
          prompt,
          style,
          roomType: roomType || "room",
          furnitureIncluded: furnitureNames,
          wallColor: paintColor || "white",
        },
        content: [
          {
            type: "text" as const,
            text: `Generated AI room visualization: ${style} ${roomType || "room"} with ${furnitureList} and ${paintColor || "white"} walls. Image rendered via fal.ai.`,
          },
        ],
      };
    },
  )

  // ── Tool: get-3d-room-data ───────────────────────────────────────────────
  .registerTool(
    "get-3d-room-data",
    {
      description:
        "Generate 3D scene data for an interactive room visualization. Returns furniture positions, dimensions, colors, and room geometry for rendering in a 3D viewer.",
      inputSchema: {
        roomWidth: z.number().describe("Room width in cm"),
        roomLength: z.number().describe("Room length in cm"),
        roomHeight: z.number().describe("Room height in cm"),
        furnitureIds: z.array(z.string()).describe("IDs of selected furniture items"),
        paintHex: z.string().optional().describe("Wall paint hex color, e.g. #B2BDA0"),
        floorColor: z.string().optional().describe("Floor hex color"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ roomWidth, roomLength, roomHeight, furnitureIds, paintHex, floorColor }) => {
      // Look up furniture from catalog
      const selectedFurniture = FURNITURE_CATALOG.filter((f) =>
        furnitureIds.includes(f.id),
      );

      // Auto-place furniture along walls and in room
      const placements: Array<{
        id: string;
        name: string;
        category: string;
        width: number;
        depth: number;
        height: number;
        x: number;
        y: number;
        z: number;
        color: string;
        rotation: number;
      }> = [];

      // Category-based colors
      const categoryColors: Record<string, string> = {
        sofa: "#8B7355",
        table: "#DEB887",
        chair: "#CD853F",
        shelf: "#F5F5DC",
        lamp: "#FFD700",
        rug: "#BC8F8F",
        bed: "#D2B48C",
        desk: "#A0522D",
        armchair: "#8B4513",
        mirror: "#C0C0C0",
      };

      // Simple placement algorithm — distribute furniture around the room
      const wallOffset = 10; // cm from wall
      const centerX = roomWidth / 2;
      const centerZ = roomLength / 2;

      selectedFurniture.forEach((f, i) => {
        let x = 0,
          y = f.height / 2,
          z = 0,
          rotation = 0;

        switch (f.category) {
          case "sofa":
          case "bed":
            // Against back wall, centered
            x = centerX;
            z = f.depth / 2 + wallOffset;
            rotation = 0;
            break;
          case "table":
            // Center of room
            x = centerX;
            z = centerZ;
            break;
          case "desk":
            // Against right wall
            x = roomWidth - f.depth / 2 - wallOffset;
            z = centerZ;
            rotation = Math.PI / 2;
            break;
          case "chair":
            // Near table
            x = centerX + 60;
            z = centerZ + 40;
            rotation = -Math.PI / 4;
            break;
          case "shelf":
          case "mirror":
            // Against left wall
            x = f.depth / 2 + wallOffset;
            z = 50 + i * 120;
            rotation = Math.PI / 2;
            break;
          case "lamp":
            // Corner
            x = roomWidth - 50;
            z = wallOffset + 30;
            break;
          case "rug":
            // Center floor
            x = centerX;
            y = 1;
            z = centerZ;
            break;
          case "armchair":
            // Angled in corner
            x = roomWidth - f.width / 2 - wallOffset - 20;
            z = f.depth / 2 + wallOffset + 20;
            rotation = -Math.PI / 6;
            break;
          default:
            x = wallOffset + 60 + i * 80;
            z = wallOffset + 60;
        }

        placements.push({
          id: f.id,
          name: f.name,
          category: f.category,
          width: f.width,
          depth: f.depth,
          height: f.height,
          x,
          y,
          z,
          color: categoryColors[f.category] || "#999999",
          rotation,
        });
      });

      return {
        structuredContent: {
          room: {
            width: roomWidth,
            length: roomLength,
            height: roomHeight,
            wallColor: paintHex || "#FAFAFA",
            floorColor: floorColor || "#DEB887",
          },
          furniture: placements.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            position: { x: p.x, y: p.y, z: p.z },
          })),
          itemCount: placements.length,
        },
        content: [
          {
            type: "text" as const,
            text: `3D scene ready with ${placements.length} furniture items placed in a ${roomWidth}×${roomLength}cm room.`,
          },
        ],
      };
    },
  )

  // ══════════════════════════════════════════════════════════════════════════
  // ── Interior Architect Widget (real IKEA search via Google SERP + fal.ai image editing)
  // ══════════════════════════════════════════════════════════════════════════

  .registerWidget(
    "interior-architect",
    {
      description:
        "Browse real IKEA furniture and visualize it in rooms. Widget handles image uploads and product selection.",
      _meta: {
        ui: {
          csp: {
            connectDomains: [
              "https://image.pollinations.ai",
              "https://fal.run",
              "https://api.fal.ai",
              "https://v3.fal.media",
              "https://fal.media",
            ],
            resourceDomains: [
              "https://images.unsplash.com",
              "https://image.pollinations.ai",
              "https://v3.fal.media",
              "https://v3b.fal.media",
              "https://fal.media",
              "https://encrypted-tbn0.gstatic.com",
              "data:",
            ],
            redirectDomains: ["https://www.ikea.com"],
          },
        },
      },
    },
    {
      description:
        "Interior design tool that shows real IKEA furniture catalogue via Google Shopping. When user shares a room image URL and mentions furniture they want (e.g., 'add a table and two chairs'), immediately call this tool with imageUrl and prompt to show matching IKEA products. User clicks products in the widget to generate a furnished room image.",
      inputSchema: {
        imageUrl: z.string().optional().describe("Room image URL from user's messages"),
        productImageUrl: z.string().optional().describe("INTERNAL: Extract 'Product Image:' URL when user sends 'Generate room with this furniture' message from widget"),
        prompt: z.string().optional().describe("What furniture user wants to add (e.g., 'table and two chairs', 'sofa', 'bookshelf')"),
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
        // PHASE 1: Need room image first
        if (!imageUrl) {
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

        // PHASE 2: Show catalogue (have imageUrl, no product selected yet)
        if (!selectedProductId) {
          const searchQuery = prompt
            ? prompt
            : style
            ? `${style} style furniture`
            : "furniture";

          const products = await searchIkeaProducts({
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

        // PHASE 3: Generate image (have both imageUrl + selectedProductId)
        const imagePrompt = prompt || "Add furniture to this room";
        let furnishedImageUrl: string;
        let processingTime = 0;

        if (process.env.FAL_API_KEY) {
          const result = await editRoomImage({
            imageUrl,
            productImageUrl,
            prompt: imagePrompt,
            style,
          });
          furnishedImageUrl = result.furnishedImageUrl;
          processingTime = result.processingTime;
        } else {
          const encoded = encodeURIComponent(`Interior design: ${imagePrompt}, ${style || "modern"} style`);
          furnishedImageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=768&seed=${Date.now()}&nologo=true`;
        }

        const products = await searchIkeaProducts({
          query: prompt || style || "furniture",
          style,
          maxPrice: budget,
          limit: 8,
        });

        return {
          content: [{
            type: "text" as const,
            text: `✨ **Your furnished room is ready!**\n\n📸 Generated Image:\n${furnishedImageUrl}\n\n⏱️ Processing time: ${processingTime}ms\n\n👇 Check the widget below to view the image and browse more IKEA products.`,
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

export default server;
export type AppType = typeof server;
