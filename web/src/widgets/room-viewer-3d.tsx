import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoomViewerRef {
  getScreenshot: () => string;
}

interface FurniturePlacement {
  id: string;
  name: string;
  category: string;
  width: number;
  depth: number;
  height: number;
  x: number;
  y: number;
  z: number;
  color: string;
  rotation: number;
}

interface RoomConfig {
  width: number; // cm
  length: number; // cm
  height: number; // cm
  wallColor: string;
  floorColor: string;
}

interface RoomViewer3DProps {
  room: RoomConfig;
  furniture: FurniturePlacement[];
}

// ─── Main Component ──────────────────────────────────────────────────────────

const RoomViewer3D = forwardRef<RoomViewerRef, RoomViewer3DProps>(({ room, furniture }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationRef = useRef<number>(0);

  // Expose the screenshot function to the parent
  useImperativeHandle(ref, () => ({
    getScreenshot: () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return "";
      // Render a fresh frame to ensure the screenshot is up to date
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      // Get the data URL (JPEG 0.9 quality)
      return rendererRef.current.domElement.toDataURL("image/jpeg", 0.9);
    }
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clean up previous
    if (rendererRef.current) {
      rendererRef.current.dispose();
      container.innerHTML = "";
    }
    cancelAnimationFrame(animationRef.current);

    const width = container.clientWidth;
    const height = container.clientHeight || 500;

    // ── Scene ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // ── Camera ──
    const scale = 0.01;
    const roomW = room.width * scale;
    const roomL = room.length * scale;
    const roomH = room.height * scale;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(roomW * 1.5, roomH * 1.8, roomL * 2);
    camera.lookAt(roomW / 2, roomH * 0.3, roomL / 2);
    cameraRef.current = camera;

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      preserveDrawingBuffer: true // REQUIRED for screenshots
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Controls ──
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(roomW / 2, roomH * 0.3, roomL / 2);
    controls.enableDamping = true;
    controls.update();

    // ── Lighting ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.0);
    sunLight.position.set(roomW, roomH * 2, roomL * 0.5);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // ── Geometry Helper ──
    const createBox = (w: number, h: number, d: number, color: string | number) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    // ── Room Shell ──
    // Floor
    const floor = createBox(roomW, 0.05, roomL, room.floorColor);
    floor.position.set(roomW/2, -0.025, roomL/2);
    scene.add(floor);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: room.wallColor, side: THREE.DoubleSide });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomH), wallMat);
    backWall.position.set(roomW/2, roomH/2, 0);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomL, roomH), wallMat);
    leftWall.rotation.y = Math.PI/2;
    leftWall.position.set(0, roomH/2, roomL/2);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // ── Furniture ──
    furniture.forEach((item) => {
      // Simple block representation for ControlNet depth map
      const w = item.width * scale;
      const h = item.height * scale;
      const d = item.depth * scale;
      
      const group = new THREE.Group();
      const mesh = createBox(w, h, d, item.color);
      mesh.position.y = h / 2;
      group.add(mesh);

      group.position.set(item.x * scale, 0, item.z * scale);
      group.rotation.y = item.rotation;
      scene.add(group);
    });

    // ── Animation ──
    function animate() {
      animationRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animationRef.current);
      controls.dispose();
      renderer.dispose();
      scene.clear();
      container.innerHTML = "";
    };
  }, [room, furniture]);

  return (
    <div 
      className="room-3d-container" 
      ref={containerRef} 
      style={{ width: "100%", height: "100%", minHeight: "500px", background: "#f0f0f0" }}
    />
  );
});

export default RoomViewer3D;