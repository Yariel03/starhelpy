import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NeuroSleepService } from '../../core/services/neuro-sleep.service';
import { I18nService } from '../../core/services/i18n.service';

type BreathPhase = 'INSPECT' | 'HOLD' | 'EXHALE';

@Component({
  selector: 'app-guided-breathing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="breathing-modal-backdrop" (click)="closeOnBackdrop($event)">
      <div class="breathing-card">
        <!-- Cabecera -->
        <div class="modal-header">
          <div class="header-left">
            <span class="header-icon">🌬️</span>
            <div>
              <h3>{{ i18n.currentLang() === 'en' ? '4-7-8 Guided Breathing Protocol' : 'Protocolo de Respiración Guiada 4-7-8' }}</h3>
              <p class="subtitle">{{ i18n.currentLang() === 'en' ? 'Neurobehavioral countermeasure to decompress sympathetic arousal' : 'Contramedida neuroconductual para despresurizar el sistema simpático' }}</p>
            </div>
          </div>
          <button class="close-btn" (click)="close()" [title]="i18n.currentLang() === 'en' ? 'Close' : 'Cerrar'">✕</button>
        </div>

        <!-- Visualizador interactivo de respiración -->
        <div class="breathing-stage">
          <div
            class="breathing-orb"
            [class.expand]="phase() === 'INSPECT'"
            [class.hold]="phase() === 'HOLD'"
            [class.shrink]="phase() === 'EXHALE'"
          >
            <div class="orb-content">
              <span class="phase-action">{{ phaseText() }}</span>
              <span class="phase-seconds">{{ secondsLeft() }}s</span>
            </div>
            <div class="orb-pulse-ring"></div>
          </div>

          <!-- Barra de Ciclo -->
          <div class="cycle-indicator">
            {{ i18n.currentLang() === 'en' ? 'Cycle ' + currentCycle() + ' of ' + totalCycles : 'Ciclo ' + currentCycle() + ' de ' + totalCycles }}
          </div>
        </div>

        <!-- Indicador de telemetría de LPM en descenso -->
        <div class="telemetry-feedback">
          <div class="stat-pill">
            <span class="stat-label">{{ i18n.currentLang() === 'en' ? 'Initial Heart Rate:' : 'LPM Inicial:' }}</span>
            <span class="stat-val red">{{ initialLpm }} BPM</span>
          </div>
          <span class="arrow-trans">➔</span>
          <div class="stat-pill">
            <span class="stat-label">{{ i18n.currentLang() === 'en' ? 'Projected Heart Rate:' : 'LPM Proyectado:' }}</span>
            <span class="stat-val green">{{ currentTargetLpm() }} BPM</span>
          </div>
        </div>

        <!-- Instrucciones y Controles -->
        <div class="instruction-box">
          <p>
            {{ i18n.currentLang() === 'en'
              ? 'This NASA-derived technique stimulates the vagus nerve, reduces salivary cortisol in microgravity and induces parasympathetic tone for deep restorative sleep.'
              : 'Esta técnica de la NASA estimula el nervio vago, reduce los niveles de cortisol salival en microgravedad e induce el tono parasimpático para permitir la fase N3 de sueño profundo.' }}
          </p>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="close()">{{ i18n.currentLang() === 'en' ? 'Cancel' : 'Cancelar' }}</button>
          <button class="btn btn-primary" (click)="finish()">
            {{ i18n.currentLang() === 'en' ? '✓ Finish & Restore Vagal Tone' : '✓ Finalizar y Restaurar Tono Vagotónico' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .breathing-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(10px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 100000;
      padding: 1rem;
      animation: fadeIn 0.25s ease;
    }

    .breathing-card {
      background: rgba(255, 255, 255, 0.98);
      border-radius: 20px;
      width: 100%;
      max-width: 520px;
      padding: 1.5rem;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(226, 232, 240, 0.8);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.75rem;

      .header-left {
        display: flex;
        gap: 0.65rem;
        align-items: center;

        .header-icon {
          font-size: 1.8rem;
        }

        h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
        }

        .subtitle {
          margin: 0.2rem 0 0;
          font-size: 0.76rem;
          color: #64748b;
        }
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 1.2rem;
        color: #94a3b8;
        cursor: pointer;
        &:hover {
          color: #0f172a;
        }
      }
    }

    .breathing-stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem 0;
      background: radial-gradient(circle at center, #f8fafc 0%, #edf2f7 100%);
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      position: relative;
    }

    .breathing-orb {
      width: 170px;
      height: 170px;
      border-radius: 50%;
      background: linear-gradient(135deg, #38bdf8, #0284c7);
      display: flex;
      justify-content: center;
      align-items: center;
      color: #ffffff;
      box-shadow: 0 10px 30px rgba(2, 132, 199, 0.35);
      transition: transform 4s cubic-bezier(0.4, 0, 0.2, 1), background 1s ease;
      position: relative;

      &.expand {
        transform: scale(1.35);
        background: linear-gradient(135deg, #38bdf8, #2563eb);
        box-shadow: 0 14px 40px rgba(37, 99, 235, 0.5);
      }

      &.hold {
        transform: scale(1.35);
        background: linear-gradient(135deg, #f59e0b, #d97706);
        box-shadow: 0 14px 40px rgba(245, 158, 11, 0.5);
      }

      &.shrink {
        transform: scale(0.9);
        background: linear-gradient(135deg, #10b981, #059669);
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
      }

      .orb-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;

        .phase-action {
          font-size: 1rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .phase-seconds {
          font-size: 2.2rem;
          font-weight: 900;
          line-height: 1;
        }
      }
    }

    .cycle-indicator {
      margin-top: 1rem;
      font-size: 0.78rem;
      font-weight: 700;
      color: #475569;
      background: #ffffff;
      padding: 3px 12px;
      border-radius: 20px;
      border: 1px solid #cbd5e1;
    }

    .telemetry-feedback {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;

      .stat-pill {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 6px 14px;
        border-radius: 12px;

        .stat-label {
          font-size: 0.68rem;
          color: #64748b;
          font-weight: 600;
        }

        .stat-val {
          font-size: 1.1rem;
          font-weight: 800;
          &.red {
            color: #ef4444;
          }
          &.green {
            color: #10b981;
          }
        }
      }

      .arrow-trans {
        font-size: 1.1rem;
        color: #94a3b8;
      }
    }

    .instruction-box {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      border-radius: 6px;
      padding: 0.75rem 1rem;
      p {
        margin: 0;
        font-size: 0.78rem;
        color: #1e40af;
        line-height: 1.4;
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;

      .btn {
        padding: 0.6rem 1.2rem;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;

        &.btn-secondary {
          background: #e2e8f0;
          color: #334155;
          &:hover {
            background: #cbd5e1;
          }
        }

        &.btn-primary {
          background: #10b981;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
          &:hover {
            background: #059669;
            transform: translateY(-1px);
          }
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes popIn {
      from { opacity: 0; transform: scale(0.92); }
      to { opacity: 1; transform: scale(1); }
    }
  `],
})
export class GuidedBreathingComponent implements OnInit, OnDestroy {
  readonly neuroService = inject(NeuroSleepService);
  readonly i18n = inject(I18nService);

  readonly phase = signal<BreathPhase>('INSPECT');
  readonly secondsLeft = signal<number>(4);
  readonly currentCycle = signal<number>(1);
  readonly totalCycles = 3;

  readonly initialLpm = this.neuroService.liveLpm();
  readonly currentTargetLpm = signal<number>(this.initialLpm);

  private timer: any = null;

  readonly phaseText = signal<string>('Inhala (Nariz)');

  ngOnInit(): void {
    this.runCycle();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private runCycle(): void {
    const isEn = this.i18n.currentLang() === 'en';
    // 1. INHALE 4 seconds
    this.phase.set('INSPECT');
    this.phaseText.set(isEn ? 'Inhale (Nose)' : 'Inhala (Nariz)');
    this.secondsLeft.set(4);

    this.timer = setInterval(() => {
      const s = this.secondsLeft();
      if (s > 1) {
        this.secondsLeft.set(s - 1);
      } else {
        clearInterval(this.timer);
        this.runHold();
      }
    }, 1000);
  }

  private runHold(): void {
    const isEn = this.i18n.currentLang() === 'en';
    // 2. HOLD 7 seconds
    this.phase.set('HOLD');
    this.phaseText.set(isEn ? 'Hold Breath' : 'Retén el Aire');
    this.secondsLeft.set(7);

    this.timer = setInterval(() => {
      const s = this.secondsLeft();
      if (s > 1) {
        this.secondsLeft.set(s - 1);
      } else {
        clearInterval(this.timer);
        this.runExhale();
      }
    }, 1000);
  }

  private runExhale(): void {
    const isEn = this.i18n.currentLang() === 'en';
    // 3. EXHALE 8 seconds
    this.phase.set('EXHALE');
    this.phaseText.set(isEn ? 'Exhale (Mouth)' : 'Exhala (Boca)');
    this.secondsLeft.set(8);

    // Reducción paulatina de LPM en la telemetría
    const cycle = this.currentCycle();
    const reduction = Math.round((this.initialLpm - 52) / this.totalCycles);
    const newLpm = Math.max(52, this.initialLpm - reduction * cycle);
    this.currentTargetLpm.set(newLpm);

    this.timer = setInterval(() => {
      const s = this.secondsLeft();
      if (s > 1) {
        this.secondsLeft.set(s - 1);
      } else {
        clearInterval(this.timer);
        if (this.currentCycle() < this.totalCycles) {
          this.currentCycle.update((c) => c + 1);
          this.runCycle();
        } else {
          // Completado
          this.phaseText.set(isEn ? 'Completed!' : '¡Completado!');
          this.secondsLeft.set(0);
        }
      }
    }, 1000);
  }

  finish(): void {
    this.neuroService.finishBreathingExercise();
  }

  close(): void {
    this.neuroService.closeBreathingExercise();
  }

  closeOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('breathing-modal-backdrop')) {
      this.close();
    }
  }
}
