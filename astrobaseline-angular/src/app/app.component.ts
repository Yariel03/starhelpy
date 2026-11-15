import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MissionStateService } from './core/services/mission-state.service';
import { ConfigService } from './core/services/config.service';
import { NeuroSleepService } from './core/services/neuro-sleep.service';
import { BadgeComponent } from './components/badge/badge.component';
import { BodyMapComponent } from './components/body-map/body-map.component';
import { MissionWizardComponent } from './components/mission-wizard/mission-wizard.component';
import { RealtimeBpmComponent } from './components/realtime-bpm/realtime-bpm.component';
import { RewardStreakComponent } from './components/reward-streak/reward-streak.component';
import { StarPetComponent } from './components/star-pet/star-pet.component';
import { NeuroSleepComponent } from './components/neuro-sleep/neuro-sleep.component';
import { GuidedBreathingComponent } from './components/guided-breathing/guided-breathing.component';
import { PanicGroundingComponent } from './components/panic-grounding/panic-grounding.component';
import { EmergencySosComponent } from './components/emergency-sos/emergency-sos.component';
import { FlightReportComponent } from './components/flight-report/flight-report.component';
import { BodyRegionKey, IndicatorKey } from './core/models/indicator.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BadgeComponent,
    BodyMapComponent,
    MissionWizardComponent,
    RealtimeBpmComponent,
    RewardStreakComponent,
    StarPetComponent,
    NeuroSleepComponent,
    GuidedBreathingComponent,
    PanicGroundingComponent,
    EmergencySosComponent,
    FlightReportComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly state = inject(MissionStateService);
  readonly config = inject(ConfigService);
  readonly neuro = inject(NeuroSleepService);

  readonly activeTab = signal<'dashboard' | 'trends' | 'body' | 'quality' | 'neuro-sleep'>('dashboard');
  readonly expandedMetric = signal<string | null>(null);

  // Entornos disponibles
  readonly environmentKeys = Object.keys(this.config.ENVIRONMENTS);

  // Información del entorno seleccionado
  readonly currentEnvInfo = computed(() => {
    const env = this.state.selectedEnvironment();
    return this.config.ENVIRONMENTS[env] || this.config.ENVIRONMENTS['Space station (low Earth orbit)'];
  });

  // Meta de entrenamiento / arquetipo físico seleccionado
  readonly currentGoal = computed(() => {
    const sid = this.state.selectedAstronaut();
    return (
      this.config.TRAINING_GOALS.find((g) => g.id === sid) ||
      this.config.TRAINING_GOALS[0]
    );
  });

  // Destino seleccionado actualmente
  readonly currentDestination = computed(() => {
    const env = this.state.selectedEnvironment();
    return (
      this.config.DESTINATIONS.find((d) => d.environmentKey === env) ||
      this.config.DESTINATIONS[0]
    );
  });

  // Imagen de fondo dinámico de la misión activa
  readonly activeBgImage = this.state.activeBackgroundImage;

  // Información de la región anatómica seleccionada
  readonly currentRegionInfo = computed(() => {
    const reg = this.state.selectedBodyRegion();
    const info = this.config.REGIONS[reg];

    // Para Cerebro y Comportamiento (head), reflejar dinámicamente la descripción del caso simulado
    if (reg === 'head') {
      const activeCase = this.neuro.activeCase();
      return {
        label: info.label,
        indicators: info.indicators,
        note: `${activeCase.headline}: ${activeCase.clinicalDescription}`,
      };
    }

    return info;
  });

  // Rango de tiempo seleccionado para la bitácora
  readonly tableTimeRange = signal<'7days' | '14days' | 'all'>('all');

  // Estado de los biosensores médicos de a bordo
  readonly hardwareSensors = [
    {
      name: 'Holter ECG BioZ',
      tag: 'Cardiovascular',
      status: 'Nominal',
      detail: '99.8% recepción · VFC activa · Batería 88%',
      icon: '💓',
      color: '#10b981',
    },
    {
      name: 'Actígrafo de Cabina',
      tag: 'Sueño & Vigilia',
      status: 'Sincronizado',
      detail: 'Detección N1-N3/REM nominal · 0 pérdidas',
      icon: '🛌',
      color: '#10b981',
    },
    {
      name: 'Mapeo Óptico fNIRS',
      tag: 'Corteza Límbica',
      status: 'Calibrado',
      detail: 'Acoplamiento BOLD al 98% nominal',
      icon: '🧠',
      color: '#10b981',
    },
    {
      name: 'Monitor Metabólico',
      tag: 'Glucosa & Termo',
      status: 'Certificado',
      detail: 'Calibración válida para Cirujano de Vuelo',
      icon: '🩸',
      color: '#10b981',
    },
  ];

  // Historial longitudinal diario de telemetría y signos vitales (Bitácora de Datos)
  readonly dailyClinicalLog = computed(() => {
    const raw = this.state.recordsUpToCurrent();
    const currDate = this.state.currentDate();
    const stateId = this.neuro.activeStateId();
    const activeCase = this.neuro.activeCase();
    const liveLpm = this.neuro.liveLpm();
    const range = this.tableTimeRange();

    // Ordenar de más reciente a más antiguo
    const sorted = [...raw].sort((a, b) => b.date.localeCompare(a.date));

    const mapped = sorted.map((r, idx) => {
      const isToday = r.date === currDate;
      const isSimulated = isToday && !!stateId;

      let lpm = r.heart_rate ?? 70;
      let sleepH = r.sleep_hours ?? 7.5;
      let sleepQual =
        sleepH >= 7.5
          ? 'Excelente (92%)'
          : sleepH >= 6
          ? 'Moderado (72%)'
          : 'Insuficiente (48%)';
      let moodScore = r.mood ?? 4.0;
      let sysBp = r.systolic_bp ?? 118;
      let diaBp = r.diastolic_bp ?? 76;
      let gluc = r.glucose ?? 95;
      let temp = r.temperature ?? 36.6;
      let statusText = 'Nominal';
      let statusColor = '#10b981';

      if (isSimulated) {
        lpm = liveLpm;
        sleepQual = activeCase.sleepQuality;
        statusColor = activeCase.severityColor;

        if (stateId === 'REPAIR_SLEEP') {
          sleepH = 8.5;
          moodScore = 5.0;
          statusText = 'Sueño Reparador';
        } else if (stateId === 'ANXIETY') {
          sleepH = 5.2;
          moodScore = 2.4;
          statusText = 'Alerta Ansiedad';
        } else if (stateId === 'PANIC') {
          sleepH = 3.1;
          moodScore = 1.2;
          statusText = 'Crisis Pánico';
        } else if (stateId === 'PSYCHOSIS') {
          sleepH = 1.4;
          moodScore = 1.0;
          statusText = 'Crisis Psicosis';
        }
      } else {
        if (lpm > 100 || sleepH < 5 || moodScore < 2) {
          statusText = 'Alerta';
          statusColor = '#ef4444';
        } else if (lpm > 85 || sleepH < 6.5 || moodScore < 3) {
          statusText = 'Atención';
          statusColor = '#f59e0b';
        }
      }

      return {
        date: r.date,
        missionDay: sorted.length - idx,
        isToday,
        isSimulated,
        lpm,
        sleepH: Number(sleepH).toFixed(1),
        sleepQual,
        bp: `${sysBp}/${diaBp}`,
        glucose: gluc,
        temperature: Number(temp).toFixed(1),
        mood: Number(moodScore).toFixed(1),
        statusText,
        statusColor,
        caseIcon: isSimulated ? activeCase.icon : '',
        caseName: isSimulated ? activeCase.shortName : '',
      };
    });

    if (range === '7days') return mapped.slice(0, 7);
    if (range === '14days') return mapped.slice(0, 14);
    return mapped;
  });

  // Exportar bitácora médica estructurada a formato CSV
  exportCsv(): void {
    const data = this.dailyClinicalLog();
    const sid = this.state.selectedAstronaut();
    const headers = [
      'Fecha',
      'Dia_Mision',
      'Astronauta',
      'Horas_Sueno',
      'Calidad_Sueno',
      'Frecuencia_Cardiaca_LPM',
      'Presion_Arterial_mmHg',
      'Glucosa_mgdL',
      'Temperatura_C',
      'Estado_Animo_1a5',
      'Estado_Clinico',
    ];

    const rows = data.map((d) => [
      d.date,
      `Dia ${d.missionDay}`,
      sid,
      d.sleepH,
      `"${d.sleepQual}"`,
      d.lpm,
      `"${d.bp}"`,
      d.glucose,
      d.temperature,
      d.mood,
      `"${d.statusText}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Datos_Salud_${sid}_${this.state.currentDate() || 'Mision'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Lista de calidad para la tabla del Tab 4
  readonly qualityTableRows = computed(() => {
    const results = this.state.evaluationResults();
    return this.config.INDICATOR_KEYS.map((k) => {
      const cfg = this.config.INDICATORS[k];
      const q = results[k]?.quality || { score: 0, completeness: 0, days_since: null, flag: 'No data' };
      return {
        key: k,
        label: cfg.label,
        score: q.score,
        coverage: `${Math.round(q.completeness * 100)}%`,
        daysSince: q.days_since !== null ? q.days_since : '-',
        flag: q.flag,
      };
    });
  });

  // Métricas para la región seleccionada en el Tab 3
  readonly regionIndicators = computed(() => {
    const info = this.currentRegionInfo();
    const results = this.state.evaluationResults();
    return info.indicators.map((k) => ({
      key: k,
      config: this.config.INDICATORS[k],
      result: results[k],
    }));
  });

  setTab(tab: 'dashboard' | 'trends' | 'body' | 'quality' | 'neuro-sleep') {
    this.activeTab.set(tab);
  }

  toggleExpand(key: string) {
    this.expandedMetric.update((curr) => (curr === key ? null : key));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.state.loadUploadedFile(input.files[0]);
    }
  }

  onDateSliderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const index = parseInt(target.value, 10);
    const dates = this.state.astronautDates();
    if (dates && dates[index]) {
      this.state.currentDate.set(dates[index]);
    }
  }

  getCurrentDateIndex(): number {
    const dates = this.state.astronautDates();
    const curr = this.state.currentDate();
    const idx = dates.indexOf(curr);
    return idx >= 0 ? idx : dates.length - 1;
  }

  formatValue(v: number | null, unit: string): string {
    return v === null || isNaN(v) ? '-' : `${v.toFixed(1)} ${unit}`;
  }
}
