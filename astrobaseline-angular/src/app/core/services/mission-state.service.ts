import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';
import { DataLoaderService } from './data-loader.service';
import { AnalysisService } from './analysis.service';
import { NasaDonkiService } from './nasa-donki.service';
import { NeuroSleepService } from './neuro-sleep.service';
import {
  BodyRegionKey,
  EvaluationResults,
  HealthRecord,
  IndicatorKey,
  MissionConfig,
} from '../models/indicator.model';

@Injectable({
  providedIn: 'root',
})
export class MissionStateService {
  private config = inject(ConfigService);
  private dataLoader = inject(DataLoaderService);
  private analysisService = inject(AnalysisService);
  private nasa = inject(NasaDonkiService);
  private neuro = inject(NeuroSleepService);
  private http = inject(HttpClient);

  // Estados Base
  readonly isLoading = signal<boolean>(false);
  readonly rawDataset = signal<HealthRecord[]>([]);
  readonly transformationLog = signal<string[]>([]);
  readonly astronauts = signal<string[]>([]);
  readonly dates = signal<string[]>([]);

  // Wizard de Configuración de Misión
  readonly isWizardOpen = signal<boolean>(true);
  readonly isMissionStarted = signal<boolean>(false);
  readonly missionConfig = signal<MissionConfig>({
    daysInSpace: 60,
    destination: this.config.DESTINATIONS[0],
    trainingGoal: this.config.TRAINING_GOALS[0],
  });

  // Ejercicios asignados al astronauta según la meta (todos inician desmarcados)
  readonly exercisesList = signal<Record<string, Array<{ id: string; name: string; description: string; target: string; icon: string; completed: boolean }>>>({
    'A-01': [
      {
        id: 'cbum-1',
        name: 'Sentadilla con pistón neumático ARED',
        description: 'Sobrecarga axial controlada para preservar densidad ósea lumbar y masa muscular de cuádriceps en microgravedad.',
        target: '4 series × 8-10 repeticiones · Carga axial de 140 kg simulados',
        icon: '🏋️',
        completed: false,
      },
      {
        id: 'cbum-2',
        name: 'Peso muerto rumano antigravedad',
        description: 'Tensión mecánica excéntrica continua en isquiotibiales y cadena posterior para prevenir la atrofia del tronco.',
        target: '4 series × 10 repeticiones · Carga guiada de 120 kg simulados',
        icon: '⚡',
        completed: false,
      },
      {
        id: 'cbum-3',
        name: 'Press de banca con barras axiales ARED',
        description: 'Preservación de pectoral, deltoides anterior y tríceps para mantener la fuerza de empuje en microgravedad.',
        target: '4 series × 10-12 repeticiones · Carga axial de 95 kg simulados',
        icon: '💪',
        completed: false,
      },
    ],
    'A-02': [
      {
        id: 'spartacus-1',
        name: 'Protocolo HIIT en Cicloergómetro CEVIS',
        description: 'Intervalos anaeróbicos de alta exigencia para mantener el VO2 max y la fuerza contráctil del miocardio.',
        target: '20 min · 30s sprint (95% FCM) / 30s recuperación activa',
        icon: '🚴',
        completed: false,
      },
      {
        id: 'spartacus-2',
        name: 'Carrera con arnés de carga en Cinta Rodante T2',
        description: 'Simulación biomecánica de impacto gravitatorio para mantener la masa ósea y resistencia vascular periférica.',
        target: '45 min continuos a 11.5 km/h · Carga elástica de 1.0g simulado',
        icon: '🏃',
        completed: false,
      },
      {
        id: 'spartacus-3',
        name: 'Circuitos funcionales con arnés elástico reactivo',
        description: 'Acondicionamiento pliométrico de cuerpo completo para agilidad y resistencia postural contra la gravedad cero.',
        target: '3 rondas de 5 min · Trabajo continuo de alta intensidad',
        icon: '🔥',
        completed: false,
      },
    ],
  });

  // Marca de tiempo de la última interacción del usuario con los ejercicios
  readonly lastExerciseInteraction = signal<number>(Date.now());

  // Ejercicios activos correspondientes a la meta actual
  readonly currentExercises = computed(() => {
    const gid = this.missionConfig().trainingGoal?.id || this.selectedAstronaut();
    const all = this.exercisesList();
    return all[gid] || all['A-01'];
  });

  // Conteo de ejercicios completados hoy
  readonly completedExercisesCount = computed(() => {
    return this.currentExercises().filter((e) => e.completed).length;
  });

  // Estado emocional de la mascota estrella Star Helpy:
  // - 'happy': si hace ejercicio (todos completados) y mantiene la racha
  // - 'happy' / en progreso: si lleva 1 o más completados
  // - 'angry': si no hace ejercicio (0 completados)
  readonly petMood = computed<'happy' | 'sad' | 'angry'>(() => {
    const completed = this.completedExercisesCount();
    const total = this.currentExercises().length;
    if (total === 0) return 'angry';
    if (completed === 0) return 'angry';
    return 'happy';
  });

  toggleExerciseCompletion(id: string): void {
    const gid = this.missionConfig().trainingGoal?.id || this.selectedAstronaut();
    this.exercisesList.update((curr) => {
      const list = curr[gid] || curr['A-01'];
      const updated = list.map((ex) =>
        ex.id === id ? { ...ex, completed: !ex.completed } : ex
      );
      return {
        ...curr,
        [gid]: updated,
      };
    });
    this.lastExerciseInteraction.set(Date.now());
  }

  // Filtros y Selección
  readonly dataSource = signal<'demo' | 'upload'>('demo');
  readonly selectedAstronaut = signal<string>('A-01');
  readonly selectedEnvironment = signal<string>(
    'Estación espacial (órbita terrestre baja)'
  );
  readonly baselineDays = signal<number>(14);
  readonly currentDate = signal<string>('');
  readonly selectedIndicatorForTrends = signal<IndicatorKey>('heart_rate');
  readonly selectedBodyRegion = signal<BodyRegionKey>('chest');

  // Estado Computado: Datos del astronauta seleccionado
  readonly currentAstronautRecords = computed(() => {
    const sid = this.selectedAstronaut();
    return this.rawDataset().filter((r) => r.astronaut_id === sid);
  });

  // Fechas disponibles para el astronauta seleccionado
  readonly astronautDates = computed(() => {
    return this.currentAstronautRecords().map((r) => r.date);
  });

  // Día de misión actual (1-indexado)
  readonly missionDay = computed(() => {
    const dates = this.astronautDates();
    const curr = this.currentDate();
    const idx = dates.indexOf(curr);
    return idx >= 0 ? idx + 1 : dates.length;
  });

  // Registros recortados hasta la fecha seleccionada
  readonly recordsUpToCurrent = computed(() => {
    const curr = this.currentDate();
    if (!curr) return this.currentAstronautRecords();
    return this.currentAstronautRecords().filter((r) => r.date <= curr);
  });

  // Resultados de evaluación médica para cada indicador
  readonly evaluationResults = computed<EvaluationResults>(() => {
    const records = this.recordsUpToCurrent();
    const curr = this.currentDate();
    const days = this.baselineDays();
    if (!curr || records.length === 0) {
      return {} as EvaluationResults;
    }
    const results = this.analysisService.evaluateHealth(records, curr, days);

    // Reflejar la telemetría cardíaca en vivo del caso neuroconductual simulado
    const stateId = this.neuro.activeStateId();
    if (stateId && results['heart_rate']) {
      const liveLpm = this.neuro.liveLpm();
      let lvl: 0 | 1 | 2 = 0;
      if (stateId === 'ANXIETY') lvl = 1;
      else if (stateId === 'PANIC' || stateId === 'PSYCHOSIS') lvl = 2;

      results['heart_rate'] = {
        ...results['heart_rate'],
        recent: liveLpm,
        level: lvl,
      };
    }

    return results;
  });

  // Nivel global (-1: Sin dato, 0: Normal, 1: Atención, 2: Alerta)
  readonly overallStatus = computed(() => {
    const results = this.evaluationResults();
    return this.analysisService.computeOverallStatus(results);
  });

  // Texto de escalación médica según el entorno
  readonly escalationText = computed(() => {
    const env = this.selectedEnvironment();
    const lvl = this.overallStatus();
    return this.analysisService.getEscalationText(env, lvl);
  });

  // Mediciones pendientes o con problemas de cobertura
  readonly dueMeasurements = computed(() => {
    const results = this.evaluationResults();
    const due: string[] = [];
    for (const key of this.config.INDICATOR_KEYS) {
      const res = results[key];
      if (res && res.quality) {
        if (
          res.quality.flag !== 'Correcto' &&
          res.quality.flag !== 'OK' &&
          (res.quality.days_since === null || res.quality.days_since >= 1)
        ) {
          due.push(this.config.INDICATORS[key].label);
        }
      }
    }
    return due;
  });

  // Colores calculados para el Body Map SVG (reaccionan al dataset y a la simulación neuroconductual)
  readonly bodyRegionColors = computed<Record<BodyRegionKey, string>>(() => {
    const results = this.evaluationResults();
    const colors: Record<BodyRegionKey, string> = {
      head: '#757575',
      chest: '#757575',
      abdomen: '#757575',
      arms: '#757575',
      legs: '#757575',
    };

    // 1. Cálculo base por dataset de biomarcadores para cada región corporal
    const keys: BodyRegionKey[] = ['head', 'chest', 'abdomen', 'arms', 'legs'];
    for (const reg of keys) {
      const info = this.config.REGIONS[reg];
      if (!info.indicators || info.indicators.length === 0) {
        colors[reg] = this.config.STATUS_CONFIG[-1].color;
        continue;
      }
      const regResults: Partial<EvaluationResults> = {};
      for (const ind of info.indicators) {
        if (results[ind]) {
          regResults[ind] = results[ind];
        }
      }
      const lvl = this.analysisService.computeOverallStatus(
        regResults as EvaluationResults
      );
      colors[reg] = this.config.STATUS_CONFIG[lvl]?.color || '#757575';
    }

    // 2. Solo la cabeza reacciona a la simulación de casos neuroconductuales del mapeo encefálico
    const stateId = this.neuro.activeStateId();
    if (stateId === 'REPAIR_SLEEP') {
      colors.head = '#10b981'; // Sueño Reparador: Esmeralda
    } else if (stateId === 'ANXIETY') {
      colors.head = '#f59e0b'; // Ansiedad: Ámbar
    } else if (stateId === 'PANIC') {
      colors.head = '#f97316'; // Pánico: Naranja Shock
    } else if (stateId === 'PSYCHOSIS') {
      colors.head = '#ef4444'; // Psicosis: Rojo Carmesí
    }

    return colors;
  });

  // Fondo dinámico según el destino activo
  readonly activeBackgroundImage = computed(() => {
    const env = this.selectedEnvironment();
    const dest = this.config.DESTINATIONS.find((d) => d.environmentKey === env);
    return dest ? dest.image : '/assets/images/destinations/iss.jpg';
  });

  constructor() {
    this.loadDemoData();
  }

  openWizard(): void {
    this.isWizardOpen.set(true);
  }

  applyMissionConfig(cfg: MissionConfig): void {
    this.missionConfig.set(cfg);
    this.selectedAstronaut.set(cfg.trainingGoal.id);
    this.selectedEnvironment.set(cfg.destination.environmentKey);
    this.isWizardOpen.set(false);
    this.isMissionStarted.set(true);
    // Iniciar escaneo NASA DONKI: primer escaneo en 1.3 minutos, luego cada 2 minutos
    this.nasa.startRadiationMonitoring();
  }

  /**
   * Carga los datos sintéticos de demostración desde el CSV estático
   */
  loadDemoData(): void {
    this.isLoading.set(true);
    this.http.get('data/synthetic_health.csv', { responseType: 'text' }).subscribe({
      next: (csvText) => {
        const parsed = this.dataLoader.standardize(
          this.parseCsvString(csvText)
        );
        this.applyStandardizedData(parsed);
        this.dataSource.set('demo');
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading demo CSV:', err);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Procesa un archivo subido por el usuario
   */
  async loadUploadedFile(file: File): Promise<void> {
    this.isLoading.set(true);
    try {
      const rows = await this.dataLoader.readFile(file);
      const standardized = this.dataLoader.standardize(rows);
      this.applyStandardizedData(standardized);
      this.dataSource.set('upload');
    } catch (e) {
      console.error('Error parsing uploaded file:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  private applyStandardizedData(res: any): void {
    this.rawDataset.set(res.records);
    this.transformationLog.set(res.log);
    this.astronauts.set(res.astronauts);
    this.dates.set(res.dates);

    if (res.astronauts.length > 0) {
      this.selectedAstronaut.set(res.astronauts[0]);
    }
    if (res.dates.length > 0) {
      this.currentDate.set(res.dates[res.dates.length - 1]);
    }
  }

  private parseCsvString(csvText: string): any[] {
    const res = (window as any).Papa
      ? (window as any).Papa.parse(csvText, { header: true, dynamicTyping: true, skipEmptyLines: true })
      : { data: [] };
    if (!res.data || res.data.length === 0) {
      // Fallback manual simple
      const lines = csvText.trim().split('\n');
      if (lines.length <= 1) return [];
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      return lines.slice(1).map((l) => {
        const parts = l.split(',');
        const row: any = {};
        headers.forEach((h, i) => {
          const raw = parts[i] ? parts[i].trim().replace(/^"|"$/g, '') : '';
          const num = parseFloat(raw);
          row[h] = !isNaN(num) && raw !== '' ? num : raw;
        });
        return row;
      });
    }
    return res.data;
  }
}
