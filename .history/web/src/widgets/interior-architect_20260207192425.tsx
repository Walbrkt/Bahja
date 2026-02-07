import "@/index.css";
import { useState, useEffect } from "react";
import { mountWidget } from "skybridge/web";
import { useOpenExternal } from "skybridge/web";
import { useToolInfo, useCallTool } from "../helpers";

interface IkeaProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  articleNumber: string;
  width: number;
  depth: number;
  height: number;
  imageUrl: string;
  buyUrl: string;
  category: string;
  style: string;
}

function ProductCard({ 
  product, 
  mode, 
  onSelect 
}: { 
  product: IkeaProduct; 
  mode?: "selection" | "result"; 
  onSelect?: (product: IkeaProduct) => void;
}) {
  const openExternal = useOpenExternal();

  return (
    <div 
      className="item-card" 
      data-llm={`${product.name} - ${product.category} - €${product.price} - Article: ${product.articleNumber}`}
    >
      <div className="item-card__image-wrapper">
        <img src={product.imageUrl} alt={product.name} className="item-card__image" />
        <span className="item-card__badge">{product.category}</span>
      </div>
      <div className="item-card__body">
        <h3 className="item-card__title">{product.name}</h3>
        <p className="item-card__desc">{product.description}</p>
        <div className="item-card__meta">
          <span className="item-card__price">€{product.price}</span>
          <span className="item-card__dims">
            {product.width}×{product.depth}×{product.height}cm
          </span>
        </div>
        <div className="item-card__article">
          <strong>Article:</strong> {product.articleNumber}
        </div>
        <div className="item-card__actions">
          {mode === "selection" && onSelect && (
            <button 
              className="btn btn--primary" 
              onClick={() => onSelect(product)} 
              data-llm={`Generate room with ${product.name}`}
              style={{ marginBottom: "8px", width: "100%" }}
            >
              🎨 Generate Room with This
            </button>
          )}
          <button 
            className="btn btn--secondary" 
            onClick={() => openExternal(product.buyUrl)} 
            data-llm="Buy on IKEA"
          >
            Buy on IKEA →
          </button>
        </div>
      </div>
    </div>
  );
}

function InteriorArchitect() {
  const { output, responseMetadata, isPending } = useToolInfo<"interior-architect">();
  const { callTool, data: callToolData, isPending: isCallPending } = useCallTool("interior-architect");
  const [roomImageUrl, setRoomImageUrl] = useState<string>("");
  const [loadedOnce, setLoadedOnce] = useState(false);

  // Get products from either widget output or call tool response
  const products = (responseMetadata?.products || callToolData?.meta?.products || []) as IkeaProduct[];
  const mode = (responseMetadata?.mode || callToolData?.meta?.mode || "needImage") as "needImage" | "selection" | "result";
  const storedRoomImage = (responseMetadata?.roomImageUrl || callToolData?.meta?.roomImageUrl) as string | undefined;
  const furnishedImageUrl = (output as any)?.furnishedImageUrl || (callToolData as any)?.furnishedImageUrl;
  const isLoading = isPending || isCallPending;

  // Auto-prompt for room image on mount
  useEffect(() => {
    if (!loadedOnce && !isLoading) {
      setLoadedOnce(true);
      callTool({});
    }
  }, [loadedOnce, isLoading, callTool]);

  const handleProductSelect = async (product: IkeaProduct) => {
    console.log(`🎨 Generating room with: ${product.name}`);
    // Immediately generate with stored room image
    await callTool({
      imageUrl: storedRoomImage || roomImageUrl,
      selectedProductId: product.id,
    });
  };

  // Room image upload prompt
  if (mode === "needImage" && !storedRoomImage) {
    return (
      <div className="app">
        <div className="empty-state">
          <h2>🏠 AI Interior Architect</h2>
          <p>First, provide your room image URL:</p>
          <div style={{ marginTop: "24px" }}>
            <input
              type="text"
              placeholder="https://example.com/your-room.jpg"
              value={roomImageUrl}
              onChange={(e) => setRoomImageUrl(e.target.value)}
              style={{
                width: "100%",
                maxWidth: "500px",
                padding: "12px",
                fontSize: "14px",
                border: "2px solid #ddd",
                borderRadius: "8px",
                marginBottom: "12px",
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && roomImageUrl) {
                  callTool({ imageUrl: roomImageUrl });
                }
              }}
            />
            <button
              className="btn btn--primary"
              onClick={() => roomImageUrl && callTool({ imageUrl: roomImageUrl })}
              disabled={!roomImageUrl || isLoading}
              style={{ marginTop: "8px" }}
            >
              {isLoading ? "Loading..." : "Browse Furniture →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && products.length === 0) {
    return (
      <div className="app">
        <div className="empty-state">
          <h2>🔄 Loading IKEA Catalogue...</h2>
          <p>Fetching furniture options for you...</p>
        </div>
      </div>
    );
  }

  // Product selection view
  if (mode === "selection" && products.length > 0 && !furnishedImageUrl) {
    return (
      <div className="app">
        <section className="products">
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h2 className="products__title">Choose Furniture to Add</h2>
            <p style={{ color: "#0066cc", fontSize: "13px", fontWeight: 500, marginTop: "8px" }}>
              Click "Generate Room" on any product to continue
            </p>
          </div>
          <div className="products__grid">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                mode="selection" 
                onSelect={handleProductSelect} 
              />
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Result view with generated image
  if (furnishedImageUrl && products.length > 0) {
    return (
      <div className="app">
        <section className="hero" data-llm="AI-generated furnished room">
          <img 
            src={furnishedImageUrl} 
            alt="Furnished room" 
            className="hero__image" 
            style={{ width: "100%", maxHeight: "500px", objectFit: "cover", borderRadius: "8px" }} 
          />
        </section>
        <section className="products">
          <h2 className="products__title">Matching IKEA Products</h2>
          <div className="products__grid">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                mode="result"
              />
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Empty/initial state
  return (
    <div className="app">
      <div className="empty-state">
        <h2>🏠 AI Interior Architect</h2>
        <p>Browse IKEA furniture and visualize it in your room!</p>
      </div>
    </div>
  );
}

if (typeof window !== 'undefined') {
  mountWidget(<InteriorArchitect />);
}
