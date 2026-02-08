import "@/index.css";

import { useState, useEffect, useMemo } from "react";
import { mountWidget, useDisplayMode, createStore } from "skybridge/web";
import { useOpenExternal } from "skybridge/web";
import { useToolInfo, useCallTool } from "../helpers";

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

// ─── Furniture Selection Card ────────────────────────────────────────────────
// Compact card: image + info + select toggle. Click anywhere to select.

function FurnitureSelectCard({
  item,
  selected,
  onToggle,
}: {
  item: FurnitureItem;
  selected: boolean;
  onToggle: () => void;
}) {
  const openExternal = useOpenExternal();

  return (
    <div
      className={`dr-card ${selected ? "dr-card--selected" : ""}`}
      onClick={onToggle}
      data-llm={`${item.name} €${item.price}${selected ? " [SELECTED]" : ""}`}
    >
      {/* Selection indicator */}
      <div className="dr-card__check">
        {selected ? "✓" : ""}
      </div>

      {/* Image */}
      <div className="dr-card__img-wrap">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="dr-card__img"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop";
          }}
        />
      </div>

      {/* Info */}
      <div className="dr-card__info">
        <h4 className="dr-card__name">{item.name}</h4>
        <p className="dr-card__desc">{item.description}</p>
        <div className="dr-card__meta">
          <span className="dr-card__price">€{item.price}</span>
          <span className="dr-card__cat">{item.category}</span>
        </div>
        <div className="dr-card__dims">
          {item.width}×{item.depth}×{item.height}cm · {item.retailer}
        </div>
      </div>

      {/* Buy link (stop propagation so it doesn't toggle selection) */}
      <button
        className="dr-card__buy"
        onClick={(e) => {
          e.stopPropagation();
          openExternal(item.buyUrl);
        }}
        title={`Buy at ${item.retailer}`}
      >
        🛒
      </button>
    </div>
  );
}

// ─── Paint Selection Card ────────────────────────────────────────────────────

function PaintSelectCard({
  item,
  selected,
  onToggle,
}: {
  item: PaintItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`dr-card dr-card--paint ${selected ? "dr-card--selected" : ""}`}
      onClick={onToggle}
    >
      <div className="dr-card__check">
        {selected ? "✓" : ""}
      </div>
      <div className="dr-card__img-wrap">
        <div className="dr-card__swatch" style={{ backgroundColor: item.colorHex }} />
      </div>
      <div className="dr-card__info">
        <h4 className="dr-card__name">{item.name}</h4>
        <p className="dr-card__desc">{item.description}</p>
        <div className="dr-card__meta">
          <span className="dr-card__price">€{item.price}</span>
          <span className="dr-card__cat">{item.finish}</span>
        </div>
        <div className="dr-card__dims">{item.color} · {item.coverage}</div>
      </div>
    </div>
  );
}

// ─── Main Widget ─────────────────────────────────────────────────────────────

function DesignRoom() {
  const { input, output, isPending, responseMetadata } = useToolInfo<"design-room">();
  const { selectedItems, addItem, removeItem } = useSelectionStore();
  const [displayMode, setDisplayMode] = useDisplayMode();
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [activeSection, setActiveSection] = useState<"furniture" | "paint">("furniture");
  const [showResult, setShowResult] = useState(false);

  const {
    callTool: callGenerateImage,
    data: imageData,
    isPending: isImagePending,
  } = useCallTool("generate-room-image");

  // Derived state
  const selectedFurniture = useMemo(
    () => selectedItems.filter((i) => i.type === "furniture"),
    [selectedItems],
  );
  const selectedPaint = useMemo(
    () => selectedItems.find((i) => i.type === "paint"),
    [selectedItems],
  );

  // Listen for generated image result
  useEffect(() => {
    if (imageData && !isImagePending) {
      const sc = imageData.structuredContent as Record<string, unknown> | undefined;
      const url = sc?.imageUrl;
      if (url && typeof url === "string") {
        setGeneratedImageUrl(url);
        setShowResult(true);
      }
    }
  }, [imageData, isImagePending]);

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
    furniture: FurnitureItem[];
    paint: PaintItem[];
  };

  const isFullscreen = displayMode === "fullscreen";

  // Toggle furniture selection
  const toggleFurniture = (item: FurnitureItem) => {
    const isSelected = selectedItems.some((i) => i.id === item.id);
    if (isSelected) {
      removeItem(item.id);
    } else {
      addItem({
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
      });
    }
  };

  // Toggle paint selection (only one at a time)
  const togglePaint = (item: PaintItem) => {
    const isSelected = selectedItems.some((i) => i.id === item.id);
    if (isSelected) {
      removeItem(item.id);
    } else {
      // Remove any other paint selection first
      selectedItems.filter((i) => i.type === "paint").forEach((i) => removeItem(i.id));
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        currency: item.currency,
        type: "paint",
        imageUrl: item.imageUrl,
        buyUrl: item.buyUrl,
        description: `${item.color} ${item.finish} — ${item.coverage}`,
        colorHex: item.colorHex,
      });
    }
  };

  // Generate the room image
  const handleGenerate = () => {
    const furnitureNames = selectedFurniture.map((f) => f.name);
    const furnitureImageUrls = selectedFurniture.map((f) => f.imageUrl).filter(Boolean);
    setGeneratedImageUrl(null);
    setImageError(false);
    setShowResult(true); // Show the result section immediately (with loading)
    callGenerateImage({
      roomWidth: output.roomDimensions.width,
      roomLength: output.roomDimensions.length,
      roomHeight: output.roomDimensions.height,
      style: output.style || "modern",
      furnitureNames: furnitureNames.length > 0 ? furnitureNames : ["minimal furniture"],
      furnitureImageUrls: furnitureImageUrls.length > 0 ? furnitureImageUrls : undefined,
      paintColor: selectedPaint?.description?.split(" ")[0] || undefined,
      paintHex: selectedPaint?.colorHex || undefined,
      roomType: output.roomType || "room",
    });
  };

  const totalPrice = selectedItems.reduce((sum, i) => sum + i.price, 0);

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

      {/* ── AI Generated Result (shows when image is generated) ── */}
      {showResult && (
        <div className="dr-result">
          {isImagePending && (
            <div className="dr-result__loading">
              <div className="rc-loading__spinner" />
              <p>🎨 fal.ai is painting your {output.style} room…</p>
              <p className="dr-result__sub">
                Including {selectedFurniture.length} furniture item{selectedFurniture.length !== 1 ? "s" : ""}
                {selectedPaint ? ` · ${selectedPaint.description?.split(" — ")[0]} walls` : ""}
              </p>
            </div>
          )}
          {generatedImageUrl && !isImagePending && (
            <>
              <img
                src={generatedImageUrl}
                alt={`AI generated ${output.style} room`}
                className="dr-result__image"
                onError={() => setImageError(true)}
              />
              {imageError && (
                <div className="dr-result__loading" style={{ padding: "2rem" }}>
                  <p>⚠️ Image failed to load</p>
                  <button className="btn btn--primary btn--sm" onClick={handleGenerate}>
                    🔄 Try Again
                  </button>
                </div>
              )}
              <div className="dr-result__caption">
                <span className="dr-result__badge">✨ AI GENERATED · FAL.AI</span>
                {output.style?.charAt(0).toUpperCase()}{output.style?.slice(1)}{" "}
                {output.roomType || "room"} · {selectedFurniture.length} items
              </div>
              <div className="dr-result__actions">
                <button className="btn btn--primary btn--sm" onClick={handleGenerate}>
                  🔄 Regenerate
                </button>
                <button className="btn btn--outline btn--sm" onClick={() => setShowResult(false)}>
                  ← Back to selection
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Step indicator ── */}
      {!showResult && (
        <div className="dr-steps">
          <div className={`dr-step ${selectedFurniture.length > 0 ? "dr-step--done" : "dr-step--active"}`}>
            <span className="dr-step__num">1</span>
            <span className="dr-step__label">Select furniture & paint</span>
          </div>
          <div className="dr-step__arrow">→</div>
          <div className={`dr-step ${selectedFurniture.length > 0 ? "dr-step--active" : ""}`}>
            <span className="dr-step__num">2</span>
            <span className="dr-step__label">Generate your room</span>
          </div>
        </div>
      )}

      {/* ── Selected items bar ── */}
      {!showResult && selectedItems.length > 0 && (
        <div className="dr-selected-bar">
          <div className="dr-selected-bar__items">
            {selectedItems.map((item) => (
              <div key={item.id} className="dr-selected-bar__chip">
                {item.type === "paint" && item.colorHex ? (
                  <div className="dr-selected-bar__color" style={{ backgroundColor: item.colorHex }} />
                ) : (
                  <img src={item.imageUrl} alt={item.name} className="dr-selected-bar__img" />
                )}
                <span className="dr-selected-bar__name">{item.name}</span>
                <button
                  className="dr-selected-bar__remove"
                  onClick={() => removeItem(item.id)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="dr-selected-bar__summary">
            <span className="dr-selected-bar__total">
              {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} · €{totalPrice}
            </span>
          </div>
        </div>
      )}

      {/* ── Section tabs (furniture / paint) ── */}
      {!showResult && (
        <>
          <div className="rc-tabs">
            <button
              className={`rc-tab ${activeSection === "furniture" ? "rc-tab--active" : ""}`}
              onClick={() => setActiveSection("furniture")}
            >
              🪑 Furniture ({meta.furniture?.length || 0})
            </button>
            <button
              className={`rc-tab ${activeSection === "paint" ? "rc-tab--active" : ""}`}
              onClick={() => setActiveSection("paint")}
            >
              🎨 Paint ({meta.paint?.length || 0})
            </button>
          </div>

          {/* Furniture Grid */}
          {activeSection === "furniture" && (
            <div className="dr-grid">
              {(meta.furniture || []).map((item) => (
                <FurnitureSelectCard
                  key={item.id}
                  item={item}
                  selected={selectedItems.some((i) => i.id === item.id)}
                  onToggle={() => toggleFurniture(item)}
                />
              ))}
              {(!meta.furniture || meta.furniture.length === 0) && (
                <p className="rc-empty">No furniture found matching your criteria.</p>
              )}
            </div>
          )}

          {/* Paint Grid */}
          {activeSection === "paint" && (
            <div className="dr-grid">
              {(meta.paint || []).map((item) => (
                <PaintSelectCard
                  key={item.id}
                  item={item}
                  selected={selectedItems.some((i) => i.id === item.id)}
                  onToggle={() => togglePaint(item)}
                />
              ))}
              {(!meta.paint || meta.paint.length === 0) && (
                <p className="rc-empty">No paint options found matching your criteria.</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Floating Generate Button ── */}
      {!showResult && selectedFurniture.length > 0 && (
        <div className="dr-generate-bar">
          <div className="dr-generate-bar__info">
            <span className="dr-generate-bar__count">
              🪑 {selectedFurniture.length} furniture
              {selectedPaint ? " · 🎨 1 paint" : ""}
            </span>
            <span className="dr-generate-bar__price">€{totalPrice}</span>
          </div>
          <button
            className="btn btn--primary dr-generate-bar__btn"
            onClick={handleGenerate}
            disabled={isImagePending}
          >
            {isImagePending ? (
              <>
                <span className="btn-spinner" /> Generating…
              </>
            ) : (
              <>✨ Generate Room Image</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default DesignRoom;

mountWidget(<DesignRoom />);
