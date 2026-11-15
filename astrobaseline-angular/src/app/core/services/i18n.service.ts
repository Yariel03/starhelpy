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
  bpm_elevated: string;
  bpm_critical: string;
  pause_stream: string;
  resume_stream: string;

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

  // Pestaña Telemetría
  telemetry_title: string;
  telemetry_subtitle: string;
  telemetry_card_title: string;
  z_vs_baseline: string;
  no_delta: string;
  hide_details: string;
  show_details: string;
  clinical_why: string;
  clinical_how: string;
  clinical_hazard: string;
  alerts_label: string;
  action_suggested: string;
  action_urgent: string;

  // Pestaña Mapa Corporal
  select_region: string;
  region_head: string;
  region_chest: string;
  region_abdomen: string;
  region_arms: string;
  region_legs: string;
  sleep_quality: string;
  dominant_stage: string;
  brain_activation: string;
  no_indicators_region: string;
  sim_case_hint: string;

  // Insignias / Badges
  badge_normal: string;
  badge_attention: string;
  badge_alert: string;
  badge_nodata: string;

  // Panel General / Racha (Duolingo style)
  streak_active_title: string;
  streak_badge: string;
  streak_motto: string;
  orbital_points: string;
  perf_rank: string;
  active_shield: string;
  zero_g_shield: string;
  streak_history_title: string;
  streak_history_sub: string;
  assigned_goal: string;
  today_progress: string;
  exercises_unit: string;
  completed_status: string;
  pending_status: string;
  mark_completed: string;
  mark_pending: string;
  sets_reps: string;
  biomech_desc: string;
  all_done_title: string;
  all_done_desc: string;

  // Neuro-Sueño 3D
  cardiac_telemetry: string;
  autonomic_tone: string;
  parasympathetic: string;
  sympathetic: string;
  sim_header_title: string;
  sim_header_sub: string;
  active_tag: string;
  bpm_avg_sub: string;
  brain_map_title: string;
  orbital_rot_hint: string;
  diag_box_title: string;
  zones_involved: string;
  sleep_arch_title: string;
  sleep_arch_hint: string;
  stage_n3: string;
  stage_n2: string;
  stage_rem: string;
  stage_wake: string;
  guidelines_sub: string;
  btn_breath: string;
  btn_panic: string;
  btn_emergency: string;

  // Asistente Configuración de Misión (Wizard)
  wizard_title: string;
  wizard_subtitle: string;
  step_duration: string;
  step_dest: string;
  step_goal: string;
  step1_q: string;
  step1_desc: string;
  days_in_orbit: string;
  approx: string;
  months: string;
  presets_label: string;
  step2_q: string;
  step2_desc: string;
  active_dest: string;
  step3_q: string;
  step3_desc: string;
  assigned_meta: string;
  archetype_tag: string;
  protocol_label: string;
  btn_skip: string;
  btn_back: string;
  btn_next: string;
  btn_launch: string;

  // Reporte Médico (Flight Report)
  report_confidential: string;
  report_btn_print: string;
  report_btn_close: string;
  report_title: string;
  report_sub: string;
  report_mission: string;
  report_subject: string;
  report_chronology: string;
  report_earth_date: string;
  report_sec1_title: string;
  report_sec1_sub: string;
  report_col_bio: string;
  report_col_base: string;
  report_col_meas: string;
  report_col_delta: string;
  report_col_eval: string;

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
  bpm_elevated: 'Elevado',
  bpm_critical: 'Crítico',
  pause_stream: 'Pausar transmisión',
  resume_stream: 'Reanudar transmisión',

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

  telemetry_title: 'Indicadores Biológicos y Fisiológicos en Tiempo Real',
  telemetry_subtitle: 'Monitoreo continuo de signos vitales, desviaciones z-score vs línea base personal y acciones clínicas.',
  telemetry_card_title: 'Haz clic para graficar la evolución temporal de este indicador',
  z_vs_baseline: 'σ vs línea base',
  no_delta: 'Sin variación de línea base',
  hide_details: 'Ocultar detalles ▲',
  show_details: '¿Por qué importa? / Acciones ▼',
  clinical_why: 'Importancia clínica:',
  clinical_how: 'Cómo medir:',
  clinical_hazard: 'Riesgo espacial:',
  alerts_label: 'Alertas:',
  action_suggested: 'Acción sugerida:',
  action_urgent: 'Acción urgente:',

  select_region: 'Seleccionar región anatómica:',
  region_head: 'Cabeza',
  region_chest: 'Tórax',
  region_abdomen: 'Abdomen',
  region_arms: 'Brazos',
  region_legs: 'Piernas',
  sleep_quality: 'Calidad de Sueño:',
  dominant_stage: 'Fase Dominante:',
  brain_activation: 'Activación Encefálica:',
  no_indicators_region: 'No hay indicadores biológicos activos en esta región.',
  sim_case_hint: 'Caso neuroconductual simulado en vivo',

  badge_normal: 'Normal',
  badge_attention: 'Atención',
  badge_alert: 'Alerta',
  badge_nodata: 'Sin datos',

  streak_active_title: '¡Racha de {days} Días Activa!',
  streak_badge: 'En Racha',
  streak_motto: '¡Disciplina espacial ejemplar! Has cumplido el protocolo de entrenamiento y telemetría sin interrupciones.',
  orbital_points: 'Puntos Orbitales',
  perf_rank: 'Rango de Rendimiento',
  active_shield: 'Escudo Activo',
  zero_g_shield: 'Protección Cero-G',
  streak_history_title: 'Historial de Racha y Próximos Hitos:',
  streak_history_sub: 'Días completados y objetivos de preservación orbital',
  assigned_goal: 'Meta de Entrenamiento Asignada',
  today_progress: 'Progreso de Hoy',
  exercises_unit: 'ejercicios',
  completed_status: 'Completado',
  pending_status: 'Pendiente',
  mark_completed: 'Marcar como completado',
  mark_pending: 'Marcar como pendiente',
  sets_reps: 'Series & Repeticiones:',
  biomech_desc: 'Descripción Biomecánica:',
  all_done_title: '¡Sesión Diaria Completada al 100%!',
  all_done_desc: 'Has asegurado la preservación muscular y cardiovascular de hoy. Racha protegida y +120 XP acreditados.',

  cardiac_telemetry: 'Telemetría Cardíaca:',
  autonomic_tone: 'Tono Autonómico',
  parasympathetic: 'Parasimpático',
  sympathetic: 'Simpático',
  sim_header_title: 'SIMULADOR DE CASOS NEUROCONDUCTUALES ESPACIALES',
  sim_header_sub: 'Interacción en Vivo · Eje Cerebro-Corazón',
  active_tag: 'Activo',
  bpm_avg_sub: 'LPM promedio',
  brain_map_title: 'Mapeo Encefálico Tridimensional',
  orbital_rot_hint: 'Rotación Orbital 360°',
  diag_box_title: 'Análisis Anatomofuncional del Estado Activo:',
  zones_involved: 'Zonas Encefálicas Involucradas:',
  sleep_arch_title: 'Arquitectura de Sueño y Telemetría Nocturna (8 Horas)',
  sleep_arch_hint: 'LPM por Hora & Fase',
  stage_n3: 'N3 (Profundo)',
  stage_n2: 'N2 (Ligero)',
  stage_rem: 'REM (Vívido)',
  stage_wake: 'Vigilia / Despertar',
  guidelines_sub: 'Directrices médicas espaciales emitidas por el Cirujano de Vuelo',
  btn_breath: 'Iniciar Respiración Guiada 4-7-8',
  btn_panic: 'Suspiro Fisiológico & Anclaje 5-4-3-2-1',
  btn_emergency: 'Alerta SOS Cirujano de Vuelo (Nivel 3)',

  wizard_title: 'Configuración de la Misión Espacial',
  wizard_subtitle: 'Define la duración, el destino y el protocolo de entrenamiento físico del astronauta',
  step_duration: 'Duración',
  step_dest: 'Destino',
  step_goal: 'Meta de Ejercicio',
  step1_q: '¿Cuántos días estará en el espacio?',
  step1_desc: 'Define la ventana de misión para calcular los días de línea base y monitorear la adaptación fisiológica.',
  days_in_orbit: 'días en órbita',
  approx: 'aprox.',
  months: 'meses',
  presets_label: 'Preajustes habituales:',
  step2_q: '¿En dónde estará la tripulación?',
  step2_desc: 'Selecciona la ubicación: el fondo de la aplicación cambiará automáticamente con vistas reales del destino.',
  active_dest: 'Destino Activo',
  step3_q: '¿Cuál es la meta del astronauta para brindar su ejercicio?',
  step3_desc: 'Elige el arquetipo de acondicionamiento físico y protocolo de entrenamiento contra el deterioro en microgravedad.',
  assigned_meta: 'Meta Asignada',
  archetype_tag: 'Arquetipo',
  protocol_label: 'Protocolo de Ejercicio:',
  btn_skip: 'Omitir y ver panel',
  btn_back: '← Atrás',
  btn_next: 'Siguiente →',
  btn_launch: 'Aplicar Meta e Iniciar Misión',

  report_confidential: 'TELEMETRÍA MÉDICA OFICIAL · NASA SPACE APPS 2026',
  report_btn_print: 'Imprimir / Guardar PDF',
  report_btn_close: 'Cerrar',
  report_title: 'START HELPY — RESUMEN CLÍNICO DE VUELO',
  report_sub: 'División de Medicina Espacial y Factores Humanos · Telemetría Orbital',
  report_mission: 'Misión:',
  report_subject: 'Sujeto:',
  report_chronology: 'Cronología:',
  report_earth_date: 'Fecha Tierra:',
  report_sec1_title: '1. Telemetría de Signos Vitales vs. Línea Base Terrestre',
  report_sec1_sub: 'Comparativa robusta de biomarcadores orbitales en relación a la ventana pre-vuelo en gravedad terrestre (1g):',
  report_col_bio: 'Biomarcador',
  report_col_base: 'Línea Base Tierra',
  report_col_meas: 'Medición en Vuelo',
  report_col_delta: 'Delta Relativo',
  report_col_eval: 'Evaluación Fisiológica',

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
  bpm_elevated: 'Elevated',
  bpm_critical: 'Critical',
  pause_stream: 'Pause stream',
  resume_stream: 'Resume stream',

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

  telemetry_title: 'Real-Time Biological & Physiological Indicators',
  telemetry_subtitle: 'Continuous monitoring of vital signs, z-score deviations vs personal baseline and clinical actions.',
  telemetry_card_title: 'Click to plot temporal evolution of this indicator',
  z_vs_baseline: 'σ vs baseline',
  no_delta: 'No baseline variation',
  hide_details: 'Hide details ▲',
  show_details: 'Why it matters / Actions ▼',
  clinical_why: 'Clinical importance:',
  clinical_how: 'How to measure:',
  clinical_hazard: 'Space hazard:',
  alerts_label: 'Alerts:',
  action_suggested: 'Suggested action:',
  action_urgent: 'Urgent action:',

  select_region: 'Select anatomical region:',
  region_head: 'Head',
  region_chest: 'Chest',
  region_abdomen: 'Abdomen',
  region_arms: 'Arms',
  region_legs: 'Legs',
  sleep_quality: 'Sleep Quality:',
  dominant_stage: 'Dominant Stage:',
  brain_activation: 'Brain Activation:',
  no_indicators_region: 'No active biological indicators in this region.',
  sim_case_hint: 'Live simulated neurobehavioral case',

  badge_normal: 'Normal',
  badge_attention: 'Attention',
  badge_alert: 'Alert',
  badge_nodata: 'No data',

  streak_active_title: '{days}-Day Streak Active!',
  streak_badge: 'On Streak',
  streak_motto: 'Exemplary space discipline! You have completed training and telemetry protocols without interruption.',
  orbital_points: 'Orbital Points',
  perf_rank: 'Performance Rank',
  active_shield: 'Active Shield',
  zero_g_shield: 'Zero-G Protection',
  streak_history_title: 'Streak History & Upcoming Milestones:',
  streak_history_sub: 'Completed days and orbital preservation goals',
  assigned_goal: 'Assigned Training Goal',
  today_progress: "Today's Progress",
  exercises_unit: 'exercises',
  completed_status: 'Completed',
  pending_status: 'Pending',
  mark_completed: 'Mark as completed',
  mark_pending: 'Mark as pending',
  sets_reps: 'Sets & Reps:',
  biomech_desc: 'Biomechanical Description:',
  all_done_title: 'Daily Session 100% Completed!',
  all_done_desc: "You've secured today's muscular and cardiovascular preservation. Streak protected and +120 XP credited.",

  cardiac_telemetry: 'Cardiac Telemetry:',
  autonomic_tone: 'Autonomic Tone',
  parasympathetic: 'Parasympathetic',
  sympathetic: 'Sympathetic',
  sim_header_title: 'SPACE NEUROBEHAVIORAL CASE SIMULATOR',
  sim_header_sub: 'Live Interaction · Brain-Heart Axis',
  active_tag: 'Active',
  bpm_avg_sub: 'BPM average',
  brain_map_title: '3D Brain Mapping',
  orbital_rot_hint: '360° Orbital Rotation',
  diag_box_title: 'Anatomofunctional Analysis of Active State:',
  zones_involved: 'Brain Zones Involved:',
  sleep_arch_title: 'Sleep Architecture & Nocturnal Telemetry (8 Hours)',
  sleep_arch_hint: 'BPM per Hour & Stage',
  stage_n3: 'N3 (Deep)',
  stage_n2: 'N2 (Light)',
  stage_rem: 'REM (Vivid)',
  stage_wake: 'Wakefulness / Arousal',
  guidelines_sub: 'Space medical guidelines issued by Flight Surgeon',
  btn_breath: 'Start Guided Breathing 4-7-8',
  btn_panic: 'Physiological Sigh & 5-4-3-2-1 Grounding',
  btn_emergency: 'Flight Surgeon SOS Alert (Level 3)',

  wizard_title: 'Space Mission Configuration',
  wizard_subtitle: "Define the astronaut's duration, destination and physical training protocol",
  step_duration: 'Duration',
  step_dest: 'Destination',
  step_goal: 'Exercise Goal',
  step1_q: 'How many days will you be in space?',
  step1_desc: 'Define mission window to calculate baseline days and monitor physiological adaptation.',
  days_in_orbit: 'days in orbit',
  approx: 'approx.',
  months: 'months',
  presets_label: 'Common presets:',
  step2_q: 'Where will the crew be located?',
  step2_desc: 'Select location: the application background dynamically changes with real destination views.',
  active_dest: 'Active Destination',
  step3_q: "What is the astronaut's training goal?",
  step3_desc: 'Choose physical conditioning archetype and exercise protocol against zero-g degradation.',
  assigned_meta: 'Assigned Goal',
  archetype_tag: 'Archetype',
  protocol_label: 'Exercise Protocol:',
  btn_skip: 'Skip to dashboard',
  btn_back: '← Back',
  btn_next: 'Next →',
  btn_launch: 'Apply Goal & Launch Mission',

  report_confidential: 'OFFICIAL MEDICAL TELEMETRY · NASA SPACE APPS 2026',
  report_btn_print: 'Print / Save PDF',
  report_btn_close: 'Close',
  report_title: 'START HELPY — CLINICAL FLIGHT SUMMARY',
  report_sub: 'Space Medicine and Human Factors Division · Orbital Telemetry',
  report_mission: 'Mission:',
  report_subject: 'Subject:',
  report_chronology: 'Chronology:',
  report_earth_date: 'Earth Date:',
  report_sec1_title: '1. Vital Signs Telemetry vs. Terrestrial Baseline',
  report_sec1_sub: 'Robust comparison of orbital biomarkers relative to pre-flight terrestrial gravity window (1g):',
  report_col_bio: 'Biomarker',
  report_col_base: 'Earth Baseline',
  report_col_meas: 'In-Flight Reading',
  report_col_delta: 'Relative Delta',
  report_col_eval: 'Physiological Evaluation',

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
