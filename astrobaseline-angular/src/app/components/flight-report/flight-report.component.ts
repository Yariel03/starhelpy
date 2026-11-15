import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissionStateService } from '../../core/services/mission-state.service';
import { ConfigService } from '../../core/services/config.service';
import { NasaDonkiService } from '../../core/services/nasa-donki.service';
import { NeuroSleepService } from '../../core/services/neuro-sleep.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-flight-report',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="report-modal-backdrop" (click)="closeOnBackdrop($event)">
      <div class="report-sheet">
        <!-- Barra de acciones superiores (No imprimible) -->
        <div class="report-top-actions no-print">
          <span class="confidential-tag">{{ i18n.t().report_confidential }}</span>
          <div class="action-buttons">
            <button class="btn btn-print" (click)="printReport()">{{ i18n.t().report_btn_print }}</button>
            <button class="btn btn-close" (click)="close()">{{ i18n.t().report_btn_close }}</button>
          </div>
        </div>

        <!-- Encabezado Oficial del Reporte Clínico de Misión -->
        <div class="clinical-header">
          <div class="header-branding">
            <img src="/assets/images/logo/logo-dark.png" alt="Start Helpy" class="report-header-logo" />
            <div class="brand-text">
              <h2>{{ i18n.t().report_title }}</h2>
              <p class="agency-sub">{{ i18n.t().report_sub }}</p>
            </div>
          </div>
          <div class="flight-meta-box">
            <div class="meta-row"><span>{{ i18n.t().report_mission }}</span> <strong>{{ destination().name }}</strong></div>
            <div class="meta-row"><span>{{ i18n.t().report_subject }}</span> <strong>{{ i18n.currentLang() === 'en' ? 'Astronaut' : 'Astronauta' }} {{ state.selectedAstronaut() }}</strong></div>
            <div class="meta-row"><span>{{ i18n.t().report_chronology }}</span> <strong>{{ i18n.t().sol }} {{ state.missionDay() }} {{ i18n.t().of_days }} {{ state.missionConfig().daysInSpace }} {{ i18n.t().days_unit }}</strong></div>
            <div class="meta-row"><span>{{ i18n.t().report_earth_date }}</span> <strong>{{ state.currentDate() || (i18n.currentLang() === 'en' ? 'Real Time' : 'Tiempo Real') }}</strong></div>
          </div>
        </div>

        <hr class="divider" />

        <!-- 1. Perfil Fisiológico y Comparativa con Línea Base de Tierra -->
        <section class="report-section">
          <h3 class="section-title">{{ i18n.t().report_sec1_title }}</h3>
          <p class="section-intro">{{ i18n.t().report_sec1_sub }}</p>
          <div class="vitals-table-wrapper">
            <table class="report-table">
              <thead>
                <tr>
                  <th>{{ i18n.t().report_col_bio }}</th>
                  <th>{{ i18n.t().report_col_base }}</th>
                  <th>{{ i18n.t().report_col_meas }}</th>
                  <th>{{ i18n.t().report_col_delta }}</th>
                  <th>{{ i18n.t().report_col_eval }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>{{ i18n.t().heart_resting }}</strong></td>
                  <td>58.2 bpm</td>
                  <td>61.9 bpm</td>
                  <td><span class="delta-tag plus">+6.3%</span></td>
                  <td><span class="badge-status ok">{{ i18n.currentLang() === 'en' ? 'Nominal (Microgravity)' : 'Nominal (Microgravedad)' }}</span></td>
                </tr>
                <tr>
                  <td><strong>{{ i18n.t().col_bp }} (Sistólica)</strong></td>
                  <td>115.0 mmHg</td>
                  <td>116.3 mmHg</td>
                  <td><span class="delta-tag plus">+1.1%</span></td>
                  <td><span class="badge-status ok">{{ i18n.currentLang() === 'en' ? 'Normal / No Cephalic Shift' : 'Normal / Sin Desplazamiento Cefálico Crítico' }}</span></td>
                </tr>
                <tr>
                  <td><strong>{{ i18n.t().col_glucose }}</strong></td>
                  <td>90.0 mg/dL</td>
                  <td>92.4 mg/dL</td>
                  <td><span class="delta-tag plus">+2.6%</span></td>
                  <td><span class="badge-status ok">{{ i18n.currentLang() === 'en' ? 'Optimal Metabolism' : 'Metabolismo Óptimo' }}</span></td>
                </tr>
                <tr>
                  <td><strong>{{ i18n.t().col_temp }}</strong></td>
                  <td>36.5 °C</td>
                  <td>36.6 °C</td>
                  <td><span class="delta-tag neutral">+0.2%</span></td>
                  <td><span class="badge-status ok">{{ i18n.currentLang() === 'en' ? 'Stable Thermoregulation' : 'Termorregulación Estable' }}</span></td>
                </tr>
                <tr>
                  <td><strong>{{ i18n.t().col_sleep }}</strong></td>
                  <td>7.8 h</td>
                  <td>{{ neuro.activeCase().id === 'PSYCHOSIS' ? '2.1 h' : '6.9 h' }}</td>
                  <td><span class="delta-tag minus">{{ neuro.activeCase().id === 'PSYCHOSIS' ? '-73%' : '-11.5%' }}</span></td>
                  <td>
                    <span class="badge-status" [class.alert]="neuro.activeCase().id === 'PSYCHOSIS'" [class.ok]="neuro.activeCase().id !== 'PSYCHOSIS'">
                      {{ neuro.activeCase().id === 'PSYCHOSIS' ? (i18n.currentLang() === 'en' ? 'Critical Alert: Severe Insomnia' : 'Alerta Crítica: Insomnio') : (i18n.currentLang() === 'en' ? 'Acceptable Adaptation' : 'Adaptativo Aceptable') }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 2. Adherencia Física y Protocolo de Preservación Muscular / Ósea -->
        <section class="report-section">
          <h3 class="section-title">{{ i18n.currentLang() === 'en' ? '2. Physical Training Protocol & Atrophy Mitigation' : '2. Protocolo de Entrenamiento Físico y Combate a la Atrofia' }}</h3>
          <div class="exercise-summary-grid">
            <div class="summary-card">
              <span class="card-label">{{ i18n.t().assigned_goal }}:</span>
              <strong class="card-val">{{ goal().name }}</strong>
              <p class="card-desc">{{ goal().archetype }}</p>
            </div>
            <div class="summary-card">
              <span class="card-label">{{ i18n.currentLang() === 'en' ? 'Consecutive Streak:' : 'Racha Consecutiva:' }}</span>
              <strong class="card-val flame">🔥 {{ state.missionDay() }} {{ i18n.currentLang() === 'en' ? 'Days Active' : 'Días Activos' }}</strong>
              <p class="card-desc">{{ state.completedExercisesCount() }} / {{ state.currentExercises().length }} {{ i18n.currentLang() === 'en' ? 'exercises completed today' : 'ejercicios completados en el Sol actual' }}</p>
            </div>
            <div class="summary-card">
              <span class="card-label">{{ i18n.currentLang() === 'en' ? 'Muscle Preservation Index:' : 'Índice de Preservación Muscular:' }}</span>
              <strong class="card-val green">96.4% {{ i18n.t().status_optimal }}</strong>
              <p class="card-desc">{{ i18n.currentLang() === 'en' ? 'Continuous resistive guided load against osteopenia' : 'Carga guiada resistiva continua contra osteopenia' }}</p>
            </div>
          </div>
        </section>

        <!-- 3. Clima Espacial y Radiación Ionizante NASA DONKI -->
        <section class="report-section">
          <h3 class="section-title">{{ i18n.currentLang() === 'en' ? '3. Space Radiation Exposure (NASA DONKI Live)' : '3. Exposición a Radiación Espacial (NASA DONKI Live)' }}</h3>
          <div class="radiation-report-box" [class.danger]="nasa.isDangerous()">
            <div class="rad-header">
              <div class="rad-status-pill" [class.danger]="nasa.isDangerous()">
                {{ nasa.isDangerous() ? (i18n.currentLang() === 'en' ? '☢️ HAZARDOUS RADIATION (>1000 pfu)' : '☢️ RADIACIÓN PELIGROSA (>1000 pfu)') : (i18n.currentLang() === 'en' ? '🛡️ NOMINAL / SAFE RADIATION LEVELS' : '🛡️ NIVELES NOMINALES / SEGUROS') }}
              </div>
              <span class="rad-time">{{ i18n.currentLang() === 'en' ? 'Satellite scan:' : 'Último escaneo satelital:' }} {{ lastCheckedStr() }}</span>
            </div>
            <p class="rad-headline"><strong>{{ i18n.currentLang() === 'en' ? 'DONKI Diagnosis:' : 'Diagnóstico DONKI:' }}</strong> {{ nasa.radiationHeadline() }}</p>
            <p class="rad-details">{{ nasa.radiationDetails() }}</p>
            <div class="rad-recommendation">
              <strong>{{ i18n.currentLang() === 'en' ? 'Spacewalk (EVA) Recommendation:' : 'Recomendación para Caminatas Espaciales (EVA):' }}</strong>
              {{ nasa.isDangerous() ? (i18n.currentLang() === 'en' ? 'IMMEDIATELY PROHIBITED. Shelter in water/polyethylene shielded quarters.' : 'PROHIBIDAS DE INMEDIATO. Permanecer en módulo con blindaje hídrico/polietileno.') : (i18n.currentLang() === 'en' ? 'AUTHORIZED. Energetic particle flux within permissible NASA bounds.' : 'AUTORIZADAS. Parámetros de partículas energéticas dentro de los límites permisibles de la NASA.') }}
            </div>
          </div>
        </section>

        <!-- 4. Neuroconducta, Arquitectura de Sueño y Diagnóstico Límbico -->
        <section class="report-section">
          <h3 class="section-title">{{ i18n.currentLang() === 'en' ? '4. Neurobehavioral Status, Brain-Heart Axis & Sleep' : '4. Estado Neuroconductual, Eje Cerebro-Corazón y Sueño' }}</h3>
          <div class="neuro-summary-box" [style.border-left-color]="neuro.activeCase().severityColor">
            <div class="neuro-top">
              <span class="neuro-badge" [style.background-color]="neuro.activeCase().severityColor">
                {{ neuro.activeCase().shortName }} ({{ neuro.liveLpm() }} BPM)
              </span>
              <span class="neuro-stage">{{ i18n.t().dominant_stage }} <strong>{{ neuro.activeCase().dominantStage }}</strong></span>
            </div>
            <p class="neuro-headline"><strong>{{ neuro.activeCase().headline }}</strong></p>
            <p class="neuro-desc">{{ neuro.activeCase().clinicalDescription }}</p>
            <div class="neuro-zones">
              <span class="zones-title">{{ i18n.t().zones_involved }}</span>
              <ul class="zones-list">
                @for (zone of neuro.activeCase().zonesActivated; track zone) {
                  <li>{{ zone }}</li>
                }
              </ul>
            </div>
          </div>
        </section>

        <!-- Validación Digital del Sistema -->
        <div class="clinical-signature-footer">
          <div class="footer-system-info">
            <span class="system-title">{{ i18n.currentLang() === 'en' ? 'Autonomous Telemetry & Crew Health System' : 'Sistema Autónomo de Telemetría y Salud de Tripulación' }}</span>
            <span class="system-sub">{{ i18n.currentLang() === 'en' ? 'Validated and synchronized in real time for orbital mission' : 'Datos validados y sincronizados en tiempo real para misión orbital' }}</span>
          </div>
          <div class="system-stamp">
            <span class="stamp-pill">PROCESSED BY START HELPY v2.0</span>
            <span class="stamp-time">{{ i18n.currentLang() === 'en' ? 'Synchronized Telemetry' : 'Telemetría Sincronizada' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .report-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: flex-start;
      z-index: 100000;
      padding: 2rem 1rem;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    .report-sheet {
      background: #ffffff;
      color: #0f172a;
      width: 100%;
      max-width: 850px;
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
      font-family: var(--font-family-base);
      margin: auto;
      border: 1px solid #cbd5e1;
    }

    .report-top-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;

      .confidential-tag {
        font-size: 0.72rem;
        font-weight: 800;
        color: #64748b;
        letter-spacing: 0.5px;
      }

      .action-buttons {
        display: flex;
        gap: 0.5rem;

        .btn {
          padding: 0.45rem 0.9rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;

          &.btn-print {
            background: #2563eb;
            color: #ffffff;
            &:hover {
              background: #1d4ed8;
            }
          }

          &.btn-close {
            background: #f1f5f9;
            color: #475569;
            &:hover {
              background: #e2e8f0;
              color: #0f172a;
            }
          }
        }
      }
    }

    .clinical-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;

      .header-branding {
        display: flex;
        align-items: center;
        gap: 1rem;

        .report-header-logo {
          height: 48px;
          max-width: 140px;
          object-fit: contain;
        }

        .brand-text {
          h2 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 800;
            color: #0f172a;
          }
          .agency-sub {
            margin: 0.2rem 0 0;
            font-size: 0.76rem;
            color: #64748b;
          }
        }
      }

      .flight-meta-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 0.6rem 0.85rem;
        border-radius: 8px;
        font-size: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        min-width: 220px;

        .meta-row {
          display: flex;
          justify-content: space-between;
          span {
            color: #64748b;
          }
          strong {
            color: #0f172a;
          }
        }
      }
    }

    .divider {
      border: none;
      border-top: 1.5px solid #0f172a;
      margin: 1.25rem 0;
    }

    .report-section {
      margin-bottom: 1.5rem;

      .section-title {
        font-size: 0.95rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 0.5rem 0;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 0.3rem;
      }

      .section-intro {
        font-size: 0.78rem;
        color: #64748b;
        margin: 0 0 0.6rem 0;
      }
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;

      th, td {
        padding: 0.5rem 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
      }

      th {
        background: #f8fafc;
        font-weight: 700;
        color: #475569;
      }

      .delta-tag {
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 0.72rem;
        &.plus {
          background: #eff6ff;
          color: #2563eb;
        }
        &.minus {
          background: #fff1f2;
          color: #e11d48;
        }
        &.neutral {
          background: #f1f5f9;
          color: #64748b;
        }
      }

      .badge-status {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        &.ok {
          background: #dcfce7;
          color: #166534;
        }
        &.alert {
          background: #fee2e2;
          color: #991b1b;
        }
      }
    }

    .exercise-summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.85rem;

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }

      .summary-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.75rem;
        display: flex;
        flex-direction: column;

        .card-label {
          font-size: 0.68rem;
          color: #64748b;
          font-weight: 600;
        }
        .card-val {
          font-size: 0.95rem;
          color: #0f172a;
          margin: 0.2rem 0;
          &.flame {
            color: #ea580c;
          }
          &.green {
            color: #16a34a;
          }
        }
        .card-desc {
          font-size: 0.72rem;
          color: #64748b;
          margin: 0;
        }
      }
    }

    .radiation-report-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.85rem;

      &.danger {
        background: #fff1f2;
        border-color: #fca5a5;
      }

      .rad-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.4rem;

        .rad-status-pill {
          font-size: 0.72rem;
          font-weight: 800;
          background: #dcfce7;
          color: #15803d;
          padding: 2px 8px;
          border-radius: 999px;
          &.danger {
            background: #ef4444;
            color: #ffffff;
          }
        }

        .rad-time {
          font-size: 0.68rem;
          color: #64748b;
        }
      }

      .rad-headline {
        margin: 0.2rem 0;
        font-size: 0.8rem;
        color: #0f172a;
      }

      .rad-details {
        margin: 0.2rem 0 0.5rem;
        font-size: 0.75rem;
        color: #475569;
        line-height: 1.35;
      }

      .rad-recommendation {
        font-size: 0.75rem;
        color: #1e293b;
        background: rgba(255, 255, 255, 0.7);
        padding: 0.45rem 0.65rem;
        border-radius: 6px;
      }
    }

    .neuro-summary-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 5px solid #2563eb;
      border-radius: 8px;
      padding: 0.85rem;

      .neuro-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.4rem;

        .neuro-badge {
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 999px;
        }

        .neuro-stage {
          font-size: 0.72rem;
          color: #64748b;
        }
      }

      .neuro-headline {
        margin: 0.2rem 0;
        font-size: 0.82rem;
        color: #0f172a;
      }

      .neuro-desc {
        margin: 0.2rem 0 0.5rem;
        font-size: 0.76rem;
        color: #475569;
        line-height: 1.35;
      }

      .neuro-zones {
        .zones-title {
          font-size: 0.72rem;
          font-weight: 700;
          color: #334155;
        }
        .zones-list {
          margin: 0.2rem 0 0 1.25rem;
          padding: 0;
          font-size: 0.74rem;
          color: #475569;
        }
      }
    }

    .clinical-signature-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #cbd5e1;
      padding-top: 1rem;
      margin-top: 1.5rem;

      .footer-system-info {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;

        .system-title {
          font-size: 0.76rem;
          font-weight: 800;
          color: #0f172a;
        }

        .system-sub {
          font-size: 0.68rem;
          color: #64748b;
        }
      }

      .system-stamp {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.2rem;

        .stamp-pill {
          font-size: 0.68rem;
          font-weight: 800;
          background: #eff6ff;
          color: #2563eb;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid #bfdbfe;
        }
        .stamp-time {
          font-size: 0.65rem;
          color: #94a3b8;
        }
      }
    }

    @media print {
      .no-print {
        display: none !important;
      }
      .report-modal-backdrop {
        position: static !important;
        background: none !important;
        padding: 0 !important;
      }
      .report-sheet {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
    }
  `],
})
export class FlightReportComponent {
  readonly state = inject(MissionStateService);
  readonly config = inject(ConfigService);
  readonly nasa = inject(NasaDonkiService);
  readonly neuro = inject(NeuroSleepService);
  readonly i18n = inject(I18nService);

  readonly destination = computed(() => {
    const env = this.state.selectedEnvironment();
    return (
      this.config.DESTINATIONS.find((d) => d.environmentKey === env) ||
      this.config.DESTINATIONS[0]
    );
  });

  readonly goal = computed(() => {
    const sid = this.state.selectedAstronaut();
    return (
      this.config.TRAINING_GOALS.find((g) => g.id === sid) ||
      this.config.TRAINING_GOALS[0]
    );
  });

  readonly lastCheckedStr = computed(() => {
    return this.nasa.lastCheckedTime().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  printReport(): void {
    window.print();
  }

  close(): void {
    this.neuro.closeFlightReport();
  }

  closeOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('report-modal-backdrop')) {
      this.close();
    }
  }
}
