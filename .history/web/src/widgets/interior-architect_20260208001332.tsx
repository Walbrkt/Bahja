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
        <div style={{ 
          fontSize: "11px", 
          color: "#666", 
          marginTop: "8px",
          padding: "8px",
          background: "#f9f9f9",
          borderRadius: "4px",
          wordBreak: "break-all",
        }}>
          <strong>URL:</strong>{" "}
          <a 
            href={product.buyUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: "#0066cc", textDecoration: "underline" }}
          >
            {product.buyUrl}
          </a>
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
  const { responseMetadata, isPending } = useToolInfo<"interior-architect">();
  const { callTool, data: callToolData, isPending: isCallPending } = useCallTool("interior-architect");
  const [roomImageUrl, setRoomImageUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProductName, setSelectedProductName] = useState<string>("");

  // Get products from either widget output or call tool response
  const products = (responseMetadata?.products || callToolData?.meta?.products || []) as IkeaProduct[];
  const mode = (responseMetadata?.mode || callToolData?.meta?.mode || "needImage") as "needImage" | "selection" | "result";
  const storedRoomImage = (responseMetadata?.roomImageUrl || callToolData?.meta?.roomImageUrl) as string | undefined;
  const furnishedImageUrl = (responseMetadata?.furnishedImageUrl || callToolData?.meta?.furnishedImageUrl) as string | undefined;
  const isLoading = isPending || isCallPending;

  // Debug: Log widget state on every render
  useEffect(() => {
    console.log("🔍 Widget state:", {
      mode,
      productsCount: products.length,
      storedRoomImage: storedRoomImage ? String(storedRoomImage).substring(0, 50) + '...' : 'none',
      roomImageUrlState: roomImageUrl ? roomImageUrl.substring(0, 50) + '...' : 'none',
      hasResponseMetadata: !!responseMetadata,
      hasCallToolData: !!callToolData,
    });
  }, [storedRoomImage, roomImageUrl, mode, products.length, responseMetadata, callToolData]);

  // Debug: Log when furnished image URL changes
  useEffect(() => {
    if (furnishedImageUrl) {
      console.log("✅ Generated image URL received:", furnishedImageUrl);
      console.log("📊 Mode:", mode);
      console.log("📦 Products count:", products.length);
    }
  }, [furnishedImageUrl, mode, products.length]);

  // Don't auto-load - wait for explicit user action
  // This prevents the widget from making unnecessary API calls

  const handleProductSelect = async (product: IkeaProduct) => {
    console.log(`\n🎨 ========== PRODUCT SELECTED: ${product.name} ==========`);
    console.log(`📦 Product image: ${product.imageUrl}`);
    console.log(`🏠 Room image sources:`);
    console.log(`   - storedRoomImage: ${storedRoomImage ? storedRoomImage.substring(0, 80) + '...' : '❌ NONE'}`);
    console.log(`   - roomImageUrl (state): ${roomImageUrl ? roomImageUrl.substring(0, 80) + '...' : '❌ NONE'}`);
    console.log(`   - responseMetadata.roomImageUrl: ${responseMetadata?.roomImageUrl ? (responseMetadata.roomImageUrl as string).substring(0, 80) + '...' : '❌ NONE'}`);
    console.log(`   - callToolData.meta.roomImageUrl: ${callToolData?.meta?.roomImageUrl ? (callToolData.meta.roomImageUrl as string).substring(0, 80) + '...' : '❌ NONE'}`);
    
    setIsGenerating(true);
    setSelectedProductName(product.name);
    try {
      // Pass both room image and product image directly
      const roomImage = storedRoomImage || roomImageUrl;
      
      if (!roomImage) {
        console.error("❌ No room image available!");
        alert("Please provide a room image first");
        return;
      }
      
      console.log(`📤 Sending to server: room=${roomImage.substring(0, 50)}..., product=${product.imageUrl.substring(0, 50)}...`);
      
      await callTool({
        imageUrl: roomImage,
        productImageUrl: product.imageUrl,
        selectedProductId: product.id,
        prompt: product.name,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Room image upload prompt
  if (mode === "needImage" && !storedRoomImage) {
    return (
      <div className="app">
        <div className="empty-state">
          <h2>🏠 AI Interior Architect</h2>
          <p>Upload your room photo or paste an image URL:</p>
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            
            {/* File Upload Button */}
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                maxWidth: "500px",
                padding: "32px 24px",
                border: "2px dashed #4f46e5",
                borderRadius: "12px",
                cursor: "pointer",
                backgroundColor: "#f5f3ff",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: "40px", marginBottom: "8px" }}>📷</span>
              <span style={{ fontWeight: 600, color: "#4f46e5" }}>Click to upload room photo</span>
              <span style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>JPG, PNG up to 10MB</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const dataUri = reader.result as string;
                    console.log(`📷 Image uploaded: ${file.name} (${file.size} bytes) → data URI (${dataUri.length} chars)`);
                    setRoomImageUrl(dataUri);
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>

            {/* Preview uploaded image */}
            {roomImageUrl && (
              <div style={{ width: "100%", maxWidth: "500px" }}>
                <img
                  src={roomImageUrl}
                  alt="Room preview"
                  style={{ width: "100%", borderRadius: "8px", border: "2px solid #4f46e5" }}
                />
              </div>
            )}

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", width: "100%", maxWidth: "500px", gap: "12px" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#ddd" }} />
              <span style={{ color: "#999", fontSize: "13px" }}>or paste URL</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#ddd" }} />
            </div>

            {/* URL input */}
            <input
              type="text"
              placeholder="https://example.com/my-room.jpg"
              value={roomImageUrl.startsWith('data:') ? '' : roomImageUrl}
              onChange={(e) => setRoomImageUrl(e.target.value)}
              style={{
                width: "100%",
                maxWidth: "500px",
                padding: "12px",
                fontSize: "14px",
                border: "2px solid #ddd",
                borderRadius: "8px",
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
              style={{ width: "100%", maxWidth: "500px" }}
            >
              {isLoading ? "Loading catalogue..." : "Browse IKEA Furniture →"}
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
        {isGenerating && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
          >
            <div style={{
              background: "white",
              padding: "48px",
              borderRadius: "16px",
              textAlign: "center",
              maxWidth: "400px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}>
              <div style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 24px",
                border: "4px solid #f0f0f0",
                borderTop: "4px solid #0066cc",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }} />
              <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "12px", color: "#333" }}>
                🎨 Generating Your Room
              </h2>
              <p style={{ fontSize: "16px", color: "#666", marginBottom: "8px" }}>
                Adding <strong>{selectedProductName}</strong> to your space
              </p>
              <p style={{ fontSize: "14px", color: "#999" }}>
                This may take 10-30 seconds...
              </p>
            </div>
          </div>
        )}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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
          <div style={{ 
            marginTop: "16px", 
            padding: "12px", 
            background: "#f5f5f5", 
            borderRadius: "8px",
            border: "1px solid #ddd",
          }}>
            <p style={{ fontSize: "12px", color: "#666", marginBottom: "6px", fontWeight: 600 }}>
              Generated Image URL:
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="text"
                value={furnishedImageUrl}
                readOnly
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: "13px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  background: "white",
                  fontFamily: "monospace",
                }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                className="btn btn--primary"
                onClick={() => {
                  navigator.clipboard.writeText(furnishedImageUrl);
                  alert("Image URL copied to clipboard!");
                }}
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                📋 Copy
              </button>
            </div>
          </div>
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
