import { Injectable, computed, signal } from '@angular/core';

export type NeuroStateId = 'REPAIR_SLEEP' | 'ANXIETY' | 'PANIC' | 'PSYCHOSIS';

export interface BrainZone {
  id: string;
  name: string;
  subsystem: string;
  activationLevel: number; // 0 to 100
  colorHex: string;
  statusText: string;
}

export interface SleepTimelinePoint {
  hour: string; // e.g. "00:00", "01:00"
  lpm: number;
  stage: 'Vigilia' | 'REM' | 'N1' | 'N2' | 'N3';
  stressLevel: number; // 0 to 100
}

export interface NeuroCaseConfig {
  id: NeuroStateId;
  name: string;
  shortName: string;
  icon: string;
  lpmAverage: number;
  lpmRange: string;
  sleepQuality: string;
  dominantStage: string;
  severity: 'NOMINAL' | 'WARNING' | 'URGENT' | 'CRITICAL';
  severityColor: string;
  headline: string;
  clinicalDescription: string;
  zonesActivated: string[];
  countermeasureTitle: string;
  countermeasures: string[];
  helpyMood: 'happy' | 'sad' | 'angry';
  helpyMessage: string;
  helpyBadge: string;
  helpyAuraColor: string;
}

@Injectable({
  providedIn: 'root',
})
export class NeuroSleepService {
  // Estado activo de la simulación
  readonly activeStateId = signal<NeuroStateId>('REPAIR_SLEEP');
  readonly userExplicitCase = signal<NeuroStateId | null>(null);
  readonly lastNeuroInteraction = signal<number>(0);

  // LPM en tiempo real con leve variabilidad fisiológica (+/- 2 bpm)
  readonly liveLpm = signal<number>(50);

  // Modales de Contramedidas Interactivas Específicas
  readonly isBreathingActive = signal<boolean>(false);
  readonly isPanicGroundingActive = signal<boolean>(false);
  readonly isEmergencySosActive = signal<boolean>(false);

  // Modal de Reporte Médico de Vuelo activo
  readonly isFlightReportOpen = signal<boolean>(false);

  // Casos predefinidos de simulación aeroespacial
  readonly cases: Record<NeuroStateId, NeuroCaseConfig> = {
    REPAIR_SLEEP: {
      id: 'REPAIR_SLEEP',
      name: 'Sueño Profundo Reparador',
      shortName: 'Sueño Reparador',
      icon: '🟢',
      lpmAverage: 50,
      lpmRange: '45 - 54 LPM',
      sleepQuality: 'Excelente (94%)',
      dominantStage: 'N3 (Ondas Lentas) & REM',
      severity: 'NOMINAL',
      severityColor: '#10b981',
      headline: 'Recuperación Neuroquímica y Tono Parasimpático Óptimo',
      clinicalDescription:
        'El astronauta presenta ciclos de sueño regulares de 90 minutos con predominio de sueño N3 delta. Descenso fisiológico de la presión arterial y frecuencia cardíaca. Consolidación de memoria sinusal y regeneración celular en microgravedad.',
      zonesActivated: ['Hipocampo (Consolidación)', 'Corteza Frontal (Reposo Oscilatorio)', 'Tálamo Sincronizado'],
      countermeasureTitle: 'Protocolo de Mantenimiento Nominal',
      countermeasures: [
        'Mantener temperatura de cabina entre 18°C y 20°C.',
        'Iluminación circadiana en espectro azul atenuado (480nm filtrado).',
        'Continuar con horario habitual de despertar orbital.',
      ],
      helpyMood: 'happy',
      helpyMessage:
        '😴 [Sueño Reparador · 50 LPM] Tu recuperación cerebral es magnífica, comandante. Ondas cerebrales lentas sincronizadas y tono vagal óptimo. ¡Sigue descansando profundamente! ⭐',
      helpyBadge: '⭐ Sueño Óptimo',
      helpyAuraColor: '#10b981',
    },

    ANXIETY: {
      id: 'ANXIETY',
      name: 'Ansiedad y Estrés Espacial',
      shortName: 'Ansiedad Nocturna',
      icon: '🟡',
      lpmAverage: 92,
      lpmRange: '84 - 102 LPM',
      sleepQuality: 'Fragmentado (58%)',
      dominantStage: 'N1 & Microdespertares',
      severity: 'WARNING',
      severityColor: '#f59e0b',
      headline: 'Hiperarousal Simpático con Sobrecarga Amigdalina',
      clinicalDescription:
        'Incapacidad para alcanzar sueño profundo N3 debido a ruidos de ventilación de cabina, estrés operacional y lejanía de la Tierra. Disfunción autonómica con taquicardia sostenida y cortisol salival nocturno elevado.',
      zonesActivated: ['Amígdala (Hiperalerta)', 'Corteza Insular (Angustia Interoceptiva)', 'Locus Coeruleus (Noradrenalina)'],
      countermeasureTitle: 'Contramedida Neuroconductual Inmediata',
      countermeasures: [
        'Iniciar sesión de respiración guiada 4-7-8 en pantalla para reducir el tono simpático.',
        'Aislamiento acústico pasivo mediante tapones bio-adaptables de cabina.',
        'Terapia de audio binaural relajante a 432 Hz en audífonos de descanso.',
      ],
      helpyMood: 'sad',
      helpyMessage:
        '🥺 [Alerta de Ansiedad · 92 LPM] Detecto taquicardia nocturna persistente y tu amígdala cerebral muestra hiperactividad de alerta. Te sugiero iniciar el protocolo de respiración 4-7-8 para calmar tu ritmo cardíaco.',
      helpyBadge: '🟡 Ansiedad Detectada',
      helpyAuraColor: '#f59e0b',
    },

    PANIC: {
      id: 'PANIC',
      name: 'Ataque de Pánico / Pesadilla en Microgravedad',
      shortName: 'Pánico / Despertar',
      icon: '🟠',
      lpmAverage: 122,
      lpmRange: '112 - 132 LPM',
      sleepQuality: 'Disrupción Crítica (32%)',
      dominantStage: 'REM Brusco a Vigilia',
      severity: 'URGENT',
      severityColor: '#f97316',
      headline: 'Descarga Adrenérgica Masiva con Despertar Confusional',
      clinicalDescription:
        'Despertar taquicárdico abrupto en gravedad cero con sensación de falta de aire y desorientación espacial ("space fugue state"). Pico repentino de LPM que activa el circuito de supervivencia extremo.',
      zonesActivated: ['Amígdala Bilateral Desbordada', 'Hipotálamo (Eje HPA)', 'Tronco Encefálico (Respuesta Huida)'],
      countermeasureTitle: 'Protocolo de Rescate por Pánico & Verificación de Cabina',
      countermeasures: [
        'Suspiro Fisiológico Cíclico (doble inhalación nasal + exhalación oral lenta) para revertir la hiperventilación.',
        'Verificación de telemetría en vivo: Presión nominal 101.3 kPa y O2 al 21.2% (sin despresurización).',
        'Técnica de anclaje sensorial espacial 3-2-1 para reconectar con el entorno seguro de cabina.',
      ],
      helpyMood: 'sad',
      helpyMessage:
        '⚠️ [Pico de Pánico · 122 LPM] ¡Despertar taquicárdico brusco! Tu corazón late con fuerza y hay sobrecarga límbica. Comandante, respira con el doble suspiro: la presión y el oxígeno de tu cabina son 100% seguros. Estoy contigo.',
      helpyBadge: '⚠️ Pánico / Sobresalto',
      helpyAuraColor: '#f97316',
    },

    PSYCHOSIS: {
      id: 'PSYCHOSIS',
      name: 'Descompensación Neuroconductual / Psicosis',
      shortName: 'Psicosis',
      icon: '🔴',
      lpmAverage: 138,
      lpmRange: '128 - 146 LPM',
      sleepQuality: 'Insomnio Severo Continuado (<15%)',
      dominantStage: 'Vigilia Forzada / Delirio',
      severity: 'CRITICAL',
      severityColor: '#ef4444',
      headline: 'Hipoactividad Prefrontal Severa y Delirio de Aislamiento',
      clinicalDescription:
        'Pérdida de contacto con la realidad inducida por privación crónica acumulativa de sueño (>72 horas con micro-sueños no restauradores) y confinamiento extremo. La corteza prefrontal dorsolateral pierde el control inhibitorio superior.',
      zonesActivated: ['Corteza Prefrontal Desconectada (Hipoactividad)', 'Amígdala / Cíngulo Anterior Fuera de Control', 'Red Neuronal por Defecto Caótica'],
      countermeasureTitle: 'Protocolo Médico de Emergencia Nivel 3 (Houston / TsUP)',
      countermeasures: [
        'Transmisión prioritaria de telemetría y alerta SOS al Cirujano de Vuelo y Psiquiatría de Misión.',
        'Bloqueo cautelar de mandos de esclusas de despresurización (EVA) y controles de propulsión.',
        'Reanclaje cognitivo mediante canal de audio familiar de apoyo y descanso forzado en cabina.',
      ],
      helpyMood: 'angry',
      helpyMessage:
        '🚨 ¡EMERGENCIA NEUROCONDUCTUAL! [138 LPM] Desconexión de corteza prefrontal y sobrecarga límbica extrema por insomnio crítico. Descompensación conductual inminente. Bloqueando mandos sensibles y alertando al Cirujano de Vuelo en Tierra.',
      helpyBadge: '🚨 EMERGENCIA CRÍTICA',
      helpyAuraColor: '#ef4444',
    },
  };

  // Configuración del caso activo
  readonly activeCase = computed(() => this.cases[this.activeStateId()]);

  // Regiones cerebrales con porcentajes de activación según el estado
  readonly brainZones = computed<BrainZone[]>(() => {
    const id = this.activeStateId();
    if (id === 'REPAIR_SLEEP') {
      return [
        { id: 'prefrontal', name: 'Corteza Prefrontal', subsystem: 'Control Ejecutivo', activationLevel: 25, colorHex: '#38bdf8', statusText: 'Reposo oscilatorio lento' },
        { id: 'amygdala', name: 'Complejo Amigdalino', subsystem: 'Circuito Emocional', activationLevel: 12, colorHex: '#34d399', statusText: 'Inhibido (Calma)' },
        { id: 'insula', name: 'Corteza Insular', subsystem: 'Interocepcion', activationLevel: 18, colorHex: '#22d3ee', statusText: 'Sensaciones corporales estables' },
        { id: 'hippocampus', name: 'Hipocampo', subsystem: 'Consolidación Memoria', activationLevel: 88, colorHex: '#10b981', statusText: 'Activo (Fase N3 profunda)' },
        { id: 'brainstem', name: 'Tronco Encefálico', subsystem: 'Control Autónomo', activationLevel: 20, colorHex: '#60a5fa', statusText: 'Tono vagal predominante' },
        { id: 'cingulate', name: 'Cíngulo Anterior', subsystem: 'Procesamiento Conflicto', activationLevel: 15, colorHex: '#818cf8', statusText: 'Sin actividad conflictiva' },
      ];
    } else if (id === 'ANXIETY') {
      return [
        { id: 'prefrontal', name: 'Corteza Prefrontal', subsystem: 'Control Ejecutivo', activationLevel: 45, colorHex: '#fbbf24', statusText: 'Esfuerzo compensatorio' },
        { id: 'amygdala', name: 'Complejo Amigdalino', subsystem: 'Circuito Emocional', activationLevel: 85, colorHex: '#f59e0b', statusText: 'Hiperactivo (Miedo/Alerta)' },
        { id: 'insula', name: 'Corteza Insular', subsystem: 'Interocepcion', activationLevel: 78, colorHex: '#d97706', statusText: 'Angustia y opresión precordial' },
        { id: 'hippocampus', name: 'Hipocampo', subsystem: 'Consolidación Memoria', activationLevel: 32, colorHex: '#fbbf24', statusText: 'Interrumpido por microdespertares' },
        { id: 'brainstem', name: 'Tronco Encefálico', subsystem: 'Control Autónomo', activationLevel: 70, colorHex: '#f59e0b', statusText: 'Descarga simpática elevada' },
        { id: 'cingulate', name: 'Cíngulo Anterior', subsystem: 'Procesamiento Conflicto', activationLevel: 68, colorHex: '#ea580c', statusText: 'Tensión cognitiva' },
      ];
    } else if (id === 'PANIC') {
      return [
        { id: 'prefrontal', name: 'Corteza Prefrontal', subsystem: 'Control Ejecutivo', activationLevel: 30, colorHex: '#fb923c', statusText: 'Bloqueo cognitivo agudo' },
        { id: 'amygdala', name: 'Complejo Amigdalino', subsystem: 'Circuito Emocional', activationLevel: 98, colorHex: '#f97316', statusText: 'Fuego límbico desbordado' },
        { id: 'insula', name: 'Corteza Insular', subsystem: 'Interocepcion', activationLevel: 92, colorHex: '#ea580c', statusText: 'Hiperventilación y sensación de asfixia' },
        { id: 'hippocampus', name: 'Hipocampo', subsystem: 'Consolidación Memoria', activationLevel: 15, colorHex: '#fb923c', statusText: 'Fragmentación amnésica' },
        { id: 'brainstem', name: 'Tronco Encefálico', subsystem: 'Control Autónomo', activationLevel: 95, colorHex: '#c2410c', statusText: 'Taquicardia extrema (>120 lpm)' },
        { id: 'cingulate', name: 'Cíngulo Anterior', subsystem: 'Procesamiento Conflicto', activationLevel: 88, colorHex: '#ea580c', statusText: 'Alarma de supervivencia masiva' },
      ];
    } else {
      // PSYCHOSIS
      return [
        { id: 'prefrontal', name: 'Corteza Prefrontal', subsystem: 'Control Ejecutivo', activationLevel: 8, colorHex: '#475569', statusText: 'Hipofrontalidad severa (Desconectada)' },
        { id: 'amygdala', name: 'Complejo Amigdalino', subsystem: 'Circuito Emocional', activationLevel: 96, colorHex: '#ef4444', statusText: 'Desincronización caótica continua' },
        { id: 'insula', name: 'Corteza Insular', subsystem: 'Interocepcion', activationLevel: 88, colorHex: '#dc2626', statusText: 'Alteración somatomorfa delirante' },
        { id: 'hippocampus', name: 'Hipocampo', subsystem: 'Consolidación Memoria', activationLevel: 10, colorHex: '#64748b', statusText: 'Atrofia funcional por falta de sueño' },
        { id: 'brainstem', name: 'Tronco Encefálico', subsystem: 'Control Autónomo', activationLevel: 94, colorHex: '#b91c1c', statusText: 'Taquicardia autónoma fija' },
        { id: 'cingulate', name: 'Cíngulo Anterior', subsystem: 'Procesamiento Conflicto', activationLevel: 95, colorHex: '#ef4444', statusText: 'Incapacidad de discernir realidad' },
      ];
    }
  });

  // Datos de la curva de sueño de 8 horas para la gráfica
  readonly sleepTimeline = computed<SleepTimelinePoint[]>(() => {
    const id = this.activeStateId();
    const hours = ['22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00'];

    if (id === 'REPAIR_SLEEP') {
      const lpms = [62, 54, 49, 47, 46, 48, 51, 53, 58];
      const stages: Array<'Vigilia' | 'REM' | 'N1' | 'N2' | 'N3'> = ['Vigilia', 'N1', 'N2', 'N3', 'N3', 'N2', 'REM', 'N2', 'Vigilia'];
      return hours.map((h, i) => ({ hour: h, lpm: lpms[i], stage: stages[i], stressLevel: 12 + i * 2 }));
    } else if (id === 'ANXIETY') {
      const lpms = [78, 86, 92, 95, 89, 94, 98, 93, 89];
      const stages: Array<'Vigilia' | 'REM' | 'N1' | 'N2' | 'N3'> = ['Vigilia', 'N1', 'N1', 'N2', 'Vigilia', 'N1', 'REM', 'N1', 'Vigilia'];
      return hours.map((h, i) => ({ hour: h, lpm: lpms[i], stage: stages[i], stressLevel: 65 + (i % 3) * 8 }));
    } else if (id === 'PANIC') {
      const lpms = [68, 62, 58, 64, 126, 121, 108, 95, 88];
      const stages: Array<'Vigilia' | 'REM' | 'N1' | 'N2' | 'N3'> = ['Vigilia', 'N1', 'N2', 'REM', 'Vigilia', 'Vigilia', 'N1', 'N1', 'Vigilia'];
      return hours.map((h, i) => ({ hour: h, lpm: lpms[i], stage: stages[i], stressLevel: i === 4 ? 98 : (i > 4 ? 75 : 25) }));
    } else {
      // PSYCHOSIS
      const lpms = [128, 134, 139, 142, 138, 141, 144, 139, 136];
      const stages: Array<'Vigilia' | 'REM' | 'N1' | 'N2' | 'N3'> = ['Vigilia', 'Vigilia', 'N1', 'Vigilia', 'Vigilia', 'N1', 'Vigilia', 'Vigilia', 'Vigilia'];
      return hours.map((h, i) => ({ hour: h, lpm: lpms[i], stage: stages[i], stressLevel: 94 + (i % 2) * 5 }));
    }
  });

  private lpmTimer: any = null;

  constructor() {
    this.startLiveFluctuation();
  }

  // Simulación de fluctuación natural de latidos
  private startLiveFluctuation(): void {
    if (this.lpmTimer) clearInterval(this.lpmTimer);
    this.lpmTimer = setInterval(() => {
      const target = this.activeCase().lpmAverage;
      // Pequeño jitter natural de +/- 2 LPM
      const jitter = Math.floor(Math.random() * 5) - 2;
      this.liveLpm.set(target + jitter);
    }, 1800);
  }

  // Cambiar el caso activo
  simulateCase(id: NeuroStateId): void {
    this.activeStateId.set(id);
    this.userExplicitCase.set(id);
    this.liveLpm.set(this.cases[id].lpmAverage);
    this.lastNeuroInteraction.set(Date.now());
  }

  // Abrir / Cerrar ejercicio de respiración 4-7-8 (Caso Ansiedad)
  openBreathingExercise(): void {
    this.isBreathingActive.set(true);
  }

  closeBreathingExercise(): void {
    this.isBreathingActive.set(false);
  }

  // Al completar la respiración guiada, calmar el ritmo cardíaco
  finishBreathingExercise(): void {
    this.isBreathingActive.set(false);
    this.liveLpm.set(52);
    this.simulateCase('REPAIR_SLEEP');
  }

  // Abrir / Cerrar Protocolo de Rescate por Pánico (Caso Pánico)
  openPanicGrounding(): void {
    this.isPanicGroundingActive.set(true);
  }

  closePanicGrounding(): void {
    this.isPanicGroundingActive.set(false);
  }

  finishPanicGrounding(): void {
    this.isPanicGroundingActive.set(false);
    this.liveLpm.set(55);
    this.simulateCase('REPAIR_SLEEP');
  }

  // Abrir / Cerrar Consola SOS de Cirujano de Vuelo (Caso Psicosis)
  openEmergencySos(): void {
    this.isEmergencySosActive.set(true);
  }

  closeEmergencySos(): void {
    this.isEmergencySosActive.set(false);
  }

  finishEmergencySos(): void {
    this.isEmergencySosActive.set(false);
    this.liveLpm.set(50);
    this.simulateCase('REPAIR_SLEEP');
  }

  // Abrir / Cerrar Reporte Médico de Vuelo
  openFlightReport(): void {
    this.isFlightReportOpen.set(true);
  }

  closeFlightReport(): void {
    this.isFlightReportOpen.set(false);
  }
}
