import "@/index.css";

import { useState } from "react";
import { mountWidget } from "skybridge/web";
import { useOpenExternal } from "skybridge/web";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  product, 
  mode,
  onSelect 
}: { 
  product: IkeaProduct;
  mode?: "selection" | "result";
  onSelect?: (product: IkeaProduct) => void;


// ─── Sub-components ──────────────────────────────────────────────────────────

function ProductCard({ product }: { product: IkeaProduct }) {
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
          {mode === "selection" && onSelect ? (
            <button
              className="btn btn--primary"
              onClick={() => onSelect(product)}
              data-llm={`Generate room with ${product.name}`}
              style={{ marginBottom: "8px", width: "100%" }}
            >
              🎨 Generate Room with This
            </button>
          ) : null}
          <button
            className="btn btn--second.depth}×{product.height}cm
          </span>
        </div>
        <div className="item-card__article">
          <strong>Article:</strong> {product
  furnishedImageUrl, 
  products, 
  originalImageUrl,
  prompt,
  style,
  mode = "selection"
}: WidgetProps) {
  const [selectedProduct, setSelectedProduct] = useState<IkeaProduct | null>(null);

  // Handle product selection
  const handleProductSelect = (product: IkeaProduct) => {
    setSelectedProduct(product);
    // This will be visible to the LLM through data-llm attributes
    console.log(`User selected: ${product.name} (${product.articleNumber})`);
  };

  // Mode 1: Product Selection (show products, no image yet)
  if (mode === "selection" && products && products.length > 0 && !furnishedImageUrl) {
    return (
      <div className="app">
        {/* Original Room Image */}
        {originalImageUrl && (
          <section className="hero" data-llm="Original room image before furnishing">
            <img
              src={originalImageUrl}
              alt="Original room"
           div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h2 className="products__title">Available Products</h2>
            <p style={{ color: "#0066cc", fontSize: "13px", fontWeight: 500, marginTop: "8px" }}>
              Click "Generate Room" to see a different product in your space
            </p>
          </div>
          <div className="products__grid">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                mode="result"
                onSelect={handleProductSelect}
             
              position: "absolute", 
              top: "16px", 
              left: "16px", 
              background: "rgba(0,0,0,0.7)", 
              color: "white", 
              padding: "8px 16px", 
              borderRadius: "4px",
              fontSize: "14px"
            }}>
              📸 Original Room
            </div>
          </section>
        )}

        {/* Product Selection */}
        <section className="products">
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h2 className="products__title">Choose Furniture to Add</h2>
            <p style={{ color: "#666", fontSize: "14px", marginTop: "8px" }}>
              {prompt && `Request: "${prompt}"`}
              {style && ` • Style: ${style}`}
            </p>
            <p style={{ color: "#0066cc", fontSize: "13px", fontWeight: 500, marginTop: "8px" }}>
              Click "Generate Room" on any product to see it in your space
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

        {/* Selection Indicator */}
        {selectedProduct && (
          <div 
            style={{
              position: "fixed",
              bottom: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#0066cc",
              color: "white",
              padding: "16px 32px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              zIndex: 1000,
              maxWidth: "500px",
              textAlign: "center"
            }}
            data-llm={`User selected ${selectedProduct.name} for image generation`}
          >
            <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
              ✓ Selected: {selectedProduct.name}
            </div>
            <div style={{ fontSize: "13px", opacity: 0.9 }}>
              Ready to generate furnished room image
            </div>
          </div>
        )}
      </div>
    );
  }

  // Mode 2: Result View (show generated image + products for re-selection)
            className="btn btn--primary"
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

// ─── Main Widget Component ───────────────────────────────────────────────────

export default function InteriorArchitect({ furnishedImageUrl, products }: WidgetProps) {
  const [selectedProduct, setSelectedProduct] = useState<IkeaProduct | null>(null);

  // Show results if we have data
  if (furnishedImageUrl && products && products.length > 0) {
    return (
      <div className="app">
        {/* Furnished Room Image */}
        <section className="hero" data-llm="AI-generated furnished room image">
          <img
            src={furnishedImageUrl}
            alt="Furnished room"
            className="hero__image"
            style={{ width: "100%", maxHeight: "500px", objectFit: "cover", borderRadius: "8px" }}
          />
        </section>

        {/* IKEA Products Grid */}
        <section className="products">
          <h2 className="products__title">Matching IKEA Products</h2>
          <div className="products__grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="modal" onClick={() => setSelectedProduct(null)}>
            <div className="modal__content" onClick={(e) => e.stopPropagation()}>
              <button className="modal__close" onClick={() => setSelectedProduct(null)}>
                ×
              </button>
              <div className="modal__body">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="modal__image"
                />
                <div className="modal__info">
                  <h2>{selectedProduct.name}</h2>
                  <p className="modal__category">{selectedProduct.category}</p>
                  <p className="modal__description">{selectedProduct.description}</p>
                  <div className="modal__specs">
                    <div>
                      <strong>Price:</strong> €{selectedProduct.price}
                    </div>
                    <div>
                      <strong>Article:</strong> {selectedProduct.articleNumber}
                    </div>
                    <div>
                      <strong>Dimensions:</strong> {selectedProduct.width}×{selectedProduct.depth}×
                      {selectedProduct.height}cm
                    </div>
                    <div>
                      <strong>Style:</strong> {selectedProduct.style}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Initial empty state
  return (
    <div className="app">
      <div className="empty-state">
        <h2>🏠 AI Interior Architect</h2>
        <p>
          Upload a room photo and describe what furniture you'd like to add. I'll generate a
          furnished image and suggest matching IKEA products!
        </p>
        <p className="empty-state__hint">
          Try: "Add a grey sofa and round coffee table in scandinavian style"
        </p>
      </div>
    </div>
  );
}

// Mount the widget
if (typeof window !== 'undefined') {
  mountWidget(<InteriorArchitect />);
}
