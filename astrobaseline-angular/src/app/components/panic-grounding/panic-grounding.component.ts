import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NeuroSleepService } from '../../core/services/neuro-sleep.service';

type SighPhase = 'INHALE_1' | 'INHALE_2' | 'EXHALE_LONG';

@Component({
  selector: 'app-panic-grounding',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grounding-modal-backdrop" (click)="closeOnBackdrop($event)">
      <div class="grounding-card">
        <!-- Cabecera de Alerta de Pánico -->
        <div class="modal-header">
          <div class="header-left">
            <span class="header-icon">⚡</span>
            <div>
              <h3>Protocolo de Rescate por Pánico & Despertar Abrupto</h3>
              <p class="subtitle">Desactivación rápida de amígdala · Suspiro Fisiológico & Verificación de Cabina</p>
            </div>
          </div>
          <button class="close-btn" (click)="close()" title="Cerrar">✕</button>
        </div>

        <!-- Telemetría en Descenso -->
        <div class="telemetry-bar">
          <div class="tele-item">
            <span class="tele-label">Frecuencia Inicial:</span>
            <span class="tele-val danger">122 LPM (Pánico)</span>
          </div>
          <span class="tele-arrow">➔</span>
          <div class="tele-item">
            <span class="tele-label">Frecuencia Proyectada:</span>
            <span class="tele-val safe">{{ projectedLpm() }} LPM (Seguro)</span>
          </div>
          <div class="tele-item o2-check">
            <span class="tele-label">O2 Cabina:</span>
            <span class="tele-val safe">21.2% (101.3 kPa)</span>
          </div>
        </div>

        <!-- Pestañas de las 2 Fases Clínicas -->
        <div class="stages-tabs">
          <button
            class="tab-pill"
            [class.active]="currentTab() === 'sigh'"
            (click)="currentTab.set('sigh')"
          >
            1. Suspiro Fisiológico Cíclico
          </button>
          <button
            class="tab-pill"
            [class.active]="currentTab() === 'safety'"
            (click)="currentTab.set('safety')"
          >
            2. Anclaje & Seguridad de Cabina
          </button>
        </div>

        <!-- FASE 1: SUSPIRO FISIOLÓGICO -->
        @if (currentTab() === 'sigh') {
          <div class="sigh-stage">
            <div
              class="sigh-orb"
              [class.inhale1]="sighPhase() === 'INHALE_1'"
              [class.inhale2]="sighPhase() === 'INHALE_2'"
              [class.exhale]="sighPhase() === 'EXHALE_LONG'"
            >
              <div class="orb-inner">
                <span class="sigh-title">{{ phaseLabel() }}</span>
                <span class="sigh-timer">{{ phaseSeconds() }}s</span>
              </div>
              <div class="pulse-aura"></div>
            </div>

            <div class="sigh-meta">
              <span class="cycle-pill">Ciclo {{ cycle() }} de 3</span>
              <p class="sigh-instruction">{{ phaseTip() }}</p>
            </div>
          </div>
        }

        <!-- FASE 2: VERIFICACIÓN DE CABINA Y ANCLAJE SENSORIAL -->
        @if (currentTab() === 'safety') {
          <div class="safety-stage">
            <div class="safety-checklist">
              <div class="check-item verified">
                <span class="check-icon">✓</span>
                <div class="check-texts">
                  <strong>Presión Barométrica Nominal: 101.3 kPa</strong>
                  <span>Sin despresurización. El soporte vital del módulo funciona al 100%.</span>
                </div>
              </div>
              <div class="check-item verified">
                <span class="check-icon">✓</span>
                <div class="check-texts">
                  <strong>Oxígeno y Flujo de Aire: 21.2% O2</strong>
                  <span>Tus pulmones reciben aire puro; la sensación de asfixia es una ilusión adrenérgica.</span>
                </div>
              </div>
              <div class="check-item sensory">
                <span class="check-icon">👁️</span>
                <div class="check-texts">
                  <strong>Anclaje Visual 3-2-1:</strong>
                  <span>Fija la mirada en 3 puntos fijos iluminados de tu consola frontal. Siente la firmeza del arnés.</span>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="close()">Cancelar</button>
          <button class="btn btn-panic-finish" (click)="finish()">
            ✓ Restablecer Sistema Vagal & Reposo
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .grounding-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.82);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.25rem;
      animation: modalFade 0.25s ease;
    }

    .grounding-card {
      background: #ffffff;
      border-radius: 18px;
      width: 100%;
      max-width: 580px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(249, 115, 22, 0.35);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      background: linear-gradient(135deg, #fff7ed, #ffedd5);
      border-bottom: 1px solid #fed7aa;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        align-items: center;
        gap: 0.9rem;

        .header-icon {
          font-size: 1.8rem;
          background: #ffedd5;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          border: 1px solid #fdba74;
        }

        h3 {
          margin: 0;
          font-size: 1.12rem;
          font-weight: 800;
          color: #9a3412;
        }

        .subtitle {
          margin: 0.2rem 0 0;
          font-size: 0.78rem;
          color: #c2410c;
        }
      }

      .close-btn {
        background: transparent;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: #9a3412;
        padding: 4px 8px;
        border-radius: 6px;
        transition: background 0.2s;

        &:hover {
          background: rgba(234, 88, 12, 0.15);
        }
      }
    }

    .telemetry-bar {
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 0.75rem 1.5rem;
      background: #0f172a;
      color: #ffffff;
      font-size: 0.8rem;

      .tele-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.15rem;

        .tele-label {
          color: #94a3b8;
          font-size: 0.7rem;
        }

        .tele-val {
          font-weight: 800;
          font-size: 0.88rem;

          &.danger {
            color: #fb923c;
          }
          &.safe {
            color: #34d399;
          }
        }
      }

      .tele-arrow {
        color: #64748b;
        font-weight: 800;
      }
    }

    .stages-tabs {
      display: flex;
      padding: 0.75rem 1.5rem 0;
      gap: 0.5rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;

      .tab-pill {
        flex: 1;
        padding: 0.6rem 0.75rem;
        border: none;
        background: transparent;
        font-size: 0.82rem;
        font-weight: 700;
        color: #64748b;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;

        &.active {
          color: #ea580c;
          border-bottom-color: #ea580c;
        }
      }
    }

    .sigh-stage {
      padding: 2rem 1.5rem 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
      background: radial-gradient(circle at center, #fff7ed 0%, #ffffff 70%);

      .sigh-orb {
        width: 140px;
        height: 140px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ea580c, #c2410c);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        position: relative;
        transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 10px 25px rgba(234, 88, 12, 0.35);

        &.inhale1 {
          transform: scale(1.15);
          background: linear-gradient(135deg, #f97316, #ea580c);
        }

        &.inhale2 {
          transform: scale(1.3);
          background: linear-gradient(135deg, #fb923c, #f97316);
        }

        &.exhale {
          transform: scale(0.88);
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.35);
        }

        .orb-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
          z-index: 2;

          .sigh-title {
            font-size: 0.78rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .sigh-timer {
            font-size: 1.8rem;
            font-weight: 900;
          }
        }
      }

      .sigh-meta {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        text-align: center;

        .cycle-pill {
          font-size: 0.75rem;
          font-weight: 800;
          background: #ffedd5;
          color: #c2410c;
          padding: 3px 12px;
          border-radius: 999px;
        }

        .sigh-instruction {
          margin: 0;
          font-size: 0.85rem;
          color: #475569;
          max-width: 420px;
        }
      }
    }

    .safety-stage {
      padding: 1.5rem;
      background: #ffffff;

      .safety-checklist {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;

        .check-item {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          padding: 0.9rem 1rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;

          &.verified {
            background: #f0fdf4;
            border-color: #bbf7d0;

            .check-icon {
              background: #22c55e;
              color: #ffffff;
            }
          }

          &.sensory {
            background: #fff7ed;
            border-color: #fed7aa;

            .check-icon {
              background: #f97316;
              color: #ffffff;
            }
          }

          .check-icon {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.82rem;
            font-weight: 900;
            flex-shrink: 0;
          }

          .check-texts {
            display: flex;
            flex-direction: column;
            gap: 0.15rem;

            strong {
              font-size: 0.85rem;
              color: #0f172a;
            }

            span {
              font-size: 0.78rem;
              color: #64748b;
            }
          }
        }
      }
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;

      .btn {
        padding: 0.65rem 1.25rem;
        border-radius: 9px;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
        border: none;
        transition: all 0.2s;

        &.btn-secondary {
          background: #e2e8f0;
          color: #475569;

          &:hover {
            background: #cbd5e1;
          }
        }

        &.btn-panic-finish {
          background: linear-gradient(135deg, #ea580c, #c2410c);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);

          &:hover {
            opacity: 0.92;
            transform: translateY(-1px);
          }
        }
      }
    }

    @keyframes modalFade {
      from {
        opacity: 0;
        transform: scale(0.97);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `],
})
export class PanicGroundingComponent implements OnInit, OnDestroy {
  readonly neuro = inject(NeuroSleepService);

  readonly currentTab = signal<'sigh' | 'safety'>('sigh');
  readonly sighPhase = signal<SighPhase>('INHALE_1');
  readonly phaseSeconds = signal<number>(3);
  readonly cycle = signal<number>(1);
  readonly projectedLpm = signal<number>(122);

  private timerId: any = null;

  ngOnInit(): void {
    this.startSighCycle();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private startSighCycle(): void {
    this.clearTimer();
    this.sighPhase.set('INHALE_1');
    this.phaseSeconds.set(3);

    this.timerId = setInterval(() => {
      const s = this.phaseSeconds();
      if (s > 1) {
        this.phaseSeconds.update((v) => v - 1);
        return;
      }

      // Transición entre las 3 etapas del suspiro fisiológico
      const current = this.sighPhase();
      if (current === 'INHALE_1') {
        this.sighPhase.set('INHALE_2');
        this.phaseSeconds.set(1); // Segundo sorbo rápido de aire
      } else if (current === 'INHALE_2') {
        this.sighPhase.set('EXHALE_LONG');
        this.phaseSeconds.set(6); // Exhalación desinflatoria profunda
        // Cada ciclo de exhalación desciende los LPM
        this.projectedLpm.update((p) => Math.max(55, p - 22));
      } else {
        if (this.cycle() < 3) {
          this.cycle.update((c) => c + 1);
          this.sighPhase.set('INHALE_1');
          this.phaseSeconds.set(3);
        } else {
          this.clearTimer();
          this.currentTab.set('safety');
        }
      }
    }, 1000);
  }

  phaseLabel(): string {
    switch (this.sighPhase()) {
      case 'INHALE_1':
        return 'Inhala Profundo (Nariz)';
      case 'INHALE_2':
        return 'Sorbo Extra (+ Aire)';
      case 'EXHALE_LONG':
        return 'Exhala Lento (Boca)';
    }
  }

  phaseTip(): string {
    switch (this.sighPhase()) {
      case 'INHALE_1':
        return 'Llena tus pulmones con aire por la nariz.';
      case 'INHALE_2':
        return 'Inhala un poco más al final para expandir los alvéolos colapsados.';
      case 'EXHALE_LONG':
        return 'Suelta todo el aire lentamente por la boca. Siente cómo tu ritmo cardíaco se desploma.';
    }
  }

  close(): void {
    this.neuro.closePanicGrounding();
  }

  closeOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('grounding-modal-backdrop')) {
      this.close();
    }
  }

  finish(): void {
    this.neuro.finishPanicGrounding();
  }
}
