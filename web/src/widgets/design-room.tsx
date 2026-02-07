import "@/index.css";

import { useState } from "react";
import { mountWidget, useDisplayMode, createStore } from "skybridge/web";
import { useOpenExternal } from "skybridge/web";
import { useToolInfo } from "../helpers";

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
            <img src={item.imageUrl} alt={item.name} className="selection-chip__img" />
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

// ─── Main Widget ─────────────────────────────────────────────────────────────

function DesignRoom() {
  const { input, output, isPending, responseMetadata } = useToolInfo<"design-room">();
  const [displayMode, setDisplayMode] = useDisplayMode();
  const [activeTab, setActiveTab] = useState<"furniture" | "paint">("furniture");

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
      </div>

      {/* Grid */}
      <div className="rc-grid">
        {activeTab === "furniture" &&
          meta.furniture.map((item) => (
            <FurnitureCard key={item.id} item={item} />
          ))}
        {activeTab === "paint" &&
          meta.paint.map((item) => <PaintCard key={item.id} item={item} />)}
      </div>

      {/* Empty state */}
      {activeTab === "furniture" && meta.furniture.length === 0 && (
        <p className="rc-empty">No furniture found matching your criteria.</p>
      )}
      {activeTab === "paint" && meta.paint.length === 0 && (
        <p className="rc-empty">No paint options found matching your criteria.</p>
      )}
    </div>
  );
}

export default DesignRoom;

mountWidget(<DesignRoom />);
