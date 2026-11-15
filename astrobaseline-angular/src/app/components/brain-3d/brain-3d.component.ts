import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { NeuroSleepService } from '../../core/services/neuro-sleep.service';

@Component({
  selector: 'app-brain-3d',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="brain-viewer-wrapper">
      <!-- Canvas 3D de WebGL con Three.js -->
      <div #canvasContainer class="canvas-container"></div>

      <!-- Superposición de Telemetría Neuronal en Tiempo Real -->
      <div class="viewer-overlay-card">
        <div class="pulse-indicator">
          <span class="pulse-dot" [style.background-color]="activeColor()"></span>
          <span class="pulse-text">
            Frecuencia Sináptica: <strong>{{ neuroService.liveLpm() }} BPM</strong>
          </span>
        </div>
        <span class="rot-hint">🔄 Arrastra para rotar en 3D</span>
      </div>

      <!-- Leyenda de Zonas Cerebrales Iluminadas -->
      <div class="zones-legend-bar">
        @for (zone of neuroService.brainZones(); track zone.id) {
          <div
            class="zone-tag"
            [class.active]="zone.activationLevel > 50"
            [style.--zone-color]="zone.colorHex"
            (mouseenter)="highlightZone(zone.id)"
            (mouseleave)="unhighlightZone()"
          >
            <span class="zone-dot" [style.background-color]="zone.colorHex"></span>
            <span class="zone-name">{{ zone.name }}</span>
            <span class="zone-pct">{{ zone.activationLevel }}%</span>
          </div>
        }
      </div>

      <!-- Botón para recentrar la cámara -->
      <button class="reset-cam-btn" (click)="resetCamera()" title="Recentrar vista">
        🎯 Recentrar
      </button>
    </div>
  `,
  styles: [`
    .brain-viewer-wrapper {
      position: relative;
      width: 100%;
      height: 380px;
      background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(51, 65, 85, 0.6);
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
      user-select: none;
    }

    .canvas-container {
      width: 100%;
      height: 100%;
      cursor: grab;
      touch-action: none;
      &:active {
        cursor: grabbing;
      }
    }

    .viewer-overlay-card {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid rgba(148, 163, 184, 0.2);
      display: flex;
      align-items: center;
      gap: 12px;
      pointer-events: none;

      .pulse-indicator {
        display: flex;
        align-items: center;
        gap: 6px;

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          box-shadow: 0 0 8px currentColor;
          animation: heartPulse 1s infinite alternate;
        }

        .pulse-text {
          font-size: 0.75rem;
          color: #e2e8f0;
          font-weight: 500;
          strong {
            color: #ffffff;
            font-weight: 700;
          }
        }
      }

      .rot-hint {
        font-size: 0.68rem;
        color: #94a3b8;
        border-left: 1px solid rgba(148, 163, 184, 0.3);
        padding-left: 8px;
      }
    }

    .zones-legend-bar {
      position: absolute;
      bottom: 12px;
      left: 12px;
      right: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
      pointer-events: auto;

      .zone-tag {
        background: rgba(15, 23, 42, 0.78);
        backdrop-filter: blur(6px);
        border: 1px solid rgba(148, 163, 184, 0.2);
        padding: 3px 8px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.68rem;
        color: #cbd5e1;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover, &.active {
          border-color: var(--zone-color);
          background: rgba(30, 41, 59, 0.9);
          transform: translateY(-1px);
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
        }

        .zone-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .zone-name {
          font-weight: 600;
        }

        .zone-pct {
          font-weight: 800;
          color: var(--zone-color);
        }
      }
    }

    .reset-cam-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.25);
      color: #94a3b8;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 14px;
      cursor: pointer;
      backdrop-filter: blur(8px);
      transition: all 0.2s ease;

      &:hover {
        background: rgba(30, 41, 59, 0.95);
        color: #ffffff;
        border-color: #38bdf8;
      }
    }

    @keyframes heartPulse {
      0% {
        transform: scale(0.9);
        opacity: 0.8;
      }
      100% {
        transform: scale(1.3);
        opacity: 1;
      }
    }
  `],
})
export class Brain3dComponent implements OnInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  readonly neuroService = inject(NeuroSleepService);

  readonly activeColor = computed(() => this.neuroService.activeCase().severityColor);

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;

  // Objetos y grupos 3D
  private brainGroup!: THREE.Group;
  private lobes: { id: string; mesh: THREE.Mesh; material: THREE.MeshStandardMaterial; baseColor: THREE.Color }[] = [];
  private particlesMesh!: THREE.Points;
  private haloMesh!: THREE.Mesh;

  // Control de arrastre e interactividad
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private targetRotation = { x: 0.2, y: 0.4 };
  private currentRotation = { x: 0.2, y: 0.4 };

  constructor() {
    // Reaccionar a cambios de estado para actualizar colores y destellos
    effect(() => {
      const stateId = this.neuroService.activeStateId();
      this.updateBrainColors(stateId);
    });
  }

  ngOnInit(): void {
    this.initThree();
    this.createBrainModel();
    this.createNeuralNetworkParticles();
    this.createAtmosphereHalo();
    this.setupEventListeners();
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initThree(): void {
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 380;

    // Escena
    this.scene = new THREE.Scene();

    // Cámara perspectiva
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 7.5);

    // Renderizador con antialias
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 8, 5);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.7);
    dirLight2.position.set(-5, -5, -3);
    this.scene.add(dirLight2);

    // Grupo contenedor del cerebro
    this.brainGroup = new THREE.Group();
    this.brainGroup.rotation.x = this.currentRotation.x;
    this.brainGroup.rotation.y = this.currentRotation.y;
    this.scene.add(this.brainGroup);
  }

  // Modelado 3D anatómico del encéfalo humano
  private createBrainModel(): void {
    const lobeDefinitions = [
      // 1. Corteza Prefrontal / Frontal (Izquierda y Derecha)
      { id: 'prefrontal', pos: new THREE.Vector3(-0.75, 0.45, 1.1), scale: new THREE.Vector3(1.1, 0.95, 1.15), baseColor: 0x38bdf8 },
      { id: 'prefrontal', pos: new THREE.Vector3(0.75, 0.45, 1.1), scale: new THREE.Vector3(1.1, 0.95, 1.15), baseColor: 0x38bdf8 },

      // 2. Lóbulo Parietal (Superior posterior)
      { id: 'parietal', pos: new THREE.Vector3(-0.85, 0.75, -0.2), scale: new THREE.Vector3(1.15, 1.05, 1.2), baseColor: 0x60a5fa },
      { id: 'parietal', pos: new THREE.Vector3(0.85, 0.75, -0.2), scale: new THREE.Vector3(1.15, 1.05, 1.2), baseColor: 0x60a5fa },

      // 3. Lóbulo Occipital (Posterior)
      { id: 'occipital', pos: new THREE.Vector3(-0.65, 0.1, -1.35), scale: new THREE.Vector3(0.9, 0.85, 0.95), baseColor: 0x818cf8 },
      { id: 'occipital', pos: new THREE.Vector3(0.65, 0.1, -1.35), scale: new THREE.Vector3(0.9, 0.85, 0.95), baseColor: 0x818cf8 },

      // 4. Lóbulo Temporal & Corteza Insular (Lateral medial)
      { id: 'insula', pos: new THREE.Vector3(-1.3, -0.2, 0.25), scale: new THREE.Vector3(0.85, 0.75, 1.1), baseColor: 0x22d3ee },
      { id: 'insula', pos: new THREE.Vector3(1.3, -0.2, 0.25), scale: new THREE.Vector3(0.85, 0.75, 1.1), baseColor: 0x22d3ee },

      // 5. Complejo Amigdalino & Hipocampo (Núcleo Límbico Profundo)
      { id: 'amygdala', pos: new THREE.Vector3(-0.55, -0.35, 0.5), scale: new THREE.Vector3(0.55, 0.5, 0.65), baseColor: 0x34d399 },
      { id: 'amygdala', pos: new THREE.Vector3(0.55, -0.35, 0.5), scale: new THREE.Vector3(0.55, 0.5, 0.65), baseColor: 0x34d399 },
      { id: 'hippocampus', pos: new THREE.Vector3(-0.5, -0.45, -0.2), scale: new THREE.Vector3(0.5, 0.45, 0.8), baseColor: 0x10b981 },
      { id: 'hippocampus', pos: new THREE.Vector3(0.5, -0.45, -0.2), scale: new THREE.Vector3(0.5, 0.45, 0.8), baseColor: 0x10b981 },

      // 6. Tronco Encefálico & Cerebelo (Base inferior)
      { id: 'brainstem', pos: new THREE.Vector3(0, -1.15, -0.3), scale: new THREE.Vector3(0.55, 1.25, 0.55), baseColor: 0x60a5fa },
      { id: 'cerebellum', pos: new THREE.Vector3(-0.7, -0.85, -1.1), scale: new THREE.Vector3(0.8, 0.65, 0.75), baseColor: 0x64748b },
      { id: 'cerebellum', pos: new THREE.Vector3(0.7, -0.85, -1.1), scale: new THREE.Vector3(0.8, 0.65, 0.75), baseColor: 0x64748b },
    ];

    lobeDefinitions.forEach((def) => {
      // Geometría con deformación orgánica simulando surcos corticales
      const geom = new THREE.SphereGeometry(1, 24, 20);
      geom.scale(def.scale.x, def.scale.y, def.scale.z);

      const color = new THREE.Color(def.baseColor);
      const mat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.35,
        roughness: 0.35,
        metalness: 0.15,
        wireframe: false,
        transparent: true,
        opacity: 0.88,
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(def.pos);
      this.brainGroup.add(mesh);

      this.lobes.push({
        id: def.id,
        mesh,
        material: mat,
        baseColor: color,
      });
    });
  }

  // Red de partículas y sinapsis interconectadas
  private createNeuralNetworkParticles(): void {
    const particleCount = 280;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Dispersión dentro del volumen elipsoidal del cerebro
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 1.3 + Math.random() * 0.9;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta) * 1.35;
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 1.05;
      positions[i * 3 + 2] = radius * Math.cos(phi) * 1.45;

      colors[i * 3] = 0.2;
      colors[i * 3 + 1] = 0.7;
      colors[i * 3 + 2] = 0.95;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    this.particlesMesh = new THREE.Points(geometry, material);
    this.brainGroup.add(this.particlesMesh);
  }

  // Halo atmosférico y resplandor exterior
  private createAtmosphereHalo(): void {
    const haloGeom = new THREE.SphereGeometry(2.35, 28, 28);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.09,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    this.haloMesh = new THREE.Mesh(haloGeom, haloMat);
    this.brainGroup.add(this.haloMesh);
  }

  // Actualizar colores y respuesta lumínica del cerebro según el caso
  private updateBrainColors(stateId: string): void {
    if (!this.lobes || this.lobes.length === 0) return;

    if (stateId === 'REPAIR_SLEEP') {
      // Verde / Esmeralda / Cyan pacífico
      this.lobes.forEach((l) => {
        if (l.id === 'hippocampus') {
          l.material.color.setHex(0x10b981);
          l.material.emissive.setHex(0x10b981);
          l.material.emissiveIntensity = 0.75;
          l.material.opacity = 0.95;
        } else if (l.id === 'prefrontal') {
          l.material.color.setHex(0x38bdf8);
          l.material.emissive.setHex(0x38bdf8);
          l.material.emissiveIntensity = 0.35;
          l.material.opacity = 0.85;
        } else {
          l.material.color.setHex(0x60a5fa);
          l.material.emissive.setHex(0x3b82f6);
          l.material.emissiveIntensity = 0.25;
          l.material.opacity = 0.78;
        }
      });
      if (this.haloMesh) {
        (this.haloMesh.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
        (this.haloMesh.material as THREE.MeshBasicMaterial).opacity = 0.12;
      }
    } else if (stateId === 'ANXIETY') {
      // Ámbar / Amarillo con foco en Amígdala e Ínsula
      this.lobes.forEach((l) => {
        if (l.id === 'amygdala' || l.id === 'insula') {
          l.material.color.setHex(0xf59e0b);
          l.material.emissive.setHex(0xf59e0b);
          l.material.emissiveIntensity = 0.95;
          l.material.opacity = 0.98;
        } else if (l.id === 'brainstem') {
          l.material.color.setHex(0xfbbf24);
          l.material.emissive.setHex(0xfbbf24);
          l.material.emissiveIntensity = 0.65;
          l.material.opacity = 0.88;
        } else {
          l.material.color.setHex(0x64748b);
          l.material.emissive.setHex(0x475569);
          l.material.emissiveIntensity = 0.25;
          l.material.opacity = 0.75;
        }
      });
      if (this.haloMesh) {
        (this.haloMesh.material as THREE.MeshBasicMaterial).color.setHex(0xf59e0b);
        (this.haloMesh.material as THREE.MeshBasicMaterial).opacity = 0.18;
      }
    } else if (stateId === 'PANIC') {
      // Naranja Fuego en núcleo límbico y tronco encefálico
      this.lobes.forEach((l) => {
        if (l.id === 'amygdala') {
          l.material.color.setHex(0xf97316);
          l.material.emissive.setHex(0xea580c);
          l.material.emissiveIntensity = 1.25;
          l.material.opacity = 1.0;
        } else if (l.id === 'insula' || l.id === 'brainstem') {
          l.material.color.setHex(0xfb923c);
          l.material.emissive.setHex(0xf97316);
          l.material.emissiveIntensity = 0.9;
          l.material.opacity = 0.95;
        } else {
          l.material.color.setHex(0x475569);
          l.material.emissive.setHex(0x334155);
          l.material.emissiveIntensity = 0.2;
          l.material.opacity = 0.7;
        }
      });
      if (this.haloMesh) {
        (this.haloMesh.material as THREE.MeshBasicMaterial).color.setHex(0xf97316);
        (this.haloMesh.material as THREE.MeshBasicMaterial).opacity = 0.25;
      }
    } else {
      // PSYCHOSIS: Rojo carmesí de emergencia y corteza prefrontal apagada (desconexión)
      this.lobes.forEach((l) => {
        if (l.id === 'prefrontal') {
          // Desconexión prefrontal
          l.material.color.setHex(0x1e293b);
          l.material.emissive.setHex(0x0f172a);
          l.material.emissiveIntensity = 0.05;
          l.material.opacity = 0.55;
        } else if (l.id === 'amygdala' || l.id === 'brainstem') {
          // Fuego límbico descontrolado
          l.material.color.setHex(0xef4444);
          l.material.emissive.setHex(0xdc2626);
          l.material.emissiveIntensity = 1.45;
          l.material.opacity = 1.0;
        } else {
          l.material.color.setHex(0x991b1b);
          l.material.emissive.setHex(0x7f1d1d);
          l.material.emissiveIntensity = 0.55;
          l.material.opacity = 0.82;
        }
      });
      if (this.haloMesh) {
        (this.haloMesh.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
        (this.haloMesh.material as THREE.MeshBasicMaterial).opacity = 0.35;
      }
    }
  }

  // Resaltado al pasar el cursor sobre la leyenda
  highlightZone(zoneId: string): void {
    this.lobes.forEach((l) => {
      if (l.id === zoneId) {
        l.material.emissiveIntensity = 1.5;
        l.mesh.scale.multiplyScalar(1.08);
      } else {
        l.material.opacity = 0.4;
      }
    });
  }

  unhighlightZone(): void {
    const stateId = this.neuroService.activeStateId();
    this.lobes.forEach((l) => {
      l.mesh.scale.set(1, 1, 1);
    });
    this.createBrainModelScaleReset();
    this.updateBrainColors(stateId);
  }

  private createBrainModelScaleReset(): void {
    const scales: Record<string, THREE.Vector3> = {
      prefrontal: new THREE.Vector3(1.1, 0.95, 1.15),
      parietal: new THREE.Vector3(1.15, 1.05, 1.2),
      occipital: new THREE.Vector3(0.9, 0.85, 0.95),
      insula: new THREE.Vector3(0.85, 0.75, 1.1),
      amygdala: new THREE.Vector3(0.55, 0.5, 0.65),
      hippocampus: new THREE.Vector3(0.5, 0.45, 0.8),
      brainstem: new THREE.Vector3(0.55, 1.25, 0.55),
      cerebellum: new THREE.Vector3(0.8, 0.65, 0.75),
    };
    this.lobes.forEach((l) => {
      if (scales[l.id]) {
        l.mesh.scale.copy(scales[l.id]);
      }
    });
  }

  resetCamera(): void {
    this.targetRotation = { x: 0.2, y: 0.4 };
  }

  // Interacción de rotación por ratón y toque
  private setupEventListeners(): void {
    const el = this.containerRef.nativeElement;

    el.addEventListener('mousedown', (e: MouseEvent) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.targetRotation.y += deltaX * 0.008;
      this.targetRotation.x += deltaY * 0.008;

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Touch
    el.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length > 0) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e: TouchEvent) => {
      if (!this.isDragging || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
      const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

      this.targetRotation.y += deltaX * 0.01;
      this.targetRotation.x += deltaY * 0.01;

      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  // Bucle de animación continua WebGL
  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Suavizado de rotación inercial
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;

    if (!this.isDragging) {
      // Rotación suave automática lenta para exhibición
      this.targetRotation.y += 0.0025;
    }

    this.brainGroup.rotation.x = this.currentRotation.x;
    this.brainGroup.rotation.y = this.currentRotation.y;

    // Pulso sináptico sincronizado con los LPM actuales
    const lpm = this.neuroService.liveLpm();
    const frequency = (lpm / 60) * Math.PI * 2;
    const time = performance.now() * 0.001;
    const pulse = 0.5 + 0.5 * Math.sin(time * frequency);

    // Ondulación de partículas
    if (this.particlesMesh) {
      this.particlesMesh.rotation.y = time * 0.15;
      const pMat = this.particlesMesh.material as THREE.PointsMaterial;
      pMat.size = 0.07 + pulse * 0.04;
    }

    this.renderer.render(this.scene, this.camera);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!this.containerRef || !this.renderer || !this.camera) return;
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
