import "@/index.css";
import { useState, useEffect } from "react";
import { mountWidget, useSendFollowUpMessage, useFiles } from "skybridge/web";
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
  const { callTool, data: callToolData, isPending: isCallPending } = useCallTool("interior-architect");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const openExternal = useOpenExternal();
  const sendFollowUpMessage = useSendFollowUpMessage();
  const { upload, getDownloadUrl } = useFiles();

  const products = (responseMetadata?.products || callToolData?.meta?.products || []) as IkeaProduct[];
  const mode = (responseMetadata?.mode || callToolData?.meta?.mode) as "needImage" | "selection" | "result" | undefined;
  const storedRoomImage = uploadedImageUrl || (responseMetadata?.roomImageUrl || callToolData?.meta?.roomImageUrl) as string | undefined;
  const furnishedImageUrl = (responseMetadata?.furnishedImageUrl || callToolData?.meta?.furnishedImageUrl) as string | undefined;
  const userPrompt = (responseMetadata?.userPrompt || callToolData?.meta?.userPrompt) as string | undefined;
  const isLoading = isPending || isCallPending;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload file and get downloadable URL
      const { fileId } = await upload(file);
      const { downloadUrl } = await getDownloadUrl({ fileId });
      
      setUploadedImageUrl(downloadUrl);
      
      // Send message asking what furniture they want
      sendFollowUpMessage(`I uploaded a room image: ${downloadUrl}\n\nWhat furniture would you like to add to this room?`);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Debug logging
  console.log("Widget State:", {
    mode,
    hasFurnishedImageUrl: !!furnishedImageUrl,
    furnishedImageUrl: furnishedImageUrl?.substring(0, 50),
    productsCount: products.length,
    hasResponseMetadata: !!responseMetadata,
    hasCallToolData: !!callToolData,
    responseMetadata_furnishedImageUrl: responseMetadata?.furnishedImageUrl ? String(responseMetadata.furnishedImageUrl).substring(0, 50) : 'none',
    callToolData_furnishedImageUrl: callToolData?.meta?.furnishedImageUrl ? String(callToolData.meta.furnishedImageUrl).substring(0, 50) : 'none',
  });

  const handleProductSelect = async (product: IkeaProduct) => {
    setIsGenerating(true);
    try {
      // Send message with product details for AI to extract
      sendFollowUpMessage(
        `Generate room with this furniture:\n\n` +
        `Product: ${product.name}\n` +
        `Product Image: ${product.imageUrl}\n` +
        `Product ID: ${product.id}\n` +
        (userPrompt ? `User wants: ${userPrompt}\n` : '') +
        `\nUse the room image already provided and add this furniture to it.`
      );
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Always show upload UI first if no image is uploaded
  if (!storedRoomImage && !uploadedImageUrl) {
    return (
      <div className="app">
        <div className="empty-state">
          <h2>🏠 Interior Architect</h2>
          <p style={{ marginBottom: "24px", fontSize: "16px" }}>Start by uploading a room image</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              cursor: isUploading ? "not-allowed" : "pointer",
              borderRadius: "8px",
              border: "2px solid #3b82f6",
              backgroundColor: isUploading ? "#e5e7eb" : "white",
            }}
          />
          {isUploading && <p style={{ marginTop: "12px", color: "#6b7280" }}>Uploading...</p>}
        </div>
      </div>
    );
  }

  // Show waiting state after upload, before user responds with furniture request
  if ((uploadedImageUrl || storedRoomImage) && (mode === "needImage" || !mode)) {
    return (
      <div className="app">
        <div className="empty-state">
          <h2>✅ Image Uploaded</h2>
          <p>Tell me what furniture you'd like to add!</p>
          {(uploadedImageUrl || storedRoomImage) && (
            <img 
              src={uploadedImageUrl || storedRoomImage} 
              alt="Uploaded room" 
              style={{ 
                maxWidth: "400px", 
                marginTop: "20px", 
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }} 
            />
          )}
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
    return (
      <div className="app">
        <div style={{ padding: "24px", maxWidth: "1800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h2 style={{ fontSize: "28px", margin: "0 0 8px 0" }}>Choose Furniture to Add</h2>
            <p style={{ color: "#6b7280", fontSize: "15px" }}>Click any product to visualize it in your room</p>
          </div>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "24px",
          }}>
            {products.map((product) => (
              <div
                key={product.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  overflow: "hidden",
                  backgroundColor: "white",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
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
                    onClick={() => handleProductSelect(product)}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      fontSize: "15px",
                      padding: "14px",
                      fontWeight: 600,
                      backgroundColor: isLoading ? "#9ca3af" : "#4f46e5",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) e.currentTarget.style.backgroundColor = "#4338ca";
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) e.currentTarget.style.backgroundColor = "#4f46e5";
                    }}
                  >
                    {isLoading ? "Generating..." : "Generate Room →"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isGenerating && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.90)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}>
            <div style={{
              background: "white",
              padding: "48px 64px",
              borderRadius: "20px",
              textAlign: "center",
              maxWidth: "450px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}>
              <div style={{
                width: "80px",
                height: "80px",
                margin: "0 auto 32px",
                border: "5px solid #e5e7eb",
                borderTop: "5px solid #4f46e5",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              <h2 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "16px", color: "#111827" }}>
                🎨 Generating Image...
              </h2>
              <p style={{ fontSize: "15px", color: "#6b7280", lineHeight: "1.6" }}>
                Creating your furnished room with AI.<br/>
                This usually takes 10-30 seconds.
              </p>
            </div>
          </div>
        )}
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
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
        <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
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
