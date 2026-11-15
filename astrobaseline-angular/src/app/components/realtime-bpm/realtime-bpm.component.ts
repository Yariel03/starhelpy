import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NeuroSleepService } from '../../core/services/neuro-sleep.service';

@Component({
  selector: 'app-realtime-bpm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './realtime-bpm.component.html',
  styleUrl: './realtime-bpm.component.scss',
})
export class RealtimeBpmComponent implements OnInit, OnDestroy {
  @ViewChild('ecgCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly neuro = inject(NeuroSleepService);

  // Estado del monitor en vivo
  readonly currentBpm = signal<number>(50);
  readonly isRunning = signal<boolean>(true);
  readonly mode = signal<'rest' | 'exercise'>('rest'); // Reposo vs Ejercicio

  // Estadísticas de la sesión
  readonly minBpm = signal<number>(48);
  readonly maxBpm = signal<number>(54);
  readonly avgBpm = signal<number>(50);

  // Buffer de datos para el trazado
  private dataHistory: number[] = [];
  private maxHistoryPoints = 35;
  private intervalId: any = null;
  private baseBpm = 50;
  private totalSum = 0;
  private totalCount = 0;
  private lastCaseId = '';

  readonly heartAnimationDuration = computed(() => {
    const bpm = this.currentBpm();
    const seconds = 60 / Math.max(bpm, 40);
    return `${seconds.toFixed(2)}s`;
  });

  // Color temático asociado a la severidad del caso neuroconductual
  readonly activeColor = computed(() => {
    return this.neuro.activeCase().severityColor || '#10b981';
  });

  // Etiqueta médica sincronizada con el estado neuroconductual
  readonly statusLabel = computed(() => {
    const activeCase = this.neuro.activeCase();
    const bpm = this.currentBpm();

    if (activeCase.id === 'REPAIR_SLEEP') {
      return { text: 'Sueño Reparador (Sinusal)', color: '#10b981' };
    } else if (activeCase.id === 'ANXIETY') {
      return { text: 'Ansiedad / Hiperarousal', color: '#f59e0b' };
    } else if (activeCase.id === 'PANIC') {
      return { text: 'Taquicardia por Pánico', color: '#f97316' };
    } else if (activeCase.id === 'PSYCHOSIS') {
      return { text: 'Crisis Crítica / Descompensación', color: '#ef4444' };
    }

    if (bpm < 50) return { text: 'Bradicardia', color: '#f59e0b' };
    if (bpm > 100) return { text: 'Ritmo Elevado (ARED)', color: '#ef4444' };
    return { text: 'Ritmo Sinusal Normal', color: '#10b981' };
  });

  constructor() {
    // Sincronización reactiva inmediata con el simulador de neuroconducta y mapeo encefálico
    effect(() => {
      const liveLpm = this.neuro.liveLpm();
      const currentCase = this.neuro.activeStateId();

      // Si ha cambiado de caso de simulación, ajustar instantáneamente el baseline y el pulso
      if (this.lastCaseId !== currentCase) {
        this.lastCaseId = currentCase;
        this.baseBpm = liveLpm;
        this.currentBpm.set(liveLpm);

        // Pre-ajustar estadísticas acordes al caso
        this.minBpm.set(Math.max(35, liveLpm - 4));
        this.maxBpm.set(liveLpm + 4);
        this.avgBpm.set(liveLpm);
        this.totalSum = liveLpm * 5;
        this.totalCount = 5;

        // Rellenar historial con valores cercanos al nuevo nivel para transición limpia en el trazado
        this.dataHistory = Array.from({ length: this.maxHistoryPoints }, () =>
          liveLpm + Math.round((Math.random() - 0.5) * 4)
        );

        this.drawChart();
      } else {
        // Actualización fluida continua
        this.baseBpm = liveLpm;
      }
    });
  }

  ngOnInit(): void {
    const initialBpm = this.neuro.liveLpm() || 50;
    this.baseBpm = initialBpm;
    this.currentBpm.set(initialBpm);
    this.lastCaseId = this.neuro.activeStateId();

    this.dataHistory = [];
    for (let i = 0; i < this.maxHistoryPoints; i++) {
      this.dataHistory.push(this.baseBpm + (Math.random() * 4 - 2));
    }
    this.startStreaming();
  }

  ngOnDestroy(): void {
    this.stopStreaming();
  }

  toggleStreaming(): void {
    if (this.isRunning()) {
      this.stopStreaming();
      this.isRunning.set(false);
    } else {
      this.startStreaming();
      this.isRunning.set(true);
    }
  }

  toggleMode(): void {
    const nextMode = this.mode() === 'rest' ? 'exercise' : 'rest';
    this.mode.set(nextMode);
    if (nextMode === 'exercise') {
      this.baseBpm = 128;
    } else {
      this.baseBpm = this.neuro.liveLpm();
    }
  }

  private startStreaming(): void {
    this.stopStreaming();
    // Actualizar cada 800ms generando fisiología creíble
    this.intervalId = setInterval(() => {
      this.generateNextPulse();
      this.drawChart();
    }, 800);
  }

  private stopStreaming(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private generateNextPulse(): void {
    const targetBase = this.mode() === 'exercise' ? 128 : this.neuro.liveLpm();
    // Variabilidad biológica natural (arritmia sinusal respiratoria)
    const jitter = (Math.random() - 0.48) * 3.2;
    const prev = this.currentBpm();
    // Suavizado dinámico hacia el target
    const nextVal = Math.round(prev * 0.45 + (targetBase + jitter) * 0.55);

    this.currentBpm.set(nextVal);

    // Actualizar historial
    this.dataHistory.push(nextVal);
    if (this.dataHistory.length > this.maxHistoryPoints) {
      this.dataHistory.shift();
    }

    // Actualizar estadísticas
    this.minBpm.update((m) => Math.min(m, nextVal));
    this.maxBpm.update((m) => Math.max(m, nextVal));
    this.totalSum += nextVal;
    this.totalCount++;
    this.avgBpm.set(Math.round(this.totalSum / this.totalCount));
  }

  private hexToRgba(hex: string, alpha: number): string {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) || 16;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 185;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 129;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private drawChart(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Dibujar cuadrícula médica de telemetría (estilo monitor ECG)
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.lineWidth = 1;

    const gridX = 20;
    const gridY = 15;
    ctx.beginPath();
    for (let x = 0; x < width; x += gridX) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += gridY) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Rango de escala dinámica para el trazado
    const values = this.dataHistory;
    if (values.length < 2) return;

    const minV = Math.min(...values) - 6;
    const maxV = Math.max(...values) + 6;
    const range = Math.max(maxV - minV, 10);

    const getX = (index: number) => (index / (this.maxHistoryPoints - 1)) * width;
    const getY = (val: number) => height - ((val - minV) / range) * (height - 16) - 8;

    const activeCol = this.activeColor();

    // 1. Área bajo la curva con gradiente neon
    ctx.beginPath();
    ctx.moveTo(getX(0), height);
    for (let i = 0; i < values.length; i++) {
      ctx.lineTo(getX(i), getY(values[i]));
    }
    ctx.lineTo(getX(values.length - 1), height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, this.hexToRgba(activeCol, 0.35));
    gradient.addColorStop(1, this.hexToRgba(activeCol, 0.0));
    ctx.fillStyle = gradient;
    ctx.fill();

    // 2. Línea principal del pulso
    ctx.beginPath();
    for (let i = 0; i < values.length; i++) {
      const x = getX(i);
      const y = getY(values[i]);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        // Curva Bezier suave
        const prevX = getX(i - 1);
        const prevY = getY(values[i - 1]);
        const midX = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, prevY, midX, (prevY + y) / 2);
      }
    }
    ctx.lineTo(getX(values.length - 1), getY(values[values.length - 1]));

    ctx.strokeStyle = activeCol;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = activeCol;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // 3. Punto de trazado actual en la cabeza de la señal
    const lastIdx = values.length - 1;
    const lastX = getX(lastIdx);
    const lastY = getY(values[lastIdx]);

    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = activeCol;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
