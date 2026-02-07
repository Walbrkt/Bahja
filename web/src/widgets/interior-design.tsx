import "@/index.css";
import { mountWidget } from "skybridge/web";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCallTool } from "../helpers";

interface RoomDimensions {
  length: number;
  width: number;
  height: number;
  unit: "m" | "cm" | "ft";
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  dimensions?: { length: number; width: number; height: number; unit: "m" | "cm" | "in" };
  url: string;
  image: string;
  materials: string[];
  availability: string;
}

type SceneSize = { width: number; height: number };

function roomToMeters(room: RoomDimensions) {
  const scale = room.unit === "m" ? 1 : room.unit === "cm" ? 0.01 : 0.3048;
  return {
    length: room.length * scale,
    width: room.width * scale,
    height: room.height * scale,
  };
}

function toMeters(dimensions?: Product["dimensions"]) {
  if (!dimensions) return null;
  const { length, width, height, unit } = dimensions;
  const scale = unit === "m" ? 1 : unit === "cm" ? 0.01 : 0.0254;
  return {
    length: length * scale,
    width: width * scale,
    height: height * scale,
  };
}

function makePlaceholderImage(label: string) {
  const safeLabel = label.replace(/[<>]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#eef2f5"/>
        <stop offset="100%" stop-color="#d7dde3"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect x="24" y="24" width="552" height="352" rx="24" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
    <text x="50%" y="52%" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#334155" text-anchor="middle">
      ${safeLabel}
    </text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function InteriorDesignWidget() {
  const { callToolAsync, isPending: isSearching } =
    useCallTool("searchProducts");
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const [sceneSize, setSceneSize] = useState<SceneSize>({ width: 0, height: 0 });

  // Form state
  const [step, setStep] = useState<
    "welcome" | "upload" | "dimensions" | "style" | "results"
  >("welcome");
  const [roomImage, setRoomImage] = useState<string>("");
  const [dimensions, setDimensions] = useState<RoomDimensions>({
    length: 5.5,
    width: 4.2,
    height: 2.8,
    unit: "m",
  });
  const [selectedStyle, setSelectedStyle] = useState("Scandinavian");
  const [budget, setBudget] = useState(2000);
  const [selectedColors, setSelectedColors] = useState<string[]>(["white"]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([
    "natural",
  ]);

  // Product state
  const [products, setProducts] = useState<Product[]>([]);
  const [costTotal, setCostTotal] = useState(0);
  const [productNotice, setProductNotice] = useState<string>("");

  const styles = [
    "Scandinavian",
    "Industrial",
    "Minimalist",
    "Eclectic",
    "Modern",
    "Rustic",
  ];
  const colorOptions = [
    "white",
    "black",
    "neutral",
    "warm",
    "cool",
    "colorful",
  ];
  const materialOptions = [
    "natural",
    "eco-friendly",
    "leather",
    "fabric",
    "metal",
    "wood",
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRoomImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDimensionChange = (
    key: keyof RoomDimensions,
    value: number | string,
  ) => {
    setDimensions((prev) => ({
      ...prev,
      [key]: key === "unit" ? value : parseFloat(value as string),
    }));
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );
  };

  const toggleMaterial = (material: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(material)
        ? prev.filter((m) => m !== material)
        : [...prev, material],
    );
  };

  const handleSubmit = async () => {
    const fallback = (label: string) => makePlaceholderImage(label);
    const categories = ["sofa", "table", "chair", "lamp"];
    const perItemBudget = Math.max(
      Math.floor(budget / categories.length),
      50,
    );

    try {
      const responses = await Promise.all(
        categories.map((category) =>
          callToolAsync({
            category,
            style: selectedStyle,
            budget_per_item: perItemBudget,
            constraints: {
              materials: selectedMaterials,
              colors: selectedColors,
            },
          }).catch(() => null),
        ),
      );

      let notice = "";
      const nextProducts = responses.flatMap((response) => {
        if (!response) return [];
        let payload: any = null;
        if (response.structuredContent && Object.keys(response.structuredContent).length) {
          payload = response.structuredContent;
        } else if (response.result) {
          try {
            payload = JSON.parse(response.result);
          } catch {
            payload = null;
          }
        }

        if (!payload?.ok || !payload?.data?.products) return [];
        if (payload?.data?.notice && !notice) {
          notice = String(payload.data.notice);
        }
        return payload.data.products as Product[];
      });

      const normalizedProducts = nextProducts.map((product) => ({
        ...product,
        image: product.image || fallback(product.name),
        materials: Array.isArray(product.materials) ? product.materials : [],
      }));

      setProducts(normalizedProducts);
      setProductNotice(notice);
      const total = normalizedProducts.reduce((acc, p) => acc + p.price, 0);
      setCostTotal(total);
      setStep("results");
    } catch (error) {
      console.error("Product search failed", error);
      setProducts([]);
      setCostTotal(0);
      setProductNotice("Unable to fetch products. Check your API key.");
      setStep("results");
    }
  };

  useEffect(() => {
    if (!sceneRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry?.contentRect) return;
      setSceneSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(sceneRef.current);
    return () => observer.disconnect();
  }, []);

  const placements = useMemo(() => {
    if (!products.length || !sceneSize.width || !sceneSize.height) return [];

    const room = roomToMeters(dimensions);
    const roomWidthM = room.width;
    const roomLengthM = room.length;
    const cols = products.length >= 4 ? 2 : 1;
    const rows = Math.ceil(products.length / cols);
    const cellWidthM = roomWidthM / cols;
    const cellLengthM = roomLengthM / rows;

    return products.map((product, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const centerXM = cellWidthM * col + cellWidthM / 2;
      const centerYM = cellLengthM * row + cellLengthM / 2;

      const dims = toMeters(product.dimensions) ?? {
        length: cellLengthM * 0.6,
        width: cellWidthM * 0.6,
        height: 0.6,
      };

      const xPercent = (centerXM / roomWidthM) * 100;
      const yPercent = (centerYM / roomLengthM) * 100;
      const widthPercent = (dims.width / roomWidthM) * 100;
      const depthPercent = (dims.length / roomLengthM) * 100;
      const scale = Math.min(widthPercent, depthPercent) / 35;

      return {
        id: product.id,
        xPercent,
        yPercent,
        scale: Math.max(0.3, Math.min(scale, 1.2)),
      };
    });
  }, [products, sceneSize, dimensions.length, dimensions.width]);

  // Step 1: Welcome
  if (step === "welcome") {
    return (
      <div className="design-container">
        <div className="welcome-section">
          <h1>🏠 Interior Design AI</h1>
          <p>Transform your room into a beautiful, furnished space</p>
          <div className="welcome-features">
            <div className="feature">
              <div className="icon">📸</div>
              <p>Upload your room photo</p>
            </div>
            <div className="feature">
              <div className="icon">🎨</div>
              <p>Choose your design style</p>
            </div>
            <div className="feature">
              <div className="icon">🛋️</div>
              <p>Discover real furniture</p>
            </div>
            <div className="feature">
              <div className="icon">3D</div>
              <p>See interactive 3D layout</p>
            </div>
          </div>
          <button className="btn-primary" onClick={() => setStep("upload")}>
            Get Started
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Image Upload
  if (step === "upload") {
    return (
      <div className="design-container">
        <div className="step-header">
          <h2>Step 1: Upload Room Photo</h2>
          <p>Provide a clear image of your room (phone or camera photo)</p>
        </div>

        <div className="upload-section">
          {roomImage ? (
            <div className="image-preview">
              <img src={roomImage} alt="Room preview" />
              <button
                className="btn-secondary"
                onClick={() => setRoomImage("")}
              >
                Change Photo
              </button>
            </div>
          ) : (
            <div className="upload-box">
              <div className="upload-icon">📸</div>
              <p>Drag and drop your room photo here</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input"
              />
              <button
                className="btn-secondary"
                onClick={() => {
                  const input = document.querySelector(
                    ".file-input",
                  ) as HTMLInputElement;
                  input?.click();
                }}
              >
                Select Photo
              </button>
            </div>
          )}
        </div>

        <div className="step-actions">
          <button className="btn-secondary" onClick={() => setStep("welcome")}>
            Back
          </button>
          <button
            className="btn-primary"
            onClick={() => setStep("dimensions")}
            disabled={!roomImage}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Dimensions & Style
  if (step === "dimensions") {
    return (
      <div className="design-container">
        <div className="step-header">
          <h2>Step 2: Room Details & Style</h2>
          <p>Tell us about your room and design preferences</p>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Room Length</label>
            <input
              type="number"
              value={dimensions.length}
              onChange={(e) =>
                handleDimensionChange("length", parseFloat(e.target.value))
              }
              step="0.1"
            />
          </div>
          <div className="form-group">
            <label>Room Width</label>
            <input
              type="number"
              value={dimensions.width}
              onChange={(e) =>
                handleDimensionChange("width", parseFloat(e.target.value))
              }
              step="0.1"
            />
          </div>
          <div className="form-group">
            <label>Room Height</label>
            <input
              type="number"
              value={dimensions.height}
              onChange={(e) =>
                handleDimensionChange("height", parseFloat(e.target.value))
              }
              step="0.1"
            />
          </div>
          <div className="form-group">
            <label>Unit</label>
            <select
              value={dimensions.unit}
              onChange={(e) =>
                handleDimensionChange("unit", e.target.value as "m" | "cm" | "ft")
              }
            >
              <option value="m">Meters (m)</option>
              <option value="cm">Centimeters (cm)</option>
              <option value="ft">Feet (ft)</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <label>Design Style</label>
          <div className="style-grid">
            {styles.map((style) => (
              <button
                key={style}
                className={`style-btn ${selectedStyle === style ? "active" : ""}`}
                onClick={() => setSelectedStyle(style)}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label>Budget (USD)</label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(parseInt(e.target.value))}
            step="100"
          />
          <p className="hint">Total budget for all furniture</p>
        </div>

        <div className="form-section">
          <label>Preferred Colors</label>
          <div className="option-grid">
            {colorOptions.map((color) => (
              <button
                key={color}
                className={`option-btn ${selectedColors.includes(color) ? "active" : ""}`}
                onClick={() => toggleColor(color)}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label>Preferred Materials</label>
          <div className="option-grid">
            {materialOptions.map((material) => (
              <button
                key={material}
                className={`option-btn ${selectedMaterials.includes(material) ? "active" : ""}`}
                onClick={() => toggleMaterial(material)}
              >
                {material}
              </button>
            ))}
          </div>
        </div>

        <div className="step-actions">
          <button className="btn-secondary" onClick={() => setStep("upload")}>
            Back
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={isSearching}>
            {isSearching ? "Searching..." : "Generate Design"}
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Results
  if (step === "results") {
    return (
      <div className="design-container">
        <div className="step-header">
          <h2>✨ Your Design is Ready!</h2>
          <p>Here's your curated furniture selection</p>
        </div>

        <div className="results-grid">
          <div className="viewer-section">
            <div className="viewer-scene" ref={sceneRef}>
              <div
                className="scene-background"
                style={{
                  backgroundImage: roomImage ? `url(${roomImage})` : "none",
                }}
              />
              <div className="scene-overlay" />
              <div className="scene-floor">
                {products.map((product) => {
                  const placement = placements.find((item) => item.id === product.id);
                  const fallback = makePlaceholderImage(product.name);
                  return (
                    <img
                      key={product.id}
                      className="scene-item"
                      src={product.image || fallback}
                      alt={product.name}
                      style={{
                        left: `${placement?.xPercent ?? 50}%`,
                        top: `${placement?.yPercent ?? 50}%`,
                        transform: `translate(-50%, -50%) rotateX(65deg) scale(${placement?.scale ?? 0.6})`,
                      }}
                    />
                  );
                })}
              </div>
              <div className="scene-caption">
                Room: {dimensions.length} × {dimensions.width} × {dimensions.height}{" "}
                {dimensions.unit} · Style: {selectedStyle}
              </div>
            </div>
          </div>

          <div className="sidebar">
            <div className="cost-summary">
              <h3>Budget Summary</h3>
              <div className="cost-line">
                <span>Items:</span>
                <strong>{products.length}</strong>
              </div>
              <div className="cost-line">
                <span>Subtotal:</span>
                <strong>${costTotal}</strong>
              </div>
              <div className="cost-line">
                <span>Tax (10%):</span>
                <strong>${(costTotal * 0.1).toFixed(2)}</strong>
              </div>
              <div className="cost-line total">
                <span>Total:</span>
                <strong>${(costTotal * 1.1).toFixed(2)}</strong>
              </div>
              <div className="budget-status">
                <span>
                  {costTotal > budget
                    ? `Over budget by $${costTotal - budget}`
                    : `$${budget - costTotal} under budget`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="products-section">
          <h3>Selected Furniture</h3>
          {productNotice && <div className="empty-state">{productNotice}</div>}
          <div className="products-grid">
            {products.length === 0 && (
              <div className="empty-state">
                No products found. Check `SERPAPI_API_KEY` or try a different
                style/budget.
              </div>
            )}
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <img
                  src={product.image || makePlaceholderImage(product.name)}
                  alt={product.name}
                  loading="lazy"
                  onError={(event) => {
                    const target = event.currentTarget;
                    const fallback = makePlaceholderImage(product.name);
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                />
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p className="brand">{product.brand}</p>
                  <p className="price">${product.price}</p>
                  <p className="materials">
                    {product.materials.join(", ")}
                  </p>
                  <p className="dimensions">
                    {product.dimensions
                      ? `${product.dimensions.length}L × ${product.dimensions.width}W × ${product.dimensions.height}H ${product.dimensions.unit}`
                      : "Dimensions: N/A"}
                  </p>
                  <a href={product.url} target="_blank" className="btn-link">
                    View Product →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="export-section">
          <h3>Next Steps</h3>
          <div className="action-buttons">
            <button className="btn-secondary">Download Layout (PDF)</button>
            <button className="btn-secondary">Export Product List (CSV)</button>
            <button className="btn-secondary">Share Design Link</button>
          </div>
        </div>

        <div className="step-actions">
          <button className="btn-secondary" onClick={() => setStep("dimensions")}>
            Refine Design
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setStep("welcome");
              setRoomImage("");
            }}
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default InteriorDesignWidget;
mountWidget(<InteriorDesignWidget />);
