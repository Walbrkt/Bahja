import "@/index.css";
import { useState } from "react";
import { mountWidget, useSendFollowUpMessage } from "skybridge/web";
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

function InteriorArchitect() {
  const { responseMetadata, isPending } = useToolInfo<"interior-architect">();
  const { data: callToolData, isPending: isCallPending } = useCallTool("interior-architect");
  const [selectedFurniture, setSelectedFurniture] = useState<IkeaProduct[]>([]);
  const openExternal = useOpenExternal();
  const sendFollowUpMessage = useSendFollowUpMessage();

  const products = (responseMetadata?.products || callToolData?.meta?.products || []) as IkeaProduct[];
  const mode = (responseMetadata?.mode || callToolData?.meta?.mode || "needImage") as "needImage" | "selection" | "result";
  const storedRoomImage = (responseMetadata?.roomImageUrl || callToolData?.meta?.roomImageUrl) as string | undefined;
  const furnishedImageUrl = (responseMetadata?.furnishedImageUrl || callToolData?.meta?.furnishedImageUrl) as string | undefined;
  const isLoading = isPending || isCallPending;

  // Debug logging
  console.log("Widget State:", {
    mode,
    hasFurnishedImageUrl: !!furnishedImageUrl,
    furnishedImageUrl: furnishedImageUrl?.substring(0, 50),
    productsCount: products.length,
    selectedFurnitureCount: selectedFurniture.length,
    hasResponseMetadata: !!responseMetadata,
    hasCallToolData: !!callToolData,
    responseMetadata_furnishedImageUrl: responseMetadata?.furnishedImageUrl ? String(responseMetadata.furnishedImageUrl).substring(0, 50) : 'none',
    callToolData_furnishedImageUrl: callToolData?.meta?.furnishedImageUrl ? String(callToolData.meta.furnishedImageUrl).substring(0, 50) : 'none',
  });

  const handleProductSelect = async (product: IkeaProduct) => {
    // Check if product already selected
    const isAlreadySelected = selectedFurniture.some(f => f.id === product.id);
    
    let newSelection: IkeaProduct[];
    if (isAlreadySelected) {
      // Remove from selection
      newSelection = selectedFurniture.filter(f => f.id !== product.id);
    } else {
      // Add to selection
      newSelection = [...selectedFurniture, product];
    }
    
    setSelectedFurniture(newSelection);
  };

  const handleGenerateRoom = async () => {
    if (selectedFurniture.length === 0) {
      alert("Please select at least one furniture item");
      return;
    }
    
    try {
      // Build furniture list message
      const furnitureList = selectedFurniture
        .map((p, i) => `${i + 1}. ${p.name} (ID: ${p.id}, Image: ${p.imageUrl})`)
        .join("\n");
      
      sendFollowUpMessage(
        `Generate room with these furniture items:\n\n${furnitureList}\n\n` +
        `Add all ${selectedFurniture.length} furniture item(s) to the room image.`
      );
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleClearSelection = () => {
    setSelectedFurniture([]);
  };

  // Need image from chat
  if (mode === "needImage" && !storedRoomImage) {
    return (
      <div className="app">
        <div className="empty-state">
          <h2>🏠 Interior Architect</h2>
          <p>Share a room image URL in the chat to get started</p>
        </div>
      </div>
    );
  }

  // Loading catalogue
  if (isLoading && products.length === 0) {
    return (
      <div className="app">
        <div className="empty-state">
          <h2>🔄 Loading IKEA Catalogue...</h2>
        </div>
      </div>
    );
  }

  // Show products to select
  if (mode === "selection" && products.length > 0 && !furnishedImageUrl) {
    const isProductSelected = (productId: string) => selectedFurniture.some(f => f.id === productId);
    
    return (
      <div className="app">
        <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h2 style={{ fontSize: "28px", margin: "0 0 8px 0" }}>Choose Furniture to Add</h2>
            <p style={{ color: "#6b7280", fontSize: "15px" }}>Click items to select, then generate your furnished room</p>
            {selectedFurniture.length > 0 && (
              <p style={{ color: "#4f46e5", fontSize: "14px", fontWeight: 600, margin: "8px 0 0 0" }}>
                {selectedFurniture.length} item{selectedFurniture.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "24px",
          }}>
            {products.map((product) => {
              const isSelected = isProductSelected(product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  style={{
                    border: isSelected ? "2px solid #4f46e5" : "1px solid #e5e7eb",
                    borderRadius: "12px",
                    overflow: "hidden",
                    backgroundColor: isSelected ? "#f0f4ff" : "white",
                    transition: "all 0.2s",
                    boxShadow: isSelected ? "0 8px 24px rgba(79,70,229,0.15)" : "0 2px 8px rgba(0,0,0,0.08)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = isSelected 
                      ? "0 12px 32px rgba(79,70,229,0.2)"
                      : "0 8px 24px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = isSelected
                      ? "0 8px 24px rgba(79,70,229,0.15)"
                      : "0 2px 8px rgba(0,0,0,0.08)";
                  }}
                >
                  <div style={{ position: "relative", paddingTop: "75%", backgroundColor: "#f9fafb" }}>
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    {isSelected && (
                      <div style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        width: "32px",
                        height: "32px",
                        backgroundColor: "#4f46e5",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "18px",
                        fontWeight: "bold",
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "20px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 8px 0", lineHeight: "1.4", color: "#111827" }}>
                      {product.name}
                    </h3>
                    {product.description && (
                      <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 16px 0", lineHeight: "1.5", height: "40px", overflow: "hidden" }}>
                        {product.description.substring(0, 80)}{product.description.length > 80 ? '...' : ''}
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                      <span style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>
                        {product.price}€
                      </span>
                      {product.style && (
                        <span style={{
                          fontSize: "11px",
                          padding: "4px 10px",
                          backgroundColor: "#f3f4f6",
                          borderRadius: "6px",
                          color: "#6b7280",
                          fontWeight: 500,
                          textTransform: "capitalize",
                        }}>
                          {product.style}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductSelect(product);
                      }}
                      disabled={isLoading}
                      style={{
                        width: "100%",
                        fontSize: "15px",
                        padding: "14px",
                        fontWeight: 600,
                        backgroundColor: isSelected ? "#10b981" : "#e5e7eb",
                        color: isSelected ? "white" : "#6b7280",
                        border: "none",
                        borderRadius: "8px",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.backgroundColor = isSelected ? "#059669" : "#d1d5db";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.backgroundColor = isSelected ? "#10b981" : "#e5e7eb";
                        }
                      }}
                    >
                      {isSelected ? "✓ Selected" : "Select"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedFurniture.length > 0 && (
            <div style={{
              position: "fixed",
              bottom: "0",
              left: "0",
              right: "0",
              backgroundColor: "white",
              borderTop: "1px solid #e5e7eb",
              padding: "20px",
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              boxShadow: "0 -4px 12px rgba(0,0,0,0.08)",
            }}>
              <button
                onClick={handleClearSelection}
                disabled={isLoading}
                style={{
                  fontSize: "15px",
                  padding: "14px 32px",
                  fontWeight: 600,
                  backgroundColor: "#f3f4f6",
                  color: "#6b7280",
                  border: "none",
                  borderRadius: "8px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.currentTarget.style.backgroundColor = "#e5e7eb";
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
              >
                Clear Selection
              </button>
              <button
                onClick={handleGenerateRoom}
                disabled={isLoading || selectedFurniture.length === 0}
                style={{
                  fontSize: "15px",
                  padding: "14px 48px",
                  fontWeight: 600,
                  backgroundColor: isLoading || selectedFurniture.length === 0 ? "#9ca3af" : "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: isLoading || selectedFurniture.length === 0 ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && selectedFurniture.length > 0) e.currentTarget.style.backgroundColor = "#4338ca";
                }}
                onMouseLeave={(e) => {
                  if (!isLoading && selectedFurniture.length > 0) e.currentTarget.style.backgroundColor = "#4f46e5";
                }}
              >
                {isLoading ? "Generating..." : `Generate Room with ${selectedFurniture.length} Item${selectedFurniture.length !== 1 ? 's' : ''} →`}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show generated result - check mode OR furnishedImageUrl
  if (mode === "result" || furnishedImageUrl) {
    // Safety check - ensure we have the image URL
    if (!furnishedImageUrl) {
      console.error("❌ Mode is 'result' but furnishedImageUrl is missing!");
      return (
        <div className="app">
          <div className="empty-state">
            <h2>⚠️ Image Not Found</h2>
            <p>The generated image URL is missing. Please try again.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="app">
        <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "32px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}>
            <h2 style={{ margin: "0 0 24px 0", fontSize: "28px", textAlign: "center" }}>
              ✨ Your Furnished Room
            </h2>
            <div style={{
              position: "relative",
              width: "100%",
              maxWidth: "900px",
              margin: "0 auto 24px",
            }}>
              <img
                src={furnishedImageUrl}
                alt="Furnished room"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "12px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                  display: "block",
                }}
              />
            </div>
            
            <div style={{
              backgroundColor: "#f9fafb",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
            }}>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px", fontWeight: 600 }}>
                📸 Image URL:
              </p>
              <div style={{ display: "flex", gap: "12px", alignItems: "stretch" }}>
                <input
                  type="text"
                  value={furnishedImageUrl}
                  readOnly
                  onClick={(e) => e.currentTarget.select()}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    fontSize: "13px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    fontFamily: "monospace",
                    color: "#374151",
                  }}
                />
                <button
                  onClick={() => {
                    if (furnishedImageUrl) {
                      navigator.clipboard.writeText(furnishedImageUrl);
                      const btn = document.activeElement as HTMLButtonElement;
                      const originalText = btn.textContent;
                      btn.textContent = "✓ Copied!";
                      setTimeout(() => btn.textContent = originalText, 2000);
                    }
                  }}
                  style={{
                    padding: "12px 24px",
                    fontSize: "14px",
                    fontWeight: 600,
                    backgroundColor: "#4f46e5",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#4338ca"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#4f46e5"}
                >
                  📋 Copy
                </button>
              </div>
            </div>
          </div>

          {products.length > 0 && (
            <>
              <h3 style={{ marginBottom: "24px", fontSize: "22px", textAlign: "center" }}>
                Try More Furniture
              </h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "20px",
              }}>
                {products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      overflow: "hidden",
                      backgroundColor: "white",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                    }}
                  >
                    <div style={{ position: "relative", paddingTop: "75%", backgroundColor: "#f9fafb" }}>
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <div style={{ padding: "16px" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 8px 0", lineHeight: "1.3" }}>
                        {product.name}
                      </h4>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>
                        {product.price}€
                      </div>
                      <button
                        onClick={() => openExternal(product.buyUrl)}
                        style={{
                          width: "100%",
                          padding: "10px",
                          fontSize: "13px",
                          fontWeight: 600,
                          backgroundColor: "#f3f4f6",
                          color: "#374151",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#e5e7eb";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#f3f4f6";
                        }}
                      >
                        Buy on IKEA →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="empty-state">
        <h2>🏠 Interior Architect</h2>
        <p>Share a room image URL to browse furniture</p>
      </div>
    </div>
  );
}

if (typeof window !== 'undefined') {
  mountWidget(<InteriorArchitect />);
}
