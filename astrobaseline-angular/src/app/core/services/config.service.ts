import { Injectable, inject } from '@angular/core';
import {
  IndicatorConfig,
  IndicatorKey,
  RegionInfo,
  BodyRegionKey,
  EnvironmentInfo,
  MissionDestination,
  TrainingGoal,
} from '../models/indicator.model';
import { I18nService } from './i18n.service';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly i18n = inject(I18nService);

  readonly APP_NAME = 'Start Helpy';

  get TAGLINE(): string {
    return this.i18n.t().tagline;
  }

  readonly DATE_COL = 'date';
  readonly SUBJECT_COL = 'astronaut_id';

  readonly DATE_SYNONYMS = [
    'date', 'fecha', 'day', 'timestamp', 'time', 'datetime',
    'fechahora', 'missionday', 'dia', 'sol',
  ];

  readonly SUBJECT_SYNONYMS = [
    'astronautid', 'astronaut', 'subject', 'subjectid', 'crew',
    'crewmember', 'participant', 'patient', 'userid', 'user', 'id',
  ];

  readonly LONG_VAR_SYNONYMS = [
    'variable', 'metric', 'measurement', 'indicator',
    'parameter', 'test', 'tipo', 'type',
  ];

  readonly LONG_VAL_SYNONYMS = ['value', 'valor', 'result', 'reading', 'measure'];

  private readonly INDICATORS_ES: Record<IndicatorKey, IndicatorConfig> = {
    heart_rate: {
      label: 'Frecuencia cardíaca en reposo',
      unit: 'lpm',
      ref_low: 50,
      ref_high: 100,
      hard_low: 40,
      hard_high: 120,
      plaus_low: 20,
      plaus_high: 250,
      min_sigma: 2.0,
      region: 'chest',
      hazard: 'Campos gravitatorios (desplazamiento de fluidos, descondicionamiento); estrés operacional',
      why: 'La redistribución de fluidos y el descondicionamiento en microgravedad, sumado al estrés y descanso deficiente, alteran el ritmo basal.',
      how: 'Monitor portátil o toma manual de pulso en reposo (sentado, 5 min).',
      attention: 'Descansar, hidratarse, repetir en 10 min; evaluar sueño y niveles de estrés.',
      alert: 'Repetir la medición; de confirmarse, aplicar el protocolo médico a bordo y notificar al cirujano de vuelo.',
      synonyms: ['hr', 'heartrate', 'pulse', 'bpm', 'fc', 'frecuenciacardiaca', 'pulso', 'heart_rate_bpm'],
    },
    systolic_bp: {
      label: 'Presión arterial sistólica',
      unit: 'mmHg',
      ref_low: 90,
      ref_high: 130,
      hard_low: 80,
      hard_high: 160,
      plaus_low: 60,
      plaus_high: 260,
      min_sigma: 4.0,
      region: 'chest',
      hazard: 'Microgravedad (desplazamiento cefálico); radiación espacial (riesgo cardiovascular)',
      why: 'La gravedad alterada redistribuye fluidos corporales hacia la cabeza y modifica la regulación de la presión arterial.',
      how: 'Tensiómetro digital automático de brazo, en reposo sentado, mismo brazo y misma hora del día.',
      attention: 'Repetir tras 10 min de reposo; reducir ingesta de sodio y cafeína; registrar en bitácora.',
      alert: 'Repetir medición; de confirmarse fuera de rango crítico, activar protocolo a bordo y alertar al cirujano de vuelo.',
      synonyms: ['sbp', 'systolic', 'sys', 'bpsys', 'presionsistolica', 'systolicbloodpressure', 'ps'],
    },
    diastolic_bp: {
      label: 'Presión arterial diastólica',
      unit: 'mmHg',
      ref_low: 60,
      ref_high: 85,
      hard_low: 50,
      hard_high: 100,
      plaus_low: 30,
      plaus_high: 160,
      min_sigma: 3.0,
      region: 'chest',
      hazard: 'Microgravedad (desplazamiento cefálico); radiación cósmica',
      why: 'Mismo mecanismo que la presión sistólica; ambas se analizan de manera conjunta para evaluar resistencia vascular.',
      how: 'Misma toma de tensiómetro que la presión sistólica.',
      attention: 'Repetir tras 10 min de reposo; registrar en bitácora de telemetría.',
      alert: 'Repetir; si se confirma el valor crítico, seguir procedimiento a bordo y notificar de urgencia a tierra.',
      synonyms: ['dbp', 'diastolic', 'dia', 'bpdia', 'presiondiastolica', 'diastolicbloodpressure', 'pd'],
    },
    glucose: {
      label: 'Glucosa en sangre',
      unit: 'mg/dL',
      ref_low: 70,
      ref_high: 110,
      hard_low: 60,
      hard_high: 180,
      plaus_low: 20,
      plaus_high: 600,
      min_sigma: 5.0,
      region: 'abdomen',
      hazard: 'Ambiente confinado (dieta espacial, estrés metabólico); alteración del gasto energético',
      why: 'Cambios en la dieta, estrés y menor carga gravitacional alteran el metabolismo de carbohidratos y sensibilidad a la insulina.',
      how: 'Glucómetro capilar en yema del dedo, en ayunas, misma hora cada mañana.',
      attention: 'Revisar ingesta nutricional y ejercicio reciente; repetir medición en ayunas.',
      alert: 'Repetir toma; de persistir alteración, aplicar protocolo metabólico a bordo y alertar al cirujano de vuelo.',
      synonyms: ['glucose', 'glucosa', 'bloodsugar', 'bg', 'glu', 'glycemia', 'glicemia', 'bloodglucose'],
    },
    temperature: {
      label: 'Temperatura corporal',
      unit: '°C',
      ref_low: 36.0,
      ref_high: 37.5,
      hard_low: 35.0,
      hard_high: 38.5,
      plaus_low: 30,
      plaus_high: 43,
      min_sigma: 0.2,
      region: 'arms',
      hazard: 'Ambiente cerrado (riesgo de infección, carga térmica del hábitat); cambios inmunológicos',
      why: 'La microgravedad altera la respuesta inmune y los hábitats cerrados favorecen la transmisión de patógenos.',
      how: 'Termómetro infrarrojo frontal o digital oral, misma hora cada día.',
      attention: 'Hidratar, verificar temperatura del módulo y repetir medición en 30 min.',
      alert: 'Aislar preventivamente al astronauta si es viable, repetir toma, seguir protocolo clínico e informar a tierra.',
      synonyms: ['temp', 'bodytemp', 'bodytemperature', 'temperatura', 'tempc', 'temperature_c', 'temperaturec'],
    },
    sleep_hours: {
      label: 'Duración del sueño',
      unit: 'h',
      ref_low: 6.0,
      ref_high: 10.0,
      hard_low: 4.5,
      hard_high: null,
      plaus_low: 0,
      plaus_high: 24,
      min_sigma: 0.5,
      region: 'head',
      hazard: 'Aislamiento y confinamiento; disrupción circadiana (~16 amaneceres/día); ruido y sobrecarga',
      why: 'Los rápidos ciclos de luz solar orbitales, el ruido de soporte vital y la carga de trabajo reducen el descanso reparador.',
      how: 'Monitor wearable de sueño o registro diario de bitácora del astronauta.',
      attention: 'Proteger ventana de descanso; atenuar luz y ruido acústico; revisar carga de tareas.',
      alert: 'Reportar riesgo agudo de fatiga al cirujano de vuelo; solicitar reducción temporal de horario.',
      synonyms: ['sleep', 'sleeptime', 'sleepduration', 'sueno', 'horassueno', 'sleephours', 'hoursofsleep', 'totalsleep'],
    },
    mood: {
      label: 'Estado de ánimo (1-5)',
      unit: 'puntos',
      ref_low: 3,
      ref_high: null,
      hard_low: 2,
      hard_high: null,
      plaus_low: 1,
      plaus_high: 5,
      min_sigma: 0.5,
      region: 'head',
      hazard: 'Aislamiento, confinamiento extremo y lejanía de la Tierra',
      why: 'La lejanía y el confinamiento prolongado impactan la salud mental y conductual. Escala: 1 = Muy bajo, 5 = Excelente.',
      how: 'Autoevaluación diaria rápida (1-5) en menos de 10 segundos.',
      attention: 'Coordinar llamada con familiares o tripulación, ajustar períodos de descanso y recreación.',
      alert: 'Solicitar sesión de consulta psicológica/conductual con el equipo médico de tierra.',
      synonyms: ['mood', 'animo', 'estadoanimo', 'wellbeing', 'mentalstate', 'moodscore'],
    },
  };

  private readonly INDICATORS_EN: Record<IndicatorKey, IndicatorConfig> = {
    heart_rate: {
      label: 'Resting Heart Rate',
      unit: 'bpm',
      ref_low: 50,
      ref_high: 100,
      hard_low: 40,
      hard_high: 120,
      plaus_low: 20,
      plaus_high: 250,
      min_sigma: 2.0,
      region: 'chest',
      hazard: 'Gravitational fields (fluid shifts, cardiovascular deconditioning); operational stress',
      why: 'Fluid redistribution and zero-g deconditioning, coupled with operational stress and poor sleep, disrupt baseline cardiac rhythm.',
      how: 'Wearable telemetry monitor or manual pulse check at rest (seated, 5 min).',
      attention: 'Rest, hydrate, recheck in 10 min; assess sleep hygiene and stress levels.',
      alert: 'Repeat measurement; if confirmed, apply onboard medical protocol and notify Flight Surgeon.',
      synonyms: ['hr', 'heartrate', 'pulse', 'bpm', 'fc', 'frecuenciacardiaca', 'pulso', 'heart_rate_bpm'],
    },
    systolic_bp: {
      label: 'Systolic Blood Pressure',
      unit: 'mmHg',
      ref_low: 90,
      ref_high: 130,
      hard_low: 80,
      hard_high: 160,
      plaus_low: 60,
      plaus_high: 260,
      min_sigma: 4.0,
      region: 'chest',
      hazard: 'Microgravity (cephalad fluid shift); space radiation (cardiovascular risk)',
      why: 'Altered gravity shifts body fluids toward the head, altering blood pressure regulation.',
      how: 'Automatic digital arm cuff, seated at rest, same arm and time of day.',
      attention: 'Repeat after 10 min rest; reduce sodium and caffeine; log in telemetry log.',
      alert: 'Repeat reading; if critical range confirmed, trigger onboard protocol and alert Flight Surgeon.',
      synonyms: ['sbp', 'systolic', 'sys', 'bpsys', 'presionsistolica', 'systolicbloodpressure', 'ps'],
    },
    diastolic_bp: {
      label: 'Diastolic Blood Pressure',
      unit: 'mmHg',
      ref_low: 60,
      ref_high: 85,
      hard_low: 50,
      hard_high: 100,
      plaus_low: 30,
      plaus_high: 160,
      min_sigma: 3.0,
      region: 'chest',
      hazard: 'Microgravity (cephalad fluid shift); cosmic radiation',
      why: 'Same mechanism as systolic pressure; evaluated together to assess systemic vascular resistance.',
      how: 'Same digital arm cuff protocol as systolic blood pressure.',
      attention: 'Repeat after 10 min rest; record in telemetry log.',
      alert: 'Repeat; if critical value confirmed, follow emergency procedure and notify ground.',
      synonyms: ['dbp', 'diastolic', 'dia', 'bpdia', 'presiondiastolica', 'diastolicbloodpressure', 'pd'],
    },
    glucose: {
      label: 'Blood Glucose',
      unit: 'mg/dL',
      ref_low: 70,
      ref_high: 110,
      hard_low: 60,
      hard_high: 180,
      plaus_low: 20,
      plaus_high: 600,
      min_sigma: 5.0,
      region: 'abdomen',
      hazard: 'Confined habitat (space nutrition, metabolic stress); energy expenditure changes',
      why: 'Changes in diet, psychological stress and lower gravity load alter carbohydrate metabolism and insulin sensitivity.',
      how: 'Capillary fingertip glucometer, fasting state, same time each morning.',
      attention: 'Review dietary log and recent exercise; repeat fasting measurement.',
      alert: 'Repeat test; if persistent alteration, apply onboard metabolic protocol and notify Flight Surgeon.',
      synonyms: ['glucose', 'glucosa', 'bloodsugar', 'bg', 'glu', 'glycemia', 'glicemia', 'bloodglucose'],
    },
    temperature: {
      label: 'Body Temperature',
      unit: '°C',
      ref_low: 36.0,
      ref_high: 37.5,
      hard_low: 35.0,
      hard_high: 38.5,
      plaus_low: 30,
      plaus_high: 43,
      min_sigma: 0.2,
      region: 'arms',
      hazard: 'Closed environment (pathogen transmission, habitat thermal load); immune dysregulation',
      why: 'Microgravity suppresses immune response and closed quarters increase microbial transmission risks.',
      how: 'Infrared forehead sensor or digital oral thermometer, same time daily.',
      attention: 'Hydrate, verify cabin module ventilation, repeat reading in 30 min.',
      alert: 'Preemptively isolate astronaut if viable, follow clinical protocol and report to ground.',
      synonyms: ['temp', 'bodytemp', 'bodytemperature', 'temperatura', 'tempc', 'temperature_c', 'temperaturec'],
    },
    sleep_hours: {
      label: 'Sleep Duration',
      unit: 'h',
      ref_low: 6.0,
      ref_high: 10.0,
      hard_low: 4.5,
      hard_high: null,
      plaus_low: 0,
      plaus_high: 24,
      min_sigma: 0.5,
      region: 'head',
      hazard: 'Isolation and confinement; circadian disruption (~16 orbital sunrises/day); acoustic noise',
      why: 'Frequent orbital light-dark cycles, life support noise, and high workloads compromise restorative rest.',
      how: 'Wearable sleep telemetry tracker or daily astronaut log.',
      attention: 'Protect sleep window; dim lighting and minimize noise; review daily workload.',
      alert: 'Report acute fatigue risk to Flight Surgeon; request temporary schedule adjustment.',
      synonyms: ['sleep', 'sleeptime', 'sleepduration', 'sueno', 'horassueno', 'sleephours', 'hoursofsleep', 'totalsleep'],
    },
    mood: {
      label: 'Mood Score (1-5)',
      unit: 'pts',
      ref_low: 3,
      ref_high: null,
      hard_low: 2,
      hard_high: null,
      plaus_low: 1,
      plaus_high: 5,
      min_sigma: 0.5,
      region: 'head',
      hazard: 'Extreme isolation, confinement and Earth-out-of-view phenomenon',
      why: 'Prolonged distance and confinement directly impact psychological wellbeing and behavioral health. Scale: 1 = Very low, 5 = Excellent.',
      how: 'Quick daily self-assessment (1-5) taking under 10 seconds.',
      attention: 'Schedule family or crew private comms window; adjust recreation time.',
      alert: 'Request behavioral health psychological consult with mission support on Earth.',
      synonyms: ['mood', 'animo', 'estadoanimo', 'wellbeing', 'mentalstate', 'moodscore'],
    },
  };

  get INDICATORS(): Record<IndicatorKey, IndicatorConfig> {
    return this.i18n.currentLang() === 'en' ? this.INDICATORS_EN : this.INDICATORS_ES;
  }

  private readonly REGIONS_ES: Record<BodyRegionKey, RegionInfo> = {
    head: {
      label: 'Cerebro y Comportamiento',
      indicators: ['sleep_hours', 'mood'],
      note: 'Salud mental, bienestar psicológico y calidad del sueño.',
    },
    chest: {
      label: 'Sistema Cardiovascular',
      indicators: ['heart_rate', 'systolic_bp', 'diastolic_bp'],
      note: 'Monitoreo cardíaco, ritmo sinusal y regulación de presión sanguínea.',
    },
    abdomen: {
      label: 'Metabolismo & Nutrición',
      indicators: ['glucose'],
      note: 'Nivel glucémico y respuesta metabólica al ejercicio y nutrición.',
    },
    arms: {
      label: 'Termorregulación y Sistema Inmune',
      indicators: ['temperature'],
      note: 'Temperatura corporal como indicador de infección o sobrecalentamiento.',
    },
    legs: {
      label: 'Sistema Musculoesquelético',
      indicators: [],
      note: 'La pérdida de densidad ósea y muscular requiere imagenología a bordo (DXA / ultrasonido).',
    },
  };

  private readonly REGIONS_EN: Record<BodyRegionKey, RegionInfo> = {
    head: {
      label: 'Brain & Behavior',
      indicators: ['sleep_hours', 'mood'],
      note: 'Mental health, psychological wellbeing and sleep quality.',
    },
    chest: {
      label: 'Cardiovascular System',
      indicators: ['heart_rate', 'systolic_bp', 'diastolic_bp'],
      note: 'Cardiac monitoring, sinus rhythm and blood pressure regulation.',
    },
    abdomen: {
      label: 'Metabolism & Nutrition',
      indicators: ['glucose'],
      note: 'Glycemic control and metabolic response to exercise and space nutrition.',
    },
    arms: {
      label: 'Thermoregulation & Immune System',
      indicators: ['temperature'],
      note: 'Body temperature monitoring for infection or habitat overheating.',
    },
    legs: {
      label: 'Musculoskeletal System',
      indicators: [],
      note: 'Bone and muscle density monitoring requires onboard ultrasound or DXA.',
    },
  };

  get REGIONS(): Record<BodyRegionKey, RegionInfo> {
    return this.i18n.currentLang() === 'en' ? this.REGIONS_EN : this.REGIONS_ES;
  }

  readonly STATUS_CONFIG: Record<number, { name: string; color: string }> = {
    [-1]: { name: 'Sin datos', color: '#757575' },
    0: { name: 'Normal', color: '#2e7d32' },
    1: { name: 'Atención', color: '#f9a825' },
    2: { name: 'Alerta', color: '#c62828' },
  };

  readonly ENVIRONMENTS: Record<string, EnvironmentInfo> = {
    'Estación espacial (órbita terrestre baja)': {
      delay: '< 1 s, contacto casi continuo',
      autonomy: 'Baja',
      routine: 'Rutina: mantener mediciones diarias; control en tierra puede revisar en tiempo real.',
      attention: 'Soporte en tiempo real: enviar datos al cirujano de vuelo en la siguiente ventana de contacto y aplicar la acción sugerida.',
      alert: 'Contactar al cirujano de vuelo AHORA (soporte en tiempo real disponible).',
    },
    'Base lunar / superficie lunar': {
      delay: 'aprox. 1.3 s de ida',
      autonomy: 'Media',
      routine: 'Rutina: mantener mediciones diarias; el equipo en tierra revisa con rapidez.',
      attention: 'Soporte casi en tiempo real: aplicar la acción sugerida y enviar el paquete de datos al cirujano de vuelo.',
      alert: 'Contactar al cirujano de vuelo ahora; aplicar primeros auxilios mientras llega la respuesta.',
    },
    'Tránsito / superficie de Marte': {
      delay: 'aprox. 3 a 22 min de ida, más posibles bloqueos solares',
      autonomy: 'Alta',
      routine: 'Rutina: la tripulación se autoevalúa; los datos se almacenan y transmiten de forma asíncrona.',
      attention: 'Soporte diferido: seguir la guía a bordo primero, registrar la tendencia y enviar reporte asíncrono.',
      alert: 'Soporte diferido: iniciar procedimiento médico de emergencia a bordo inmediatamente; no esperar confirmación de la Tierra.',
    },
  };

  readonly INDICATOR_KEYS: IndicatorKey[] = [
    'heart_rate',
    'systolic_bp',
    'diastolic_bp',
    'glucose',
    'temperature',
    'sleep_hours',
    'mood',
  ];

  private readonly DESTINATIONS_ES: MissionDestination[] = [
    {
      id: 'iss',
      name: 'Estación Espacial Internacional (ISS)',
      environmentKey: 'Estación espacial (órbita terrestre baja)',
      image: '/assets/images/destinations/iss.jpg',
      description: 'Órbita terrestre baja, microgravedad continua, retraso < 1s con el centro de control.',
    },
    {
      id: 'moon',
      name: 'La Luna (Base Lunar Artemis)',
      environmentKey: 'Base lunar / superficie lunar',
      image: '/assets/images/destinations/luna.jpg',
      description: 'Gravedad 1/6 g, radiación lunar, retraso ~1.3 s de comunicación de ida.',
    },
    {
      id: 'mars',
      name: 'Marte (Tránsito & Superficie)',
      environmentKey: 'Tránsito / superficie de Marte',
      image: '/assets/images/destinations/marte4.webp',
      description: 'Gravedad 0.38 g, alta autonomía requerida, retraso de 3 a 22 minutos.',
    },
  ];

  private readonly DESTINATIONS_EN: MissionDestination[] = [
    {
      id: 'iss',
      name: 'International Space Station (ISS)',
      environmentKey: 'Estación espacial (órbita terrestre baja)',
      image: '/assets/images/destinations/iss.jpg',
      description: 'Low Earth orbit, microgravity, < 1s latency with mission control.',
    },
    {
      id: 'moon',
      name: 'The Moon (Artemis Base Camp)',
      environmentKey: 'Base lunar / superficie lunar',
      image: '/assets/images/destinations/luna.jpg',
      description: '1/6 g gravity, lunar radiation, ~1.3 s one-way communications delay.',
    },
    {
      id: 'mars',
      name: 'Mars (Transit & Surface)',
      environmentKey: 'Tránsito / superficie de Marte',
      image: '/assets/images/destinations/marte4.webp',
      description: '0.38 g gravity, high autonomy required, 3 to 22 minutes one-way delay.',
    },
  ];

  get DESTINATIONS(): MissionDestination[] {
    return this.i18n.currentLang() === 'en' ? this.DESTINATIONS_EN : this.DESTINATIONS_ES;
  }

  private readonly TRAINING_GOALS_ES: TrainingGoal[] = [
    {
      id: 'A-01',
      name: 'Meta CBUM — Hipertrofia & Fuerza Muscular',
      archetype: 'Desarrollo y preservación de masa muscular magra',
      avatar: '/assets/images/astronauts/cbum.jpeg',
      description: 'Entrenamiento enfocado en retención de masa muscular, densidad corporal y fuerza máxima para contrarrestar la atrofia en microgravedad.',
      routineFocus: 'Sobrecarga biomecánica en ARED (dispositivo resistivo avanzado), seguimiento estricto de glucosa y metabolismo de proteínas.',
    },
    {
      id: 'A-02',
      name: 'Meta Spartacus — Resistencia & Condición Espartana',
      archetype: 'Capacidad cardiovascular y resistencia funcional extrema',
      avatar: '/assets/images/astronauts/spartacus.jpeg',
      description: 'Acondicionamiento físico de alta exigencia, capacidad de trabajo prolongado y tolerancia al estrés fisiológico en misiones hostiles.',
      routineFocus: 'Circuitos aeróbicos continuos en cicloergómetro (CEVIS), cinta rodante (T2) y control de variabilidad de frecuencia cardíaca.',
    },
  ];

  private readonly TRAINING_GOALS_EN: TrainingGoal[] = [
    {
      id: 'A-01',
      name: 'CBUM Goal — Hypertrophy & Muscle Strength',
      archetype: 'Lean muscle mass preservation and development',
      avatar: '/assets/images/astronauts/cbum.jpeg',
      description: 'Training focused on muscle retention, body density, and maximal strength to counteract microgravity atrophy.',
      routineFocus: 'Biomechanical overload on ARED (Advanced Resistive Exercise Device), strict monitoring of glucose and protein metabolism.',
    },
    {
      id: 'A-02',
      name: 'Spartacus Goal — Endurance & Spartan Conditioning',
      archetype: 'Cardiovascular capacity and extreme functional stamina',
      avatar: '/assets/images/astronauts/spartacus.jpeg',
      description: 'High-intensity physical conditioning, prolonged work capacity, and stress tolerance for demanding exploration missions.',
      routineFocus: 'Continuous aerobic circuits on CEVIS cycle ergometer, T2 treadmill, and heart rate variability tracking.',
    },
  ];

  get TRAINING_GOALS(): TrainingGoal[] {
    return this.i18n.currentLang() === 'en' ? this.TRAINING_GOALS_EN : this.TRAINING_GOALS_ES;
  }
}
