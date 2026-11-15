import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NeuroCaseConfig, NeuroSleepService, NeuroStateId } from '../../core/services/neuro-sleep.service';
import { I18nService } from '../../core/services/i18n.service';
import { Brain3dComponent } from '../brain-3d/brain-3d.component';

@Component({
  selector: 'app-neuro-sleep',
  standalone: true,
  imports: [CommonModule, Brain3dComponent],
  template: `
    <div class="neuro-sleep-container">
      <!-- CABECERA DE ESTADO NEUROCONDUCTUAL -->
      <div class="neuro-header-banner" [style.border-left-color]="neuro.activeCase().severityColor">
        <div class="header-main-info">
          <div class="badge-row">
            <span class="severity-pill" [style.background-color]="neuro.activeCase().severityColor">
              {{ neuro.activeCase().icon }} {{ neuro.activeCase().severity }}
            </span>
            <span class="lpm-tag">
              {{ i18n.t().cardiac_telemetry }} <strong>{{ neuro.liveLpm() }} LPM</strong> ({{ neuro.activeCase().lpmRange }})
            </span>
          </div>
          <h2>{{ neuro.activeCase().name }}</h2>
          <p class="headline-sub">{{ neuro.activeCase().headline }}</p>
        </div>

        <div class="header-metrics-group">
          <div class="metric-block">
            <span class="metric-label">{{ i18n.t().sleep_quality }}</span>
            <span class="metric-value">{{ neuro.activeCase().sleepQuality }}</span>
          </div>
          <div class="metric-block">
            <span class="metric-label">{{ i18n.t().dominant_stage }}</span>
            <span class="metric-value highlight">{{ neuro.activeCase().dominantStage }}</span>
          </div>
          <div class="metric-block">
            <span class="metric-label">{{ i18n.t().autonomic_tone }}</span>
            <span class="metric-value" [class.danger]="neuro.activeCase().severity !== 'NOMINAL'">
              {{ neuro.activeCase().severity === 'NOMINAL' ? i18n.t().parasympathetic : i18n.t().sympathetic }}
            </span>
          </div>
        </div>
      </div>

      <!-- BOTONERA DEL SIMULADOR CLÍNICO ESPACIAL (EN VIVO) -->
      <div class="simulator-panel-card">
        <div class="sim-header">
          <div class="sim-title-box">
            <span class="sim-icon">⚡</span>
            <h4>{{ i18n.t().sim_header_title }}</h4>
          </div>
          <span class="sim-badge">{{ i18n.t().sim_header_sub }}</span>
        </div>

        <div class="simulator-buttons-grid">
          @for (c of caseList; track c.id) {
            <button
              class="sim-btn"
              [class.active]="neuro.activeStateId() === c.id"
              [style.--case-color]="c.severityColor"
              (click)="simulate(c.id)"
            >
              <span class="btn-icon">{{ c.icon }}</span>
              <div class="btn-texts">
                <span class="btn-title">{{ c.shortName }}</span>
                <span class="btn-sub">{{ c.lpmAverage }} {{ i18n.t().bpm_avg_sub }}</span>
              </div>
              @if (neuro.activeStateId() === c.id) {
                <span class="active-badge">{{ i18n.t().active_tag }}</span>
              }
            </button>
          }
        </div>
      </div>

      <!-- DISPOSICIÓN PRINCIPAL EN 2 COLUMNAS (CEREBRO 3D + TELEMETRÍA Y CONTRAMEDIDAS) -->
      <div class="neuro-main-grid">
        <!-- COLUMNA IZQUIERDA: CEREBRO 3D INTERACTIVO -->
        <div class="brain-column">
          <div class="column-card brain-card">
            <div class="card-header">
              <div class="header-left">
                <span class="card-icon">🧠</span>
                <h4>{{ i18n.t().brain_map_title }}</h4>
              </div>
              <div class="header-right-actions">
                <span class="card-hint">{{ i18n.t().orbital_rot_hint }}</span>
              </div>
            </div>

            <!-- Visor 3D -->
            <app-brain-3d></app-brain-3d>

            <!-- Diagnóstico de Activación Límbica -->
            <div class="brain-diagnostic-box">
              <h5>{{ i18n.t().diag_box_title }}</h5>
              <p class="diag-desc">{{ neuro.activeCase().clinicalDescription }}</p>

              <div class="zones-activated-pillbox">
                <span class="pillbox-title">{{ i18n.t().zones_involved }}</span>
                <div class="pills-wrap">
                  @for (zone of neuro.activeCase().zonesActivated; track zone) {
                    <span class="zone-pill">{{ zone }}</span>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMNA DERECHA: GRÁFICA DE TELEMETRÍA DE SUEÑO & CONTRAMEDIDAS -->
        <div class="telemetry-column">
          <!-- Gráfica de 8 Horas de Sueño y Curva de LPM -->
          <div class="column-card timeline-card">
            <div class="card-header">
              <div class="header-left">
                <span class="card-icon">📈</span>
                <h4>{{ i18n.t().sleep_arch_title }}</h4>
              </div>
              <span class="card-hint">{{ i18n.t().sleep_arch_hint }}</span>
            </div>

            <div class="timeline-chart-wrapper">
              <div class="chart-bars-container">
                @for (pt of neuro.sleepTimeline(); track pt.hour) {
                  <div class="timeline-bar-column">
                    <div class="bar-value-label">{{ pt.lpm }}</div>
                    <div class="bar-track">
                      <div
                        class="bar-fill"
                        [style.height.%]="getLpmBarHeight(pt.lpm)"
                        [style.background-color]="getLpmBarColor(pt.lpm)"
                      ></div>
                    </div>
                    <div class="bar-stage-pill" [class]="pt.stage.toLowerCase()">{{ pt.stage }}</div>
                    <div class="bar-hour-label">{{ pt.hour }}</div>
                  </div>
                }
              </div>
            </div>

            <!-- Leyenda de Fases -->
            <div class="stages-legend">
              <span class="legend-item"><span class="dot n3"></span> {{ i18n.t().stage_n3 }}</span>
              <span class="legend-item"><span class="dot n2"></span> {{ i18n.t().stage_n2 }}</span>
              <span class="legend-item"><span class="dot rem"></span> {{ i18n.t().stage_rem }}</span>
              <span class="legend-item"><span class="dot vigilia"></span> {{ i18n.t().stage_wake }}</span>
            </div>
          </div>

          <!-- Protocolo Clínico y Botones de Contramedidas -->
          <div class="column-card countermeasures-card" [style.border-top-color]="neuro.activeCase().severityColor">
            <div class="cm-header">
              <span class="cm-icon">🛡️</span>
              <div>
                <h4>{{ neuro.activeCase().countermeasureTitle }}</h4>
                <p class="cm-sub">{{ i18n.t().guidelines_sub }}</p>
              </div>
            </div>

            <ul class="cm-list">
              @for (item of neuro.activeCase().countermeasures; track item) {
                <li>
                  <span class="check-bullet">✓</span>
                  <span>{{ item }}</span>
                </li>
              }
            </ul>

            <div class="cm-actions-row">
              @if (neuro.activeStateId() === 'ANXIETY') {
                <button
                  class="btn btn-breath"
                  (click)="openBreathing()"
                  title="4-7-8 Breathing"
                >
                  {{ i18n.t().btn_breath }}
                </button>
              }

              @if (neuro.activeStateId() === 'PANIC') {
                <button
                  class="btn btn-panic"
                  (click)="openPanic()"
                  title="Panic Rescue"
                >
                  {{ i18n.t().btn_panic }}
                </button>
              }

              @if (neuro.activeStateId() === 'PSYCHOSIS') {
                <button
                  class="btn btn-emergency"
                  (click)="openEmergency()"
                  title="Flight Surgeon SOS"
                >
                  {{ i18n.t().btn_emergency }}
                </button>
              }

              <button
                class="btn btn-report"
                (click)="openReport()"
                [title]="i18n.t().flight_report"
              >
                📄 {{ i18n.t().flight_report }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .neuro-sleep-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      animation: fadeIn 0.3s ease;
    }

    // Cabecera superior
    .neuro-header-banner {
      background: var(--card-glass-bg);
      backdrop-filter: var(--card-glass-blur);
      -webkit-backdrop-filter: var(--card-glass-blur);
      border-radius: 14px;
      padding: 1.25rem 1.75rem;
      border: var(--card-glass-border);
      border-left: 6px solid #10b981;
      box-shadow: var(--card-glass-shadow);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        padding: 1rem;
      }

      .header-main-info {
        .badge-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.35rem;

          .severity-pill {
            font-size: 0.7rem;
            font-weight: 800;
            color: #ffffff;
            padding: 2px 10px;
            border-radius: 999px;
            letter-spacing: 0.5px;
          }

          .lpm-tag {
            font-size: 0.78rem;
            color: #475569;
            strong {
              color: #0f172a;
            }
          }
        }

        h2 {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 800;
          color: #0f172a;
        }

        .headline-sub {
          margin: 0.25rem 0 0;
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
        }
      }

      .header-metrics-group {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;

        .metric-block {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 0.6rem 1rem;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          min-width: 130px;

          .metric-label {
            font-size: 0.68rem;
            color: #64748b;
            font-weight: 600;
          }

          .metric-value {
            font-size: 1rem;
            font-weight: 800;
            color: #0f172a;
            margin-top: 0.15rem;

            &.highlight {
              color: #2563eb;
            }
            &.danger {
              color: #ef4444;
            }
          }
        }
      }
    }

    // Panel del Simulador
    .simulator-panel-card {
      background: var(--card-glass-bg);
      backdrop-filter: var(--card-glass-blur);
      -webkit-backdrop-filter: var(--card-glass-blur);
      border: var(--card-glass-border);
      border-radius: 14px;
      padding: 1.1rem 1.4rem;
      box-shadow: var(--card-glass-shadow);
      display: flex;
      flex-direction: column;
      gap: 0.85rem;

      .sim-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .sim-title-box {
          display: flex;
          align-items: center;
          gap: 0.45rem;

          .sim-icon {
            font-size: 1.1rem;
          }

          h4 {
            margin: 0;
            font-size: 0.88rem;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.3px;
          }
        }

        .sim-badge {
          font-size: 0.68rem;
          font-weight: 700;
          background: #eff6ff;
          color: #2563eb;
          padding: 2px 8px;
          border-radius: 10px;
        }
      }

      .simulator-buttons-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.85rem;

        @media (max-width: 900px) {
          grid-template-columns: repeat(2, 1fr);
        }
        @media (max-width: 500px) {
          grid-template-columns: 1fr;
        }

        .sim-btn {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.75rem 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          text-align: left;

          &:hover {
            border-color: var(--case-color);
            background: #ffffff;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
          }

          &.active {
            border-color: var(--case-color);
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);

            .btn-title {
              color: var(--case-color);
            }
          }

          .btn-icon {
            font-size: 1.5rem;
          }

          .btn-texts {
            display: flex;
            flex-direction: column;

            .btn-title {
              font-size: 0.82rem;
              font-weight: 800;
              color: #1e293b;
              transition: color 0.2s;
            }

            .btn-sub {
              font-size: 0.72rem;
              color: #64748b;
              margin-top: 0.1rem;
            }
          }

          .active-badge {
            position: absolute;
            top: 6px;
            right: 8px;
            font-size: 0.62rem;
            font-weight: 800;
            background: var(--case-color);
            color: #ffffff;
            padding: 1px 6px;
            border-radius: 999px;
          }
        }
      }
    }

    // Grid principal en 2 columnas
    .neuro-main-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }

      .column-card {
        background: var(--card-glass-bg);
        backdrop-filter: var(--card-glass-blur);
        -webkit-backdrop-filter: var(--card-glass-blur);
        border: var(--card-glass-border);
        border-radius: 14px;
        padding: 1.25rem;
        box-shadow: var(--card-glass-shadow);
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.45rem;

          .card-icon {
            font-size: 1.15rem;
          }

          h4 {
            margin: 0;
            font-size: 0.95rem;
            font-weight: 800;
            color: #0f172a;
          }
        }

        .header-right-actions {
          display: flex;
          align-items: center;
          gap: 0.65rem;

          .card-hint {
            font-size: 0.68rem;
            color: #94a3b8;
            font-weight: 600;
          }
        }

        .card-hint {
          font-size: 0.68rem;
          color: #94a3b8;
          font-weight: 600;
        }
      }

      // Caja de diagnóstico 3D
      .brain-diagnostic-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 0.9rem 1rem;

        h5 {
          margin: 0 0 0.35rem 0;
          font-size: 0.82rem;
          font-weight: 700;
          color: #1e293b;
        }

        .diag-desc {
          margin: 0 0 0.65rem 0;
          font-size: 0.78rem;
          color: #475569;
          line-height: 1.4;
        }

        .zones-activated-pillbox {
          .pillbox-title {
            font-size: 0.72rem;
            font-weight: 700;
            color: #64748b;
            display: block;
            margin-bottom: 0.35rem;
          }

          .pills-wrap {
            display: flex;
            flex-wrap: wrap;
            gap: 0.35rem;

            .zone-pill {
              background: #ffffff;
              border: 1px solid #cbd5e1;
              color: #334155;
              padding: 2px 8px;
              border-radius: 8px;
              font-size: 0.7rem;
              font-weight: 600;
            }
          }
        }
      }

      // Gráfica de Línea de Tiempo de 8 Horas
      .timeline-card {
        .timeline-chart-wrapper {
          background: rgba(248, 250, 252, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.7);
          border-radius: 12px;
          padding: 1.25rem 0.75rem 0.75rem 0.75rem;

          .chart-bars-container {
            display: grid;
            grid-template-columns: repeat(9, 1fr);
            gap: 0.45rem;
            height: 160px;
            align-items: end;

            .timeline-bar-column {
              display: flex;
              flex-direction: column;
              align-items: center;
              height: 100%;
              justify-content: flex-end;
              gap: 0.25rem;

              .bar-value-label {
                font-size: 0.65rem;
                font-weight: 700;
                color: #0f172a;
              }

              .bar-track {
                width: 14px;
                height: 100px;
                background: #e2e8f0;
                border-radius: 4px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;

                .bar-fill {
                  width: 100%;
                  border-radius: 4px;
                  transition: height 0.4s ease, background-color 0.4s ease;
                }
              }

              .bar-stage-pill {
                font-size: 0.58rem;
                font-weight: 800;
                padding: 1px 4px;
                border-radius: 4px;
                text-transform: uppercase;

                &.n3 { background: #dcfce7; color: #15803d; }
                &.n2 { background: #e0f2fe; color: #0369a1; }
                &.n1 { background: #fef3c7; color: #b45309; }
                &.rem { background: #f3e8ff; color: #7e22ce; }
                &.vigilia { background: #fee2e2; color: #b91c1c; }
              }

              .bar-hour-label {
                font-size: 0.62rem;
                color: #94a3b8;
                font-weight: 600;
              }
            }
          }
        }

        .stages-legend {
          display: flex;
          justify-content: center;
          gap: 1rem;
          font-size: 0.7rem;
          color: #64748b;
          font-weight: 600;

          .legend-item {
            display: flex;
            align-items: center;
            gap: 0.3rem;

            .dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              &.n3 { background: #16a34a; }
              &.n2 { background: #0284c7; }
              &.rem { background: #9333ea; }
              &.vigilia { background: #ef4444; }
            }
          }
        }
      }

      // Tarjeta de Contramedidas y Acciones Médicas
      .countermeasures-card {
        border-top: 4px solid #10b981;

        .cm-header {
          display: flex;
          gap: 0.75rem;
          align-items: center;

          .cm-icon {
            font-size: 1.7rem;
          }

          h4 {
            margin: 0;
            font-size: 0.95rem;
            font-weight: 800;
            color: #0f172a;
          }

          .cm-sub {
            margin: 0.15rem 0 0;
            font-size: 0.75rem;
            color: #64748b;
          }
        }

        .cm-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;

          li {
            display: flex;
            align-items: flex-start;
            gap: 0.45rem;
            font-size: 0.78rem;
            color: #334155;
            line-height: 1.35;

            .check-bullet {
              color: #16a34a;
              font-weight: 900;
              line-height: 1.2;
            }
          }
        }

        .cm-actions-row {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;

          @media (max-width: 540px) {
            flex-direction: column;
          }

          .btn {
            flex: 1;
            padding: 0.7rem 1rem;
            border-radius: 10px;
            font-size: 0.82rem;
            font-weight: 700;
            cursor: pointer;
            border: none;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.35rem;

            &.btn-breath {
              background: linear-gradient(135deg, #0284c7, #2563eb);
              color: #ffffff;
              box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
              &:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
              }
            }

            &.btn-panic {
              background: linear-gradient(135deg, #ea580c, #c2410c);
              color: #ffffff;
              box-shadow: 0 4px 12px rgba(234, 88, 12, 0.28);
              &:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(234, 88, 12, 0.38);
              }
            }

            &.btn-emergency {
              background: linear-gradient(135deg, #ef4444, #b91c1c);
              color: #ffffff;
              box-shadow: 0 4px 12px rgba(239, 68, 68, 0.32);
              &:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(239, 68, 68, 0.45);
              }
            }

            &.btn-report {
              background: #f1f5f9;
              color: #0f172a;
              border: 1px solid #cbd5e1;
              &:hover {
                background: #e2e8f0;
                transform: translateY(-2px);
              }
            }
          }
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class NeuroSleepComponent {
  readonly neuro = inject(NeuroSleepService);
  readonly i18n = inject(I18nService);

  get caseList(): NeuroCaseConfig[] {
    return Object.values(this.neuro.cases);
  }

  simulate(caseId: NeuroStateId): void {
    this.neuro.simulateCase(caseId);
  }

  openBreathing(): void {
    this.neuro.openBreathingExercise();
  }

  openPanic(): void {
    this.neuro.openPanicGrounding();
  }

  openEmergency(): void {
    this.neuro.openEmergencySos();
  }

  openReport(): void {
    this.neuro.openFlightReport();
  }

  getLpmBarHeight(lpm: number): number {
    // Normalizar escala de 40 a 150 LPM
    return Math.min(100, Math.max(15, Math.round(((lpm - 40) / 110) * 100)));
  }

  getLpmBarColor(lpm: number): string {
    if (lpm < 65) return '#10b981'; // Verde (Óptimo)
    if (lpm < 95) return '#f59e0b'; // Ámbar (Ansiedad)
    if (lpm < 125) return '#f97316'; // Naranja (Pánico)
    return '#ef4444'; // Rojo (Crisis)
  }
}
