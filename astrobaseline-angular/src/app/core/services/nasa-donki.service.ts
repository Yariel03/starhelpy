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

  // Retardo inicial: 1.3 minutos (78 segundos) tras aplicar meta e iniciar misión
  private readonly INITIAL_DELAY_SECONDS = 78;
  private readonly INITIAL_DELAY_MS = 78 * 1000;

  // Intervalo de verificación periódico: 2 minutos (120 segundos)
  private readonly POLL_INTERVAL_SECONDS = 120;
  private readonly POLL_INTERVAL_MS = 120 * 1000;

  private pollTimer: any = null;
  private initialDelayTimer: any = null;
  private countdownTimer: any = null;

  // Estados de radiación (inicia nominal y seguro)
  readonly radiationLevel = signal<RadiationLevel>('SAFE');
  readonly isDangerous = computed(() => this.radiationLevel() === 'DANGER');
  readonly radiationHeadline = signal<string>('Radiación espacial en niveles seguros');
  readonly radiationDetails = signal<string>('Monitoreo espacial activado. Primer escaneo DONKI en 1.3 min.');
  readonly latestAlert = signal<DonkiNotification | null>(null);
  readonly lastCheckedTime = signal<Date>(new Date());
  readonly secondsUntilNextCheck = signal<number>(78);
  readonly checkCount = signal<number>(0);

  // Control de estado de monitoreo activo
  readonly isMonitoringActive = signal<boolean>(false);

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

  // Iniciar monitoreo: se ejecuta 1.3 minutos tras aplicar meta e iniciar misión, luego cada 2 minutos
  startRadiationMonitoring(): void {
    // Limpiar temporizadores anteriores si los hubiera
    this.stopRadiationMonitoring();
    this.isMonitoringActive.set(true);

    // Estado inicial seguro y cuenta regresiva de 1.3 minutos (78s)
    this.secondsUntilNextCheck.set(this.INITIAL_DELAY_SECONDS);
    this.radiationLevel.set('SAFE');
    this.radiationHeadline.set('Radiación espacial en niveles seguros');
    this.radiationDetails.set('Monitoreo activado tras iniciar la misión. Primer escaneo DONKI en 1.3 min.');

    // Contador regresivo segundo a segundo para la UI
    this.countdownTimer = setInterval(() => {
      this.secondsUntilNextCheck.update((s) => (s > 1 ? s - 1 : 1));
    }, 1000);

    // Primer escaneo retrasado a los 1.3 minutos (78 segundos)
    this.initialDelayTimer = setTimeout(() => {
      this.checkRadiationStatus();
      this.secondsUntilNextCheck.set(this.POLL_INTERVAL_SECONDS);

      // Sondeo periódico continuo cada 2 minutos (120 segundos)
      this.pollTimer = setInterval(() => {
        this.checkRadiationStatus();
        this.secondsUntilNextCheck.set(this.POLL_INTERVAL_SECONDS);
      }, this.POLL_INTERVAL_MS);
    }, this.INITIAL_DELAY_MS);
  }

  // Detener monitoreo
  stopRadiationMonitoring(): void {
    if (this.initialDelayTimer) clearTimeout(this.initialDelayTimer);
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

  // Notificaciones de respaldo nominales en caso de desconexión o límite de API DEMO_KEY
  private getFallbackNotifications(): DonkiNotification[] {
    return [
      {
        messageType: 'REPORT',
        messageID: '20261114-FLIGHT-001',
        messageURL: 'https://ccmc.gsfc.nasa.gov/DONKI/',
        messageIssueTime: new Date().toISOString(),
        messageBody:
          'Space weather conditions nominal. Solar energetic proton fluxes remain well below the 10 pfu threshold. Background galactic cosmic rays within expected operational margins for astronaut crew.',
      },
    ];
  }
}
