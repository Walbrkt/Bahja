import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Category-based 3D shapes ────────────────────────────────────────────────

function createFurnitureMesh(item: FurniturePlacement): THREE.Group {
  const group = new THREE.Group();
  const scale = 0.01; // cm → meters
  const w = item.width * scale;
  const d = item.depth * scale;
  const h = item.height * scale;
  const color = new THREE.Color(item.color);
  const darkColor = new THREE.Color(item.color).multiplyScalar(0.7);

  switch (item.category) {
    case "sofa": {
      // Seat
      const seatGeo = new THREE.BoxGeometry(w, h * 0.35, d * 0.7);
      const seatMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
      const seat = new THREE.Mesh(seatGeo, seatMat);
      seat.position.y = h * 0.175;
      group.add(seat);
      // Back
      const backGeo = new THREE.BoxGeometry(w, h * 0.65, d * 0.15);
      const backMat = new THREE.MeshStandardMaterial({ color: darkColor, roughness: 0.8 });
      const back = new THREE.Mesh(backGeo, backMat);
      back.position.y = h * 0.325 + h * 0.175;
      back.position.z = -d * 0.275;
      group.add(back);
      // Armrests
      for (const side of [-1, 1]) {
        const armGeo = new THREE.BoxGeometry(d * 0.12, h * 0.25, d * 0.7);
        const armMat = new THREE.MeshStandardMaterial({ color: darkColor, roughness: 0.8 });
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.position.set((side * w) / 2 - side * d * 0.06, h * 0.3, 0);
        group.add(arm);
      }
      break;
    }
    case "table":
    case "desk": {
      // Tabletop
      const topGeo = new THREE.BoxGeometry(w, h * 0.05, d);
      const topMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = h * 0.95;
      group.add(top);
      // Legs
      const legH = h * 0.9;
      const legR = Math.min(w, d) * 0.03;
      for (const [lx, lz] of [
        [-w / 2 + legR * 2, -d / 2 + legR * 2],
        [w / 2 - legR * 2, -d / 2 + legR * 2],
        [-w / 2 + legR * 2, d / 2 - legR * 2],
        [w / 2 - legR * 2, d / 2 - legR * 2],
      ]) {
        const legGeo = new THREE.CylinderGeometry(legR, legR, legH, 8);
        const legMat = new THREE.MeshStandardMaterial({ color: darkColor, roughness: 0.6 });
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, legH / 2, lz);
        group.add(leg);
      }
      break;
    }
    case "chair": {
      // Seat
      const cSeatGeo = new THREE.BoxGeometry(w, h * 0.05, d);
      const cSeatMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
      const cSeat = new THREE.Mesh(cSeatGeo, cSeatMat);
      cSeat.position.y = h * 0.5;
      group.add(cSeat);
      // Back
      const cBackGeo = new THREE.BoxGeometry(w, h * 0.45, d * 0.05);
      const cBackMat = new THREE.MeshStandardMaterial({ color: darkColor, roughness: 0.7 });
      const cBack = new THREE.Mesh(cBackGeo, cBackMat);
      cBack.position.set(0, h * 0.75, -d / 2 + d * 0.025);
      group.add(cBack);
      // Legs
      for (const [lx, lz] of [
        [-w * 0.4, -d * 0.4],
        [w * 0.4, -d * 0.4],
        [-w * 0.4, d * 0.4],
        [w * 0.4, d * 0.4],
      ]) {
        const lGeo = new THREE.CylinderGeometry(0.015, 0.015, h * 0.48, 6);
        const lMat = new THREE.MeshStandardMaterial({ color: darkColor, roughness: 0.5 });
        const l = new THREE.Mesh(lGeo, lMat);
        l.position.set(lx, h * 0.24, lz);
        group.add(l);
      }
      break;
    }
    case "bed": {
      // Mattress
      const mattGeo = new THREE.BoxGeometry(w, h * 0.3, d);
      const mattMat = new THREE.MeshStandardMaterial({ color: 0xf5f5dc, roughness: 0.9 });
      const matt = new THREE.Mesh(mattGeo, mattMat);
      matt.position.y = h * 0.5;
      group.add(matt);
      // Frame
      const frameGeo = new THREE.BoxGeometry(w + 0.05, h * 0.3, d + 0.05);
      const frameMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.y = h * 0.15;
      group.add(frame);
      // Headboard
      const hbGeo = new THREE.BoxGeometry(w + 0.05, h * 0.7, 0.05);
      const hbMat = new THREE.MeshStandardMaterial({ color: darkColor, roughness: 0.6 });
      const hb = new THREE.Mesh(hbGeo, hbMat);
      hb.position.set(0, h * 0.35 + h * 0.15, -d / 2);
      group.add(hb);
      // Pillows
      for (const px of [-w * 0.25, w * 0.25]) {
        const pillowGeo = new THREE.BoxGeometry(w * 0.35, 0.08, 0.25);
        const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
        const pillow = new THREE.Mesh(pillowGeo, pillowMat);
        pillow.position.set(px, h * 0.68, -d * 0.35);
        group.add(pillow);
      }
      break;
    }
    case "lamp": {
      // Base
      const baseGeo = new THREE.CylinderGeometry(w * 0.15, w * 0.2, h * 0.03, 16);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.3, metalness: 0.8 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = h * 0.015;
      group.add(base);
      // Pole
      const poleGeo = new THREE.CylinderGeometry(0.01, 0.01, h * 0.7, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.8 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = h * 0.38;
      group.add(pole);
      // Shade
      const shadeGeo = new THREE.ConeGeometry(w * 0.25, h * 0.25, 16, 1, true);
      const shadeMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.8,
        side: THREE.DoubleSide,
      });
      const shade = new THREE.Mesh(shadeGeo, shadeMat);
      shade.position.y = h * 0.85;
      shade.rotation.x = Math.PI;
      group.add(shade);
      // Light bulb glow
      const light = new THREE.PointLight(0xfff5e0, 0.5, 3);
      light.position.y = h * 0.8;
      group.add(light);
      break;
    }
    case "rug": {
      const rugGeo = new THREE.BoxGeometry(w, 0.01, d);
      const rugMat = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
      const rug = new THREE.Mesh(rugGeo, rugMat);
      rug.position.y = 0.005;
      group.add(rug);
      break;
    }
    case "shelf": {
      // Vertical boards
      for (const sx of [-w / 2, 0, w / 2]) {
        const boardGeo = new THREE.BoxGeometry(0.02, h, d);
        const boardMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.set(sx, h / 2, 0);
        group.add(board);
      }
      // Shelves
      const shelfCount = 5;
      for (let i = 0; i <= shelfCount; i++) {
        const shelfGeo = new THREE.BoxGeometry(w, 0.02, d);
        const shelfMat = new THREE.MeshStandardMaterial({ color: darkColor, roughness: 0.6 });
        const shelf = new THREE.Mesh(shelfGeo, shelfMat);
        shelf.position.y = (i / shelfCount) * h;
        group.add(shelf);
      }
      break;
    }
    case "mirror": {
      // Frame
      const frameGeo2 = new THREE.TorusGeometry(w * 0.45 * scale * 100, 0.03, 8, 32);
      const frameMat2 = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
      const mirrorFrame = new THREE.Mesh(frameGeo2, frameMat2);
      mirrorFrame.position.y = h / 2;
      group.add(mirrorFrame);
      // Mirror surface
      const mirrorGeo = new THREE.CircleGeometry(w * 0.4 * scale * 100, 32);
      const mirrorMat = new THREE.MeshStandardMaterial({
        color: 0xccddee,
        roughness: 0.05,
        metalness: 0.95,
      });
      const mirrorMesh = new THREE.Mesh(mirrorGeo, mirrorMat);
      mirrorMesh.position.y = h / 2;
      mirrorMesh.position.z = 0.01;
      group.add(mirrorMesh);
      break;
    }
    case "armchair": {
      // Seat
      const aSeatGeo = new THREE.BoxGeometry(w, h * 0.3, d * 0.7);
      const aSeatMat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
      const aSeat = new THREE.Mesh(aSeatGeo, aSeatMat);
      aSeat.position.y = h * 0.35;
      group.add(aSeat);
      // Back
      const aBackGeo = new THREE.BoxGeometry(w * 0.9, h * 0.55, d * 0.15);
      const aBackMat = new THREE.MeshStandardMaterial({ color: darkColor, roughness: 0.85 });
      const aBack = new THREE.Mesh(aBackGeo, aBackMat);
      aBack.position.set(0, h * 0.55, -d * 0.275);
      group.add(aBack);
      // Arms
      for (const side of [-1, 1]) {
        const armGeo = new THREE.BoxGeometry(d * 0.15, h * 0.35, d * 0.7);
        const armMat = new THREE.MeshStandardMaterial({ color: darkColor, roughness: 0.85 });
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.position.set((side * w) / 2, h * 0.35, 0);
        group.add(arm);
      }
      break;
    }
    default: {
      // Generic box
      const boxGeo = new THREE.BoxGeometry(w, h, d);
      const boxMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.y = h / 2;
      group.add(box);
    }
  }

  // Enable shadows for all meshes in the group
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

// ─── Label sprite ────────────────────────────────────────────────────────────

function createLabel(text: string, position: THREE.Vector3): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = 512;
  canvas.height = 64;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.roundRect(0, 0, 512, 64, 8);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.9 });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(1.2, 0.15, 1);
  return sprite;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function RoomViewer3D({ room, furniture }: RoomViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationRef = useRef<number>(0);

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
    scene.fog = new THREE.Fog(0xf0f0f0, 15, 25);

    // ── Camera ──
    const scale = 0.01;
    const roomW = room.width * scale;
    const roomL = room.length * scale;
    const roomH = room.height * scale;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(roomW * 1.5, roomH * 1.8, roomL * 2);
    camera.lookAt(roomW / 2, roomH * 0.3, roomL / 2);

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Controls ──
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(roomW / 2, roomH * 0.3, roomL / 2);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.minDistance = 1;
    controls.maxDistance = 15;
    controls.update();

    // ── Lighting ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
    sunLight.position.set(roomW, roomH * 2, roomL * 0.5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 20;
    sunLight.shadow.camera.left = -5;
    sunLight.shadow.camera.right = 5;
    sunLight.shadow.camera.top = 5;
    sunLight.shadow.camera.bottom = -5;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xaaccff, 0.3);
    fillLight.position.set(-roomW, roomH, -roomL);
    scene.add(fillLight);

    // ── Floor ──
    const floorGeo = new THREE.PlaneGeometry(roomW, roomL);
    const floorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(room.floorColor),
      roughness: 0.8,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(roomW / 2, 0, roomL / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    // ── Walls ──
    const wallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(room.wallColor),
      roughness: 0.9,
      side: THREE.DoubleSide,
    });

    // Back wall
    const backWallGeo = new THREE.PlaneGeometry(roomW, roomH);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(roomW / 2, roomH / 2, 0);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left wall
    const leftWallGeo = new THREE.PlaneGeometry(roomL, roomH);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(0, roomH / 2, roomL / 2);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall (transparent/wireframe for visibility)
    const rightWallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(room.wallColor),
      roughness: 0.9,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const rightWallGeo = new THREE.PlaneGeometry(roomL, roomH);
    const rightWall = new THREE.Mesh(rightWallGeo, rightWallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(roomW, roomH / 2, roomL / 2);
    scene.add(rightWall);

    // Front wall (transparent for visibility)
    const frontWallGeo = new THREE.PlaneGeometry(roomW, roomH);
    const frontWall = new THREE.Mesh(frontWallGeo, rightWallMat.clone());
    frontWall.rotation.y = Math.PI;
    frontWall.position.set(roomW / 2, roomH / 2, roomL);
    scene.add(frontWall);

    // ── Ceiling (subtle) ──
    const ceilingGeo = new THREE.PlaneGeometry(roomW, roomL);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(roomW / 2, roomH, roomL / 2);
    scene.add(ceiling);

    // ── Room edges (wireframe outline) ──
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 1 });
    const edgePoints = [
      // Floor edges
      [0, 0, 0], [roomW, 0, 0],
      [roomW, 0, 0], [roomW, 0, roomL],
      [roomW, 0, roomL], [0, 0, roomL],
      [0, 0, roomL], [0, 0, 0],
      // Ceiling edges
      [0, roomH, 0], [roomW, roomH, 0],
      [roomW, roomH, 0], [roomW, roomH, roomL],
      [roomW, roomH, roomL], [0, roomH, roomL],
      [0, roomH, roomL], [0, roomH, 0],
      // Vertical edges
      [0, 0, 0], [0, roomH, 0],
      [roomW, 0, 0], [roomW, roomH, 0],
      [roomW, 0, roomL], [roomW, roomH, roomL],
      [0, 0, roomL], [0, roomH, roomL],
    ];
    for (let i = 0; i < edgePoints.length; i += 2) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...(edgePoints[i] as [number, number, number])),
        new THREE.Vector3(...(edgePoints[i + 1] as [number, number, number])),
      ]);
      scene.add(new THREE.LineSegments(geo, edgeMat));
    }

    // ── Furniture ──
    furniture.forEach((item) => {
      const mesh = createFurnitureMesh(item);
      mesh.position.set(item.x * scale, 0, item.z * scale);
      mesh.rotation.y = item.rotation;
      scene.add(mesh);

      // Label above furniture
      const labelPos = new THREE.Vector3(
        item.x * scale,
        (item.height * scale) + 0.15,
        item.z * scale,
      );
      const label = createLabel(item.name, labelPos);
      scene.add(label);
    });

    // ── Grid helper (subtle) ──
    const gridHelper = new THREE.GridHelper(Math.max(roomW, roomL) * 1.5, 20, 0xdddddd, 0xeeeeee);
    gridHelper.position.set(roomW / 2, -0.001, roomL / 2);
    scene.add(gridHelper);

    // ── Animation loop ──
    function animate() {
      animationRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // ── Resize handler ──
    function onResize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
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
    <div className="room-3d-container" ref={containerRef} data-llm="Interactive 3D room viewer — drag to rotate, scroll to zoom" />
  );
}
