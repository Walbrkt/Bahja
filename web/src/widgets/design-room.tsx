import "@/index.css";

import { useState, useEffect } from "react";
import { mountWidget, useDisplayMode, createStore } from "skybridge/web";
import { useOpenExternal } from "skybridge/web";
import { useToolInfo, useCallTool } from "../helpers";
import RoomViewer3D from "./room-viewer-3d";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FurnitureItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  width: number;
  depth: number;
  height: number;
  imageUrl: string;
  buyUrl: string;
  retailer: string;
  category: string;
  style: string;
}

interface PaintItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  color: string;
  colorHex: string;
  finish: string;
  coverage: string;
  imageUrl: string;
  buyUrl: string;
  retailer: string;
}

type SelectedItem = {
  id: string;
  name: string;
  price: number;
  currency: string;
  type: "furniture" | "paint";
  imageUrl: string;
  buyUrl: string;
  description: string;
  category?: string;
  width?: number;
  depth?: number;
  height?: number;
  colorHex?: string;
};

// ─── Store (persisted, LLM-visible) ──────────────────────────────────────────

interface SelectionState {
  selectedItems: SelectedItem[];
  addItem: (item: SelectedItem) => void;
  removeItem: (id: string) => void;
  [key: string]: unknown;
}

const useSelectionStore = createStore<SelectionState>((set) => ({
  selectedItems: [],
  addItem: (item: SelectedItem) =>
    set((s) => ({
      selectedItems: [...s.selectedItems.filter((i) => i.id !== item.id), item],
    })),
  removeItem: (id: string) =>
    set((s) => ({
      selectedItems: s.selectedItems.filter((i) => i.id !== id),
    })),
}));

// ─── Sub-components ──────────────────────────────────────────────────────────

function FurnitureCard({ item }: { item: FurnitureItem }) {
  const { addItem, removeItem, selectedItems } = useSelectionStore();
  const openExternal = useOpenExternal();
  const selected = (selectedItems as SelectedItem[]).some((i) => i.id === item.id);

  return (
    <div
      className={`item-card ${selected ? "item-card--selected" : ""}`}
      data-llm={`Furniture: ${item.name}, €${item.price}, ${item.width}×${item.depth}×${item.height}cm, ${item.category}${selected ? " [SELECTED]" : ""}`}
    >
      <div className="item-card__image-wrapper">
        <img src={item.imageUrl} alt={item.name} className="item-card__image" />
        <span className="item-card__badge">{item.category}</span>
      </div>
      <div className="item-card__body">
        <h3 className="item-card__title">{item.name}</h3>
        <p className="item-card__desc">{item.description}</p>
        <div className="item-card__meta">
          <span className="item-card__price">€{item.price}</span>
          <span className="item-card__dims">
            {item.width}×{item.depth}×{item.height}cm
          </span>
        </div>
        <div className="item-card__retailer">
          {item.retailer}
        </div>
        <div className="item-card__actions">
          <button
            className={`btn ${selected ? "btn--danger" : "btn--primary"}`}
            onClick={() =>
              selected
                ? removeItem(item.id)
                : addItem({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    currency: item.currency,
                    type: "furniture",
                    imageUrl: item.imageUrl,
                    buyUrl: item.buyUrl,
                    description: `${item.category} — ${item.width}×${item.depth}×${item.height}cm`,
                    category: item.category,
                    width: item.width,
                    depth: item.depth,
                    height: item.height,
                  })
            }
          >
            {selected ? "✕ Remove" : "＋ Select"}
          </button>
          <button className="btn btn--outline" onClick={() => openExternal(item.buyUrl)}>
            🛒 Buy
          </button>
        </div>
      </div>
    </div>
  );
}

function PaintCard({ item }: { item: PaintItem }) {
  const { addItem, removeItem, selectedItems } = useSelectionStore();
  const openExternal = useOpenExternal();
  const selected = (selectedItems as SelectedItem[]).some((i) => i.id === item.id);

  return (
    <div
      className={`item-card item-card--paint ${selected ? "item-card--selected" : ""}`}
      data-llm={`Paint: ${item.name}, ${item.color}, ${item.finish}, €${item.price}${selected ? " [SELECTED]" : ""}`}
    >
      <div className="item-card__image-wrapper">
        <div
          className="item-card__color-swatch"
          style={{ backgroundColor: item.colorHex }}
        />
        <span className="item-card__badge item-card__badge--paint">{item.finish}</span>
      </div>
      <div className="item-card__body">
        <h3 className="item-card__title">{item.name}</h3>
        <p className="item-card__desc">{item.description}</p>
        <div className="item-card__meta">
          <span className="item-card__price">€{item.price}</span>
          <span className="item-card__dims">{item.coverage}</span>
        </div>
        <div className="item-card__color-info">
          <span
            className="item-card__color-dot"
            style={{ backgroundColor: item.colorHex }}
          />
          {item.color} · {item.retailer}
        </div>
        <div className="item-card__actions">
          <button
            className={`btn ${selected ? "btn--danger" : "btn--primary"}`}
            onClick={() =>
              selected
                ? removeItem(item.id)
                : addItem({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    currency: item.currency,
                    type: "paint",
                    imageUrl: item.imageUrl,
                    buyUrl: item.buyUrl,
                    description: `${item.color} ${item.finish} — ${item.coverage}`,
                    colorHex: item.colorHex,
                  })
            }
          >
            {selected ? "✕ Remove" : "＋ Select"}
          </button>
          <button className="btn btn--outline" onClick={() => openExternal(item.buyUrl)}>
            🛒 Buy
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectionPanel() {
  const { selectedItems, removeItem } = useSelectionStore();
  const openExternal = useOpenExternal();
  const total = selectedItems.reduce((sum, i) => sum + i.price, 0);

  if (selectedItems.length === 0) return null;

  return (
    <div
      className="selection-panel"
      data-llm={`Selected ${selectedItems.length} items, total €${total}`}
    >
      <h3 className="selection-panel__title">
        🛍️ My Selections ({selectedItems.length})
        <span className="selection-panel__total">€{total}</span>
      </h3>
      <div className="selection-panel__items">
        {selectedItems.map((item) => (
          <div key={item.id} className="selection-chip">
            {item.type === "paint" && item.colorHex ? (
              <div
                className="selection-chip__color"
                style={{ backgroundColor: item.colorHex }}
              />
            ) : (
              <img src={item.imageUrl} alt={item.name} className="selection-chip__img" />
            )}
            <div className="selection-chip__info">
              <span className="selection-chip__name">{item.name}</span>
              <span className="selection-chip__detail">
                €{item.price} · {item.description}
              </span>
            </div>
            <div className="selection-chip__actions">
              <button
                className="btn btn--sm btn--outline"
                onClick={() => openExternal(item.buyUrl)}
                title="Buy"
              >
                🛒
              </button>
              <button
                className="btn btn--sm btn--danger"
                onClick={() => removeItem(item.id)}
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Visualize Tab (3D + AI regenerate) ──────────────────────────────────────

function VisualizeTab({
  roomWidth,
  roomLength,
  roomHeight,
  style,
  roomType,
}: {
  roomWidth: number;
  roomLength: number;
  roomHeight: number;
  style: string;
  roomType: string | null;
}) {
  const { selectedItems } = useSelectionStore();
  const [userPrompt, setUserPrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [activeView, setActiveView] = useState<"3d" | "ai">("ai");

  const {
    callTool: callGenerateImage,
    data: imageData,
    isPending: isImagePending,
  } = useCallTool("generate-room-image");

  const selectedFurniture = selectedItems.filter((i) => i.type === "furniture");
  const selectedPaint = selectedItems.find((i) => i.type === "paint");

  // Category-based colors for 3D
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

  const wallOffset = 10;
  const centerX = roomWidth / 2;
  const centerZ = roomLength / 2;

  const furniturePlacements = selectedFurniture.map((item, i) => {
    let x = 0;
    let z = 0;
    let rotation = 0;
    const cat = item.category || "sofa";
    const w = item.width || 100;
    const d = item.depth || 60;

    switch (cat) {
      case "sofa":
      case "bed":
        x = centerX;
        z = d / 2 + wallOffset;
        break;
      case "table":
        x = centerX;
        z = centerZ;
        break;
      case "desk":
        x = roomWidth - d / 2 - wallOffset;
        z = centerZ;
        rotation = Math.PI / 2;
        break;
      case "chair":
        x = centerX + 60;
        z = centerZ + 40;
        rotation = -Math.PI / 4;
        break;
      case "shelf":
      case "mirror":
        x = d / 2 + wallOffset;
        z = 50 + i * 120;
        rotation = Math.PI / 2;
        break;
      case "lamp":
        x = roomWidth - 50;
        z = wallOffset + 30;
        break;
      case "rug":
        x = centerX;
        z = centerZ;
        break;
      case "armchair":
        x = roomWidth - w / 2 - wallOffset - 20;
        z = d / 2 + wallOffset + 20;
        rotation = -Math.PI / 6;
        break;
      default:
        x = wallOffset + 60 + i * 80;
        z = wallOffset + 60;
    }

    return {
      id: item.id,
      name: item.name,
      category: cat,
      width: item.width || 100,
      depth: item.depth || 60,
      height: item.height || 80,
      x,
      y: (item.height || 80) / 2,
      z,
      color: categoryColors[cat] || "#999999",
      rotation,
    };
  });

  const roomConfig = {
    width: roomWidth,
    length: roomLength,
    height: roomHeight,
    wallColor: selectedPaint?.colorHex || "#FAFAFA",
    floorColor: "#DEB887",
  };

  const handleGenerateImage = (customPrompt?: string) => {
    const furnitureNames = selectedFurniture.map((f) => f.name);
    setGeneratedImageUrl(null);
    setImageError(false);
    callGenerateImage({
      roomWidth,
      roomLength,
      roomHeight,
      style,
      furnitureNames: furnitureNames.length > 0 ? furnitureNames : ["minimal furniture"],
      paintColor: selectedPaint?.description?.split(" ")[0] || undefined,
      paintHex: selectedPaint?.colorHex || undefined,
      roomType: roomType || "room",
      userPrompt: customPrompt || userPrompt || undefined,
    });
  };

  useEffect(() => {
    if (imageData && !isImagePending) {
      const sc = imageData.structuredContent as Record<string, unknown> | undefined;
      const url = sc?.imageUrl;
      if (url && typeof url === "string") {
        setGeneratedImageUrl(url);
      }
    }
  }, [imageData, isImagePending]);

  // Quick prompt suggestions based on style
  const quickPrompts: Record<string, string[]> = {
    moroccan: ["warm golden hour light", "brass chandelier shadows", "mint tea on brass table", "view of a riad courtyard"],
    scandinavian: ["cozy winter light", "candles and wool blankets", "snowy window view", "hygge atmosphere"],
    modern: ["dramatic spotlight lighting", "city skyline view", "minimalist gallery wall", "sleek and luxurious"],
    industrial: ["exposed brick warmth", "vintage Edison bulbs", "loft with city view", "raw urban energy"],
    classic: ["crystal chandelier glow", "fireplace lit evening", "afternoon tea setting", "old world elegance"],
    french: ["Parisian rooftop view", "morning light with croissants", "herringbone floor detail", "Belle Époque charm"],
    bohemian: ["golden sunset light", "plants everywhere", "eclectic art gallery wall", "free-spirited cozy"],
    japanese: ["zen garden view", "cherry blossom outside", "morning meditation space", "wabi-sabi tranquility"],
    minimal: ["pure white serenity", "single dramatic shadow", "architectural light play", "absolute calm"],
    tropical: ["ocean breeze curtains", "sunset terrace view", "lush jungle backdrop", "island luxury"],
  };

  const stylePrompts = quickPrompts[style.toLowerCase()] || quickPrompts.modern || [];

  return (
    <div className="visualize-tab" data-llm="3D viewer + AI image generation with selected items">
      {/* View Toggle */}
      <div className="rc-tabs" style={{ marginBottom: 12 }}>
        <button
          className={`rc-tab ${activeView === "ai" ? "rc-tab--active" : ""}`}
          onClick={() => setActiveView("ai")}
        >
          🎨 AI Visualization
        </button>
        <button
          className={`rc-tab ${activeView === "3d" ? "rc-tab--active" : ""}`}
          onClick={() => setActiveView("3d")}
        >
          🧊 3D Preview
        </button>
      </div>

      {activeView === "3d" && (
        <div className="visual-panel">
          <div className="visual-panel__header">
            <h3>Interactive 3D Room Preview</h3>
            <p className="visual-panel__hint">
              🖱️ Drag to rotate · Scroll to zoom · {selectedFurniture.length} item{selectedFurniture.length !== 1 ? "s" : ""} placed
              {selectedPaint ? ` · Walls: ${selectedPaint.description?.split(" — ")[0]}` : ""}
            </p>
          </div>
          {selectedFurniture.length === 0 ? (
            <div className="visual-empty">
              <p>👆 Select furniture items from the Furniture tab to see them in 3D</p>
              <p className="visual-empty__sub">Selected paint colors will also appear on the walls</p>
            </div>
          ) : (
            <RoomViewer3D room={roomConfig} furniture={furniturePlacements} />
          )}
        </div>
      )}

      {activeView === "ai" && (
        <div className="visual-panel">
          <div className="visual-panel__header">
            <h3>🎨 AI Room Visualization</h3>
            <p className="visual-panel__hint">
              Generate a photorealistic image with your selected furniture and paint
            </p>
          </div>

          {/* Selected items summary */}
          {(selectedFurniture.length > 0 || selectedPaint) && (
            <div className="ai-selections-summary">
              <p className="ai-selections-title">📦 Items to render:</p>
              <div className="ai-prompt-tags">
                {selectedFurniture.map((f) => (
                  <span key={f.id} className="ai-tag">🪑 {f.name}</span>
                ))}
                {selectedPaint && (
                  <span className="ai-tag" style={{ borderColor: selectedPaint.colorHex }}>
                    🎨 {selectedPaint.description?.split(" — ")[0]}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick prompt tags */}
          <div className="ai-prompt-section">
            <div className="ai-prompt-tags">
              {stylePrompts.map((tag) => (
                <button
                  key={tag}
                  className="ai-tag"
                  onClick={() => setUserPrompt((prev) => prev ? `${prev}, ${tag}` : tag)}
                >
                  + {tag}
                </button>
              ))}
            </div>
            <textarea
              className="ai-prompt-input"
              placeholder="Describe the mood… e.g., 'warm afternoon light, plants by the window, cozy atmosphere'"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={2}
            />
            <button
              className="btn btn--primary btn--generate"
              onClick={() => handleGenerateImage()}
              disabled={isImagePending}
            >
              {isImagePending ? (
                <>
                  <span className="btn-spinner" /> Generating...
                </>
              ) : generatedImageUrl ? (
                "🔄 Regenerate Image"
              ) : (
                "✨ Generate AI Image"
              )}
            </button>
          </div>

          {isImagePending && (
            <div className="ai-loading">
              <div className="rc-loading__spinner" />
              <p>🎨 fal.ai is painting your {style} room...</p>
              <p className="ai-loading__sub">
                {selectedFurniture.length > 0 
                  ? `Including ${selectedFurniture.length} furniture piece${selectedFurniture.length > 1 ? "s" : ""}`
                  : "Creating a beautiful visualization"}
              </p>
            </div>
          )}

          {generatedImageUrl && !isImagePending && (
            <div className="ai-result">
              <img
                src={generatedImageUrl}
                alt={`AI generated ${style} room`}
                className="ai-result__image"
                onError={() => setImageError(true)}
              />
              {imageError && (
                <div className="ai-loading" style={{ padding: "2rem" }}>
                  <p>⚠️ Image failed to load</p>
                  <button className="btn btn--primary btn--sm" onClick={() => handleGenerateImage()}>
                    🔄 Try Again
                  </button>
                </div>
              )}
              <div className="ai-result__caption">
                <span className="ai-result__badge">✨ AI Generated · fal.ai</span>
                {style.charAt(0).toUpperCase() + style.slice(1)} {roomType || "room"} · {selectedFurniture.length} items
              </div>
            </div>
          )}

          {!generatedImageUrl && !isImagePending && (
            <div className="visual-empty">
              <p>✨ Click "Generate AI Image" to create a photorealistic room visualization</p>
              <p className="visual-empty__sub">
                {selectedFurniture.length > 0
                  ? `Your ${selectedFurniture.length} selected item${selectedFurniture.length > 1 ? "s" : ""} will be blended into the image`
                  : "Select furniture items first for a personalized render"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Widget ─────────────────────────────────────────────────────────────

function DesignRoom() {
  const { input, output, isPending, responseMetadata } = useToolInfo<"design-room">();
  const [displayMode, setDisplayMode] = useDisplayMode();
  const [activeTab, setActiveTab] = useState<"furniture" | "paint" | "3d">("furniture");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [heroSrc, setHeroSrc] = useState<string | null>(null);

  // Loading state
  if (isPending || !output) {
    return (
      <div className="rc-loading">
        <div className="rc-loading__spinner" />
        <p>
          Designing your {input?.style || ""} {input?.roomType || "room"}…
        </p>
        {input && (
          <p className="rc-loading__dims">
            {input.roomWidth} × {input.roomLength} × {input.roomHeight} cm
            {input.budget ? ` · Budget: €${input.budget}` : ""}
          </p>
        )}
      </div>
    );
  }

  const meta = responseMetadata as {
    renderImageUrl?: string;
    fallbackImageUrl?: string;
    furniture: FurnitureItem[];
    paint: PaintItem[];
  };

  // Set hero image source from structuredContent (primary) or _meta (fallback)
  useEffect(() => {
    const url = (output as any)?.renderImageUrl || meta?.renderImageUrl;
    if (url && !heroSrc) {
      setHeroSrc(url);
    }
  }, [(output as any)?.renderImageUrl, meta?.renderImageUrl]);

  const isFullscreen = displayMode === "fullscreen";

  return (
    <div className={`rc-root ${isFullscreen ? "rc-root--fullscreen" : ""}`}>
      {/* Header */}
      <header className="rc-header">
        <div className="rc-header__info">
          <h2 className="rc-header__title">
            🏠 {output.style?.charAt(0).toUpperCase()}{output.style?.slice(1)}{" "}
            {output.roomType || "Room"}
          </h2>
          <p className="rc-header__dims">
            {output.roomDimensions.width} × {output.roomDimensions.length} ×{" "}
            {output.roomDimensions.height} cm
            {output.budget ? ` · Budget: €${output.budget}` : ""}
          </p>
        </div>
        <button
          className="btn btn--outline btn--sm"
          onClick={() => setDisplayMode(isFullscreen ? "inline" : "fullscreen")}
        >
          {isFullscreen ? "↙ Collapse" : "↗ Expand"}
        </button>
      </header>

      {/* ── Hero AI Image ── */}
      {heroSrc && (
        <div className="rc-hero" data-llm="AI-generated room visualization powered by fal.ai">
          {!imageLoaded && !imageError && (
            <div className="rc-hero__loading">
              <div className="rc-loading__spinner" />
              <p>🎨 Loading room visualization…</p>
            </div>
          )}
          <img
            src={heroSrc}
            alt={`AI visualization of ${output.style} ${output.roomType || "room"}`}
            className={`rc-hero__image ${imageLoaded ? "rc-hero__image--visible" : ""}`}
            onLoad={() => {
              setImageLoaded(true);
              setImageError(false);
            }}
            onError={() => {
              // Try fallback if main image fails
              const fallback = (output as any)?.fallbackImageUrl || meta?.fallbackImageUrl;
              if (fallback && heroSrc !== fallback) {
                setHeroSrc(fallback);
              } else {
                setImageError(true);
                setImageLoaded(true);
              }
            }}
          />
          {imageLoaded && !imageError && (
            <div className="rc-hero__caption">
              <span className="rc-hero__badge">
                {output.isFallbackImage || heroSrc === ((output as any)?.fallbackImageUrl || meta?.fallbackImageUrl)
                  ? "🖼️ Preview" 
                  : "✨ AI Generated · fal.ai"}
              </span>
              {output.style?.charAt(0).toUpperCase()}{output.style?.slice(1)} {output.roomType || "room"} —{" "}
              {output.roomDimensions.width}×{output.roomDimensions.length} cm
            </div>
          )}
          {imageError && (
            <div className="rc-hero__loading" style={{ minHeight: 120 }}>
              <p>⚠️ Image could not be loaded</p>
              <p className="ai-loading__sub">Switch to the 3D View tab to generate a new visualization</p>
            </div>
          )}
        </div>
      )}

      {/* Selections */}
      <SelectionPanel />

      {/* Tabs */}
      <div className="rc-tabs">
        <button
          className={`rc-tab ${activeTab === "furniture" ? "rc-tab--active" : ""}`}
          onClick={() => setActiveTab("furniture")}
        >
          🪑 Furniture ({output.furnitureCount})
        </button>
        <button
          className={`rc-tab ${activeTab === "paint" ? "rc-tab--active" : ""}`}
          onClick={() => setActiveTab("paint")}
        >
          🎨 Paint ({output.paintCount})
        </button>
        <button
          className={`rc-tab ${activeTab === "3d" ? "rc-tab--active" : ""}`}
          onClick={() => setActiveTab("3d")}
        >
          ✨ Visualize
        </button>
      </div>

      {/* Furniture Grid */}
      {activeTab === "furniture" && (
        <div className="rc-grid">
          {meta.furniture.map((item) => (
            <FurnitureCard key={item.id} item={item} />
          ))}
          {meta.furniture.length === 0 && (
            <p className="rc-empty">No furniture found matching your criteria.</p>
          )}
        </div>
      )}

      {/* Paint Grid */}
      {activeTab === "paint" && (
        <div className="rc-grid">
          {meta.paint.map((item) => (
            <PaintCard key={item.id} item={item} />
          ))}
          {meta.paint.length === 0 && (
            <p className="rc-empty">No paint options found matching your criteria.</p>
          )}
        </div>
      )}

      {/* 3D View */}
      {activeTab === "3d" && (
        <VisualizeTab
          roomWidth={output.roomDimensions.width}
          roomLength={output.roomDimensions.length}
          roomHeight={output.roomDimensions.height}
          style={output.style || "modern"}
          roomType={output.roomType || null}
        />
      )}
    </div>
  );
}

export default DesignRoom;

mountWidget(<DesignRoom />);
