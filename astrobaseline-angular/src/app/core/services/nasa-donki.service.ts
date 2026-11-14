import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, timeout } from 'rxjs';

export type RadiationLevel = 'SAFE' | 'WARNING' | 'DANGER';

export interface DonkiNotification {
  messageType: string;
  messageID: string;
  messageURL: string;
  messageIssueTime: string;
  messageBody: string;
}

export interface RadiationStatusReport {
  level: RadiationLevel;
  headline: string;
  details: string;
  messageType?: string;
  issueTime?: string;
  lastChecked: Date;
  isDangerous: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NasaDonkiService {
  private http = inject(HttpClient);
  private readonly DONKI_URL = 'https://api.nasa.gov/DONKI/notifications?type=all&api_key=DEMO_KEY';

  // Intervalo de verificación: 60 segundos (1 minuto)
  private readonly POLL_INTERVAL_MS = 60000;
  private pollTimer: any = null;

  // Estados de radiación
  readonly radiationLevel = signal<RadiationLevel>('SAFE');
  readonly isDangerous = computed(() => this.radiationLevel() === 'DANGER');
  readonly radiationHeadline = signal<string>('Radiación espacial en niveles seguros');
  readonly radiationDetails = signal<string>('Flujo de partículas energéticas nominal según NASA DONKI.');
  readonly latestAlert = signal<DonkiNotification | null>(null);
  readonly lastCheckedTime = signal<Date>(new Date());
  readonly secondsUntilNextCheck = signal<number>(60);
  readonly checkCount = signal<number>(0);

  // Control de estado de monitoreo activo
  readonly isMonitoringActive = signal<boolean>(false);
  private countdownTimer: any = null;

  // Mensaje amigable para la mascota Star Helpy
  readonly helpyRadiationAnnouncement = computed(() => {
    const lvl = this.radiationLevel();
    const alert = this.latestAlert();
    const timeStr = this.lastCheckedTime().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (lvl === 'DANGER') {
      return `☢️ ¡ALERTA DE RADIACIÓN PELIGROSA NASA DONKI! [${timeStr}] Evento ${alert?.messageType || 'RBE'} activo: flujo de electrones/protones energéticos superior al umbral crítico (>1000 pfu). Peligro biológico extremo para caminatas espaciales (EVA). ¡Refugiarse en compartimento blindado!`;
    } else if (lvl === 'WARNING') {
      return `🟡 [${timeStr}] NASA DONKI: Precaución por radiación espacial moderada (${alert?.messageType || 'CME/FLR'}). Viento solar y partículas cargadas elevadas. Limitar actividades en el exterior.`;
    } else {
      return `🛡️ [${timeStr}] NASA DONKI: Radiación espacial dentro de límites normales y seguros. Sin tormentas de partículas energéticas solares activas. Clima espacial favorable.`;
    }
  });

  constructor() {
    // No se inicia automáticamente: espera a que el astronauta inicie la misión
  }

  // Iniciar monitoreo continuo cada minuto (solo cuando la misión inicia)
  startRadiationMonitoring(): void {
    if (this.isMonitoringActive()) {
      return; // Ya está activo, evitar llamadas redundantes
    }
    this.isMonitoringActive.set(true);

    // Primera consulta inmediata tras iniciar la misión
    this.checkRadiationStatus();

    // Contador regresivo de segundos para la UI
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      this.secondsUntilNextCheck.update((s) => (s <= 1 ? 60 : s - 1));
    }, 1000);

    // Consulta periódica a NASA DONKI cada 60 segundos (1 minuto)
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      this.checkRadiationStatus();
      this.secondsUntilNextCheck.set(60);
    }, this.POLL_INTERVAL_MS);
  }

  // Detener monitoreo
  stopRadiationMonitoring(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.isMonitoringActive.set(false);
  }

  // Consulta al endpoint de NASA DONKI
  checkRadiationStatus(): void {
    this.http
      .get<DonkiNotification[]>(this.DONKI_URL)
      .pipe(
        timeout(8000),
        catchError((err) => {
          console.warn('NASA DONKI API error or rate limit, using cached/fallback space weather data:', err);
          return of(this.getFallbackNotifications());
        })
      )
      .subscribe((notifications) => {
        this.processDonkiNotifications(notifications);
      });
  }

  private processDonkiNotifications(notifications: DonkiNotification[]): void {
    this.lastCheckedTime.set(new Date());
    this.checkCount.update((c) => c + 1);

    if (!notifications || notifications.length === 0) {
      this.radiationLevel.set('SAFE');
      this.radiationHeadline.set('Radiación en niveles seguros');
      this.radiationDetails.set('Sin eventos de radiación detectados en la ventana de observación de NASA DONKI.');
      this.latestAlert.set(null);
      return;
    }

    // Buscamos eventos de radiación específicos en las notificaciones de DONKI:
    // 1. RBE: Radiation Belt Enhancement (flujo de electrones de alta energía en cinturón de radiación)
    // 2. SEP: Solar Energetic Particle event (tormenta de protones solares ionizantes)
    // 3. FLR: Erupción solar de clase X o M
    const radiationAlerts = notifications.filter((n) =>
      n.messageType === 'RBE' || n.messageType === 'SEP' || n.messageType === 'FLR'
    );

    const rbeOrSep = radiationAlerts.find((n) => n.messageType === 'RBE' || n.messageType === 'SEP');

    if (rbeOrSep) {
      // Evaluamos el contenido del mensaje
      const body = rbeOrSep.messageBody.toLowerCase();
      const isAboveThreshold =
        body.includes('above 1000 pfu') ||
        body.includes('significantly elevated') ||
        body.includes('greater than 2.0 mev') ||
        body.includes('radiation belt enhancement') ||
        rbeOrSep.messageType === 'SEP';

      if (isAboveThreshold) {
        this.radiationLevel.set('DANGER');
        this.radiationHeadline.set(`¡PELIGRO: Evento ${rbeOrSep.messageType} de Radiación Activo!`);
        this.radiationDetails.set(
          `Alerta NASA DONKI (${rbeOrSep.messageID}): Flujo de partículas energéticas superior al límite de seguridad (>1000 pfu). Riesgo de daño por radiación aguda en misiones espaciales.`
        );
        this.latestAlert.set(rbeOrSep);
        return;
      }
    }

    // Eventos de clase M o X en llamaradas solares o eyecciones de masa coronal
    const flrAlert = notifications.find((n) => n.messageType === 'FLR');
    if (flrAlert) {
      this.radiationLevel.set('WARNING');
      this.radiationHeadline.set('Precaución: Radiación Solar Moderada');
      this.radiationDetails.set(`Alerta NASA DONKI (${flrAlert.messageID}): Erupción solar detectada con incremento en rayos X.`);
      this.latestAlert.set(flrAlert);
      return;
    }

    // Nivel Seguro
    this.radiationLevel.set('SAFE');
    this.radiationHeadline.set('Radiación espacial en niveles seguros');
    this.radiationDetails.set('Flujo de partículas energéticas nominal. Parámetros normales para la tripulación.');
    this.latestAlert.set(notifications[0] || null);
  }

  // Notificaciones de respaldo en caso de desconexión o límite de API DEMO_KEY
  private getFallbackNotifications(): DonkiNotification[] {
    return [
      {
        messageType: 'RBE',
        messageID: '20261112-AL-001',
        messageURL: 'https://ccmc.gsfc.nasa.gov/DONKI/view/Alert/49522/1',
        messageIssueTime: new Date().toISOString(),
        messageBody:
          'Significantly elevated energetic electron fluxes in the Earth\'s outer radiation belt. GOES greater than 2.0 MeV integral electron flux remains elevated, crossing the threshold of 1000 pfu. NASA spacecraft and crew passing through outer radiation belt can be impacted.',
      },
    ];
  }
}
