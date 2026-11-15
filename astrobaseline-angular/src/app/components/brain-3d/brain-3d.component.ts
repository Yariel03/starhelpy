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
    <div
      class="brain-viewer-wrapper"
      [class.fullscreen-mode]="isFullscreen()"
    >
      <!-- Canvas 3D de WebGL con Three.js -->
      <div #canvasContainer class="canvas-container"></div>

      <!-- Superposición Superior Izquierda: Telemetría Neuronal en Tiempo Real -->
      <div class="viewer-overlay-card">
        <div class="pulse-indicator">
          <span class="pulse-dot" [style.background-color]="activeColor()"></span>
          <span class="pulse-text">
            Frecuencia Sináptica: <strong>{{ neuroService.liveLpm() }} BPM</strong>
          </span>
        </div>
        <span class="rot-hint">🔄 Rotación 360° orbital</span>
      </div>

      <!-- Barra de Acciones Superiores Derechas: ¿Qué es el %?, Zoom y Maximizar -->
      <div class="viewer-top-actions">
        <button
          class="ctrl-btn info-btn"
          (click)="togglePctGuide()"
          title="Ver qué significa el porcentaje de activación"
        >
          ℹ️ ¿Qué es el %?
        </button>
        <button
          class="ctrl-btn zoom-btn"
          (click)="zoomIn()"
          title="Acercar modelo 3D (+)"
        >
          🔍+
        </button>
        <button
          class="ctrl-btn zoom-btn"
          (click)="zoomOut()"
          title="Alejar modelo 3D (-)"
        >
          🔍-
        </button>
        <button
          class="ctrl-btn reset-cam-btn"
          (click)="resetCamera()"
          title="Recentrar vista orbital"
        >
          🎯 Recentrar
        </button>
        <button
          class="ctrl-btn max-btn"
          (click)="toggleFullscreen()"
          [title]="isFullscreen() ? 'Minimizar a vista normal (Esc)' : 'Maximizar a pantalla completa'"
        >
          {{ isFullscreen() ? '✕ Minimizar' : '⛶ Maximizar 3D' }}
        </button>
      </div>

      <!-- GUÍA CLÍNICA EMERGENTE: ¿QUÉ SIGNIFICA EL %? -->
      @if (showPctGuide()) {
        <div class="pct-guide-overlay" (click)="togglePctGuide()">
          <div class="pct-guide-card" (click)="$event.stopPropagation()">
            <div class="guide-header">
              <div class="guide-title-row">
                <span class="guide-badge-icon">📊</span>
                <div>
                  <h5>Significado Clínico del % de Activación Encefálica</h5>
                  <p class="guide-sub">Telemetría Biomédica BOLD (Blood-Oxygen-Level-Dependent) & fNIRS</p>
                </div>
              </div>
              <button class="close-guide-btn" (click)="togglePctGuide()">✕</button>
            </div>

            <p class="guide-main-desc">
              El porcentaje mide el <strong>consumo de oxígeno y tasa metabólica de glucosa</strong> de cada estructura cerebral <strong>en relación a la Línea Base Terrestre en Reposo (1g pre-vuelo)</strong>:
            </p>

            <div class="scale-tiers-grid">
              <div class="tier-card tier-green">
                <div class="tier-top">
                  <span class="tier-pct">0% — 30%</span>
                  <span class="tier-name">Reposo / Tono Parasimpático</span>
                </div>
                <p>Nivel basal atenuado. Típico durante sueño profundo N3 (ondas lentas delta) y regeneración celular.</p>
              </div>

              <div class="tier-card tier-blue">
                <div class="tier-top">
                  <span class="tier-pct">31% — 60%</span>
                  <span class="tier-name">Actividad Cognitiva Nominal</span>
                </div>
                <p>Procesamiento sensorial, memoria de trabajo y resolución de problemas habituales de la misión.</p>
              </div>

              <div class="tier-card tier-amber">
                <div class="tier-top">
                  <span class="tier-pct">61% — 85%</span>
                  <span class="tier-name">Hiperarousal / Estrés Espacial</span>
                </div>
                <p>Amígdala e ínsula sobrecargadas por cortisol nocturno, ruidos de ventilación o estrés de cabina.</p>
              </div>

              <div class="tier-card tier-red">
                <div class="tier-top">
                  <span class="tier-pct">86% — 100%</span>
                  <span class="tier-name">Alarma Crítica / Desbordamiento</span>
                </div>
                <p>Tormenta adrenérgica masiva (ataque de pánico) o pérdida de control inhibitorio prefrontal (psicosis).</p>
              </div>
            </div>

            <div class="guide-footer">
              <span class="norm-ref">Normativa: NASA Human Research Program (HRP) · Behavioral Health Standard</span>
              <button class="btn-understand" (click)="togglePctGuide()">Entendido</button>
            </div>
          </div>
        </div>
      }

      <!-- PANEL LATERAL EN MODO PANTALLA COMPLETA -->
      @if (isFullscreen()) {
        <div class="fullscreen-panel">
          <div class="fs-header">
            <h4>Telemetría Neurofuncional 3D</h4>
            <span class="fs-badge" [style.background-color]="activeColor()">
              {{ neuroService.activeCase().name }}
            </span>
          </div>

          <div class="fs-lpm-card">
            <span class="fs-label">Frecuencia en Reposo / Vigilia</span>
            <span class="fs-lpm-val">{{ neuroService.liveLpm() }} LPM</span>
            <span class="fs-desc">{{ neuroService.activeCase().headline }}</span>
          </div>

          <div class="fs-zones-scroll">
            <span class="fs-zones-title">Nivel de Activación por Estructura (% vs. Reposo):</span>
            @for (zone of neuroService.brainZones(); track zone.id) {
              <div
                class="fs-zone-item"
                [style.--zone-color]="zone.colorHex"
                (mouseenter)="highlightZone(zone.id)"
                (mouseleave)="unhighlightZone()"
              >
                <div class="fs-item-header">
                  <span class="fs-zone-name">{{ zone.name }}</span>
                  <span class="fs-zone-pct" [style.color]="zone.colorHex">{{ zone.activationLevel }}%</span>
                </div>
                <div class="fs-bar-bg">
                  <div
                    class="fs-bar-fill"
                    [style.width.%]="zone.activationLevel"
                    [style.background-color]="zone.colorHex"
                  ></div>
                </div>
                <div class="fs-item-footer">
                  <span class="subsystem-txt">{{ zone.subsystem }}</span>
                  <span class="status-txt">{{ zone.statusText }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Leyenda Inferior de Zonas Cerebrales -->
      <div class="zones-legend-bar">
        @for (zone of neuroService.brainZones(); track zone.id) {
          <div
            class="zone-tag"
            [class.active]="zone.activationLevel > 50"
            [style.--zone-color]="zone.colorHex"
            (mouseenter)="highlightZone(zone.id)"
            (mouseleave)="unhighlightZone()"
            [title]="zone.name + ' (' + zone.subsystem + '): ' + zone.activationLevel + '% de consumo O2 vs reposo terrestre — ' + zone.statusText"
          >
            <span class="zone-dot" [style.background-color]="zone.colorHex"></span>
            <span class="zone-name">{{ zone.name }}</span>
            <span class="zone-pct">{{ zone.activationLevel }}%</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .brain-viewer-wrapper {
      position: relative;
      width: 100%;
      height: 420px;
      background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(51, 65, 85, 0.6);
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
      user-select: none;
      transition: all 0.3s ease;

      &.fullscreen-mode {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 100000 !important;
        border-radius: 0 !important;
        border: none !important;
        box-shadow: none !important;
        background: radial-gradient(circle at center, #0b132b 0%, #020617 100%) !important;
      }
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
      z-index: 5;

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

    .viewer-top-actions {
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 15;

      .ctrl-btn {
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(148, 163, 184, 0.25);
        color: #e2e8f0;
        font-size: 0.72rem;
        font-weight: 700;
        padding: 5px 10px;
        border-radius: 8px;
        cursor: pointer;
        backdrop-filter: blur(8px);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: rgba(30, 41, 59, 0.95);
          color: #ffffff;
          border-color: #38bdf8;
          transform: translateY(-1px);
        }

        &.info-btn {
          background: rgba(14, 116, 144, 0.4);
          border-color: #06b6d4;
          color: #e0f2fe;

          &:hover {
            background: rgba(14, 116, 144, 0.7);
          }
        }

        &.zoom-btn {
          padding: 5px 8px;
          font-size: 0.75rem;
        }

        &.max-btn {
          background: linear-gradient(135deg, #0284c7, #2563eb);
          border-color: #60a5fa;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);

          &:hover {
            background: linear-gradient(135deg, #0369a1, #1d4ed8);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.5);
          }
        }
      }
    }

    // Modal Explicativo de los Porcentajes
    .pct-guide-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(6px);
      z-index: 30;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: fadeIn 0.2s ease;
    }

    .pct-guide-card {
      background: #ffffff;
      color: #0f172a;
      border-radius: 14px;
      max-width: 540px;
      width: 100%;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      border: 1px solid #cbd5e1;
      display: flex;
      flex-direction: column;
      gap: 0.9rem;

      .guide-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;

        .guide-title-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;

          .guide-badge-icon {
            font-size: 1.5rem;
          }

          h5 {
            margin: 0;
            font-size: 0.98rem;
            font-weight: 800;
            color: #0f172a;
          }

          .guide-sub {
            margin: 0.15rem 0 0;
            font-size: 0.7rem;
            color: #64748b;
          }
        }

        .close-guide-btn {
          background: transparent;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          color: #64748b;
          &:hover {
            color: #0f172a;
          }
        }
      }

      .guide-main-desc {
        margin: 0;
        font-size: 0.8rem;
        line-height: 1.4;
        color: #334155;
      }

      .scale-tiers-grid {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .tier-card {
          padding: 0.55rem 0.85rem;
          border-radius: 8px;
          border-left: 4px solid transparent;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;

          .tier-top {
            display: flex;
            align-items: center;
            gap: 0.6rem;

            .tier-pct {
              font-weight: 900;
              font-size: 0.78rem;
            }

            .tier-name {
              font-weight: 700;
              font-size: 0.76rem;
            }
          }

          p {
            margin: 0;
            font-size: 0.72rem;
            line-height: 1.3;
          }

          &.tier-green {
            background: #f0fdf4;
            border-left-color: #22c55e;
            .tier-pct, .tier-name { color: #15803d; }
            p { color: #166534; }
          }

          &.tier-blue {
            background: #eff6ff;
            border-left-color: #3b82f6;
            .tier-pct, .tier-name { color: #1d4ed8; }
            p { color: #1e40af; }
          }

          &.tier-amber {
            background: #fffbeb;
            border-left-color: #f59e0b;
            .tier-pct, .tier-name { color: #b45309; }
            p { color: #92400e; }
          }

          &.tier-red {
            background: #fef2f2;
            border-left-color: #ef4444;
            .tier-pct, .tier-name { color: #b91c1c; }
            p { color: #991b1b; }
          }
        }
      }

      .guide-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #e2e8f0;
        padding-top: 0.75rem;

        .norm-ref {
          font-size: 0.66rem;
          color: #94a3b8;
          font-style: italic;
        }

        .btn-understand {
          background: #0f172a;
          color: #ffffff;
          border: none;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 0.74rem;
          font-weight: 700;
          cursor: pointer;
          &:hover {
            background: #1e293b;
          }
        }
      }
    }

    // Panel Lateral en Modo Pantalla Completa
    .fullscreen-panel {
      position: absolute;
      top: 16px;
      right: 16px;
      bottom: 16px;
      width: 320px;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(14px);
      border-radius: 14px;
      border: 1px solid rgba(148, 163, 184, 0.25);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      z-index: 20;
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);

      .fs-header {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;

        h4 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 800;
          color: #ffffff;
        }

        .fs-badge {
          font-size: 0.7rem;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 999px;
          color: #ffffff;
          align-self: flex-start;
        }
      }

      .fs-lpm-card {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(148, 163, 184, 0.2);
        padding: 0.75rem 1rem;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;

        .fs-label {
          font-size: 0.68rem;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .fs-lpm-val {
          font-size: 1.4rem;
          font-weight: 900;
          color: #ffffff;
        }

        .fs-desc {
          font-size: 0.72rem;
          color: #cbd5e1;
          line-height: 1.3;
        }
      }

      .fs-zones-scroll {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        padding-right: 4px;

        &::-webkit-scrollbar {
          width: 4px;
        }
        &::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.4);
          border-radius: 4px;
        }

        .fs-zones-title {
          font-size: 0.72rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 0.2rem;
        }

        .fs-zone-item {
          background: rgba(30, 41, 59, 0.55);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 8px;
          padding: 0.6rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            border-color: var(--zone-color);
            background: rgba(30, 41, 59, 0.9);
            transform: translateX(-2px);
          }

          .fs-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .fs-zone-name {
              font-size: 0.78rem;
              font-weight: 700;
              color: #f1f5f9;
            }

            .fs-zone-pct {
              font-size: 0.85rem;
              font-weight: 900;
            }
          }

          .fs-bar-bg {
            height: 5px;
            background: rgba(15, 23, 42, 0.8);
            border-radius: 999px;
            overflow: hidden;

            .fs-bar-fill {
              height: 100%;
              border-radius: 999px;
              transition: width 0.3s ease;
            }
          }

          .fs-item-footer {
            display: flex;
            justify-content: space-between;
            font-size: 0.68rem;
            color: #94a3b8;

            .status-txt {
              color: #cbd5e1;
              font-style: italic;
            }
          }
        }
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
      z-index: 10;

      .zone-tag {
        background: rgba(15, 23, 42, 0.78);
        backdrop-filter: blur(6px);
        border: 1px solid rgba(148, 163, 184, 0.2);
        padding: 4px 10px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.7rem;
        color: #cbd5e1;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover, &.active {
          border-color: var(--zone-color);
          background: rgba(30, 41, 59, 0.95);
          transform: translateY(-1px);
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
        }

        .zone-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .zone-name {
          font-weight: 600;
        }

        .zone-pct {
          font-weight: 800;
          color: var(--zone-color);
          background: rgba(0, 0, 0, 0.25);
          padding: 1px 5px;
          border-radius: 4px;

          &.alert-pct {
            background: rgba(239, 68, 68, 0.25);
            color: #f87171;
          }
        }
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

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
  `],
})
export class Brain3dComponent implements OnInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  readonly neuroService = inject(NeuroSleepService);

  readonly activeColor = computed(() => this.neuroService.activeCase().severityColor);
  readonly isFullscreen = signal<boolean>(false);
  readonly showPctGuide = signal<boolean>(false);

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

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.showPctGuide()) {
      this.showPctGuide.set(false);
    } else if (this.isFullscreen()) {
      this.toggleFullscreen();
    }
  }

  toggleFullscreen(): void {
    this.isFullscreen.update((v) => !v);
    setTimeout(() => {
      this.onWindowResize();
    }, 60);
  }

  togglePctGuide(): void {
    this.showPctGuide.update((v) => !v);
  }

  zoomIn(): void {
    if (!this.camera) return;
    this.camera.position.z = Math.max(3.6, this.camera.position.z - 0.75);
  }

  zoomOut(): void {
    if (!this.camera) return;
    this.camera.position.z = Math.min(13.0, this.camera.position.z + 0.75);
  }

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

    // Zoom con rueda del ratón
    el.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        e.preventDefault();
        if (e.deltaY < 0) {
          this.zoomIn();
        } else {
          this.zoomOut();
        }
      },
      { passive: false }
    );

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
