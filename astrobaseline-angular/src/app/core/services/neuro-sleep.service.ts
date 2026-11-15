import { Injectable, computed, inject, signal } from '@angular/core';
import { I18nService } from './i18n.service';

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
  stage: string;
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
  private readonly i18n = inject(I18nService);

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

  // Casos predefinidos de simulación aeroespacial en Español
  private readonly cases_es: Record<NeuroStateId, NeuroCaseConfig> = {
    REPAIR_SLEEP: {
      id: 'REPAIR_SLEEP',
      name: 'Sueño Profundo Reparador',
      shortName: 'Sueño Reparador',
      icon: '',
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
        '[Sueño Reparador · 50 LPM] Tu recuperación cerebral es magnífica, comandante. Ondas cerebrales lentas sincronizadas y tono vagal óptimo. Mantén el descanso.',
      helpyBadge: 'Sueño Óptimo',
      helpyAuraColor: '#10b981',
    },

    ANXIETY: {
      id: 'ANXIETY',
      name: 'Ansiedad y Estrés Espacial',
      shortName: 'Ansiedad Nocturna',
      icon: '',
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
        '[Alerta de Ansiedad · 92 LPM] Detecto taquicardia nocturna persistente y tu amígdala cerebral muestra hiperactividad de alerta. Te sugiero iniciar el protocolo de respiración 4-7-8.',
      helpyBadge: 'Ansiedad Detectada',
      helpyAuraColor: '#f59e0b',
    },

    PANIC: {
      id: 'PANIC',
      name: 'Ataque de Pánico / Pesadilla en Microgravedad',
      shortName: 'Pánico / Despertar',
      icon: '',
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
        '[Pico de Pánico · 122 LPM] Despertar taquicárdico brusco con sobrecarga límbica. Comandante, respira con el doble suspiro: la presión y el oxígeno de cabina son 100% seguros.',
      helpyBadge: 'Pánico / Sobresalto',
      helpyAuraColor: '#f97316',
    },

    PSYCHOSIS: {
      id: 'PSYCHOSIS',
      name: 'Descompensación Neuroconductual / Psicosis',
      shortName: 'Psicosis',
      icon: '',
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
        '[EMERGENCIA NEUROCONDUCTUAL · 138 LPM] Desconexión de corteza prefrontal y sobrecarga límbica extrema por insomnio crítico. Bloqueando mandos sensibles y alertando al Cirujano de Vuelo.',
      helpyBadge: 'EMERGENCIA CRÍTICA',
      helpyAuraColor: '#ef4444',
    },
  };

  // Casos predefinidos de simulación aeroespacial en Inglés
  private readonly cases_en: Record<NeuroStateId, NeuroCaseConfig> = {
    REPAIR_SLEEP: {
      id: 'REPAIR_SLEEP',
      name: 'Deep Restorative Sleep',
      shortName: 'Restorative Sleep',
      icon: '',
      lpmAverage: 50,
      lpmRange: '45 - 54 BPM',
      sleepQuality: 'Excellent (94%)',
      dominantStage: 'N3 (Slow Wave) & REM',
      severity: 'NOMINAL',
      severityColor: '#10b981',
      headline: 'Optimal Neurochemical Recovery & Parasympathetic Vagal Tone',
      clinicalDescription:
        'Astronaut displays regular 90-minute sleep architecture with dominant slow-wave N3 delta cycles. Physiological drop in blood pressure and heart rate. Sinus memory consolidation and cellular regeneration under microgravity.',
      zonesActivated: ['Hippocampus (Consolidation)', 'Frontal Cortex (Oscillatory Rest)', 'Synchronized Thalamus'],
      countermeasureTitle: 'Nominal Maintenance Protocol',
      countermeasures: [
        'Maintain cabin temperature between 18°C and 20°C.',
        'Circadian lighting in attenuated blue spectrum (480nm filtered).',
        'Continue habitual orbital wake-up schedule.',
      ],
      helpyMood: 'happy',
      helpyMessage:
        '[Restorative Sleep · 50 BPM] Outstanding brain recovery, Commander. Synchronized slow delta waves and optimal vagal tone. Keep resting peacefully.',
      helpyBadge: 'Optimal Sleep',
      helpyAuraColor: '#10b981',
    },

    ANXIETY: {
      id: 'ANXIETY',
      name: 'Space Anxiety & Confinement Stress',
      shortName: 'Nocturnal Anxiety',
      icon: '',
      lpmAverage: 92,
      lpmRange: '84 - 102 BPM',
      sleepQuality: 'Fragmented (58%)',
      dominantStage: 'N1 & Micro-arousals',
      severity: 'WARNING',
      severityColor: '#f59e0b',
      headline: 'Sympathetic Hyperarousal with Amygdala Overdrive',
      clinicalDescription:
        'Inability to sustain restorative N3 deep sleep due to cabin ventilation acoustics, operational workload, and Earth distance. Autonomic dysregulation with sustained nocturnal tachycardia and elevated cortisol.',
      zonesActivated: ['Amygdala (Hyperarousal)', 'Insular Cortex (Interoceptive Anguish)', 'Locus Coeruleus (Norepinephrine)'],
      countermeasureTitle: 'Immediate Neurobehavioral Countermeasure',
      countermeasures: [
        'Initiate 4-7-8 onscreen guided breathing countermeasure to reduce sympathetic tone.',
        'Passive acoustic isolation via bio-adaptive cabin sleep earplugs.',
        'Relaxing 432 Hz binaural audio therapy via personal rest headphones.',
      ],
      helpyMood: 'sad',
      helpyMessage:
        '[Anxiety Alert · 92 BPM] Persistent nighttime tachycardia detected and your amygdala indicates heightened arousal. I recommend starting the 4-7-8 breathing protocol.',
      helpyBadge: 'Anxiety Detected',
      helpyAuraColor: '#f59e0b',
    },

    PANIC: {
      id: 'PANIC',
      name: 'Acute Panic Attack / Zero-G Nightmare',
      shortName: 'Panic / Arousal',
      icon: '',
      lpmAverage: 122,
      lpmRange: '112 - 132 BPM',
      sleepQuality: 'Critical Disruption (32%)',
      dominantStage: 'Abrupt REM to Wake',
      severity: 'URGENT',
      severityColor: '#f97316',
      headline: 'Massive Adrenergic Surge with Confusional Arousal',
      clinicalDescription:
        'Sudden tachycardic awakening in zero gravity accompanied by dyspnea and spatial disorientation ("space fugue state"). Abrupt spike in heart rate activating survival circuit.',
      zonesActivated: ['Bilateral Amygdala Overdrive', 'Hypothalamus (HPA Axis)', 'Brainstem (Flight Response)'],
      countermeasureTitle: 'Panic Rescue Protocol & Cabin Verification',
      countermeasures: [
        'Cyclic Physiological Sigh (double nasal inhale + extended oral exhale) to reverse hyperventilation.',
        'Live telemetry verification: Nominal pressure 101.3 kPa and O2 at 21.2% (no cabin depressurization).',
        'Spatial sensory grounding technique 3-2-1 to reconnect with secure cabin environment.',
      ],
      helpyMood: 'sad',
      helpyMessage:
        '[Panic Spike · 122 BPM] Sudden tachycardic surge with limbic flood. Commander, perform the double sigh: cabin pressure and O2 are 100% safe.',
      helpyBadge: 'Panic Surge',
      helpyAuraColor: '#f97316',
    },

    PSYCHOSIS: {
      id: 'PSYCHOSIS',
      name: 'Neurobehavioral Decompensation / Psychosis',
      shortName: 'Psychosis',
      icon: '',
      lpmAverage: 138,
      lpmRange: '128 - 146 BPM',
      sleepQuality: 'Severe Chronic Insomnia (<15%)',
      dominantStage: 'Forced Wake / Delirium',
      severity: 'CRITICAL',
      severityColor: '#ef4444',
      headline: 'Severe Prefrontal Hypoactivity and Confinement Delirium',
      clinicalDescription:
        'Loss of reality testing provoked by cumulative chronic sleep deprivation (>72 hours with non-restorative micro-sleeps) and extreme isolation. Dorsolateral prefrontal cortex loses top-down inhibitory governance.',
      zonesActivated: ['Prefrontal Cortex Disconnect (Hypoactivity)', 'Uncontrolled Amygdala & Anterior Cingulate', 'Chaotic Default Mode Network'],
      countermeasureTitle: 'Level 3 Emergency Medical Protocol (Houston / TsUP)',
      countermeasures: [
        'Priority telemetry feed and SOS alert transmitted to Earth Flight Surgeon & Mission Psychiatry.',
        'Cautious safety lockdown of airlock controls (EVA) and orbital thruster navigation.',
        'Cognitive re-anchoring via private audio link with family support and mandatory cabin rest.',
      ],
      helpyMood: 'angry',
      helpyMessage:
        '[NEUROBEHAVIORAL EMERGENCY · 138 BPM] Prefrontal disconnect and acute limbic flood from critical sleep debt. Locking critical controls and alerting Earth Flight Surgeon.',
      helpyBadge: 'CRITICAL EMERGENCY',
      helpyAuraColor: '#ef4444',
    },
  };

  get cases(): Record<NeuroStateId, NeuroCaseConfig> {
    return this.i18n.currentLang() === 'en' ? this.cases_en : this.cases_es;
  }

  // Configuración del caso activo reactiva al idioma
  readonly activeCase = computed(() => this.cases[this.activeStateId()]);

  // Lista de casos para la botonera
  readonly caseList = computed(() => Object.values(this.cases));

  // Regiones cerebrales con porcentajes de activación según el estado e idioma
  readonly brainZones = computed<BrainZone[]>(() => {
    const id = this.activeStateId();
    const isEn = this.i18n.currentLang() === 'en';

    if (id === 'REPAIR_SLEEP') {
      return [
        { id: 'prefrontal', name: isEn ? 'Prefrontal Cortex' : 'Corteza Prefrontal', subsystem: isEn ? 'Executive Control' : 'Control Ejecutivo', activationLevel: 25, colorHex: '#38bdf8', statusText: isEn ? 'Slow oscillatory rest' : 'Reposo oscilatorio lento' },
        { id: 'amygdala', name: isEn ? 'Amygdala Complex' : 'Complejo Amigdalino', subsystem: isEn ? 'Emotional Circuit' : 'Circuito Emocional', activationLevel: 12, colorHex: '#34d399', statusText: isEn ? 'Inhibited (Calm)' : 'Inhibido (Calma)' },
        { id: 'insula', name: isEn ? 'Insular Cortex' : 'Corteza Insular', subsystem: isEn ? 'Interoception' : 'Interocepcion', activationLevel: 18, colorHex: '#22d3ee', statusText: isEn ? 'Stable bodily sensations' : 'Sensaciones corporales estables' },
        { id: 'hippocampus', name: isEn ? 'Hippocampus' : 'Hipocampo', subsystem: isEn ? 'Memory Consolidation' : 'Consolidación Memoria', activationLevel: 88, colorHex: '#10b981', statusText: isEn ? 'Active (Deep N3 stage)' : 'Activo (Fase N3 profunda)' },
        { id: 'brainstem', name: isEn ? 'Brainstem' : 'Tronco Encefálico', subsystem: isEn ? 'Autonomic Control' : 'Control Autónomo', activationLevel: 20, colorHex: '#60a5fa', statusText: isEn ? 'Predominant vagal tone' : 'Tono vagal predominante' },
        { id: 'cingulate', name: isEn ? 'Anterior Cingulate' : 'Cíngulo Anterior', subsystem: isEn ? 'Conflict Processing' : 'Procesamiento Conflicto', activationLevel: 15, colorHex: '#818cf8', statusText: isEn ? 'No conflictive activity' : 'Sin actividad conflictiva' },
      ];
    } else if (id === 'ANXIETY') {
      return [
        { id: 'prefrontal', name: isEn ? 'Prefrontal Cortex' : 'Corteza Prefrontal', subsystem: isEn ? 'Executive Control' : 'Control Ejecutivo', activationLevel: 45, colorHex: '#fbbf24', statusText: isEn ? 'Compensatory effort' : 'Esfuerzo compensatorio' },
        { id: 'amygdala', name: isEn ? 'Amygdala Complex' : 'Complejo Amigdalino', subsystem: isEn ? 'Emotional Circuit' : 'Circuito Emocional', activationLevel: 85, colorHex: '#f59e0b', statusText: isEn ? 'Hyperactive (Fear/Alert)' : 'Hiperactivo (Miedo/Alerta)' },
        { id: 'insula', name: isEn ? 'Insular Cortex' : 'Corteza Insular', subsystem: isEn ? 'Interoception' : 'Interocepcion', activationLevel: 78, colorHex: '#d97706', statusText: isEn ? 'Anguish & chest tightness' : 'Angustia y opresión precordial' },
        { id: 'hippocampus', name: isEn ? 'Hippocampus' : 'Hipocampo', subsystem: isEn ? 'Memory Consolidation' : 'Consolidación Memoria', activationLevel: 32, colorHex: '#fbbf24', statusText: isEn ? 'Interrupted by micro-arousals' : 'Interrumpido por microdespertares' },
        { id: 'brainstem', name: isEn ? 'Brainstem' : 'Tronco Encefálico', subsystem: isEn ? 'Autonomic Control' : 'Control Autónomo', activationLevel: 70, colorHex: '#f59e0b', statusText: isEn ? 'High sympathetic discharge' : 'Descarga simpática elevada' },
        { id: 'cingulate', name: isEn ? 'Anterior Cingulate' : 'Cíngulo Anterior', subsystem: isEn ? 'Conflict Processing' : 'Procesamiento Conflicto', activationLevel: 68, colorHex: '#ea580c', statusText: isEn ? 'Cognitive tension' : 'Tensión cognitiva' },
      ];
    } else if (id === 'PANIC') {
      return [
        { id: 'prefrontal', name: isEn ? 'Prefrontal Cortex' : 'Corteza Prefrontal', subsystem: isEn ? 'Executive Control' : 'Control Ejecutivo', activationLevel: 30, colorHex: '#fb923c', statusText: isEn ? 'Acute cognitive freeze' : 'Bloqueo cognitivo agudo' },
        { id: 'amygdala', name: isEn ? 'Amygdala Complex' : 'Complejo Amigdalino', subsystem: isEn ? 'Emotional Circuit' : 'Circuito Emocional', activationLevel: 98, colorHex: '#f97316', statusText: isEn ? 'Uncontrolled limbic storm' : 'Fuego límbico desbordado' },
        { id: 'insula', name: isEn ? 'Insular Cortex' : 'Corteza Insular', subsystem: isEn ? 'Interoception' : 'Interocepcion', activationLevel: 92, colorHex: '#ea580c', statusText: isEn ? 'Hyperventilation & air hunger' : 'Hiperventilación y sensación de asfixia' },
        { id: 'hippocampus', name: isEn ? 'Hippocampus' : 'Hipocampo', subsystem: isEn ? 'Memory Consolidation' : 'Consolidación Memoria', activationLevel: 15, colorHex: '#fb923c', statusText: isEn ? 'Amnestic fragmentation' : 'Fragmentación amnésica' },
        { id: 'brainstem', name: isEn ? 'Brainstem' : 'Tronco Encefálico', subsystem: isEn ? 'Autonomic Control' : 'Control Autónomo', activationLevel: 95, colorHex: '#c2410c', statusText: isEn ? 'Extreme tachycardia (>120 bpm)' : 'Taquicardia extrema (>120 lpm)' },
        { id: 'cingulate', name: isEn ? 'Anterior Cingulate' : 'Cíngulo Anterior', subsystem: isEn ? 'Conflict Processing' : 'Procesamiento Conflicto', activationLevel: 88, colorHex: '#ea580c', statusText: isEn ? 'Massive survival alarm' : 'Alarma de supervivencia masiva' },
      ];
    } else {
      // PSYCHOSIS
      return [
        { id: 'prefrontal', name: isEn ? 'Prefrontal Cortex' : 'Corteza Prefrontal', subsystem: isEn ? 'Executive Control' : 'Control Ejecutivo', activationLevel: 8, colorHex: '#475569', statusText: isEn ? 'Severe hypofrontality (Disconnected)' : 'Hipofrontalidad severa (Desconectada)' },
        { id: 'amygdala', name: isEn ? 'Amygdala Complex' : 'Complejo Amigdalino', subsystem: isEn ? 'Emotional Circuit' : 'Circuito Emocional', activationLevel: 96, colorHex: '#ef4444', statusText: isEn ? 'Continuous chaotic desynchronization' : 'Desincronización caótica continua' },
        { id: 'insula', name: isEn ? 'Insular Cortex' : 'Corteza Insular', subsystem: isEn ? 'Interoception' : 'Interocepcion', activationLevel: 88, colorHex: '#dc2626', statusText: isEn ? 'Delusional somatoform alteration' : 'Alteración somatomorfa delirante' },
        { id: 'hippocampus', name: isEn ? 'Hippocampus' : 'Hipocampo', subsystem: isEn ? 'Memory Consolidation' : 'Consolidación Memoria', activationLevel: 10, colorHex: '#64748b', statusText: isEn ? 'Sleep-deprivation functional atrophy' : 'Atrofia funcional por falta de sueño' },
        { id: 'brainstem', name: isEn ? 'Brainstem' : 'Tronco Encefálico', subsystem: isEn ? 'Autonomic Control' : 'Control Autónomo', activationLevel: 94, colorHex: '#b91c1c', statusText: isEn ? 'Fixed autonomic tachycardia' : 'Taquicardia autónoma fija' },
        { id: 'cingulate', name: isEn ? 'Anterior Cingulate' : 'Cíngulo Anterior', subsystem: isEn ? 'Conflict Processing' : 'Procesamiento Conflicto', activationLevel: 95, colorHex: '#ef4444', statusText: isEn ? 'Loss of reality testing' : 'Incapacidad de discernir realidad' },
      ];
    }
  });

  // Datos de la curva de sueño de 8 horas para la gráfica
  readonly sleepTimeline = computed<SleepTimelinePoint[]>(() => {
    const id = this.activeStateId();
    const hours = ['22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00'];
    const isEn = this.i18n.currentLang() === 'en';
    const wake = isEn ? 'Wake' : 'Vigilia';

    if (id === 'REPAIR_SLEEP') {
      const lpms = [62, 54, 49, 47, 46, 48, 51, 53, 58];
      const stages: string[] = [wake, 'N1', 'N2', 'N3', 'N3', 'N2', 'REM', 'N2', wake];
      return hours.map((h, i) => ({ hour: h, lpm: lpms[i], stage: stages[i], stressLevel: 12 + i * 2 }));
    } else if (id === 'ANXIETY') {
      const lpms = [78, 86, 92, 95, 89, 94, 98, 93, 89];
      const stages: string[] = [wake, 'N1', 'N1', 'N2', wake, 'N1', 'REM', 'N1', wake];
      return hours.map((h, i) => ({ hour: h, lpm: lpms[i], stage: stages[i], stressLevel: 65 + (i % 3) * 8 }));
    } else if (id === 'PANIC') {
      const lpms = [68, 62, 58, 64, 126, 121, 108, 95, 88];
      const stages: string[] = [wake, 'N1', 'N2', 'REM', wake, wake, 'N1', 'N1', wake];
      return hours.map((h, i) => ({ hour: h, lpm: lpms[i], stage: stages[i], stressLevel: i === 4 ? 98 : (i > 4 ? 75 : 25) }));
    } else {
      // PSYCHOSIS
      const lpms = [128, 134, 139, 142, 138, 141, 144, 139, 136];
      const stages: string[] = [wake, wake, 'N1', wake, wake, 'N1', wake, wake, wake];
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
