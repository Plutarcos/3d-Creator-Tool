import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MaterialPreset, DualTextGeometries, StencilParams } from '../types';
import {
  Eye,
  RotateCw,
  Box,
  Sparkles,
  Palette,
  Move,
  ImageIcon,
  Type,
  Crosshair,
  Maximize2,
  MousePointer,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Viewport3DProps {
  geometry: THREE.BufferGeometry | null;
  multiGeometries?: DualTextGeometries | null;
  multiColorMode?: boolean;
  materialPreset: MaterialPreset;
  wireframe: boolean;
  onMaterialChange: (m: MaterialPreset) => void;
  onWireframeToggle: () => void;
  onMultiColorToggle?: () => void;
  layerProgress?: number; // 0 to 1 for layer slicing preview
  wordA?: string;
  wordB?: string;
  isDualText?: boolean;
  viewAngle?: number;
  isStencil?: boolean;
  stencilParams?: StencilParams;
  onStencilChange?: (p: Partial<StencilParams>) => void;
}

const MATERIAL_CONFIGS: Record<MaterialPreset, { color: number; metalness: number; roughness: number; emissive?: number; name: string; bgClass: string }> = {
  'ruby-red': { color: 0xe11d48, metalness: 0.35, roughness: 0.3, name: 'Vermelho Rubi (Foto)', bgClass: 'bg-rose-600' },
  'matte-black': { color: 0x1e2229, metalness: 0.1, roughness: 0.65, name: 'Preto Fosco (Base)', bgClass: 'bg-zinc-800' },
  'gold': { color: 0xd4af37, metalness: 0.75, roughness: 0.28, name: 'Seda Dourada', bgClass: 'bg-amber-400' },
  'silk-silver': { color: 0xd1d5db, metalness: 0.85, roughness: 0.25, name: 'Seda Prata', bgClass: 'bg-slate-300' },
  'neon-cyan': { color: 0x06b6d4, metalness: 0.2, roughness: 0.35, name: 'Ciano Neon', bgClass: 'bg-cyan-500' },
  'marble-white': { color: 0xf8fafc, metalness: 0.05, roughness: 0.55, name: 'Branco Puro', bgClass: 'bg-slate-100' },
  'glow-green': { color: 0x22c55e, metalness: 0.1, roughness: 0.4, emissive: 0x052e16, name: 'Verde Glow', bgClass: 'bg-emerald-500' },
  'galaxy-purple': { color: 0x9333ea, metalness: 0.4, roughness: 0.35, name: 'Roxo Galáxia', bgClass: 'bg-purple-600' },
  'wood-pla': { color: 0xa16207, metalness: 0.0, roughness: 0.8, name: 'PLA Madeira', bgClass: 'bg-amber-700' },
};

export const Viewport3D: React.FC<Viewport3DProps> = ({
  geometry,
  multiGeometries,
  multiColorMode = false,
  materialPreset,
  wireframe,
  onMaterialChange,
  onWireframeToggle,
  onMultiColorToggle,
  layerProgress = 1.0,
  wordA = 'MICHAEL',
  wordB = 'JESSICA',
  isDualText = true,
  viewAngle = 45,
  isStencil = false,
  stencilParams,
  onStencilChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const clipPlaneRef = useRef<THREE.Plane | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);

  // Stencil 3D direct positioning state
  const [stencilTarget, setStencilTarget] = useState<'image' | 'text'>('image');
  const [is3DDragEnabled, setIs3DDragEnabled] = useState<boolean>(true);
  const isDragging3DRef = useRef<boolean>(false);
  const stencilGizmoGroupRef = useRef<THREE.Group | null>(null);

  // Articulated Flexi simulation state
  const jointGroupsRef = useRef<THREE.Group[]>([]);
  const [isWiggling, setIsWiggling] = useState<boolean>(false);
  const isWigglingRef = useRef<boolean>(false);
  const wiggleAmpRef = useRef<number>(0.42);
  const [liveFlexAngle, setLiveFlexAngle] = useState<number>(0);
  const liveFlexAngleRef = useRef<number>(0);
  const [interactionMode, setInteractionMode] = useState<'camera' | 'flex'>('camera');
  const isFlexDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    isWigglingRef.current = isWiggling;
  }, [isWiggling]);

  useEffect(() => {
    liveFlexAngleRef.current = liveFlexAngle;
  }, [liveFlexAngle]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = interactionMode === 'camera';
    }
  }, [interactionMode]);

  // Initialize Three Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f19);
    sceneRef.current = scene;

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    camera.position.set(110, 85, 130);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 700;
    controls.minDistance = 20;
    controls.target.set(0, 15, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.4);
    dirLight1.position.set(120, 220, 150);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x818cf8, 1.5);
    dirLight2.position.set(-160, 90, -120);
    scene.add(dirLight2);

    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.7);
    bottomLight.position.set(0, -100, 0);
    scene.add(bottomLight);

    // Build Plate Grid (220x220mm)
    const gridHelper = new THREE.GridHelper(260, 26, 0x6366f1, 0x334155);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    // Bed Plate Border
    const bedGeo = new THREE.PlaneGeometry(260, 260);
    const bedMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.rotation.x = -Math.PI / 2;
    bedMesh.position.y = -0.1;
    scene.add(bedMesh);

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Articulated segments live physics / kinematics
      if (jointGroupsRef.current.length > 0) {
        if (isWigglingRef.current) {
          const time = performance.now() * 0.0035;
          const amp = wiggleAmpRef.current;
          jointGroupsRef.current.forEach((joint, idx) => {
            const wave = Math.sin(time * 3.4 - idx * 0.85) * amp;
            joint.rotation.y = THREE.MathUtils.lerp(joint.rotation.y, wave, 0.2);
          });
        } else {
          const targetRad = (liveFlexAngleRef.current * Math.PI) / 180;
          jointGroupsRef.current.forEach((joint, idx) => {
            const wave = Math.sin((idx + 0.65) * 1.25) * targetRad * 0.65;
            joint.rotation.y = THREE.MathUtils.lerp(joint.rotation.y, wave, 0.18);
          });
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Geometry & Meshes
  useEffect(() => {
    const modelGroup = modelGroupRef.current;
    if (!modelGroup) return;

    // Clear previous children
    while (modelGroup.children.length > 0) {
      const child = modelGroup.children[0] as THREE.Mesh;
      modelGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }

    if (!geometry) return;

    geometry.computeBoundingBox();
    const box = geometry.boundingBox || new THREE.Box3();
    const height = box.max.y - box.min.y || 50;
    const clipY = box.min.y + height * layerProgress;
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), clipY);
    clipPlaneRef.current = clipPlane;
    const clippingPlanes = layerProgress < 0.999 ? [clipPlane] : [];

    const config = MATERIAL_CONFIGS[materialPreset] || MATERIAL_CONFIGS['ruby-red'];

    const isArticulated = Boolean(
      multiGeometries?.isArticulated &&
      multiGeometries?.articulatedSegments &&
      multiGeometries.articulatedSegments.length > 1
    );

    if (isArticulated) {
      const segments = multiGeometries!.articulatedSegments!;
      const rootGroup = new THREE.Group();
      modelGroup.add(rootGroup);

      const baseMat = multiColorMode
        ? new THREE.MeshStandardMaterial({
            color: 0x242d3d,
            metalness: 0.2,
            roughness: 0.35,
            wireframe,
            clippingPlanes,
            side: THREE.DoubleSide,
          })
        : new THREE.MeshStandardMaterial({
            color: config.color,
            metalness: config.metalness,
            roughness: config.roughness,
            emissive: config.emissive || 0x000000,
            wireframe,
            side: THREE.DoubleSide,
            clippingPlanes,
          });

      const lettersMat = multiColorMode
        ? new THREE.MeshStandardMaterial({
            color: 0xef4444,
            metalness: 0.25,
            roughness: 0.35,
            wireframe,
            clippingPlanes,
            side: THREE.DoubleSide,
          })
        : baseMat;

      // Segment 0 inside rootGroup
      const seg0 = segments[0];
      if (seg0.baseGeo) {
        const m = new THREE.Mesh(seg0.baseGeo, baseMat);
        m.castShadow = true;
        m.receiveShadow = true;
        rootGroup.add(m);
      }
      if (seg0.lettersGeo && seg0.lettersGeo.getAttribute('position')) {
        const m = new THREE.Mesh(seg0.lettersGeo, lettersMat);
        m.castShadow = true;
        rootGroup.add(m);
      }

      let currentParent: THREE.Group = rootGroup;
      const jointGroups: THREE.Group[] = [];

      for (let s = 1; s < segments.length; s++) {
        const prevSeg = segments[s - 1];
        const curSeg = segments[s];

        const jointGroup = new THREE.Group();
        if (prevSeg.nextPivot) {
          jointGroup.position.copy(prevSeg.nextPivot);
        }
        currentParent.add(jointGroup);
        jointGroups.push(jointGroup);

        if (curSeg.baseGeo) {
          const m = new THREE.Mesh(curSeg.baseGeo, baseMat);
          m.castShadow = true;
          m.receiveShadow = true;
          jointGroup.add(m);
        }
        if (curSeg.lettersGeo && curSeg.lettersGeo.getAttribute('position')) {
          const m = new THREE.Mesh(curSeg.lettersGeo, lettersMat);
          m.castShadow = true;
          jointGroup.add(m);
        }

        currentParent = jointGroup;
      }

      jointGroupsRef.current = jointGroups;
    } else {
      jointGroupsRef.current = [];

      if (multiColorMode && multiGeometries) {
        // 1. Letters Mesh (Red)
        if (multiGeometries.lettersGeo && multiGeometries.lettersGeo.getAttribute('position')) {
          const lettersMat = new THREE.MeshStandardMaterial({
            color: 0xef4444, // Vibrant Red
            metalness: 0.25,
            roughness: 0.35,
            wireframe,
            clippingPlanes,
            side: THREE.DoubleSide,
          });
          const lettersMesh = new THREE.Mesh(multiGeometries.lettersGeo, lettersMat);
          lettersMesh.castShadow = true;
          lettersMesh.receiveShadow = true;
          modelGroup.add(lettersMesh);
        }

        // 2. Decorations Mesh (Hearts / Stars - Red)
        if (multiGeometries.decorationsGeo && multiGeometries.decorationsGeo.getAttribute('position')) {
          const decorMat = new THREE.MeshStandardMaterial({
            color: 0xdc2626, // Crimson Red
            metalness: 0.3,
            roughness: 0.3,
            wireframe,
            clippingPlanes,
            side: THREE.DoubleSide,
          });
          const decorMesh = new THREE.Mesh(multiGeometries.decorationsGeo, decorMat);
          decorMesh.castShadow = true;
          decorMesh.receiveShadow = true;
          modelGroup.add(decorMesh);
        }

        // 3. Base Mesh (Sleek Dark Slate Plate with distinct bevel shine)
        if (multiGeometries.baseGeo && multiGeometries.baseGeo.getAttribute('position')) {
          const baseMat = new THREE.MeshStandardMaterial({
            color: 0x242d3d, // Crisp Charcoal Slate
            metalness: 0.2,
            roughness: 0.35,
            wireframe,
            clippingPlanes,
            side: THREE.DoubleSide,
          });
          const baseMesh = new THREE.Mesh(multiGeometries.baseGeo, baseMat);
          baseMesh.castShadow = true;
          baseMesh.receiveShadow = true;
          modelGroup.add(baseMesh);
        }

        // 4. Base Inscribed Text Mesh (White Details)
        if (multiGeometries.baseTextGeo && multiGeometries.baseTextGeo.getAttribute('position')) {
          const textMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc, // Pure White
            metalness: 0.1,
            roughness: 0.4,
            wireframe,
            clippingPlanes,
            side: THREE.DoubleSide,
          });
          const textMesh = new THREE.Mesh(multiGeometries.baseTextGeo, textMat);
          textMesh.castShadow = true;
          modelGroup.add(textMesh);
        }
      } else {
        // Single Solid Material
        const mat = new THREE.MeshStandardMaterial({
          color: config.color,
          metalness: config.metalness,
          roughness: config.roughness,
          emissive: config.emissive || 0x000000,
          wireframe: wireframe,
          side: THREE.DoubleSide,
          clippingPlanes,
          clipShadows: true,
        });

        const mesh = new THREE.Mesh(geometry, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        modelGroup.add(mesh);
      }
    }

    // Center camera target
    const center = new THREE.Vector3();
    box.getCenter(center);
    if (controlsRef.current) {
      controlsRef.current.target.set(center.x, Math.max(10, center.y), center.z);
    }
  }, [geometry, multiGeometries, multiColorMode, materialPreset, wireframe, layerProgress]);

  // Handle auto rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.0;
    }
  }, [autoRotate]);

  // 3D Stencil Position Reticles in Three.js Scene
  useEffect(() => {
    if (!sceneRef.current) return;
    let gizmoGroup = stencilGizmoGroupRef.current;
    if (!gizmoGroup) {
      gizmoGroup = new THREE.Group();
      sceneRef.current.add(gizmoGroup);
      stencilGizmoGroupRef.current = gizmoGroup;
    }

    // Clean up previous markers
    while (gizmoGroup.children.length > 0) {
      const child = gizmoGroup.children[0];
      gizmoGroup.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) {
        if (Array.isArray((child as any).material)) (child as any).material.forEach((m: any) => m.dispose());
        else (child as any).material.dispose();
      }
    }

    if (!isStencil || !stencilParams) return;

    let plateCenterOffsetX = 0;
    let plateCenterOffsetY = 0;
    if (stencilParams.handlePosition === 'right') plateCenterOffsetX = -(stencilParams.handleLength || 24) / 2;
    if (stencilParams.handlePosition === 'left') plateCenterOffsetX = (stencilParams.handleLength || 24) / 2;
    if (stencilParams.handlePosition === 'top') plateCenterOffsetY = -(stencilParams.handleLength || 24) / 2;

    const plateThickness = stencilParams.thickness || 1.4;
    const markerY = plateThickness + 0.35;

    // 1. Image 3D Marker (Amber)
    const imgX = (stencilParams.imageOffsetX || 0) + plateCenterOffsetX;
    const imgZ = -(stencilParams.imageOffsetY || 0) + plateCenterOffsetY;
    const imgSelected = stencilTarget === 'image';

    const imgGroup = new THREE.Group();
    imgGroup.position.set(imgX, markerY, imgZ);

    const ringRadius = Math.max(8, Math.min(22, (stencilParams.width || 100) * 0.12 * (stencilParams.imageScale || 0.85)));
    const imgRingGeo = new THREE.RingGeometry(ringRadius - 1.2, ringRadius, 32);
    const imgRingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: imgSelected ? 0.95 : 0.45,
      depthTest: false,
    });
    const imgRingMesh = new THREE.Mesh(imgRingGeo, imgRingMat);
    imgRingMesh.rotation.x = -Math.PI / 2;
    imgGroup.add(imgRingMesh);

    // Crosshair for Image
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: imgSelected ? 0.95 : 0.45,
      depthTest: false,
    });
    const chGeo1 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-ringRadius * 1.3, 0.05, 0),
      new THREE.Vector3(ringRadius * 1.3, 0.05, 0),
    ]);
    const chGeo2 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.05, -ringRadius * 1.3),
      new THREE.Vector3(0, 0.05, ringRadius * 1.3),
    ]);
    imgGroup.add(new THREE.Line(chGeo1, lineMat));
    imgGroup.add(new THREE.Line(chGeo2, lineMat));

    // Marker Pin for selected
    if (imgSelected) {
      const pinGeo = new THREE.ConeGeometry(2.2, 7, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, depthTest: false });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.rotation.x = Math.PI; // point down towards plate
      pinMesh.position.y = 5.5;
      imgGroup.add(pinMesh);
    }
    gizmoGroup.add(imgGroup);

    // 2. Text 3D Marker (Sky Blue)
    const hasText = Boolean(stencilParams.text && stencilParams.text.trim().length > 0);
    const txtX = (stencilParams.textOffsetX || 0) + plateCenterOffsetX;
    const txtZ = -(stencilParams.textOffsetY || 0) + plateCenterOffsetY;
    const txtSelected = stencilTarget === 'text';

    const txtGroup = new THREE.Group();
    txtGroup.position.set(txtX, markerY, txtZ);

    const txtRadius = Math.max(7, Math.min(20, (stencilParams.fontSize || 14) * 0.9));
    const txtRingGeo = new THREE.RingGeometry(txtRadius - 1.2, txtRadius, 32);
    const txtRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: txtSelected ? 0.95 : (hasText ? 0.45 : 0.2),
      depthTest: false,
    });
    const txtRingMesh = new THREE.Mesh(txtRingGeo, txtRingMat);
    txtRingMesh.rotation.x = -Math.PI / 2;
    txtGroup.add(txtRingMesh);

    // Crosshair for Text
    const txtLineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: txtSelected ? 0.95 : (hasText ? 0.45 : 0.2),
      depthTest: false,
    });
    const tchGeo1 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-txtRadius * 1.3, 0.05, 0),
      new THREE.Vector3(txtRadius * 1.3, 0.05, 0),
    ]);
    const tchGeo2 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.05, -txtRadius * 1.3),
      new THREE.Vector3(0, 0.05, txtRadius * 1.3),
    ]);
    txtGroup.add(new THREE.Line(tchGeo1, txtLineMat));
    txtGroup.add(new THREE.Line(tchGeo2, txtLineMat));

    if (txtSelected) {
      const pinGeo = new THREE.ConeGeometry(2.2, 7, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, depthTest: false });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.rotation.x = Math.PI; // point down towards plate
      pinMesh.position.y = 5.5;
      txtGroup.add(pinMesh);
    }
    gizmoGroup.add(txtGroup);
  }, [isStencil, stencilParams, stencilTarget]);

  // Raycasting helper for 3D plate interaction
  const updateStencilPosFromRaycast = (clientX: number, clientY: number): boolean => {
    if (!containerRef.current || !cameraRef.current || !onStencilChange || !stencilParams) return false;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const plateThickness = stencilParams.thickness || 1.4;
    const platePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -plateThickness);
    const hitPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(platePlane, hitPoint);

    if (hitPoint) {
      let plateCenterOffsetX = 0;
      let plateCenterOffsetY = 0;
      if (stencilParams.handlePosition === 'right') plateCenterOffsetX = -(stencilParams.handleLength || 24) / 2;
      if (stencilParams.handlePosition === 'left') plateCenterOffsetX = (stencilParams.handleLength || 24) / 2;
      if (stencilParams.handlePosition === 'top') plateCenterOffsetY = -(stencilParams.handleLength || 24) / 2;

      const hw = (stencilParams.width || 100) / 2;
      const hh = (stencilParams.height || 100) / 2;

      const localX = hitPoint.x - plateCenterOffsetX;
      const localY = -(hitPoint.z - plateCenterOffsetY);

      // Check if clicked anywhere inside or near the plate
      if (Math.abs(localX) <= hw + 15 && Math.abs(localY) <= hh + 15) {
        const clampedX = Math.round(Math.max(-hw + 2, Math.min(hw - 2, localX)));
        const clampedY = Math.round(Math.max(-hh + 2, Math.min(hh - 2, localY)));

        if (stencilTarget === 'image') {
          onStencilChange({ imageOffsetX: clampedX, imageOffsetY: clampedY });
        } else {
          onStencilChange({ textOffsetX: clampedX, textOffsetY: clampedY });
        }
        return true;
      }
    }
    return false;
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left click only

    if (multiGeometries?.isArticulated && interactionMode === 'flex') {
      isFlexDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      setIsWiggling(false);
      isWigglingRef.current = false;
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
      return;
    }

    if (!isStencil || !is3DDragEnabled) return;

    const hit = updateStencilPosFromRaycast(e.clientX, e.clientY);
    if (hit) {
      isDragging3DRef.current = true;
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isFlexDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      setLiveFlexAngle((prev) => {
        const next = Math.max(-50, Math.min(50, prev + dx * 0.45));
        liveFlexAngleRef.current = next;
        return next;
      });
      return;
    }

    if (!isDragging3DRef.current || !isStencil || !is3DDragEnabled) return;
    updateStencilPosFromRaycast(e.clientX, e.clientY);
  };

  const handleCanvasPointerUp = () => {
    if (isFlexDraggingRef.current) {
      isFlexDraggingRef.current = false;
      if (controlsRef.current && interactionMode === 'camera') {
        controlsRef.current.enabled = true;
      }
    }
    if (isDragging3DRef.current) {
      isDragging3DRef.current = false;
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    }
  };

  const nudgeStencil = (dx: number, dy: number) => {
    if (!onStencilChange || !stencilParams) return;
    const hw = Math.round((stencilParams.width || 100) / 2 - 2);
    const hh = Math.round((stencilParams.height || 100) / 2 - 2);

    if (stencilTarget === 'image') {
      const curX = stencilParams.imageOffsetX || 0;
      const curY = stencilParams.imageOffsetY || 0;
      onStencilChange({
        imageOffsetX: Math.max(-hw, Math.min(hw, curX + dx)),
        imageOffsetY: Math.max(-hh, Math.min(hh, curY + dy)),
      });
    } else {
      const curX = stencilParams.textOffsetX || 0;
      const curY = stencilParams.textOffsetY || 0;
      onStencilChange({
        textOffsetX: Math.max(-hw, Math.min(hw, curX + dx)),
        textOffsetY: Math.max(-hh, Math.min(hh, curY + dy)),
      });
    }
  };

  const setCameraView = (view: 'wordA' | 'wordB' | 'front' | 'iso' | 'top') => {
    if (!cameraRef.current || !controlsRef.current || !modelGroupRef.current) return;
    const box = new THREE.Box3().setFromObject(modelGroupRef.current);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 60);
    const dist = maxDim * 2.1;
    const center = new THREE.Vector3();
    box.getCenter(center);

    controlsRef.current.target.copy(center);

    const angleRad = ((viewAngle || 45) * Math.PI) / 180;

    if (view === 'wordA') {
      // Look from Angle A (+45°)
      const xOffset = -dist * Math.sin(angleRad) * 0.9;
      const zOffset = dist * Math.cos(angleRad) * 0.9;
      cameraRef.current.position.set(center.x + xOffset, center.y + dist * 0.25, center.z + zOffset);
    } else if (view === 'wordB') {
      // Look from Angle B (-45°)
      const xOffset = dist * Math.sin(angleRad) * 0.9;
      const zOffset = dist * Math.cos(angleRad) * 0.9;
      cameraRef.current.position.set(center.x + xOffset, center.y + dist * 0.25, center.z + zOffset);
    } else if (view === 'front') {
      cameraRef.current.position.set(center.x, center.y + dist * 0.2, center.z + dist);
    } else if (view === 'top') {
      cameraRef.current.position.set(center.x, center.y + dist * 1.2, center.z + 0.01);
    } else {
      // Isometric view
      cameraRef.current.position.set(center.x + dist * 0.75, center.y + dist * 0.65, center.z + dist * 0.75);
    }
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none">
      {/* 3D Canvas */}
      <div
        ref={containerRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={handleCanvasPointerUp}
        className={`w-full h-full flex-1 ${
          isStencil && is3DDragEnabled
            ? 'cursor-crosshair'
            : interactionMode === 'flex' && multiGeometries?.isArticulated
            ? 'cursor-ew-resize active:cursor-grabbing'
            : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 right-3 flex flex-col gap-2 pointer-events-none">
        {/* Row 1: Camera Views & Action Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Camera Views Quick Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-800/80 shadow-lg pointer-events-auto max-w-full overflow-x-auto">
            <span className="text-xs font-semibold text-slate-400 px-1.5 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isStencil ? 'Visualização:' : 'Ilusão:'}</span>
            </span>

            {isDualText && (
              <>
                <button
                  id="btn-view-word-a"
                  onClick={() => setCameraView('wordA')}
                  title={`Vista ${wordA} (+${viewAngle}°)`}
                  className="px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm flex items-center gap-1"
                >
                  <span>👁️</span> {wordA || 'Nome 1'}
                </button>
                <button
                  id="btn-view-word-b"
                  onClick={() => setCameraView('wordB')}
                  title={`Vista ${wordB} (-${viewAngle}°)`}
                  className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-sm flex items-center gap-1"
                >
                  <span>👁️</span> {wordB || 'Nome 2'}
                </button>
              </>
            )}

            <button
              id="btn-view-iso"
              onClick={() => setCameraView('iso')}
              title="Perspectiva 3D Completa"
              className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors"
            >
              3D Iso
            </button>
            <button
              id="btn-view-top"
              onClick={() => setCameraView('top')}
              title="Vista Superior (Planta Exata 2D no 3D)"
              className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <span>Topo</span>
            </button>
            <button
              id="btn-view-front"
              onClick={() => setCameraView('front')}
              title="Vista Frontal"
              className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors hidden sm:inline-block"
            >
              Frente
            </button>
          </div>

          {/* Action Toggles */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-800/80 shadow-lg pointer-events-auto">
            {onMultiColorToggle && (
              <button
                id="btn-toggle-multicolor"
                onClick={onMultiColorToggle}
                className={`p-1.5 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1.5 ${
                  multiColorMode
                    ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Alternar Visualização Colorida vs Filamento Único"
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Multi-Cor</span>
              </button>
            )}

            <button
              id="btn-toggle-autorotate"
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-1.5 rounded-lg transition-colors text-xs font-medium flex items-center gap-1 ${
                autoRotate ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Girar Modelo Automaticamente"
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Giro</span>
            </button>

            <button
              id="btn-toggle-wireframe"
              onClick={onWireframeToggle}
              className={`p-1.5 rounded-lg transition-colors text-xs font-medium flex items-center gap-1 ${
                wireframe ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Modo Malha / Wireframe"
            >
              <Box className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Malha</span>
            </button>
          </div>
        </div>

        {/* Row 2: Articulated Model Controls (When model is flexi articulated) */}
        {multiGeometries?.isArticulated && (
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/95 backdrop-blur-md rounded-xl border border-rose-500/50 shadow-xl pointer-events-auto max-w-full overflow-x-auto">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Articulação Flexível Print-in-Place:</span>
            </div>

            {/* Wiggle Button */}
            <button
              type="button"
              onClick={() => {
                const next = !isWiggling;
                setIsWiggling(next);
                isWigglingRef.current = next;
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                isWiggling
                  ? 'bg-rose-600 text-white shadow-rose-600/40 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title="Simular movimento pendular elástico das articulações"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isWiggling ? 'animate-spin' : ''}`} />
              <span>{isWiggling ? 'Parar Balanço' : 'Balançar Peça (Wiggle)'}</span>
            </button>

            {/* Interaction mode switch */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setInteractionMode('camera')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  interactionMode === 'camera' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Girar Câmera
              </button>
              <button
                type="button"
                onClick={() => {
                  setInteractionMode('flex');
                  setIsWiggling(false);
                  isWigglingRef.current = false;
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  interactionMode === 'flex' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Clique e arraste com o mouse para dobrar o chaveiro livremente"
              >
                Dobrar com Mouse
              </button>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsWiggling(false);
                  isWigglingRef.current = false;
                  setLiveFlexAngle(0);
                  liveFlexAngleRef.current = 0;
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  liveFlexAngle === 0 && !isWiggling
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Alinhado reto para mesa de impressão 3D"
              >
                0° Mesa 3D Plana
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsWiggling(false);
                  isWigglingRef.current = false;
                  setLiveFlexAngle(20);
                  liveFlexAngleRef.current = 20;
                }}
                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
              >
                20° Curva
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsWiggling(false);
                  isWigglingRef.current = false;
                  setLiveFlexAngle(35);
                  liveFlexAngleRef.current = 35;
                }}
                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
              >
                35° Serpente
              </button>
            </div>

            {/* Live Angle Slider */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-700 text-[11px]">
              <span className="text-slate-400 font-mono text-[10px] w-8 text-right font-bold text-rose-400">
                {liveFlexAngle.toFixed(0)}°
              </span>
              <input
                type="range"
                min={-45}
                max={45}
                step={1}
                value={liveFlexAngle}
                onChange={(e) => {
                  setIsWiggling(false);
                  isWigglingRef.current = false;
                  const val = Number(e.target.value);
                  setLiveFlexAngle(val);
                  liveFlexAngleRef.current = val;
                }}
                className="w-20 accent-rose-500 cursor-pointer"
                title="Ajustar ângulo de flexão das articulações"
              />
            </div>
          </div>
        )}

        {/* Row 3: Stencil Direct 3D Positioning Controls (When in Stencil Mode) */}
        {isStencil && stencilParams && (
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/95 backdrop-blur-md rounded-xl border border-sky-500/40 shadow-xl pointer-events-auto max-w-full overflow-x-auto">
            <div className="flex items-center gap-1.5 pr-1 border-r border-slate-700/60">
              <span className="text-[11px] font-bold text-sky-400 px-1 flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden md:inline">Posicionar no 3D:</span>
              </span>

              <button
                type="button"
                onClick={() => setIs3DDragEnabled(!is3DDragEnabled)}
                className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                  is3DDragEnabled
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/60 shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
                title="Ativar/Desativar clique e arraste direto no modelo 3D para posicionar elementos"
              >
                <MousePointer className="w-3 h-3" />
                <span>{is3DDragEnabled ? 'Arrastar 3D: ON' : 'Arrastar 3D: OFF'}</span>
              </button>
            </div>

            {/* Select Target Element: Image or Text */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setStencilTarget('image')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  stencilTarget === 'image'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span>Imagem ({stencilParams.imageOffsetX || 0}, {stencilParams.imageOffsetY || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setStencilTarget('text')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  stencilTarget === 'text'
                    ? 'bg-sky-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Type className="w-3 h-3" />
                <span>Texto ({stencilParams.textOffsetX || 0}, {stencilParams.textOffsetY || 0})</span>
              </button>
            </div>

            {/* Quick Alignment / Reset */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={() => {
                  if (onStencilChange) {
                    if (stencilTarget === 'image') onStencilChange({ imageOffsetX: 0, imageOffsetY: 0 });
                    else onStencilChange({ textOffsetX: 0, textOffsetY: 0 });
                  }
                }}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                title="Centralizar elemento selecionado na origem (0, 0)"
              >
                <Crosshair className="w-3 h-3 text-sky-400" />
                <span>(0,0)</span>
              </button>

              <button
                type="button"
                onClick={() => setCameraView('top')}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                title="Mudar para vista do topo para posicionamento preciso"
              >
                <Maximize2 className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">Vista Topo</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating 3D Nudge D-Pad (When in Stencil Mode) */}
      {isStencil && stencilParams && (
        <div className="absolute bottom-16 right-4 p-2 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col items-center gap-1.5 pointer-events-auto z-20">
          <div className="flex items-center justify-between w-full px-1">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                stencilTarget === 'image' ? 'text-amber-400' : 'text-sky-400'
              }`}
            >
              {stencilTarget === 'image' ? 'IMG' : 'TXT'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {stencilTarget === 'image'
                ? `${stencilParams.imageOffsetX || 0},${stencilParams.imageOffsetY || 0}`
                : `${stencilParams.textOffsetX || 0},${stencilParams.textOffsetY || 0}`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1">
            <div />
            <button
              type="button"
              onClick={() => nudgeStencil(0, 2)}
              title="Mover para Cima (+2mm)"
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-sm active:scale-95"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div />

            <button
              type="button"
              onClick={() => nudgeStencil(-2, 0)}
              title="Mover para Esquerda (-2mm)"
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-sm active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (onStencilChange) {
                  if (stencilTarget === 'image') onStencilChange({ imageOffsetX: 0, imageOffsetY: 0 });
                  else onStencilChange({ textOffsetX: 0, textOffsetY: 0 });
                }
              }}
              title="Resetar Centro (0, 0)"
              className="w-7 h-7 rounded-lg bg-slate-700/70 hover:bg-slate-600 text-white flex items-center justify-center transition-colors shadow-sm active:scale-95 text-[10px] font-bold"
            >
              •
            </button>
            <button
              type="button"
              onClick={() => nudgeStencil(2, 0)}
              title="Mover para Direita (+2mm)"
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-sm active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div />
            <button
              type="button"
              onClick={() => nudgeStencil(0, -2)}
              title="Mover para Baixo (-2mm)"
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-sm active:scale-95"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <div />
          </div>
        </div>
      )}

      {/* Bottom Filament & Slicer Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Filament Preset Selector */}
        {!multiColorMode && (
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800/80 shadow-lg pointer-events-auto overflow-x-auto max-w-full">
            <span className="text-[11px] font-semibold text-slate-400 px-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Filamento:
            </span>
            {(Object.keys(MATERIAL_CONFIGS) as MaterialPreset[]).map((preset) => {
              const isSelected = materialPreset === preset;
              const cfg = MATERIAL_CONFIGS[preset];
              return (
                <button
                  key={preset}
                  id={`btn-material-${preset}`}
                  onClick={() => onMaterialChange(preset)}
                  title={cfg.name}
                  className={`w-6 h-6 rounded-full border-2 transition-all transform flex items-center justify-center ${cfg.bgClass} ${
                    isSelected ? 'border-white scale-110 ring-2 ring-indigo-500' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                />
              );
            })}
          </div>
        )}

        {multiColorMode && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800/80 text-[11px] text-slate-300 pointer-events-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Letras & Corações
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-slate-600"></span> Base Preta
            <span className="w-2.5 h-2.5 rounded-full bg-white"></span> Inscrição
          </div>
        )}

        {/* Bed Info Badge */}
        <div className="px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-300 flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Mesa 3D: 260 x 260 mm
        </div>
      </div>
    </div>
  );
};
