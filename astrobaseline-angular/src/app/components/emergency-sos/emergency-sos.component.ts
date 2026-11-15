import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NeuroSleepService } from '../../core/services/neuro-sleep.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-emergency-sos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="emergency-modal-backdrop" (click)="closeOnBackdrop($event)">
      <div class="emergency-card">
        <!-- Cabecera de Emergencia Médica Nivel 3 -->
        <div class="modal-header">
          <div class="header-left">
            <span class="header-icon">!</span>
            <div>
              <h3>{{ i18n.currentLang() === 'en' ? 'Level 3 Emergency Medical Protocol (Psychosis)' : 'Protocolo Médico de Emergencia Nivel 3 (Psicosis)' }}</h3>
              <p class="subtitle">{{ i18n.currentLang() === 'en' ? 'Space Safety Directive · Flight Surgeon Alert & Safety Lockdown' : 'Directriz Médica de Seguridad ISS · Alerta a Houston & Bloqueo Cautelar' }}</p>
            </div>
          </div>
          <button class="close-btn" (click)="close()" [title]="i18n.currentLang() === 'en' ? 'Close' : 'Cerrar'">✕</button>
        </div>

        <!-- Telemetría Crítica -->
        <div class="emergency-telemetry-strip">
          <div class="tele-box danger-box">
            <span class="label">{{ i18n.currentLang() === 'en' ? 'Clinical State:' : 'Estado Clínico:' }}</span>
            <span class="val">{{ i18n.currentLang() === 'en' ? 'Neurobehavioral Decompensation' : 'Descompensación Neuroconductual' }}</span>
          </div>
          <div class="tele-box danger-box">
            <span class="label">{{ i18n.currentLang() === 'en' ? 'Critical Rate:' : 'Frecuencia Crítica:' }}</span>
            <span class="val">138 BPM ({{ i18n.currentLang() === 'en' ? 'Prefrontal Hypoactivity' : 'Hipoactividad Prefrontal' }})</span>
          </div>
          <div class="tele-box secure-box">
            <span class="label">{{ i18n.currentLang() === 'en' ? 'Ground Link:' : 'Enlace con Tierra:' }}</span>
            <span class="val">{{ i18n.currentLang() === 'en' ? 'Flight Surgeon Connected' : 'CAPCOM / Médico Conectado' }}</span>
          </div>
        </div>

        <!-- Contramedidas de Emergencia en Lista Activa -->
        <div class="emergency-content">
          <h4 class="section-title">{{ i18n.currentLang() === 'en' ? 'Clinical and Operational Measures Executed Immediately:' : 'Medidas Clínicas y Operacionales Ejecutadas de Inmediato:' }}</h4>

          <div class="action-card-list">
            <!-- 1. Bloqueo Cautelar -->
            <div class="action-card locked">
              <span class="action-badge-icon">●</span>
              <div class="action-text">
                <strong>{{ i18n.currentLang() === 'en' ? 'Safety Lockdown of Critical Controls Active' : 'Bloqueo Cautelar de Mandos Críticos Activo' }}</strong>
                <p>{{ i18n.currentLang() === 'en' ? 'Airlock controls (EVA) and orbital thruster manual navigation are secured under automatic ground control to safeguard crew.' : 'Las esclusas de despresurización EVA y mandos de propulsión manual quedan asegurados bajo control automático de Tierra para salvaguardar a la tripulación.' }}</p>
              </div>
            </div>

            <!-- 2. Telemetría a Cirujano de Vuelo -->
            <div class="action-card transmitted">
              <span class="action-badge-icon">●</span>
              <div class="action-text">
                <strong>{{ i18n.currentLang() === 'en' ? 'Brain Telemetry & Holter Transmitted to Flight Surgeon' : 'Telemetría Encefálica y Holter Transmitida al Cirujano' }}</strong>
                <p>{{ i18n.currentLang() === 'en' ? 'Mission Psychiatry and Flight Surgeon receive full cortical hypofunction mapping and amygdala telemetry to guide medical protocol.' : 'El equipo de Psiquiatría Aeroespacial en Houston dispone del registro completo de hipocorteza y zonas de amígdala activadas para pautar el sedante oral de rescate.' }}</p>
              </div>
            </div>

            <!-- 3. Entorno Circadiano y Audio Familiar -->
            <div class="action-card ambient">
              <span class="action-badge-icon">●</span>
              <div class="action-text">
                <strong>{{ i18n.currentLang() === 'en' ? 'Cognitive Grounding Link & Family Support Audio' : 'Reanclaje Cognitivo con Tierra & Audio Familiar' }}</strong>
                <p>{{ i18n.currentLang() === 'en' ? 'Warm amber cabin lighting enabled (blue-spectrum cut) with private familiar audio channel to reorient the astronaut to reality.' : 'Activada iluminación ámbar suave de cabina (sin espectro azul) y canal de audio de voz familiar de apoyo para reorientar al astronauta a la realidad.' }}</p>
              </div>
            </div>
          </div>

          <!-- Cuadro de Diálogo de Star Helpy -->
          <div class="helpy-sos-banner">
            <span class="helpy-avatar">AI</span>
            <div class="helpy-sos-text">
              <strong>{{ i18n.currentLang() === 'en' ? 'Star Helpy is with you:' : 'Star Helpy te acompaña:' }}</strong>
              <p>{{ i18n.currentLang() === 'en' ? '"Commander, you are safe. We have secured the ship and the Flight Surgeon has your telemetry. Now you must rest; we will manage the systems."' : '"Comandante, no estás solo. Hemos asegurado la nave y el Cirujano de Vuelo tiene tu telemetría. Ahora tú solo debes descansar; nosotros nos encargamos de los sistemas."' }}</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="close()">{{ i18n.currentLang() === 'en' ? 'Close Window' : 'Cerrar Ventana' }}</button>
          <button class="btn btn-emergency-confirm" (click)="finish()">
            {{ i18n.currentLang() === 'en' ? '✓ Administer Medical Countermeasure & Enforce Rest' : '✓ Administrar Contramedida Médica y Pasar a Reposo Forzado' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .emergency-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.25rem;
      animation: modalFade 0.25s ease;
    }

    .emergency-card {
      background: #ffffff;
      border-radius: 18px;
      width: 100%;
      max-width: 620px;
      box-shadow: 0 20px 50px rgba(239, 68, 68, 0.35);
      border: 2px solid #ef4444;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      background: linear-gradient(135deg, #fef2f2, #fee2e2);
      border-bottom: 1px solid #fca5a5;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        align-items: center;
        gap: 0.9rem;

        .header-icon {
          font-size: 1.8rem;
          background: #fee2e2;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          border: 1px solid #f87171;
        }

        h3 {
          margin: 0;
          font-size: 1.08rem;
          font-weight: 800;
          color: #991b1b;
        }

        .subtitle {
          margin: 0.2rem 0 0;
          font-size: 0.76rem;
          color: #b91c1c;
        }
      }

      .close-btn {
        background: transparent;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: #991b1b;
        padding: 4px 8px;
        border-radius: 6px;
        transition: background 0.2s;

        &:hover {
          background: rgba(239, 68, 68, 0.15);
        }
      }
    }

    .emergency-telemetry-strip {
      display: flex;
      padding: 0.8rem 1.5rem;
      background: #0f172a;
      gap: 1rem;
      justify-content: space-between;
      flex-wrap: wrap;

      .tele-box {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;

        .label {
          font-size: 0.68rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .val {
          font-size: 0.82rem;
          font-weight: 800;
        }

        &.danger-box .val {
          color: #f87171;
        }

        &.secure-box .val {
          color: #34d399;
        }
      }
    }

    .emergency-content {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: #fdfdfd;

      .section-title {
        margin: 0;
        font-size: 0.88rem;
        font-weight: 800;
        color: #1e293b;
      }

      .action-card-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;

        .action-card {
          display: flex;
          align-items: flex-start;
          gap: 0.9rem;
          padding: 0.85rem 1rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;

          &.locked {
            background: #fef2f2;
            border-color: #fecaca;
            .action-badge-icon {
              background: #ef4444;
              color: #ffffff;
            }
          }

          &.transmitted {
            background: #eff6ff;
            border-color: #bfdbfe;
            .action-badge-icon {
              background: #3b82f6;
              color: #ffffff;
            }
          }

          &.ambient {
            background: #f0fdf4;
            border-color: #bbf7d0;
            .action-badge-icon {
              background: #10b981;
              color: #ffffff;
            }
          }

          .action-badge-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.95rem;
            flex-shrink: 0;
          }

          .action-text {
            display: flex;
            flex-direction: column;
            gap: 0.2rem;

            strong {
              font-size: 0.84rem;
              color: #0f172a;
            }

            p {
              margin: 0;
              font-size: 0.78rem;
              color: #475569;
              line-height: 1.35;
            }
          }
        }
      }

      .helpy-sos-banner {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        background: linear-gradient(135deg, #fef3c7, #fef08a);
        padding: 0.85rem 1rem;
        border-radius: 10px;
        border: 1px solid #fde047;

        .helpy-avatar {
          font-size: 1.6rem;
        }

        .helpy-sos-text {
          strong {
            font-size: 0.82rem;
            color: #854d0e;
          }

          p {
            margin: 0.15rem 0 0;
            font-size: 0.78rem;
            color: #713f12;
            font-style: italic;
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

        &.btn-emergency-confirm {
          background: linear-gradient(135deg, #ef4444, #b91c1c);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);

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
export class EmergencySosComponent {
  readonly neuro = inject(NeuroSleepService);
  readonly i18n = inject(I18nService);

  close(): void {
    this.neuro.closeEmergencySos();
  }

  closeOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('emergency-modal-backdrop')) {
      this.close();
    }
  }

  finish(): void {
    this.neuro.finishEmergencySos();
  }
}
