import "@/index.css";

import { useState, useEffect } from "react";
import { mountWidget } from "skybridge/web";
import { useOpenExternal } from "skybridge/web";
import { useCallTool } from "../helpers";

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

interface WidgetProps {
  furnishedImageUrl?: string;
  products?: IkeaProduct[];
  originalImageUrl?: string;
  prompt?: string;
  style?: string;
  mode?: "selection" | "result";
}

function ProductCard({ product, mode, onSelect }: { product: IkeaProduct; mode?: "selection" | "result"; onSelect?: (product: IkeaProduct) => void }) {
  const openExternal = useOpenExternal();

  return (
    <div className="item-card" data-llm={`${product.name} - ${product.category} - €${product.price} - Article: ${product.articleNumber}`}>
      <div className="item-card__image-wrapper">
        <img src={product.imageUrl} alt={product.name} className="item-card__image" />
        <span className="item-card__badge">{product.category}</span>
      </div>
      <div className="item-card__body">
        <h3 className="item-card__title">{product.name}</h3>
        <p className="item-card__desc">{product.description}</p>
        <div className="item-card__meta">
          <span className="item-card__price">€{product.price}</span>
          <span className="item-card__dims">{product.width}×{product.depth}×{product.height}cm</span>
        </div>
        <div className="item-card__article">
          <strong>Article:</strong> {product.articleNumber}
        </div>
        <div className="item-card__actions">
          {mode === "selection" && onSelect && (
            <button className="btn btn--primary" onClick={() => onSelect(product)} data-llm={`Generate room with ${product.name}`} style={{ marginBottom: "8px", width: "100%" }}>
              🎨 Generate Room with This
            </button>
          )}
          <button className="btn btn--secondary" onClick={() => openExternal(product.buyUrl)} data-llm="Buy on IKEA">
            Buy on IKEA →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InteriorArchitect({ furnishedImageUrl, products, originalImageUrl, prompt, style, mode = "selection" }: WidgetProps) {
  const [selectedProduct, setSelectedProduct] = useState<IkeaProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const callTool = useCallTool();

  // Debug logging
  console.log("Widget props:", { furnishedImageUrl, products: products?.length, mode, originalImageUrl, prompt, style });

  // Auto-load catalogue on mount if no products provided
  useEffect(() => {
    if (!products && !furnishedImageUrl && !isLoading) {
      setIsLoading(true);
      callTool("interior-architect", {})
        .then((result) => {
          console.log("Tool call result:", result);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load catalogue:", err);
          setIsLoading(false);
        });
    }
  }, []);

  const handleProductSelect = (product: IkeaProduct) => {
    setSelectedProduct(product);
    console.log(`User selected: ${product.name} (${product.articleNumber})`);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="app">
        <div className="empty-state">
          <h2>🔄 Loading IKEA Catalogue...</h2>
          <p>Fetching furniture options for you...</p>
        </div>
      </div>
    );
  }

  if (mode === "selection" && products && products.length > 0 && !furnishedImageUrl) {
    return (
      <div className="app">
        {originalImageUrl && (
          <section className="hero" data-llm="Original room image">
            <img src={originalImageUrl} alt="Original room" className="hero__image" style={{ width: "100%", maxHeight: "400px", objectFit: "cover", borderRadius: "8px" }} />
          </section>
        )}
        <section className="products">
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h2 className="products__title">Choose Furniture to Add</h2>
            <p style={{ color: "#666", fontSize: "14px", marginTop: "8px" }}>{prompt && `Request: "${prompt}"`}{style && ` • Style: ${style}`}</p>
            <p style={{ color: "#0066cc", fontSize: "13px", fontWeight: 500, marginTop: "8px" }}>Click "Generate Room" on any product</p>
          </div>
          <div className="products__grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} mode="selection" onSelect={handleProductSelect} />
            ))}
          </div>
        </section>
        {selectedProduct && (
          <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", background: "#0066cc", color: "white", padding: "16px 32px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", zIndex: 1000, textAlign: "center" }} data-llm={`User selected ${selectedProduct.name}`}>
            <div style={{ fontSize: "16px", fontWeight: 600 }}>✓ Selected: {selectedProduct.name}</div>
          </div>
        )}
      </div>
    );
  }

  if (furnishedImageUrl && products && products.length > 0) {
    return (
      <div className="app">
        <section className="hero" data-llm="AI-generated furnished room">
          <img src={furnishedImageUrl} alt="Furnished room" className="hero__image" style={{ width: "100%", maxHeight: "500px", objectFit: "cover", borderRadius: "8px" }} />
        </section>
        <section className="products">
          <h2 className="products__title">Matching IKEA Products</h2>
          <div className="products__grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} mode="result" onSelect={handleProductSelect} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="empty-state">
        <h2>🏠 AI Interior Architect</h2>
        <p>Upload a room photo and describe furniture. I'll show you IKEA products first!</p>
      </div>
    </div>
  );
}

if (typeof window !== 'undefined') {
  mountWidget(<InteriorArchitect />);
}
