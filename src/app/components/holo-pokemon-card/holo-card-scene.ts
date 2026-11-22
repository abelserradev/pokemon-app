import type {
  Group,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Texture,
  WebGLRenderer,
  MeshBasicMaterial,
} from 'three';

export interface HoloCardSceneOptions {
  canvas: HTMLCanvasElement;
  artworkUrl: string;
  reducedMotion: boolean;
  onReady?: () => void;
  onError?: (message: string) => void;
}

interface PointerNorm {
  x: number;
  y: number;
}

/**
 * Three.js TCG-style holographic card: front foil plane + physical thickness group.
 * Lazy-loads `three` so only /equipo pays the bundle cost.
 * Rest pose + foil tuned so a static screenshot still reads as 3D/holo.
 */
export class HoloCardScene {
  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private cardGroup: Group | null = null;
  private frontMesh: Mesh | null = null;
  private backMesh: Mesh | null = null;
  private edgeMeshes: Mesh[] = [];
  private geometry: PlaneGeometry | null = null;
  private material: ShaderMaterial | null = null;
  private backMaterial: MeshBasicMaterial | null = null;
  private edgeMaterial: MeshBasicMaterial | null = null;
  private texture: Texture | null = null;
  private rafId = 0;
  private disposed = false;
  private reducedMotion: boolean;
  private pointer: PointerNorm = { x: 0, y: 0 };
  private pointerTilt = { x: 0, y: 0 };
  private currentTilt = { x: 0, y: 0 };
  private startMs = 0;
  private readonly canvas: HTMLCanvasElement;
  private readonly artworkUrl: string;
  private readonly onReady?: () => void;
  private readonly onError?: (message: string) => void;
  private resizeObserver: ResizeObserver | null = null;
  private boundPointerMove = (e: PointerEvent): void => this.onPointerMove(e);
  private boundPointerLeave = (): void => this.onPointerLeave();

  // Aggressive rest pose — parallelogram silhouette is visible without hovering
  private readonly restTilt = { x: 0.28, y: -0.42 };

  constructor(opts: HoloCardSceneOptions) {
    this.canvas = opts.canvas;
    this.artworkUrl = opts.artworkUrl;
    this.reducedMotion = opts.reducedMotion;
    this.onReady = opts.onReady;
    this.onError = opts.onError;
    this.currentTilt = { ...this.restTilt };
    this.pointerTilt = { ...this.restTilt };
  }

  async mount(): Promise<void> {
    if (!this.artworkUrl) {
      this.onError?.('Sin imagen disponible');
      return;
    }

    try {
      const THREE = await import('three');
      if (this.disposed) {
        return;
      }

      const width = this.canvas.clientWidth || 280;
      const height = this.canvas.clientHeight || 390;

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(width, height, false);
      this.renderer.setClearColor(0x000000, 0);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 20);
      this.camera.position.set(0.42, 0.22, 2.55);

      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');

      this.texture = await new Promise<Texture>((resolve, reject) => {
        loader.load(
          this.artworkUrl,
          (tex) => resolve(tex),
          undefined,
          () => reject(new Error('No se pudo cargar el artwork')),
        );
      });

      if (this.disposed) {
        this.texture.dispose();
        this.texture = null;
        return;
      }

      this.texture.colorSpace = THREE.SRGBColorSpace;
      this.texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

      const cardW = 1.55;
      const cardH = 2.15;
      const thickness = 0.09;
      this.geometry = new THREE.PlaneGeometry(cardW, cardH, 1, 1);

      this.material = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          uMap: { value: this.texture },
          uTime: { value: 0 },
          uPointer: { value: new THREE.Vector2(0, 0) },
          uReduced: { value: this.reducedMotion ? 1 : 0 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vUv = uv;
            vec4 world = modelMatrix * vec4(position, 1.0);
            vNormal = normalize(mat3(modelMatrix) * normal);
            vView = normalize(cameraPosition - world.xyz);
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          uniform float uTime;
          uniform vec2 uPointer;
          uniform float uReduced;
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vView;

          vec3 foilColor(float t) {
            float band = fract(t);
            // Saturated iridescence — screenshot-readable rainbow
            vec3 c0 = vec3(1.00, 0.15, 0.55);
            vec3 c1 = vec3(1.00, 0.78, 0.08);
            vec3 c2 = vec3(0.12, 0.98, 0.42);
            vec3 c3 = vec3(0.08, 0.72, 1.00);
            vec3 c4 = vec3(0.72, 0.22, 1.00);
            if (band < 0.2) return mix(c0, c1, band / 0.2);
            if (band < 0.4) return mix(c1, c2, (band - 0.2) / 0.2);
            if (band < 0.6) return mix(c2, c3, (band - 0.4) / 0.2);
            if (band < 0.8) return mix(c3, c4, (band - 0.6) / 0.2);
            return mix(c4, c0, (band - 0.8) / 0.2);
          }

          void main() {
            vec4 art = texture2D(uMap, vUv);
            float plate = smoothstep(0.012, 0.04, vUv.x) * smoothstep(0.012, 0.04, 1.0 - vUv.x)
              * smoothstep(0.012, 0.04, vUv.y) * smoothstep(0.012, 0.04, 1.0 - vUv.y);
            vec3 base = mix(vec3(0.06, 0.07, 0.1), art.rgb, art.a);
            float luma = dot(base, vec3(0.299, 0.587, 0.114));

            vec3 N = normalize(vNormal);
            vec3 V = normalize(vView);
            float fresnel = pow(1.0 - max(dot(N, V), 0.0), 1.45);

            float shimmerSpeed = mix(0.28, 1.05, 1.0 - uReduced);
            float wave = vUv.x * 6.2 + vUv.y * 4.1
              + uPointer.x * 2.1 - uPointer.y * 1.7
              + uTime * shimmerSpeed;
            float micro = sin((vUv.x * 36.0 - vUv.y * 22.0) + uTime * shimmerSpeed * 2.2);

            // Sharp foil ribbons (not soft wash)
            float ribbon = pow(0.5 + 0.5 * sin(wave * 6.28318), 0.42);
            float spark = pow(0.5 + 0.5 * micro, 4.0);

            vec3 foil = foilColor(wave);
            vec3 foilHot = foilColor(wave + 0.22);

            // Stronger on dark art / edges; character stays more readable
            float darkBias = mix(1.15, 0.55, smoothstep(0.25, 0.78, luma));
            float baseSheen = mix(0.48, 0.72, 1.0 - uReduced);
            float foilMix = (mix(baseSheen, 1.05, fresnel) * darkBias) * plate;
            foilMix *= mix(0.7, 1.35, ribbon);

            vec3 color = base + mix(foil, foilHot, spark) * foilMix;
            color += foilHot * spark * mix(0.22, 0.55, 1.0 - uReduced) * plate;

            float spec = pow(
              max(dot(N, normalize(V + vec3(uPointer.x * 0.85 + 0.25, uPointer.y * 0.65 + 0.15, 1.1))), 0.0),
              22.0
            );
            color += vec3(1.0, 0.97, 0.9) * spec * mix(0.45, 0.95, 1.0 - uReduced) * plate;

            float rim = smoothstep(0.0, 0.09, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
            color *= mix(0.42, 1.0, rim);

            gl_FragColor = vec4(color, max(art.a, 0.95) * plate);
          }
        `,
      });

      this.cardGroup = new THREE.Group();
      this.frontMesh = new THREE.Mesh(this.geometry, this.material);
      this.frontMesh.position.z = thickness * 0.5;
      this.cardGroup.add(this.frontMesh);

      // Opaque back + gold-ish edges so tilt reveals physical card depth
      this.backMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1520 });
      this.backMesh = new THREE.Mesh(this.geometry, this.backMaterial);
      this.backMesh.rotation.y = Math.PI;
      this.backMesh.position.z = -thickness * 0.5;
      this.cardGroup.add(this.backMesh);

      this.edgeMaterial = new THREE.MeshBasicMaterial({ color: 0xc9a24a });
      const edgeGeoH = new THREE.PlaneGeometry(cardW, thickness);
      const edgeGeoV = new THREE.PlaneGeometry(thickness, cardH);
      const edges: Array<{
        geo: InstanceType<typeof THREE.PlaneGeometry>;
        pos: [number, number, number];
        rot: [number, number, number];
      }> = [
        { geo: edgeGeoH, pos: [0, cardH / 2, 0], rot: [-Math.PI / 2, 0, 0] },
        {
          geo: edgeGeoH.clone(),
          pos: [0, -cardH / 2, 0],
          rot: [Math.PI / 2, 0, 0],
        },
        { geo: edgeGeoV, pos: [-cardW / 2, 0, 0], rot: [0, Math.PI / 2, 0] },
        {
          geo: edgeGeoV.clone(),
          pos: [cardW / 2, 0, 0],
          rot: [0, -Math.PI / 2, 0],
        },
      ];
      for (const e of edges) {
        const mesh = new THREE.Mesh(e.geo, this.edgeMaterial);
        mesh.position.set(...e.pos);
        mesh.rotation.set(...e.rot);
        this.edgeMeshes.push(mesh);
        this.cardGroup.add(mesh);
      }

      this.cardGroup.rotation.x = this.restTilt.x;
      this.cardGroup.rotation.y = this.restTilt.y;
      this.scene.add(this.cardGroup);

      this.canvas.addEventListener('pointermove', this.boundPointerMove);
      this.canvas.addEventListener('pointerleave', this.boundPointerLeave);
      this.canvas.style.touchAction = 'none';

      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.canvas.parentElement || this.canvas);

      this.startMs = performance.now();
      this.onReady?.();
      this.tick();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error al inicializar la carta 3D';
      this.onError?.(msg);
      this.dispose();
    }
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
    if (this.material) {
      this.material.uniforms['uReduced'].value = value ? 1 : 0;
    }
  }

  async updateArtwork(url: string): Promise<void> {
    if (!url || !this.material || this.disposed) {
      return;
    }
    const THREE = await import('three');
    if (this.disposed) {
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const next = await new Promise<Texture>((resolve, reject) => {
      loader.load(url, resolve, undefined, () => reject(new Error('artwork')));
    }).catch(() => null);

    if (!next || this.disposed) {
      next?.dispose();
      return;
    }
    next.colorSpace = THREE.SRGBColorSpace;
    this.texture?.dispose();
    this.texture = next;
    this.material.uniforms['uMap'].value = next;
  }

  dispose(): void {
    this.disposed = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.canvas.removeEventListener('pointermove', this.boundPointerMove);
    this.canvas.removeEventListener('pointerleave', this.boundPointerLeave);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    for (const m of this.edgeMeshes) {
      m.geometry.dispose();
      if (this.cardGroup) {
        this.cardGroup.remove(m);
      }
    }
    this.edgeMeshes = [];

    this.geometry?.dispose();
    this.geometry = null;
    this.material?.dispose();
    this.material = null;
    this.backMaterial?.dispose();
    this.backMaterial = null;
    this.edgeMaterial?.dispose();
    this.edgeMaterial = null;
    this.texture?.dispose();
    this.texture = null;

    if (this.cardGroup && this.scene) {
      this.scene.remove(this.cardGroup);
    }
    this.frontMesh = null;
    this.backMesh = null;
    this.cardGroup = null;
    this.scene = null;
    this.camera = null;

    this.renderer?.dispose();
    this.renderer?.forceContextLoss?.();
    this.renderer = null;
  }

  private onPointerMove(e: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    this.pointer = { x: nx, y: ny };
    const intensity = this.reducedMotion ? 0.28 : 0.62;
    this.pointerTilt = {
      x: this.restTilt.x + ny * intensity,
      y: this.restTilt.y + nx * intensity,
    };
  }

  private onPointerLeave(): void {
    this.pointer = { x: 0, y: 0 };
    this.pointerTilt = { ...this.restTilt };
  }

  private resize(): void {
    if (!this.renderer || !this.camera) {
      return;
    }
    const width = this.canvas.clientWidth || 280;
    const height = this.canvas.clientHeight || 390;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private tick = (): void => {
    if (
      this.disposed ||
      !this.renderer ||
      !this.scene ||
      !this.camera ||
      !this.cardGroup
    ) {
      return;
    }

    const elapsed = (performance.now() - this.startMs) / 1000;
    const idleX = this.reducedMotion ? 0 : Math.sin(elapsed * 0.9) * 0.1;
    const idleY = this.reducedMotion ? 0 : Math.cos(elapsed * 0.7) * 0.13;
    const targetX = this.pointerTilt.x + idleX;
    const targetY = this.pointerTilt.y + idleY;

    const lerp = this.reducedMotion ? 0.22 : 0.11;
    this.currentTilt.x += (targetX - this.currentTilt.x) * lerp;
    this.currentTilt.y += (targetY - this.currentTilt.y) * lerp;

    this.cardGroup.rotation.x = this.currentTilt.x;
    this.cardGroup.rotation.y = this.currentTilt.y;

    if (this.material) {
      this.material.uniforms['uTime'].value = elapsed;
      this.material.uniforms['uPointer'].value.set(
        this.pointer.x,
        this.pointer.y,
      );
    }

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this.tick);
  };
}
