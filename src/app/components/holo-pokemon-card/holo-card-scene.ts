import type {
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Texture,
  WebGLRenderer
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
 * Three.js TCG-style holographic card: artwork plane + foil shimmer shader.
 * Lazy-loads `three` so only /equipo pays the bundle cost.
 */
export class HoloCardScene {
  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private cardMesh: Mesh | null = null;
  private geometry: PlaneGeometry | null = null;
  private material: ShaderMaterial | null = null;
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

  constructor(opts: HoloCardSceneOptions) {
    this.canvas = opts.canvas;
    this.artworkUrl = opts.artworkUrl;
    this.reducedMotion = opts.reducedMotion;
    this.onReady = opts.onReady;
    this.onError = opts.onError;
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
        powerPreference: 'high-performance'
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(width, height, false);
      this.renderer.setClearColor(0x000000, 0);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 20);
      this.camera.position.z = 3.2;

      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');

      this.texture = await new Promise<Texture>((resolve, reject) => {
        loader.load(
          this.artworkUrl,
          (tex) => resolve(tex),
          undefined,
          () => reject(new Error('No se pudo cargar el artwork'))
        );
      });

      if (this.disposed) {
        this.texture.dispose();
        this.texture = null;
        return;
      }

      this.texture.colorSpace = THREE.SRGBColorSpace;
      this.texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

      // TCG portrait ratio ~2.5:3.5
      const cardW = 1.55;
      const cardH = 2.15;
      this.geometry = new THREE.PlaneGeometry(cardW, cardH, 1, 1);

      this.material = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          uMap: { value: this.texture },
          uTime: { value: 0 },
          uPointer: { value: new THREE.Vector2(0, 0) },
          uReduced: { value: this.reducedMotion ? 1 : 0 }
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

          // Soft metallic foil — gold/teal, not purple mush
          vec3 foilColor(float t) {
            float band = fract(t);
            vec3 gold = vec3(0.95, 0.78, 0.28);
            vec3 teal = vec3(0.25, 0.72, 0.78);
            vec3 cream = vec3(0.98, 0.94, 0.86);
            if (band < 0.33) return mix(gold, teal, band / 0.33);
            if (band < 0.66) return mix(teal, cream, (band - 0.33) / 0.33);
            return mix(cream, gold, (band - 0.66) / 0.34);
          }

          void main() {
            vec4 art = texture2D(uMap, vUv);
            // Letterbox artwork inside a dark card plate
            float plate = smoothstep(0.02, 0.05, vUv.x) * smoothstep(0.02, 0.05, 1.0 - vUv.x)
              * smoothstep(0.02, 0.05, vUv.y) * smoothstep(0.02, 0.05, 1.0 - vUv.y);
            vec3 base = mix(vec3(0.08, 0.09, 0.12), art.rgb, art.a);

            float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.2);
            float shimmerSpeed = mix(0.15, 0.55, 1.0 - uReduced);
            float wave = vUv.x * 3.2 + vUv.y * 2.1
              + uPointer.x * 0.8 - uPointer.y * 0.6
              + uTime * shimmerSpeed;
            vec3 foil = foilColor(wave);
            float foilMix = mix(0.12, 0.42, fresnel) * (1.0 - uReduced * 0.65);
            foilMix *= plate;

            vec3 color = base + foil * foilMix;
            // Soft edge rim
            float rim = smoothstep(0.0, 0.08, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
            color *= mix(0.55, 1.0, rim);

            gl_FragColor = vec4(color, max(art.a, 0.92) * plate);
          }
        `
      });

      this.cardMesh = new THREE.Mesh(this.geometry, this.material);
      this.scene.add(this.cardMesh);

      this.canvas.addEventListener('pointermove', this.boundPointerMove);
      this.canvas.addEventListener('pointerleave', this.boundPointerLeave);
      this.canvas.style.touchAction = 'none';

      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.canvas.parentElement || this.canvas);

      this.startMs = performance.now();
      this.onReady?.();
      this.tick();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al inicializar la carta 3D';
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

    this.geometry?.dispose();
    this.geometry = null;
    this.material?.dispose();
    this.material = null;
    this.texture?.dispose();
    this.texture = null;

    if (this.cardMesh && this.scene) {
      this.scene.remove(this.cardMesh);
    }
    this.cardMesh = null;
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
    const intensity = this.reducedMotion ? 0.12 : 0.28;
    this.pointerTilt = { x: ny * intensity, y: nx * intensity };
  }

  private onPointerLeave(): void {
    this.pointer = { x: 0, y: 0 };
    this.pointerTilt = { x: 0, y: 0 };
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
    if (this.disposed || !this.renderer || !this.scene || !this.camera || !this.cardMesh) {
      return;
    }

    const elapsed = (performance.now() - this.startMs) / 1000;
    const idleX = this.reducedMotion ? 0 : Math.sin(elapsed * 0.7) * 0.045;
    const idleY = this.reducedMotion ? 0 : Math.cos(elapsed * 0.55) * 0.055;
    const targetX = this.pointerTilt.x + idleX;
    const targetY = this.pointerTilt.y + idleY;

    const lerp = this.reducedMotion ? 0.2 : 0.08;
    this.currentTilt.x += (targetX - this.currentTilt.x) * lerp;
    this.currentTilt.y += (targetY - this.currentTilt.y) * lerp;

    this.cardMesh.rotation.x = this.currentTilt.x;
    this.cardMesh.rotation.y = this.currentTilt.y;

    if (this.material) {
      this.material.uniforms['uTime'].value = elapsed;
      this.material.uniforms['uPointer'].value.set(this.pointer.x, this.pointer.y);
    }

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this.tick);
  };
}
