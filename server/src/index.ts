import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express, { type Express } from "express";
import { widgetsDevServer } from "skybridge/server";
import type { ViteDevServer } from "vite";
import { mcp } from "./middleware.js";
import server from "./server.js";

const app = express() as Express & { vite: ViteDevServer };

app.use(express.json());

// ── Static serving for AI-generated images ────────────────────────────────────
// Images saved by fal.ai generation are served from /generated-images/
const GENERATED_DIR = path.join(
  process.env.NODE_ENV === "production"
    ? "/tmp"
    : path.dirname(fileURLToPath(import.meta.url)),
  "generated-images",
);
if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
}
// Export for use in server.ts
(globalThis as any).__GENERATED_DIR = GENERATED_DIR;

app.use("/generated-images", cors());
app.use("/generated-images", express.static(GENERATED_DIR, {
  maxAge: "1d",
  immutable: true,
}));

// ── Image proxy endpoint ─────────────────────────────────────────────────────
// Proxies images from fal.ai (and other allowed sources) through our server
// so the widget iframe can load them without CSP blocking.
const ALLOWED_IMAGE_HOSTS = [
  "v3b.fal.media",
  "fal.media",
  "storage.googleapis.com",
  "images.unsplash.com",
  "encrypted-tbn0.gstatic.com",   // Google Shopping thumbnails
  "m.media-amazon.com",           // Amazon product images
  "images-na.ssl-images-amazon.com",
  "i5.walmartimages.com",         // Walmart
  "target.scene7.com",            // Target
  "cb2.scene7.com",               // CB2
  "assets.weimgs.com",            // West Elm
  "img.laredoute.com",            // La Redoute
  "media.conforama.fr",           // Conforama
];

app.get("/api/image-proxy", async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    res.status(400).send("Missing url parameter");
    return;
  }

  try {
    const parsed = new URL(imageUrl);
    if (!ALLOWED_IMAGE_HOSTS.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
      res.status(403).send("Domain not allowed");
      return;
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      res.status(response.status).send("Upstream image fetch failed");
      return;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache 24h
    res.setHeader("Access-Control-Allow-Origin", "*");

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (error) {
    console.error("[image-proxy] Error:", error);
    res.status(500).send("Image proxy error");
  }
});

app.use(mcp(server));

const env = process.env.NODE_ENV || "development";

if (env !== "production") {
  const { devtoolsStaticServer } = await import("@skybridge/devtools");
  app.use(await devtoolsStaticServer());
  app.use(await widgetsDevServer());
}

if (env === "production") {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use("/assets", cors());
  app.use("/assets", express.static(path.join(__dirname, "assets")));
}

app.listen(3000, (error) => {
  if (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
});

process.on("SIGINT", async () => {
  console.log("Server shutdown complete");
  process.exit(0);
});
