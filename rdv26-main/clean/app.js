// app.js — NaughtyDuk Globe Gallery Replica (ES Module)
// Stripped to: Globe grid + GRID/LIST toggle + barrel distortion transition
// Closely matches the original O class from Projects-C_bPLObp.js

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Theme Synchronization Helpers
function syncThemeFromParent() {
  try {
    if (window.parent && window.parent !== window && window.parent.document) {
      const parentDocEl = window.parent.document.documentElement;
      
      // Sync dark class
      if (parentDocEl.classList.contains('dark')) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Sync CSS custom variables
      const style = window.parent.getComputedStyle(parentDocEl);
      const variables = [
        '--clr-bg', '--clr-text', '--clr-text-muted', '--clr-surface', '--clr-border', '--primary'
      ];
      variables.forEach(varName => {
        const val = style.getPropertyValue(varName).trim();
        if (val) {
          document.documentElement.style.setProperty(varName, val);
        }
      });
    }
  } catch (e) {
    // Fail silently in case of cross-origin or standalone fallback
  }
}

function getThemeColors() {
  syncThemeFromParent();
  const tempEl = document.documentElement;
  const style = getComputedStyle(tempEl);
  
  const bgVar = style.getPropertyValue('--clr-bg').trim();
  const textVar = style.getPropertyValue('--clr-text').trim();
  const mutedVar = style.getPropertyValue('--clr-text-muted').trim();
  
  const isDark = tempEl.classList.contains('dark');
  const fallbackBg = isDark ? '#1A1A2E' : '#D9D2C4';
  const fallbackText = isDark ? '#fbd4d4' : '#1C1C2E';
  const fallbackMuted = isDark ? '#6C6EA0' : '#6C6EA0';

  const parseColor = (colorStr, fallback) => {
    try {
      const c = new THREE.Color(colorStr || fallback);
      return c;
    } catch (e) {
      return new THREE.Color(fallback);
    }
  };

  return {
    bg: parseColor(bgVar, fallbackBg),
    text: parseColor(textVar, fallbackText),
    mutedText: parseColor(mutedVar, fallbackMuted)
  };
}

// ===================================================================
// 1. PROJECT DATA — Filter gallery-active projects from PROJECTS_DATA
// ===================================================================
const PROJECTS_DATA = window.PROJECTS_DATA || [];

function seededRandom(seed) {
  return function () {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function buildTileData(videoPool) {
  const tiles = [];
  const seen = new Set();
  let id = 0;

  PROJECTS_DATA
    .filter(p => p.gallery === true && p.active !== false)
    .forEach(p => {
      // Support image-based galleries (gridImages / images arrays)
      const imgs = (p.gridImages && p.gridImages.length > 0) ? p.gridImages : (p.images || []);
      imgs.forEach(src => {
        if (src && !seen.has(src)) {
          seen.add(src);
          tiles.push({
            id: id++,
            projectID: p.projectID,
            slug: p.slug,
            name: p.name,
            mediaType: 'image',
            mediaSrc: src
          });
        }
      });

      // Also support legacy video-based entries
      const vids = (p.gridVideos && p.gridVideos.length > 0) ? p.gridVideos : (p.videos || []);
      const clips = vids.slice(0, 4);
      clips.forEach(v => {
        if (v.mp4 && !seen.has(v.mp4)) {
          seen.add(v.mp4);
          tiles.push({
            id: id++,
            projectID: p.projectID,
            slug: p.slug,
            name: p.name,
            mediaType: 'video',
            mediaSrc: v.mp4
          });
        }
      });
    });

  // Shuffle with seed 42
  const shuffled = [...tiles];
  const rand = seededRandom(42);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Allow up to 30 tiles (enough for a good globe fill)
  return shuffled.slice(0, 30);
}

function computeGridSize(tileCount) {
  const cols = Math.max(4, Math.ceil(tileCount / 6));
  const rows = Math.max(3, Math.ceil(tileCount / cols));
  const minCells = Math.max(1.5 * tileCount, 20);
  let x = Math.max(cols, Math.ceil(Math.sqrt(minCells)));
  let y = Math.max(rows, Math.ceil(minCells / x));
  if (x / y > 3) { x = Math.ceil(Math.sqrt(0.75 * minCells)); y = Math.ceil(minCells / x); }
  else if (y / x > 3) { y = Math.ceil(Math.sqrt(0.75 * minCells)); x = Math.ceil(minCells / y); }
  return { x, y };
}

// ===================================================================
// 2. BARREL DISTORTION SHADER (for grid↔list transition)
// ===================================================================
function createBarrelShader() {
  return {
    uniforms: {
      tDiffuse: { value: null },
      distortion: { value: -0.9 },
      distortion2: { value: -0.6 },
      intensity: { value: 0 },
      bgColor: { value: new THREE.Color(0.941, 0.941, 0.941) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform sampler2D tDiffuse;
      uniform float distortion;
      uniform float distortion2;
      uniform float intensity;
      uniform vec3 bgColor;
      varying vec2 vUv;
      void main() {
        vec2 uv = vUv;
        if (intensity > 0.001) {
          vec2 centered = uv - 0.5;
          float r2 = dot(centered, centered);
          float r4 = r2 * r2;
          float factor = 1.0 + (distortion * r2 + distortion2 * r4) * intensity;
          if (factor < 0.05) {
            gl_FragColor = vec4(bgColor, 1.0);
            return;
          }
          centered *= factor;
          uv = centered + 0.5;
        }
        gl_FragColor = texture2D(tDiffuse, uv);
      }
    `
  };
}

// ===================================================================
// 3. EDGE REFRACTION SHADER (subtle edge glass on the globe)
// ===================================================================
function createEdgeRefractionShader() {
  return {
    uniforms: {
      tDiffuse: { value: null },
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      refractPixels: { value: 8 },
      sigmaPx: { value: 10 },
      cornerPx: { value: 0 },
      edgeWidthPercent: { value: 0.05 },
      falloffExp: { value: 1.6 },
      dispersion: { value: 0 },
      blurPx: { value: 0 },
      debug: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform sampler2D tDiffuse;
      uniform vec2 resolution;
      uniform float refractPixels;
      uniform float cornerPx;
      uniform float edgeWidthPercent;
      uniform float falloffExp;
      varying vec2 vUv;

      float sdRoundRect(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + vec2(r);
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
      }
      float sdfViewport(vec2 uv, vec2 res, float corner) {
        vec2 p = uv * res - 0.5 * res;
        vec2 b = 0.5 * res - vec2(corner);
        return sdRoundRect(p, b, corner);
      }
      vec2 sdfNormal(vec2 uv, vec2 res, float corner) {
        vec2 px = 1.0 / max(res, vec2(1.0));
        float sx = sdfViewport(uv + vec2(px.x, 0.0), res, corner) - sdfViewport(uv - vec2(px.x, 0.0), res, corner);
        float sy = sdfViewport(uv + vec2(0.0, px.y), res, corner) - sdfViewport(uv - vec2(0.0, px.y), res, corner);
        return normalize(vec2(sx, sy) + 1e-6);
      }
      void main() {
        vec2 uv = vUv;
        float sdf = sdfViewport(uv, resolution, cornerPx);
        float di = max(0.0, -sdf);
        float edgeWidthPx = edgeWidthPercent * min(resolution.x, resolution.y);
        float edgeMask = 1.0 - smoothstep(0.0, max(1.0, edgeWidthPx), di);
        edgeMask = pow(edgeMask, max(0.5, falloffExp));
        if (edgeMask < 0.001) {
          gl_FragColor = texture2D(tDiffuse, uv);
          return;
        }
        vec2 n = sdfNormal(uv, resolution, cornerPx);
        vec2 offset = n * refractPixels / resolution * edgeMask;
        gl_FragColor = texture2D(tDiffuse, uv + offset);
      }
    `
  };
}

// ===================================================================
// 4. MAIN GALLERY CLASS
// ===================================================================
class GlobeGallery {
  constructor(container) {
    this.container = container;
    this.isDestroyed = false;

    // Build tile data
    this.videoPool = new Map();
    this.cmsData = buildTileData(this.videoPool);
    this.cmsImages = this.cmsData.map(() => null);
    this.gridSize = computeGridSize(this.cmsData.length);
    this.tileSize = 2.0;
    this._tilePixelSize = 512;

    // Warp parameters (fisheye globe)
    this.curveA = this.gridSize.x * this.tileSize * 6;
    this.curveB = this.gridSize.y * this.tileSize * 3.2;
    this.curveC = Math.max(this.curveA, this.curveB);
    this.warpDepth = 1.4;
    this.warpIntensity = -10.4;

    // Camera offsets (scroll position in UV space)
    this.cameraOffset = { x: 0, y: 0 };
    this.cursorOffset = { x: 0, y: 0 };
    this.targetCursorOffset = { x: 0, y: 0 };

    // Interaction state
    this.isDragging = false;
    this.isHolding = false;
    this.prevMouse = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.friction = 0.945;
    this.dragScale = 0.006;
    this.minVelocity = 0.000003;
    this.targetScale = 1.05;
    this.currentScale = 1.05;

    // Hover state
    this.pointer = { x: 0, y: 0, inside: false };
    this.hoveredTile = null;
    this.hoveredTileKey = null;
    this.hoverOpacity = 0;
    this.hoverTargetOpacity = 0;
    this.hoverBgMaxOpacity = 0.25;
    this.hoverFadeDuration = 0.6;
    this.prevHoveredTileKey = null;
    this.prevHoverOpacity = 0;
    this.hoverDirty = false;

    // Media reveal animation
    this.mediaRevealProgress = new Map();
    this.revealDuration = 0.5;

    // Gallery state: "grid" | "list" | "transitioning_to_list" | "transitioning_to_grid"
    this.galleryState = 'grid';
    this.transitionProgress = 0;
    this.transitionDuration = 1.7;

    // Barrel distortion
    this.barrelIntensity = 0;
    this.targetBarrelIntensity = 0;

    // List view state
    this.listProjects = PROJECTS_DATA
      .filter(p => p.active !== false)
      .sort((a, b) => a.name.localeCompare(b.name));
    this.projectNames = this.listProjects.map(p => p.name.toUpperCase());
    this.listTextSpacing = 0;
    this.listScrollOffset = 0;
    this.listVelocity = 0;
    this.listFriction = 0.985;
    this.listScrollScale = 0.0000425;
    this.listDragScale = 0.0035;
    this.listMaxVelocity = 0.05;
    this.listIsDragging = false;
    this.listLastY = 0;
    this.listSnapTarget = null;
    this.listSwipeStartSnap = 0;

    // Text reveal animation
    this.textRevealActive = false;
    this.textRevealReverse = false;
    this.textRevealStartTime = 0;
    this.textRevealDuration = 0.8;
    this.textRevealStagger = 0.6;
    this.textRevealReverseDuration = 0.5;
    this.textRevealReverseStagger = 0.3;

    // Floating video tiles (list view companion)
    this.FLOAT_LAYOUT = [
      { xFrac: -0.58, yFrac: 0.22, size: 1.35, pFactor: 0.045 },
      { xFrac: -0.46, yFrac: -0.18, size: 1.05, pFactor: 0.065 },
      { xFrac: 0.52, yFrac: 0.10, size: 1.05, pFactor: 0.055 },
      { xFrac: 0.63, yFrac: -0.26, size: 1.35, pFactor: 0.04 }
    ];
    this.floatingGroup = null;
    this.floatingMeshes = [];
    this.floatingVideoTextures = [];
    this.floatingPrevTextures = [];
    this.floatingPlaceholderTex = null;
    this.floatingMedia = new Map();
    this.floatingTexCache = new Map();
    this.floatingCurrentSlug = '';
    this.floatingRevealProgress = 0;
    this.floatingRevealActive = false;
    this.floatingRevealReverse = false;
    this.floatingRevealStartTime = 0;
    this.floatingRevealDuration = 0.55;
    this.floatingSlideDirection = 0;

    // Video texture updates
    this._hasVideos = undefined;
    this._videoTiles = [];
    this._lastGridTextureFrame = -1;
    this._lastVideoTimes = new Map();
    this._gridCtx = null;
    this._cachedFontStr = '';
    this._cachedFontSize = 0;
    this.videoUpdateInterval = 2;
    this._isChrome = typeof navigator !== 'undefined' && /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);

    // Core Three.js objects
    this.scene = null;
    this.overlayScene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.edgePass = null;
    this.barrelPass = null;
    this.gridMesh = null;
    this.raycastPlane = null;
    this.gridTexture = null;
    this.gridCanvas = null;
    this.originalPositions = null;
    this.eventDistributionCache = null;
    this.textGroup = null;
    this.textMeshes = [];

    // Animation timing
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.warpDirty = true;
    this.lastOffsetX = 0;
    this.lastOffsetY = 0;
    this.isGridMoving = false;
    this._idleFrames = 0;
    this.mouseDownTime = 0;
    this.mouseDownPos = { x: 0, y: 0 };
    this.mouseMoveDistance = 0;
    this.clickThreshold = { time: 500, distance: 5 };
    this._clickHandled = false;

    // Colors for text
    const colors = getThemeColors();
    this._bgColor = colors.bg;
    this._textColor = colors.text;
    this._targetColor = new THREE.Color().copy(colors.text);
    this._ndColor = colors.mutedText;

    // Listen to parent theme changes if nested in iframe, otherwise watch local document
    let targetEl = document.documentElement;
    try {
      if (window.parent && window.parent !== window && window.parent.document) {
        targetEl = window.parent.document.documentElement;
      }
    } catch (e) {}

    this.themeObserver = new MutationObserver(() => {
      this.updateThemeColors();
    });
    this.themeObserver.observe(targetEl, {
      attributes: true,
      attributeFilter: ['class']
    });

    this.init();
  }

  async init() {
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();

    await this.createGrid();
    this.setupPostprocessing();
    this.createTextElements();
    this.createFloatingTiles();
    this.setupBarrelDistortion();
    this.setupEventListeners();

    // Load media for grid tiles
    this.loadAllMedia();

    // Show capsule
    this.animateCapsuleIn();

    this.animate();
  }

  // ---------------------------------------------------------------
  // SCENE SETUP
  // ---------------------------------------------------------------
  setupScene() {
    this.scene = new THREE.Scene();
    const colors = getThemeColors();
    this.scene.background = colors.bg;
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 8;
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(dpr);
    const colors = getThemeColors();
    this.renderer.setClearColor(colors.bg, 1);
    this.container.appendChild(this.renderer.domElement);
  }

  // ---------------------------------------------------------------
  // GRID CREATION
  // ---------------------------------------------------------------
  async createGrid() {
    const w = this.gridSize.x * this.tileSize;
    const h = this.gridSize.y * this.tileSize;
    const subdiv = 8;

    const geom = new THREE.PlaneGeometry(w, h, this.gridSize.x * subdiv, this.gridSize.y * subdiv);
    this.originalPositions = geom.attributes.position.array.slice();

    // Event distribution (tile placement)
    const dist = this.generateOptimalEventDistribution();

    // Create canvas texture
    const canvas = await this.createUnifiedGridTexture(dist);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.premultiplyAlpha = false;
    tex.generateMipmaps = false;

    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.DoubleSide,
      transparent: false,
      opacity: 1
    });

    this.gridMesh = new THREE.Mesh(geom, mat);
    this.scene.add(this.gridMesh);

    // Invisible raycast plane
    const rGeom = new THREE.PlaneGeometry(w, h, 1, 1);
    const rMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
    this.raycastPlane = new THREE.Mesh(rGeom, rMat);
    this.scene.add(this.raycastPlane);

    this.gridTexture = tex;
    this.gridCanvas = canvas;
  }

  async createUnifiedGridTexture(eventDist) {
    const size = this._tilePixelSize;
    const w = this.gridSize.x * size;
    const h = this.gridSize.y * size;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { alpha: false });
    const colors = getThemeColors();
    ctx.fillStyle = colors.bg.getStyle();
    ctx.fillRect(0, 0, w, h);

    for (let col = 0; col < this.gridSize.x; col++) {
      for (let row = 0; row < this.gridSize.y; row++) {
        const idx = eventDist[`${col},${row}`] ?? 0;
        const tile = this.cmsData[idx % this.cmsData.length];
        const x = col * size;
        const y = row * size;
        this.drawTileToCanvas(ctx, tile, idx, x, y, size);
      }
    }
    return canvas;
  }

  drawTileToCanvas(ctx, tile, idx, x, y, size) {
    const scale = size / 512;
    const pad = Math.round(20 * scale);

    const colors = getThemeColors();
    ctx.fillStyle = colors.bg.getStyle();
    ctx.fillRect(x, y, size, size);

    // Project ID label
    ctx.fillStyle = colors.mutedText.getStyle();
    const fontSize = Math.round(16 * scale);
    if (fontSize !== this._cachedFontSize) {
      this._cachedFontSize = fontSize;
      this._cachedFontStr = `bold ${fontSize}px monospace, Arial, sans-serif`;
    }
    ctx.font = this._cachedFontStr;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(tile.projectID, x + pad, y + pad);

    // Draw media if loaded
    const media = this.cmsImages[idx % this.cmsImages.length];
    if (media) {
      const mediaSize = Math.round(320 * scale);
      const mx = x + (size - mediaSize) / 2;
      const my = y + (size - mediaSize) / 2;

      let reveal = this.mediaRevealProgress.get(idx);
      if (reveal === undefined) {
        this.mediaRevealProgress.set(idx, 0.01);
        reveal = 0.01;
      }
      if (reveal > 0) {
        ctx.save();
        if (reveal < 1) {
          const clipH = mediaSize * reveal;
          const clipY = my + (mediaSize - clipH);
          ctx.beginPath();
          ctx.rect(mx, clipY, mediaSize, clipH);
          ctx.clip();
        }
        try {
          this.drawImageAspectFit(ctx, media, mx, my, mediaSize, mediaSize);
        } catch (e) { /* ignore */ }
        ctx.restore();
      }
    }
  }

  drawImageAspectFit(ctx, img, x, y, w, h) {
    const iw = img.videoWidth || img.naturalWidth || img.width || 0;
    const ih = img.videoHeight || img.naturalHeight || img.height || 0;
    if (iw <= 0 || ih <= 0) return;
    const scale = Math.min(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  // ---------------------------------------------------------------
  // OPTIMAL EVENT DISTRIBUTION (spiral anti-clustering)
  // ---------------------------------------------------------------
  generateOptimalEventDistribution() {
    if (this.eventDistributionCache) return this.eventDistributionCache;

    const result = {};
    const totalEvents = this.cmsData.length;
    const cx = Math.floor(this.gridSize.x / 2);
    const cy = Math.floor(this.gridSize.y / 2);
    const spiral = this.generateSpiralOrder(cx, cy);
    const placements = new Map();
    const placed = new Set();
    let eventIdx = 0;

    for (const pos of spiral) {
      if (eventIdx >= totalEvents) break;
      const key = `${pos.x},${pos.y}`;
      if (placed.has(key)) continue;

      const bestEvent = this.findBestEvent(pos.x, pos.y, eventIdx, placements, totalEvents);
      result[key] = bestEvent;
      placed.add(key);
      if (!placements.has(bestEvent)) placements.set(bestEvent, []);
      placements.get(bestEvent).push(pos);
      eventIdx++;
    }

    // Fill remaining cells
    for (let x = 0; x < this.gridSize.x; x++) {
      for (let y = 0; y < this.gridSize.y; y++) {
        const key = `${x},${y}`;
        if (!placed.has(key)) {
          const bestEvent = this.findBestEvent(x, y, 0, placements, totalEvents);
          result[key] = bestEvent;
          if (!placements.has(bestEvent)) placements.set(bestEvent, []);
          placements.get(bestEvent).push({ x, y });
        }
      }
    }

    this.eventDistributionCache = result;
    return result;
  }

  generateSpiralOrder(cx, cy) {
    const order = [];
    const visited = new Set();
    if (this.isValidPos(cx, cy)) { order.push({ x: cx, y: cy }); visited.add(`${cx},${cy}`); }

    const maxR = Math.max(this.gridSize.x, this.gridSize.y);
    for (let r = 1; r <= maxR && order.length < this.gridSize.x * this.gridSize.y; r++) {
      const ring = [];
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const px = cx + dx, py = cy + dy;
          const key = `${px},${py}`;
          if (!visited.has(key) && this.isValidPos(px, py)) {
            ring.push({ x: px, y: py });
            visited.add(key);
          }
        }
      }
      ring.sort((a, b) => {
        const da = Math.sqrt((a.x - cx) ** 2 + (a.y - cy) ** 2);
        const db = Math.sqrt((b.x - cx) ** 2 + (b.y - cy) ** 2);
        return da - db;
      });
      order.push(...ring);
    }
    return order;
  }

  findBestEvent(x, y, startIdx, placements, total) {
    let bestIdx = startIdx % total;
    let bestScore = -Infinity;
    for (let i = 0; i < total; i++) {
      const idx = (startIdx + i) % total;
      let score = 1000;
      if (placements.has(idx)) {
        let minDist = Infinity;
        for (const p of placements.get(idx)) {
          minDist = Math.min(minDist, Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2));
        }
        score = minDist;
      }
      if (score > bestScore) { bestScore = score; bestIdx = idx; }
    }
    return bestIdx;
  }

  isValidPos(x, y) {
    return x >= 0 && x < this.gridSize.x && y >= 0 && y < this.gridSize.y;
  }

  // ---------------------------------------------------------------
  // POSTPROCESSING (Edge refraction + Barrel)
  // ---------------------------------------------------------------
  setupPostprocessing() {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.composer = new EffectComposer(this.renderer);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if ('setPixelRatio' in this.composer) this.composer.setPixelRatio(dpr);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const edgeShader = createEdgeRefractionShader();
    this.edgePass = new ShaderPass(edgeShader);
    this.updateEdgeResolution();
    this.edgePass.uniforms.refractPixels.value = 22 * dpr;
    this.edgePass.uniforms.sigmaPx.value = 20 * dpr;
    this.edgePass.uniforms.edgeWidthPercent.value = 0.05;
    this.edgePass.uniforms.falloffExp.value = 1.6;
    this.edgePass.renderToScreen = true;
    this.composer.addPass(this.edgePass);
  }

  updateEdgeResolution() {
    if (!this.edgePass || !this.renderer) return;
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    const dpr = this.renderer.getPixelRatio ? this.renderer.getPixelRatio() : (window.devicePixelRatio || 1);
    this.edgePass.uniforms.resolution.value.set(size.x * dpr, size.y * dpr);
  }

  setupBarrelDistortion() {
    if (!this.composer) return;
    const shader = createBarrelShader();
    this.barrelPass = new ShaderPass(shader);
    
    // Initialize bgColor uniform
    const colors = getThemeColors();
    this.barrelPass.uniforms.bgColor.value.copy(colors.bg);

    this.barrelPass.renderToScreen = true;
    this.composer.addPass(this.barrelPass);
    if (this.edgePass) this.edgePass.renderToScreen = false;
  }

  // ---------------------------------------------------------------
  // TEXT ELEMENTS (List View — using Canvas 2D text as a workaround
  //   since we don't have troika-three-text without a bundler)
  // ---------------------------------------------------------------
  createTextElements() {
    this.textGroup = new THREE.Group();
    this.textGroup.visible = false;
    this.scene.add(this.textGroup);

    const doubled = [...this.projectNames, ...this.projectNames];
    const fovRad = this.camera.fov * Math.PI / 180;
    const viewportWidth = 2 * Math.tan(fovRad / 2) * this.camera.position.z * this.camera.aspect;
    const isSmall = viewportWidth < 5;
    this.listTextSpacing = isSmall ? 0.25 : viewportWidth * 0.04;
    const textSize = isSmall ? viewportWidth * 0.075 : viewportWidth * 0.045;

    doubled.forEach((name, i) => {
      // Create canvas-based text sprite
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const dpr = 2;
      const fSize = Math.round(textSize * 100); // pixel size for canvas
      canvas.width = 2048;
      canvas.height = Math.round(fSize * 1.4);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${fSize}px "Helvetica Neue", "Arial", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = `${-fSize * 0.06}px`;
      ctx.fillText(name, canvas.width / 2, canvas.height / 2);

      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;

      const aspect = canvas.width / canvas.height;
      const planeH = textSize;
      const planeW = planeH * aspect;

      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        opacity: 0,
        color: new THREE.Color().copy(this._textColor)
      });
      const geom = new THREE.PlaneGeometry(planeW, planeH);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.y = -i * this.listTextSpacing;
      mesh.position.z = 0.1;
      mesh.visible = false;
      mesh.userData = { name, index: i, originalIndex: i % this.projectNames.length };

      this.textMeshes.push(mesh);
      this.textGroup.add(mesh);
    });
  }

  // ---------------------------------------------------------------
  // FLOATING VIDEO TILES (List View companion)
  // ---------------------------------------------------------------
  static FLOATING_VERTEX = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  static FLOATING_FRAGMENT = `
    precision highp float;
    uniform sampler2D videoMap;
    uniform sampler2D prevVideoMap;
    uniform float revealProgress;
    uniform float direction;
    uniform float videoAspect;
    uniform float prevVideoAspect;
    uniform vec3 bgColor;
    varying vec2 vUv;
    const float TILE_ASPECT = 16.0 / 9.0;

    vec2 coverUV(vec2 uv, float vidAspect) {
      vec2 s = uv;
      if (vidAspect > TILE_ASPECT) {
        float scale = TILE_ASPECT / vidAspect;
        s.x = uv.x * scale + (1.0 - scale) * 0.5;
      } else {
        float scale = vidAspect / TILE_ASPECT;
        s.y = uv.y * scale + (1.0 - scale) * 0.5;
      }
      return s;
    }

    void main() {
      vec3 bg = bgColor;
      if (direction == 0.0) {
        if (vUv.y > revealProgress) {
          gl_FragColor = vec4(bg, 1.0);
          return;
        }
        vec2 cuv = coverUV(vUv, videoAspect);
        vec4 tex = texture2D(videoMap, cuv);
        gl_FragColor = tex.a > 0.01 ? tex : vec4(bg, 1.0);
        return;
      }
      float shiftedY = vUv.y + revealProgress * direction;
      if (shiftedY >= 0.0 && shiftedY < 1.0) {
        vec2 puv = coverUV(vec2(vUv.x, shiftedY), prevVideoAspect);
        vec4 prev = texture2D(prevVideoMap, puv);
        gl_FragColor = prev.a > 0.01 ? prev : vec4(bg, 1.0);
      } else {
        float nextY = shiftedY - direction;
        vec2 nuv = coverUV(vec2(vUv.x, nextY), videoAspect);
        vec4 tex = texture2D(videoMap, nuv);
        gl_FragColor = tex.a > 0.01 ? tex : vec4(bg, 1.0);
      }
    }
  `;

  createFloatingTiles() {
    this.overlayScene = new THREE.Scene();
    this.floatingGroup = new THREE.Group();
    this.floatingGroup.visible = false;
    this.overlayScene.add(this.floatingGroup);

    const colors = getThemeColors();
    const data = new Uint8Array([Math.round(colors.bg.r * 255), Math.round(colors.bg.g * 255), Math.round(colors.bg.b * 255), 255]);
    this.floatingPlaceholderTex = new THREE.DataTexture(data, 1, 1);
    this.floatingPlaceholderTex.needsUpdate = true;

    const fovRad = this.camera.fov * Math.PI / 180;
    const viewH = 2 * Math.tan(fovRad / 2) * this.camera.position.z;
    const viewW = viewH * this.camera.aspect;

    for (let i = 0; i < this.FLOAT_LAYOUT.length; i++) {
      const layout = this.FLOAT_LAYOUT[i];
      const xPos = layout.xFrac * (viewW / 2);
      const yPos = layout.yFrac * viewH;
      const tileAspect = 16 / 9;

      const geom = new THREE.PlaneGeometry(layout.size, layout.size / tileAspect);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          videoMap: { value: this.floatingPlaceholderTex },
          prevVideoMap: { value: this.floatingPlaceholderTex },
          revealProgress: { value: 0 },
          direction: { value: 0 },
          videoAspect: { value: 16 / 9 },
          prevVideoAspect: { value: 16 / 9 },
          bgColor: { value: new THREE.Color().copy(colors.bg) }
        },
        vertexShader: GlobeGallery.FLOATING_VERTEX,
        fragmentShader: GlobeGallery.FLOATING_FRAGMENT,
        depthWrite: false
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(xPos, yPos, 0.05);
      mesh.visible = false;
      mesh.userData = { xBase: xPos, yBase: yPos, pFactor: layout.pFactor };

      this.floatingGroup.add(mesh);
      this.floatingMeshes.push(mesh);
      this.floatingVideoTextures.push(null);
      this.floatingPrevTextures.push(null);
    }
  }

  // ---------------------------------------------------------------
  // MEDIA LOADING
  // ---------------------------------------------------------------
  loadAllMedia() {
    this.cmsData.forEach((tile, idx) => {
      if (!tile.mediaSrc) return;

      // ── IMAGE TILES ──
      if (tile.mediaType === 'image') {
        if (this.videoPool.has(tile.mediaSrc)) {
          // Already loaded (shared between tiles)
          this.cmsImages[idx] = this.videoPool.get(tile.mediaSrc);
          return;
        }
        const img = new Image();
        this.videoPool.set(tile.mediaSrc, img);
        img.onload = () => {
          this.cmsImages[idx] = img;
          if (this.gridTexture) {
            this.redrawGridTexture();
            this.gridTexture.needsUpdate = true;
          }
        };
        img.onerror = () => { };
        img.src = tile.mediaSrc;
        return;
      }

      // ── VIDEO TILES (legacy) ──
      if (this.videoPool.has(tile.mediaSrc)) {
        const vid = this.videoPool.get(tile.mediaSrc);
        if (vid.readyState >= 2) {
          this.cmsImages[idx] = vid;
          vid.play().catch(() => { });
        } else {
          vid.addEventListener('loadeddata', () => {
            this.cmsImages[idx] = vid;
            vid.play().catch(() => { });
          }, { once: true });
        }
        return;
      }

      const video = document.createElement('video');
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('webkit-playsinline', 'true');
      video.preload = 'auto';
      this.videoPool.set(tile.mediaSrc, video);

      video.addEventListener('loadeddata', () => {
        this.cmsImages[idx] = video;
        video.play().catch(() => { });
        if (this.gridTexture) {
          this.redrawGridTexture();
          this.gridTexture.needsUpdate = true;
        }
      });
      video.addEventListener('error', () => { });
      video.src = tile.mediaSrc;
      video.load();
    });
  }

  loadFloatingMedia(slug, paused = false) {
    const project = this.listProjects.find(p => p.slug === slug);
    if (!project) return;

    // Prefer images, fall back to videos
    const imgs = project.gridImages?.length ? project.gridImages : (project.images || []);
    const vids = project.gridVideos?.length ? project.gridVideos : (project.videos ?? []);
    const hasImages = imgs.length > 0;

    for (let i = 0; i < this.floatingMeshes.length; i++) {
      const key = `${slug}:${i}`;
      if (this.floatingMedia.has(key)) {
        const existing = this.floatingMedia.get(key);
        if (existing && existing.tagName === 'VIDEO' && existing.paused && !paused) {
          existing.play().catch(() => { });
        }
        continue;
      }
      this.floatingMedia.set(key, null);

      if (hasImages) {
        // Load image for floating tile
        const src = imgs[i % imgs.length];
        if (!src) continue;
        if (this.videoPool.has(src)) {
          this.floatingMedia.set(key, this.videoPool.get(src));
          continue;
        }
        const img = new Image();
        this.videoPool.set(src, img);
        img.onload = () => {
          this.floatingMedia.set(key, img);
        };
        img.src = src;
      } else {
        // Load video for floating tile (legacy)
        const src = vids[i % vids.length]?.mp4 ?? '';
        if (!src) continue;

        if (this.videoPool.has(src)) {
          const v = this.videoPool.get(src);
          if (v.readyState >= 2) {
            if (!paused) v.play().catch(() => { });
            this.floatingMedia.set(key, v);
          } else {
            v.addEventListener('loadeddata', () => {
              if (!paused) v.play().catch(() => { });
              this.floatingMedia.set(key, v);
            }, { once: true });
          }
          continue;
        }

        const video = document.createElement('video');
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'auto';
        this.videoPool.set(src, video);
        video.addEventListener('loadeddata', () => {
          if (!paused) video.play().catch(() => { });
          this.floatingMedia.set(key, video);
        });
        video.src = src;
        video.load();
      }
    }
  }

  getProjectNeighborSlugs(slug) {
    const idx = this.listProjects.findIndex(p => p.slug === slug);
    if (idx === -1) return new Set([slug]);
    const len = this.listProjects.length;
    return new Set([
      this.listProjects[(idx - 1 + len) % len].slug,
      slug,
      this.listProjects[(idx + 1) % len].slug
    ]);
  }

  getCenteredProjectSlug() {
    if (!this.textMeshes.length || !this.listProjects.length) return '';
    const nameCount = this.projectNames.length;
    const totalMeshes = this.textMeshes.length;
    let centerIdx = Math.round(this.listScrollOffset / this.listTextSpacing + totalMeshes / 2);
    centerIdx = ((centerIdx % totalMeshes) + totalMeshes) % totalMeshes;
    const projIdx = centerIdx % nameCount;
    return this.listProjects[projIdx]?.slug ?? '';
  }

  // ---------------------------------------------------------------
  // FISHEYE WARP (CPU vertex displacement)
  // ---------------------------------------------------------------
  applyFisheyeWarp() {
    if (!this.gridMesh || !this.originalPositions) return;

    const posAttr = this.gridMesh.geometry.attributes.position;
    const arr = posAttr.array;
    const orig = this.originalPositions;
    const count = posAttr.count;

    const a = Math.max(1e-4, this.curveA);
    const b = Math.max(1e-4, this.curveB);
    const c = Math.max(1e-4, this.curveC);
    const invA2 = 1 / (a * a);
    const invB2 = 1 / (b * b);
    const depth = this.warpDepth * this.warpIntensity;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const x = orig[idx];
      const y = orig[idx + 1];
      const v = x * x * invA2 + y * y * invB2;
      const g = Math.max(0, 1 - Math.min(v, 0.9999));
      const p = Math.sqrt(g);
      const m = 0.04 * (1 - p);

      arr[idx] = x * (1 - m);
      arr[idx + 1] = y * (1 - m);
      arr[idx + 2] = (-c + c * p) * depth;
    }

    posAttr.needsUpdate = true;
    this.gridMesh.geometry.computeBoundingSphere();
  }

  // ---------------------------------------------------------------
  // EVENT LISTENERS
  // ---------------------------------------------------------------
  setupEventListeners() {
    this.container.addEventListener('mousedown', this.onMouseDown);
    this.container.addEventListener('mousemove', this.onMouseMove);
    this.container.addEventListener('mouseup', this.onMouseUp);
    this.container.addEventListener('mouseleave', this.onMouseLeave);
    this.container.addEventListener('mouseenter', this.onMouseEnter);
    this.container.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.container.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.container.addEventListener('touchend', this.onTouchEnd, { passive: true });
    this.container.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('mousemove', this.onGlobalMouseMove);
    window.addEventListener('keydown', this.onKeyDown);

    // View toggle buttons
    document.getElementById('view-grid').addEventListener('click', () => this.setView('grid'));
    document.getElementById('view-list').addEventListener('click', () => this.setView('list'));
  }

  onMouseDown = (e) => {
    if ((this.galleryState === 'list' || this.galleryState === 'transitioning_to_list')) {
      this.listIsDragging = true;
      this.listLastY = e.clientY;
      this.listVelocity = 0;
      this.listSnapTarget = null;
      this.listSwipeStartSnap = Math.round(this.listScrollOffset / this.listTextSpacing) * this.listTextSpacing;
      if (this.renderer) this.renderer.domElement.style.cursor = 'grabbing';
    }
    this.isHolding = true;
    this.prevMouse.x = e.clientX;
    this.prevMouse.y = e.clientY;
    this.mouseDownTime = performance.now();
    this.mouseDownPos.x = e.clientX;
    this.mouseDownPos.y = e.clientY;
    this.mouseMoveDistance = 0;
    this.container.classList.add('dragging');
    this.targetScale = 0.92;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this._clickHandled = false;
  };

  onMouseMove = (e) => {
    if (this.listIsDragging && (this.galleryState === 'list' || this.galleryState === 'transitioning_to_list')) {
      const dy = (e.clientY - this.listLastY) * this.listDragScale;
      this.listVelocity = Math.max(-this.listMaxVelocity, Math.min(this.listMaxVelocity, dy));
      this.listLastY = e.clientY;
    }

    if (this.isHolding) {
      const dist = Math.sqrt((e.clientX - this.mouseDownPos.x) ** 2 + (e.clientY - this.mouseDownPos.y) ** 2);
      this.mouseMoveDistance = Math.max(this.mouseMoveDistance, dist);
      if (this.mouseMoveDistance > this.clickThreshold.distance && !this.isDragging) {
        this.isDragging = true;
      }
    }

    if (this.isDragging && this.galleryState === 'grid') {
      const dx = (e.clientX - this.prevMouse.x) * this.dragScale;
      const dy = (e.clientY - this.prevMouse.y) * this.dragScale;
      this.cameraOffset.x -= dx;
      this.cameraOffset.y += dy;
      this.velocity.x = 0.7 * -dx + 0.3 * this.velocity.x;
      this.velocity.y = 0.7 * dy + 0.3 * this.velocity.y;
      this.prevMouse.x = e.clientX;
      this.prevMouse.y = e.clientY;

      // Clear hover on drag
      if (this.hoveredTileKey !== null) {
        this.prevHoveredTileKey = this.hoveredTileKey;
        this.prevHoverOpacity = this.hoverOpacity;
        this.hoveredTile = null;
        this.hoveredTileKey = null;
        this.hoverTargetOpacity = 0;
        this.hoverDirty = true;
      }
    } else if (!this.isDragging) {
      this.pointer.x = e.clientX;
      this.pointer.y = e.clientY;
      this.pointer.inside = true;
      if (this.galleryState === 'grid') {
        this.updateHoveredTile(e.clientX, e.clientY);
      }
    }
  };

  onMouseUp = (e) => {
    if (this._clickHandled) return;
    this._clickHandled = true;

    this.isDragging = false;
    this.isHolding = false;
    this.listIsDragging = false;
    this.container.classList.remove('dragging');
    this.targetScale = this.galleryState === 'grid' ? 1.05 : 1;

    if (this.galleryState === 'list' && this.renderer) {
      this.renderer.domElement.style.cursor = 'grab';
    }
  };

  onMouseLeave = () => {
    if (this.hoveredTileKey !== null) {
      this.prevHoveredTileKey = this.hoveredTileKey;
      this.prevHoverOpacity = this.hoverOpacity;
      this.hoveredTile = null;
      this.hoveredTileKey = null;
      this.hoverTargetOpacity = 0;
      this.hoverDirty = true;
    }
    this.pointer.inside = false;
  };

  onMouseEnter = () => {
    this.pointer.inside = true;
  };

  onGlobalMouseMove = (e) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    this.targetCursorOffset.x = 0.075 * nx;
    this.targetCursorOffset.y = 0.075 * -ny;
    if (this.isDragging) {
      this.targetCursorOffset.x *= 0.2;
      this.targetCursorOffset.y *= 0.2;
    }
  };

  onTouchStart = (e) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      this.onMouseDown({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    }
  };

  onTouchMove = (e) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      this.onMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    }
  };

  onTouchEnd = (e) => {
    const t = e.changedTouches?.[0];
    this.onMouseUp(t ? { clientX: t.clientX, clientY: t.clientY } : { clientX: this.prevMouse.x, clientY: this.prevMouse.y });
  };

  onWheel = (e) => {
    e.preventDefault();
    if (this.galleryState === 'list' || this.galleryState === 'transitioning_to_list') {
      this.listVelocity = Math.max(-this.listMaxVelocity, Math.min(this.listMaxVelocity, this.listVelocity - e.deltaY * this.listScrollScale));
    } else {
      this.cameraOffset.x -= 0.003 * e.deltaX;
      this.cameraOffset.y += 0.003 * e.deltaY;
    }
  };

  onKeyDown = (e) => {
    if (this.galleryState !== 'list' || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const dir = e.key === 'ArrowDown' ? -1 : 1;
    const current = this.listSnapTarget ?? this.listScrollOffset;
    this.listSnapTarget = Math.round(current / this.listTextSpacing) * this.listTextSpacing + dir * this.listTextSpacing;
    this.listVelocity = dir * 0.001;
  };

  onWindowResize = () => {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
    this.updateEdgeResolution();
    this.warpDirty = true;

    // Update text spacing for new viewport
    if (this.textMeshes.length > 0 && this.camera) {
      const fovRad = this.camera.fov * Math.PI / 180;
      const viewW = 2 * Math.tan(fovRad / 2) * this.camera.position.z * this.camera.aspect;
      const isSmall = viewW < 5;
      this.listTextSpacing = isSmall ? 0.25 : viewW * 0.04;
      this.textMeshes.forEach((mesh, i) => {
        mesh.position.y = -i * this.listTextSpacing;
      });
    }

    // Update floating tile positions
    if (this.floatingMeshes.length > 0 && this.camera) {
      const fovRad = this.camera.fov * Math.PI / 180;
      const viewH = 2 * Math.tan(fovRad / 2) * this.camera.position.z;
      const viewW = viewH * this.camera.aspect;
      this.floatingMeshes.forEach((mesh, i) => {
        const layout = this.FLOAT_LAYOUT[i];
        const x = layout.xFrac * (viewW / 2);
        const y = layout.yFrac * viewH;
        mesh.position.set(x, y, 0.05);
        mesh.userData.xBase = x;
        mesh.userData.yBase = y;
      });
    }
  };

  // ---------------------------------------------------------------
  // HOVER DETECTION
  // ---------------------------------------------------------------
  _raycaster = new THREE.Raycaster();
  _rayMouse = new THREE.Vector2();

  getTileFromPointer(px, py) {
    if (!this.camera || !this.raycastPlane) return null;
    this._rayMouse.set((px / window.innerWidth) * 2 - 1, -(py / window.innerHeight) * 2 + 1);
    this._raycaster.setFromCamera(this._rayMouse, this.camera);
    const hits = this._raycaster.intersectObject(this.raycastPlane, false);
    if (hits.length === 0 || !hits[0].uv) return null;
    const uv = hits[0].uv;
    const tex = this.gridMesh?.material?.map;
    const ox = tex ? tex.offset.x : 0;
    const oy = tex ? tex.offset.y : 0;
    let u = (uv.x + ox) % 1; if (u < 0) u += 1;
    let v = (uv.y + oy) % 1; if (v < 0) v += 1;
    let col = Math.floor(u * this.gridSize.x);
    let row = Math.floor((1 - v) * this.gridSize.y);
    col = Math.max(0, Math.min(this.gridSize.x - 1, col));
    row = Math.max(0, Math.min(this.gridSize.y - 1, row));
    return { x: col, y: row };
  }

  updateHoveredTile(px, py) {
    if (!this.gridMesh) return;
    const tile = this.getTileFromPointer(px, py);
    if (tile) {
      const key = `${tile.x},${tile.y}`;
      if (key !== this.hoveredTileKey) {
        if (this.hoveredTileKey !== null) {
          this.prevHoveredTileKey = this.hoveredTileKey;
          this.prevHoverOpacity = this.hoverOpacity;
        }
        this.hoveredTile = tile;
        this.hoveredTileKey = key;
        this.hoverOpacity = 0;
        this.hoverTargetOpacity = this.hoverBgMaxOpacity;
        this.hoverDirty = true;
      } else {
        this.hoverTargetOpacity = this.hoverBgMaxOpacity;
      }
    } else if (this.hoveredTileKey !== null) {
      this.prevHoveredTileKey = this.hoveredTileKey;
      this.prevHoverOpacity = this.hoverOpacity;
      this.hoveredTile = null;
      this.hoveredTileKey = null;
      this.hoverTargetOpacity = 0;
      this.hoverDirty = true;
    }
  }

  // ---------------------------------------------------------------
  // VIEW TOGGLE (grid ↔ list)
  // ---------------------------------------------------------------
  setView(mode) {
    if (mode === 'list' && this.galleryState === 'grid') {
      // Snap List view starting offset to the currently centered project on the Globe
      const tile = this.getTileFromPointer(window.innerWidth / 2, window.innerHeight / 2);
      if (tile) {
        const dist = this.eventDistributionCache || this.generateOptimalEventDistribution();
        const idx = dist[`${tile.x},${tile.y}`] ?? 0;
        const project = this.cmsData[idx % this.cmsData.length];
        const slug = project?.slug;
        if (slug) {
          const projIdx = this.listProjects.findIndex(p => p.slug === slug);
          if (projIdx !== -1) {
            const nameCount = this.projectNames.length;
            this.listScrollOffset = (projIdx - nameCount) * this.listTextSpacing;
            this.listVelocity = 0;
            this.listSnapTarget = null;
          }
        }
      }

      this.galleryState = 'transitioning_to_list';
      this.transitionProgress = 0;
      this.targetBarrelIntensity = 1;
      if (this.renderer) this.renderer.domElement.style.cursor = 'grab';
      this.textGroup.visible = true;
      this.textMeshes.forEach(m => { m.visible = true; m.material.opacity = 0; });

      document.getElementById('view-grid').classList.remove('active');
      document.getElementById('view-list').classList.add('active');
    } else if (mode === 'grid' && this.galleryState === 'list') {
      // Snap Globe rotation offset to center on the currently centered project in the List
      const slug = this.getCenteredProjectSlug();
      if (slug) {
        const dist = this.eventDistributionCache || this.generateOptimalEventDistribution();
        let foundCol = 0, foundRow = 0, found = false;
        for (let col = 0; col < this.gridSize.x; col++) {
          for (let row = 0; row < this.gridSize.y; row++) {
            const idx = dist[`${col},${row}`] ?? 0;
            const tile = this.cmsData[idx % this.cmsData.length];
            if (tile && tile.slug === slug) {
              foundCol = col;
              foundRow = row;
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (found) {
          const u = (foundCol + 0.5) / this.gridSize.x;
          const v = 1 - (foundRow + 0.5) / this.gridSize.y;
          const gridW = this.gridSize.x * this.tileSize;
          const gridH = this.gridSize.y * this.tileSize;
          this.cameraOffset.x = (u - 0.5) * gridW;
          this.cameraOffset.y = (v - 0.5) * gridH;
          this.velocity.x = 0;
          this.velocity.y = 0;
          this.updateGridPosition();
        }
      }

      this.galleryState = 'transitioning_to_grid';
      this.transitionProgress = 0;
      this.targetBarrelIntensity = 0;
      if (this.renderer) this.renderer.domElement.style.cursor = '';
      this.textRevealActive = true;
      this.textRevealReverse = true;
      this.textRevealStartTime = performance.now();
      this.floatingRevealActive = true;
      this.floatingRevealReverse = true;
      this.floatingRevealStartTime = performance.now();

      document.getElementById('view-grid').classList.add('active');
      document.getElementById('view-list').classList.remove('active');
    }
  }

  // ---------------------------------------------------------------
  // CAPSULE ANIMATION
  // ---------------------------------------------------------------
  animateCapsuleIn() {
    const wrapper = document.getElementById('capsule-wrapper');
    wrapper.style.visibility = 'visible';
    // Animate from below
    let progress = 0;
    const animFrame = () => {
      progress += 0.04;
      if (progress >= 1) {
        wrapper.style.transform = 'translateX(-50%) translateY(0px)';
        return;
      }
      const ease = 1 - Math.pow(1 - progress, 3);
      const y = 48 * (1 - ease);
      wrapper.style.transform = `translateX(-50%) translateY(${y}px)`;
      requestAnimationFrame(animFrame);
    };
    setTimeout(() => requestAnimationFrame(animFrame), 300);
  }

  // ---------------------------------------------------------------
  // VIDEO TEXTURE UPDATES (grid)
  // ---------------------------------------------------------------
  redrawGridTexture() {
    if (!this.gridCanvas || !this.gridTexture) return;
    const ctx = this.gridCanvas.getContext('2d', { alpha: false });
    const size = this._tilePixelSize;
    const dist = this.generateOptimalEventDistribution();
    const colors = getThemeColors();

    ctx.fillStyle = colors.bg.getStyle();
    ctx.fillRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);

    for (let col = 0; col < this.gridSize.x; col++) {
      for (let row = 0; row < this.gridSize.y; row++) {
        const idx = dist[`${col},${row}`] ?? 0;
        const tile = this.cmsData[idx % this.cmsData.length];
        this.drawTileToCanvas(ctx, tile, idx, col * size, row * size, size);
      }
    }
    this.gridTexture.needsUpdate = true;
  }

  updateVideoTextures() {
    if (!this._isChrome || !this.gridMesh?.visible) return;

    if (this._hasVideos === undefined) {
      this._hasVideos = this.cmsImages.some(m => m && m.tagName === 'VIDEO');
      if (this._hasVideos) {
        this._videoTiles = [];
        const dist = this.eventDistributionCache || this.generateOptimalEventDistribution();
        for (let x = 0; x < this.gridSize.x; x++) {
          for (let y = 0; y < this.gridSize.y; y++) {
            const idx = dist[`${x},${y}`] ?? 0;
            const media = this.cmsImages[idx % this.cmsImages.length];
            if (media && media.tagName === 'VIDEO') {
              this._videoTiles.push({ x, y, eventIndex: idx });
            }
          }
        }
      }
    }

    if (!this._hasVideos || !this.gridCanvas || !this.gridTexture || !this._videoTiles || this._videoTiles.length === 0) return;
    if (this.frameCount % this.videoUpdateInterval !== 0) return;

    const tex = this.gridMesh.material.map;
    if (!tex) return;

    // Only update tiles visible in viewport
    const fovRad = this.camera.fov * Math.PI / 180;
    const zoom = this.camera.zoom || 1;
    const viewH = 2 * Math.tan(fovRad / 2) * this.camera.position.z / zoom;
    const viewW = viewH * this.camera.aspect;
    const gridW = this.gridSize.x * this.tileSize;
    const gridH = this.gridSize.y * this.tileSize;
    const visFracW = Math.min(0.5, viewW / gridW * 0.65);
    const visFracH = Math.min(0.5, viewH / gridH * 0.65);
    const centerU = (tex.offset.x + 0.5) % 1;
    const centerV = (tex.offset.y + 0.5) % 1;
    const halfTileU = 0.5 / this.gridSize.x;
    const halfTileV = 0.5 / this.gridSize.y;

    if (!this._gridCtx) this._gridCtx = this.gridCanvas.getContext('2d', { alpha: false });
    const ctx = this._gridCtx;
    const size = this._tilePixelSize;
    let dirty = false;

    for (const vt of this._videoTiles) {
      const tileU = (vt.x + 0.5) / this.gridSize.x;
      const tileV = 1 - (vt.y + 0.5) / this.gridSize.y;
      let du = Math.abs(tileU - centerU); if (du > 0.5) du = 1 - du;
      let dv = Math.abs(tileV - centerV); if (dv > 0.5) dv = 1 - dv;
      if (du > visFracW + halfTileU || dv > visFracH + halfTileV) continue;

      const media = this.cmsImages[vt.eventIndex % this.cmsImages.length];
      if (media && media.currentTime !== undefined) {
        const key = `${vt.x},${vt.y}`;
        const ct = media.currentTime;
        if (this._lastVideoTimes.get(key) === ct) continue;
        this._lastVideoTimes.set(key, ct);
      }

      const tile = this.cmsData[vt.eventIndex % this.cmsData.length];
      this.drawTileToCanvas(ctx, tile, vt.eventIndex, vt.x * size, vt.y * size, size);
      dirty = true;
    }

    if (dirty) this.gridTexture.needsUpdate = true;
  }

  // ---------------------------------------------------------------
  // REVEAL ANIMATIONS (bottom-up wipe)
  // ---------------------------------------------------------------
  updateRevealAnimations(dt) {
    if (!this.gridMesh?.visible) return;
    const frameDt = dt / 60;
    const step = this.revealDuration > 0 ? frameDt / this.revealDuration : 1;
    let dirty = false;

    for (const [idx, val] of this.mediaRevealProgress) {
      if (val < 1) {
        this.mediaRevealProgress.set(idx, Math.min(1, val + step));
        dirty = true;
      }
    }

    if (dirty && this.gridTexture) {
      this.redrawGridTexture();
      this.gridTexture.needsUpdate = true;
    }
  }

  // ---------------------------------------------------------------
  // TRANSITION STATE MACHINE
  // ---------------------------------------------------------------
  updateTransitionState(dt) {
    if (this.galleryState !== 'transitioning_to_list' && this.galleryState !== 'transitioning_to_grid') return;

    const toList = this.galleryState === 'transitioning_to_list';
    if (!toList && this.textRevealActive) return;

    if (!toList && this.gridMesh && !this.gridMesh.visible) {
      this.gridMesh.visible = true;
      this.gridMesh.material.opacity = 1;
    }

    const frameDt = dt / 60;
    this.transitionProgress = Math.min(1, this.transitionProgress + frameDt / this.transitionDuration);

    const barrelPeaked = !toList && this.barrelIntensity > 350;

    if (this.transitionProgress >= 1 || barrelPeaked) {
      if (toList) {
        if (this.gridMesh) this.gridMesh.visible = false;
        this.galleryState = 'list';
        this.barrelIntensity = 0;
        if (this.barrelPass) this.barrelPass.uniforms.intensity.value = 0;

        // Trigger text reveal
        this.textRevealActive = true;
        this.textRevealReverse = false;
        this.textRevealStartTime = performance.now();

        // Show floating tiles
        if (this.floatingGroup) {
          this.floatingGroup.visible = true;
          this.floatingMeshes.forEach(m => { m.visible = true; });
        }
        this.floatingCurrentSlug = '';
        this.floatingRevealProgress = 0;
        this.floatingRevealActive = true;
        this.floatingRevealReverse = false;
        this.floatingRevealStartTime = performance.now();
      } else {
        this.galleryState = 'grid';
        this.barrelIntensity = 0;
        if (this.barrelPass) this.barrelPass.uniforms.intensity.value = 0;
        this.textGroup.visible = false;
        this.textMeshes.forEach(m => { m.visible = false; });
        if (this.gridMesh) {
          this.gridMesh.visible = true;
          this.gridMesh.material.opacity = 1;
          this.gridMesh.material.transparent = false;
        }
        this.textRevealActive = false;
        if (this.floatingGroup) this.floatingGroup.visible = false;
        this.floatingRevealActive = false;
        this.floatingRevealProgress = 0;
        this.floatingCurrentSlug = '';
      }
    }
  }

  // ---------------------------------------------------------------
  // LIST TEXT POSITIONS UPDATE
  // ---------------------------------------------------------------
  updateListTextPositions() {
    if (this.galleryState !== 'list' && this.galleryState !== 'transitioning_to_list' && this.galleryState !== 'transitioning_to_grid') return;
    if (!this.textMeshes.length) return;

    // Snapping or free-scroll
    if (this.listSnapTarget !== null && !this.listIsDragging) {
      this.listScrollOffset += (this.listSnapTarget - this.listScrollOffset) * 0.18;
      if (Math.abs(this.listSnapTarget - this.listScrollOffset) < 0.0005) {
        this.listScrollOffset = this.listSnapTarget;
        this.listSnapTarget = null;
      }
    } else {
      if (!this.listIsDragging) {
        this.listVelocity *= this.listFriction;
        if (Math.abs(this.listVelocity) < 0.0001) this.listVelocity = 0;
      }
      this.listScrollOffset += this.listVelocity;
    }

    const totalSpan = this.textMeshes.length * this.listTextSpacing;
    const fovRad = this.camera.fov * Math.PI / 180;
    const viewHalfH = Math.tan(fovRad / 2) * this.camera.position.z;

    const isRevealing = this.textRevealActive;
    const revealTime = isRevealing ? (performance.now() - this.textRevealStartTime) / 1000 : 0;

    let allDone = true;
    const cullDist = this.listTextSpacing * 2;

    this.textMeshes.forEach((mesh, i) => {
      let y = i * this.listTextSpacing - this.listScrollOffset;
      y = ((y % totalSpan) + totalSpan) % totalSpan;
      y = y - totalSpan / 2;

      if (!isRevealing && Math.abs(y) > viewHalfH + cullDist) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;

      const mat = mesh.material;

      if (isRevealing) {
        const normDist = Math.abs(y) / viewHalfH;
        let progress;
        if (this.textRevealReverse) {
          const delay = (1 - Math.min(normDist, 1)) * this.textRevealReverseStagger;
          progress = 1 - Math.max(0, Math.min(1, (revealTime - delay) / this.textRevealReverseDuration));
        } else {
          const delay = Math.min(normDist, 1) * this.textRevealStagger;
          progress = Math.max(0, Math.min(1, (revealTime - delay) / this.textRevealDuration));
        }
        const ease = 1 - Math.pow(1 - progress, 3);
        const shift = (1 - ease) * this.listTextSpacing;

        if (this.textRevealReverse) {
          mesh.position.y = y + shift;
        } else {
          mesh.position.y = y - shift;
        }
        mat.opacity = ease;

        if ((this.textRevealReverse && progress > 0) || (!this.textRevealReverse && progress < 1)) {
          allDone = false;
        }
      } else {
        mesh.position.y = y;
      }

      mesh.position.x = 0;
      mesh.position.z = 0.1;

      // Fade based on distance from center
      const distNorm = Math.abs(mesh.position.y) / viewHalfH;
      const fadeStrength = 0.65;
      const alpha = Math.pow(Math.max(0, 1 - distNorm * fadeStrength), 3);

      // Center item gets full color, others fade to bg
      const centerProximity = Math.max(0, 1 - Math.pow(Math.abs(mesh.position.y) / (this.listTextSpacing * 0.6), 8));
      this._targetColor.lerpColors(this._ndColor, this._textColor, centerProximity);
      mat.color.copy(this._targetColor);

      // Apply alpha and color by modifying material opacity
      if (!isRevealing) {
        mat.opacity = alpha;
      }
    });

    if (isRevealing && allDone) {
      this.textRevealActive = false;
      this.textMeshes.forEach(mesh => {
        if (this.textRevealReverse) {
          mesh.material.opacity = 0;
          mesh.visible = false;
        }
      });
    }

    // Move text group with cursor parallax
    if (this.textGroup) {
      this.textGroup.position.x = this.cursorOffset.x;
      this.textGroup.position.y = this.cursorOffset.y;
    }
  }

  // ---------------------------------------------------------------
  // FLOATING TILES UPDATE
  // ---------------------------------------------------------------
  updateFloatingTiles() {
    if (!this.floatingGroup || this.floatingMeshes.length === 0) return;
    if (this.galleryState !== 'list' && this.galleryState !== 'transitioning_to_grid') return;

    // Reveal animation
    if (this.floatingRevealActive) {
      const elapsed = (performance.now() - this.floatingRevealStartTime) / 1000;
      const t = Math.max(0, Math.min(1, elapsed / this.floatingRevealDuration));
      const ease = 1 - Math.pow(1 - t, 3);
      this.floatingRevealProgress = this.floatingRevealReverse ? 1 - ease : ease;

      if (t >= 1) {
        this.floatingRevealActive = false;
        if (this.floatingRevealReverse && this.floatingGroup) this.floatingGroup.visible = false;
        if (!this.floatingRevealReverse) { this.floatingSlideDirection = 0; this.floatingRevealProgress = 1; }
      }
    }

    // Check if centered project changed
    const slug = this.getCenteredProjectSlug();
    if (slug && slug !== this.floatingCurrentSlug) {
      const wasEmpty = this.floatingCurrentSlug === '';
      this.floatingCurrentSlug = slug;
      this.loadFloatingMedia(slug);

      if (!wasEmpty) {
        // Store prev textures for slide transition
        for (let i = 0; i < this.floatingMeshes.length; i++) {
          const mat = this.floatingMeshes[i].material;
          this.floatingPrevTextures[i] = this.floatingVideoTextures[i] || this.floatingPlaceholderTex;
          mat.uniforms.prevVideoMap.value = this.floatingPrevTextures[i];
          mat.uniforms.prevVideoAspect.value = mat.uniforms.videoAspect.value;
        }
        this.floatingSlideDirection = this.listVelocity < 0 ? -1 : 1;
        this.floatingRevealProgress = 0;
        this.floatingRevealActive = true;
        this.floatingRevealReverse = false;
        this.floatingRevealStartTime = performance.now();
      }
    }

    // Update floating mesh uniforms and positions
    for (let i = 0; i < this.floatingMeshes.length; i++) {
      const mesh = this.floatingMeshes[i];
      const mat = mesh.material;
      mat.uniforms.revealProgress.value = this.floatingRevealProgress;
      mat.uniforms.direction.value = this.floatingSlideDirection;

      // Update media texture (supports both Image and Video)
      const media = this.floatingMedia.get(`${this.floatingCurrentSlug}:${i}`) ?? null;
      if (media) {
        const cacheKey = `${this.floatingCurrentSlug}:${i}`;
        let tex = this.floatingTexCache.get(cacheKey);

        if (media.tagName === 'VIDEO') {
          if (!tex || tex.image !== media) {
            tex = new THREE.VideoTexture(media);
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.colorSpace = THREE.SRGBColorSpace;
            this.floatingTexCache.set(cacheKey, tex);
          }
          if (media.videoWidth && media.videoHeight) {
            mat.uniforms.videoAspect.value = media.videoWidth / media.videoHeight;
          }
        } else if (media.tagName === 'IMG' && media.complete && media.naturalWidth) {
          if (!tex || tex.image !== media) {
            tex = new THREE.Texture(media);
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.needsUpdate = true;
            this.floatingTexCache.set(cacheKey, tex);
          }
          mat.uniforms.videoAspect.value = media.naturalWidth / media.naturalHeight;
        }

        if (tex && this.floatingVideoTextures[i] !== tex) {
          this.floatingVideoTextures[i] = tex;
          mat.uniforms.videoMap.value = tex;
        }
      }

      // Parallax cursor offset
      const pf = mesh.userData.pFactor;
      mesh.position.x = mesh.userData.xBase + this.cursorOffset.x * pf * 8;
      mesh.position.y = mesh.userData.yBase + this.cursorOffset.y * pf * 8;
    }
  }

  // ---------------------------------------------------------------
  // BARREL INTENSITY UPDATE
  // ---------------------------------------------------------------
  updateBarrelIntensity() {
    if (!this.barrelPass) return;

    if (this.galleryState === 'transitioning_to_list' || this.galleryState === 'transitioning_to_grid') {
      const toList = this.galleryState === 'transitioning_to_list';
      if (!toList && this.textRevealActive) {
        this.barrelIntensity = 1;
      } else {
        const maxBarrel = toList ? 800 : 400;
        const exp = toList ? 1 : Math.pow(150 / 400, 0.25);
        const t = toList ? this.transitionProgress : (1 - this.transitionProgress) * exp;
        this.barrelIntensity = t * t * t * t * maxBarrel;
      }
    } else {
      this.barrelIntensity += 0.05 * (this.targetBarrelIntensity - this.barrelIntensity);
    }

    this.barrelPass.uniforms.intensity.value = this.barrelIntensity;
    this.barrelPass.enabled = this.barrelIntensity > 0.001;
  }

  // ---------------------------------------------------------------
  // CAMERA ZOOM
  // ---------------------------------------------------------------
  updateCamera() {
    if (!this.camera) return;
    const diff = this.targetScale - this.currentScale;
    if (Math.abs(diff) < 0.0001) return;
    this.currentScale += diff * 0.09;
    this.camera.zoom = this.currentScale;
    this.camera.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------
  // GRID POSITION (UV offset scroll)
  // ---------------------------------------------------------------
  updateGridPosition() {
    // Lerp cursor offset
    const dx = this.targetCursorOffset.x - this.cursorOffset.x;
    const dy = this.targetCursorOffset.y - this.cursorOffset.y;
    if (Math.abs(dx) < 0.00005 && Math.abs(dy) < 0.00005) {
      this.cursorOffset.x = this.targetCursorOffset.x;
      this.cursorOffset.y = this.targetCursorOffset.y;
    } else {
      this.cursorOffset.x += 0.08 * dx;
      this.cursorOffset.y += 0.08 * dy;
    }

    if (!this.gridMesh) return;
    const tex = this.gridMesh.material.map;
    if (tex) {
      const gridW = this.gridSize.x * this.tileSize;
      const gridH = this.gridSize.y * this.tileSize;
      let ox = ((this.cameraOffset.x + this.cursorOffset.x) / gridW) % 1;
      let oy = ((this.cameraOffset.y + this.cursorOffset.y) / gridH) % 1;
      if (ox < 0) ox += 1;
      if (oy < 0) oy += 1;
      tex.offset.x = ox;
      tex.offset.y = oy;
    }
  }

  // ---------------------------------------------------------------
  // MAIN ANIMATION LOOP
  // ---------------------------------------------------------------
  animate = () => {
    if (this.isDestroyed) return;
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min(3, Math.max(0.5, (now - this.lastFrameTime) / 16.67));
    this.lastFrameTime = now;
    this.frameCount++;

    this.updateCamera();

    // Detect grid movement
    const isMoving =
      Math.abs(this.cameraOffset.x - this.lastOffsetX) > 0.0001 ||
      Math.abs(this.cameraOffset.y - this.lastOffsetY) > 0.0001 ||
      Math.abs(this.velocity.x) > this.minVelocity ||
      Math.abs(this.velocity.y) > this.minVelocity;
    this.isGridMoving = isMoving || this.isDragging;

    // Apply fisheye warp
    if (this.warpDirty) {
      this.applyFisheyeWarp();
      this.warpDirty = false;
    }

    // Update grid UV offset
    this.updateGridPosition();

    // Reveal animations
    this._lastGridTextureFrame = -1;
    this.updateRevealAnimations(dt);
    this.lastOffsetX = this.cameraOffset.x;
    this.lastOffsetY = this.cameraOffset.y;

    // Hover fade
    const fadeDt = dt / 60;
    const fadeStep = this.hoverFadeDuration > 0 ? fadeDt / this.hoverFadeDuration : 1;
    if (this.hoverOpacity < this.hoverTargetOpacity) {
      this.hoverOpacity = Math.min(this.hoverTargetOpacity, this.hoverOpacity + fadeStep);
    } else if (this.hoverOpacity > this.hoverTargetOpacity) {
      this.hoverOpacity = Math.max(this.hoverTargetOpacity, this.hoverOpacity - fadeStep);
    }
    if (this.prevHoverOpacity > 0) {
      this.prevHoverOpacity = Math.max(0, this.prevHoverOpacity - fadeStep);
    }

    // Update video textures on grid
    if (this._lastGridTextureFrame !== this.frameCount) {
      this.updateVideoTextures();
    }

    // Continuous hover check
    if (this.pointer.inside && !this.isDragging && this.galleryState === 'grid') {
      this.updateHoveredTile(this.pointer.x, this.pointer.y);
    }

    // Apply inertia
    if (!this.isDragging) {
      this.cameraOffset.x += this.velocity.x * dt;
      this.cameraOffset.y += this.velocity.y * dt;
      const frictionFactor = Math.pow(this.friction, dt);
      this.velocity.x *= frictionFactor;
      this.velocity.y *= frictionFactor;
      if (Math.abs(this.velocity.x) < this.minVelocity) this.velocity.x = 0;
      if (Math.abs(this.velocity.y) < this.minVelocity) this.velocity.y = 0;
    }

    // State transitions
    this.updateTransitionState(dt);
    this.updateListTextPositions();
    this.updateFloatingTiles();
    this.updateBarrelIntensity();

    // Render
    if (this.composer) {
      this.composer.render();
    } else if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    // Render overlay scene (floating tiles)
    if (this.overlayScene && this.renderer && this.camera && this.floatingGroup?.visible) {
      this.renderer.autoClear = false;
      this.renderer.clearDepth();
      this.renderer.render(this.overlayScene, this.camera);
      this.renderer.autoClear = true;
    }
  };

  updateThemeColors() {
    const colors = getThemeColors();

    if (this.scene) {
      this.scene.background = colors.bg;
    }
    if (this.renderer) {
      this.renderer.setClearColor(colors.bg, 1);
    }
    
    this._bgColor.copy(colors.bg);
    this._textColor.copy(colors.text);
    this._ndColor.copy(colors.mutedText);

    if (this.barrelPass && this.barrelPass.uniforms.bgColor) {
      this.barrelPass.uniforms.bgColor.value.copy(colors.bg);
    }

    if (this.floatingMeshes) {
      this.floatingMeshes.forEach(mesh => {
        if (mesh.material && mesh.material.uniforms && mesh.material.uniforms.bgColor) {
          mesh.material.uniforms.bgColor.value.copy(colors.bg);
        }
      });
    }

    this.redrawGridTexture();
  }

  destroy() {
    this.isDestroyed = true;
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
    
    // Clean up event listeners
    this.container?.removeEventListener('mousedown', this.onMouseDown);
    this.container?.removeEventListener('mousemove', this.onMouseMove);
    this.container?.removeEventListener('mouseup', this.onMouseUp);
    this.container?.removeEventListener('mouseleave', this.onMouseLeave);
    this.container?.removeEventListener('mouseenter', this.onMouseEnter);
    if (this.container) {
      this.container.removeEventListener('touchstart', this.onTouchStart);
      this.container.removeEventListener('touchmove', this.onTouchMove);
      this.container.removeEventListener('touchend', this.onTouchEnd);
      this.container.removeEventListener('wheel', this.onWheel);
    }
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('mousemove', this.onGlobalMouseMove);
    window.removeEventListener('keydown', this.onKeyDown);

    // View toggle buttons
    const viewGridBtn = document.getElementById('view-grid');
    const viewListBtn = document.getElementById('view-list');
    if (viewGridBtn) viewGridBtn.replaceWith(viewGridBtn.cloneNode(true));
    if (viewListBtn) viewListBtn.replaceWith(viewListBtn.cloneNode(true));

    if (this.container) {
      this.container.innerHTML = '';
    }

    this.cmsImages.forEach(media => {
      if (media && media.tagName === 'VIDEO') {
        try {
          media.pause();
          media.src = '';
          media.load();
        } catch (e) {}
      }
    });

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

// ===================================================================
// INITIALIZATION
// ===================================================================
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  window.gallery = new GlobeGallery(container);
});
