import { Injectable, computed, signal } from '@angular/core';

export type SupportedLanguage = 'es' | 'en';

export interface Translations {
  // Navegación por pestañas
  tabs_dashboard: string;
  tabs_telemetry: string;
  tabs_body: string;
  tabs_history: string;
  tabs_neuro: string;

  // Cabecera superior
  flight_report: string;
  config_mission: string;
  sol: string;
  of_days: string;
  goal_label: string;

  // Barra Lateral
  sidebar_bodymap: string;
  sidebar_view_map: string;
  live_telemetry: string;
  paused: string;
  stat_min: string;
  stat_avg: string;
  stat_max: string;
  heart_resting: string;
  tagline: string;

  // Historial de Datos
  history_title: string;
  history_subtitle: string;
  export_csv_btn: string;
  avg_sleep_title: string;
  avg_sleep_unit: string;
  avg_hr_title: string;
  avg_hr_unit: string;
  days_viewed_title: string;
  days_unit: string;
  filter_period_label: string;
  filter_7days: string;
  filter_14days: string;
  filter_30days: string;
  filter_all: string;
  showing_records_label: string;
  of_label: string;
  records_registered: string;

  // Columnas de la tabla
  col_date: string;
  col_sleep: string;
  col_hr: string;
  col_bp: string;
  col_glucose: string;
  col_temp: string;
  col_mood: string;
  col_status: string;
  chip_today: string;

  // Estados
  status_normal: string;
  status_attention: string;
  status_alert: string;
  status_optimal: string;
  status_anxiety: string;
  status_panic: string;
  status_psychosis: string;
}

const ES_TRANSLATIONS: Translations = {
  tabs_dashboard: 'Panel General',
  tabs_telemetry: 'Telemetría',
  tabs_body: 'Mapa Corporal',
  tabs_history: 'Historial de Datos',
  tabs_neuro: 'Neuro-Sueño 3D',

  flight_report: 'Reporte Médico',
  config_mission: 'Configurar Misión',
  sol: 'Sol',
  of_days: 'de',
  goal_label: 'Meta',

  sidebar_bodymap: 'Mapa Corporal',
  sidebar_view_map: 'Ver mapa ↗',
  live_telemetry: 'EN VIVO · TELEMETRÍA',
  paused: 'PAUSADO',
  stat_min: 'MÍN',
  stat_avg: 'PROM',
  stat_max: 'MÁX',
  heart_resting: 'Frecuencia cardíaca en reposo',
  tagline: 'Línea Base Biomédica & Telemetría en Tiempo Real',

  history_title: 'Historial de Datos de Salud',
  history_subtitle: 'Valores diarios registrados de sueño, ritmo cardíaco, presión arterial y biomarcadores del astronauta',
  export_csv_btn: 'Descargar en Excel / CSV',
  avg_sleep_title: 'Sueño Promedio',
  avg_sleep_unit: 'h / noche',
  avg_hr_title: 'Frecuencia Cardíaca',
  avg_hr_unit: 'LPM promedio',
  days_viewed_title: 'Días Visualizados',
  days_unit: 'días',
  filter_period_label: 'Seleccionar período:',
  filter_7days: 'Últimos 7 Días',
  filter_14days: 'Últimos 14 Días',
  filter_30days: 'Últimos 30 Días',
  filter_all: 'Misión Completa',
  showing_records_label: 'Mostrando',
  of_label: 'de',
  records_registered: 'días registrados',

  col_date: 'Fecha',
  col_sleep: 'Sueño',
  col_hr: 'Frecuencia Cardíaca',
  col_bp: 'Presión Arterial',
  col_glucose: 'Glucosa',
  col_temp: 'Temperatura',
  col_mood: 'Ánimo',
  col_status: 'Estado',
  chip_today: 'HOY',

  status_normal: 'Normal',
  status_attention: 'Atención',
  status_alert: 'Alerta',
  status_optimal: 'Sueño Óptimo',
  status_anxiety: 'Ansiedad',
  status_panic: 'Pánico',
  status_psychosis: 'Psicosis',
};

const EN_TRANSLATIONS: Translations = {
  tabs_dashboard: 'Dashboard',
  tabs_telemetry: 'Telemetry',
  tabs_body: 'Body Map',
  tabs_history: 'Health Data Log',
  tabs_neuro: 'Neuro-Sleep 3D',

  flight_report: 'Medical Report',
  config_mission: 'Configure Mission',
  sol: 'Sol',
  of_days: 'of',
  goal_label: 'Goal',

  sidebar_bodymap: 'Body Map',
  sidebar_view_map: 'View map ↗',
  live_telemetry: 'LIVE · TELEMETRY',
  paused: 'PAUSED',
  stat_min: 'MIN',
  stat_avg: 'AVG',
  stat_max: 'MAX',
  heart_resting: 'Resting Heart Rate',
  tagline: 'Biomedical Baseline & Real-Time Telemetry',

  history_title: 'Health Data History',
  history_subtitle: 'Daily recorded values for sleep, heart rate, blood pressure and biomarkers for astronaut',
  export_csv_btn: 'Download Excel / CSV',
  avg_sleep_title: 'Average Sleep',
  avg_sleep_unit: 'hrs / night',
  avg_hr_title: 'Heart Rate',
  avg_hr_unit: 'BPM average',
  days_viewed_title: 'Days Displayed',
  days_unit: 'days',
  filter_period_label: 'Select period:',
  filter_7days: 'Last 7 Days',
  filter_14days: 'Last 14 Days',
  filter_30days: 'Last 30 Days',
  filter_all: 'Full Mission',
  showing_records_label: 'Showing',
  of_label: 'of',
  records_registered: 'recorded days',

  col_date: 'Date',
  col_sleep: 'Sleep',
  col_hr: 'Heart Rate',
  col_bp: 'Blood Pressure',
  col_glucose: 'Glucose',
  col_temp: 'Temperature',
  col_mood: 'Mood',
  col_status: 'Status',
  chip_today: 'TODAY',

  status_normal: 'Normal',
  status_attention: 'Attention',
  status_alert: 'Alert',
  status_optimal: 'Restorative Sleep',
  status_anxiety: 'Anxiety',
  status_panic: 'Panic',
  status_psychosis: 'Psychosis',
};

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  readonly currentLang = signal<SupportedLanguage>('es');

  readonly t = computed<Translations>(() => {
    return this.currentLang() === 'en' ? EN_TRANSLATIONS : ES_TRANSLATIONS;
  });

  constructor() {
    try {
      const saved = localStorage.getItem('astro_lang') as SupportedLanguage | null;
      if (saved === 'es' || saved === 'en') {
        this.currentLang.set(saved);
      }
    } catch (e) {
      // localStorage no disponible o bloqueado en sandbox
    }
  }

  setLanguage(lang: SupportedLanguage): void {
    this.currentLang.set(lang);
    try {
      localStorage.setItem('astro_lang', lang);
    } catch (e) {
      // no-op
    }
  }

  toggleLanguage(): void {
    this.setLanguage(this.currentLang() === 'es' ? 'en' : 'es');
  }
}
