import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';
import { DataLoaderService } from './data-loader.service';
import { AnalysisService } from './analysis.service';
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
  private http = inject(HttpClient);

  // Estados Base
  readonly isLoading = signal<boolean>(false);
  readonly rawDataset = signal<HealthRecord[]>([]);
  readonly transformationLog = signal<string[]>([]);
  readonly astronauts = signal<string[]>([]);
  readonly dates = signal<string[]>([]);

  // Wizard de Configuración de Misión
  readonly isWizardOpen = signal<boolean>(true);
  readonly missionConfig = signal<MissionConfig>({
    daysInSpace: 60,
    destination: this.config.DESTINATIONS[0],
    trainingGoal: this.config.TRAINING_GOALS[0],
  });

  // Filtros y Selección
  readonly dataSource = signal<'demo' | 'upload'>('demo');
  readonly selectedAstronaut = signal<string>('A-01');
  readonly selectedEnvironment = signal<string>(
    'Space station (low Earth orbit)'
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
    return this.analysisService.evaluateHealth(records, curr, days);
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
          res.quality.flag !== 'OK' &&
          (res.quality.days_since === null || res.quality.days_since >= 1)
        ) {
          due.push(this.config.INDICATORS[key].label);
        }
      }
    }
    return due;
  });

  // Colores calculados para el Body Map SVG
  readonly bodyRegionColors = computed<Record<BodyRegionKey, string>>(() => {
    const results = this.evaluationResults();
    const colors: Record<BodyRegionKey, string> = {
      head: '#757575',
      chest: '#757575',
      abdomen: '#757575',
      arms: '#757575',
      legs: '#757575',
    };

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
