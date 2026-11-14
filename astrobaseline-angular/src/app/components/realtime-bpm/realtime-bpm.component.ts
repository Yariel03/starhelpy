import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface BpmPoint {
  time: string;
  value: number;
}

@Component({
  selector: 'app-realtime-bpm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './realtime-bpm.component.html',
  styleUrl: './realtime-bpm.component.scss',
})
export class RealtimeBpmComponent implements OnInit, OnDestroy {
  @ViewChild('ecgCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // Estado del monitor en vivo
  readonly currentBpm = signal<number>(72);
  readonly isRunning = signal<boolean>(true);
  readonly mode = signal<'rest' | 'exercise'>('rest'); // Reposo vs Ejercicio

  // Estadísticas de la sesión
  readonly minBpm = signal<number>(68);
  readonly maxBpm = signal<number>(78);
  readonly avgBpm = signal<number>(72);

  // Buffer de datos para el trazado
  private dataHistory: number[] = [];
  private maxHistoryPoints = 35;
  private intervalId: any = null;
  private baseBpm = 72;
  private totalSum = 0;
  private totalCount = 0;

  readonly heartAnimationDuration = computed(() => {
    const bpm = this.currentBpm();
    const seconds = 60 / Math.max(bpm, 40);
    return `${seconds.toFixed(2)}s`;
  });

  readonly statusLabel = computed(() => {
    const bpm = this.currentBpm();
    if (bpm < 50) return { text: 'Bradicardia', color: '#f59e0b' };
    if (bpm > 100) return { text: 'Ritmo Elevado (ARED)', color: '#ef4444' };
    return { text: 'Ritmo Sinusal Normal', color: '#10b981' };
  });

  ngOnInit(): void {
    // Inicializar historial con valores base
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
    this.baseBpm = nextMode === 'exercise' ? 128 : 72;
  }

  private startStreaming(): void {
    this.stopStreaming();
    // Actualizar cada 850ms generando fisiología creíble
    this.intervalId = setInterval(() => {
      this.generateNextPulse();
      this.drawChart();
    }, 850);
  }

  private stopStreaming(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private generateNextPulse(): void {
    const targetBase = this.baseBpm;
    // Variabilidad biológica natural (arritmia sinusal respiratoria)
    const jitter = (Math.random() - 0.48) * 3.5;
    const prev = this.currentBpm();
    // Suavizado hacia el target
    const nextVal = Math.round(prev * 0.7 + (targetBase + jitter) * 0.3);

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

    // 1. Área bajo la curva con gradiente neon
    ctx.beginPath();
    ctx.moveTo(getX(0), height);
    for (let i = 0; i < values.length; i++) {
      ctx.lineTo(getX(i), getY(values[i]));
    }
    ctx.lineTo(getX(values.length - 1), height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
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

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#10b981';
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
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
