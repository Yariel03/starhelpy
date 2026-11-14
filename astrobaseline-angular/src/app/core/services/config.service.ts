import { Injectable } from '@angular/core';
import {
  IndicatorConfig,
  IndicatorKey,
  RegionInfo,
  BodyRegionKey,
  EnvironmentInfo,
  MissionDestination,
  TrainingGoal,
} from '../models/indicator.model';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  readonly APP_NAME = 'AstroBaseline';
  readonly TAGLINE = 'Personal-baseline health monitoring for long-duration missions';

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

  readonly INDICATORS: Record<IndicatorKey, IndicatorConfig> = {
    heart_rate: {
      label: 'Resting heart rate',
      unit: 'bpm',
      ref_low: 50,
      ref_high: 100,
      hard_low: 40,
      hard_high: 120,
      plaus_low: 20,
      plaus_high: 250,
      min_sigma: 2.0,
      region: 'chest',
      hazard: 'Gravity fields (fluid shifts, cardiovascular deconditioning); stress',
      why: 'Fluid shifts and cardiovascular deconditioning in microgravity, plus stress and sleep loss, can change resting heart rate.',
      how: 'Wearable or manual pulse at rest (seated, 5 min).',
      attention: 'Rest, hydrate, repeat in 10 min; review sleep and stress.',
      alert: 'Repeat the measurement; if confirmed, follow the onboard medical procedure and notify the flight surgeon.',
      synonyms: ['hr', 'heartrate', 'pulse', 'bpm', 'fc', 'frecuenciacardiaca', 'pulso', 'heart_rate_bpm'],
    },
    systolic_bp: {
      label: 'Systolic blood pressure',
      unit: 'mmHg',
      ref_low: 90,
      ref_high: 130,
      hard_low: 80,
      hard_high: 160,
      plaus_low: 60,
      plaus_high: 260,
      min_sigma: 4.0,
      region: 'chest',
      hazard: 'Gravity fields (fluid shifts); space radiation (cardiovascular risk)',
      why: 'Altered gravity shifts body fluids and changes blood-pressure regulation; radiation is studied for long-term cardiovascular risk.',
      how: 'Automatic cuff, seated and rested, same arm and time of day.',
      attention: 'Repeat after 10 min of rest; reduce salt/caffeine; log it.',
      alert: 'Repeat; if confirmed, follow onboard procedure and notify the flight surgeon.',
      synonyms: ['sbp', 'systolic', 'sys', 'bpsys', 'presionsistolica', 'systolicbloodpressure', 'ps'],
    },
    diastolic_bp: {
      label: 'Diastolic blood pressure',
      unit: 'mmHg',
      ref_low: 60,
      ref_high: 85,
      hard_low: 50,
      hard_high: 100,
      plaus_low: 30,
      plaus_high: 160,
      min_sigma: 3.0,
      region: 'chest',
      hazard: 'Gravity fields (fluid shifts); space radiation (cardiovascular risk)',
      why: 'Same mechanism as systolic pressure; both are read together.',
      how: 'Same cuff reading as systolic.',
      attention: 'Repeat after 10 min of rest; log it.',
      alert: 'Repeat; if confirmed, follow onboard procedure and notify the flight surgeon.',
      synonyms: ['dbp', 'diastolic', 'dia', 'bpdia', 'presiondiastolica', 'diastolicbloodpressure', 'pd'],
    },
    glucose: {
      label: 'Blood glucose',
      unit: 'mg/dL',
      ref_low: 70,
      ref_high: 110,
      hard_low: 60,
      hard_high: 180,
      plaus_low: 20,
      plaus_high: 600,
      min_sigma: 5.0,
      region: 'abdomen',
      hazard: 'Hostile closed environment (diet, stress); reduced activity',
      why: 'Diet changes, stress and reduced physical load can alter glucose metabolism; it is studied in spaceflight research.',
      how: 'Fingertip glucometer, fasting, same time each day.',
      attention: 'Review meals and exercise; repeat measurement fasting.',
      alert: 'Repeat; if confirmed, follow onboard procedure and notify the flight surgeon.',
      synonyms: ['glucose', 'glucosa', 'bloodsugar', 'bg', 'glu', 'glycemia', 'glicemia', 'bloodglucose'],
    },
    temperature: {
      label: 'Body temperature',
      unit: '°C',
      ref_low: 36.0,
      ref_high: 37.5,
      hard_low: 35.0,
      hard_high: 38.5,
      plaus_low: 30,
      plaus_high: 43,
      min_sigma: 0.2,
      region: 'arms',
      hazard: 'Hostile closed environment (infection risk, thermal load); immune changes',
      why: 'Spaceflight alters immune function and closed habitats favour infection spread; habitat heat load also matters.',
      how: 'Non-contact or oral thermometer, same time each day.',
      attention: 'Hydrate, check habitat temperature, repeat in 30 min.',
      alert: 'Isolate if possible, repeat, follow onboard procedure and notify the flight surgeon.',
      synonyms: ['temp', 'bodytemp', 'bodytemperature', 'temperatura', 'tempc', 'temperature_c', 'temperaturec'],
    },
    sleep_hours: {
      label: 'Sleep duration',
      unit: 'h',
      ref_low: 6.0,
      ref_high: 10.0,
      hard_low: 4.5,
      hard_high: null,
      plaus_low: 0,
      plaus_high: 24,
      min_sigma: 0.5,
      region: 'head',
      hazard: 'Isolation and confinement; circadian disruption; workload',
      why: 'Light cycles (about 16 sunrises per day on the ISS), noise, workload and isolation reduce sleep.',
      how: 'Wearable sleep tracker or the crew sleep log.',
      attention: 'Protect the sleep window; reduce light/noise; review workload.',
      alert: 'Report fatigue risk to the flight surgeon; request schedule relief.',
      synonyms: ['sleep', 'sleeptime', 'sleepduration', 'sueno', 'horassueno', 'sleephours', 'hoursofsleep', 'totalsleep'],
    },
    mood: {
      label: 'Mood (1-5)',
      unit: 'score',
      ref_low: 3,
      ref_high: null,
      hard_low: 2,
      hard_high: null,
      plaus_low: 1,
      plaus_high: 5,
      min_sigma: 0.5,
      region: 'head',
      hazard: 'Isolation and confinement; distance from Earth',
      why: 'Isolation, confinement and distance from Earth affect behavioral health. Self-reported scale: 1 = very low, 5 = very good.',
      how: 'Daily self-report (1-5) in under 10 seconds.',
      attention: 'Schedule a call with family/crew, review rest and workload.',
      alert: 'Request a behavioral-health check-in with the flight surgeon.',
      synonyms: ['mood', 'animo', 'estadoanimo', 'wellbeing', 'mentalstate', 'moodscore'],
    },
  };

  readonly REGIONS: Record<BodyRegionKey, RegionInfo> = {
    head: {
      label: 'Brain and behavior',
      indicators: ['sleep_hours', 'mood'],
      note: 'Behavioral health and sleep.',
    },
    chest: {
      label: 'Cardiovascular system',
      indicators: ['heart_rate', 'systolic_bp', 'diastolic_bp'],
      note: 'Heart and circulation.',
    },
    abdomen: {
      label: 'Metabolism',
      indicators: ['glucose'],
      note: 'Glucose and nutrition.',
    },
    arms: {
      label: 'Thermoregulation and immune response (whole body)',
      indicators: ['temperature'],
      note: 'Temperature as a proxy for infection or heat load.',
    },
    legs: {
      label: 'Musculoskeletal system',
      indicators: [],
      note: 'Bone density loss is a key spaceflight risk, but it needs imaging (e.g. DXA or ultrasound). Not simulated here: future work.',
    },
  };

  readonly STATUS_CONFIG: Record<number, { name: string; color: string }> = {
    [-1]: { name: 'No data', color: '#757575' },
    0: { name: 'Normal', color: '#2e7d32' },
    1: { name: 'Attention', color: '#f9a825' },
    2: { name: 'Alert', color: '#c62828' },
  };

  readonly ENVIRONMENTS: Record<string, EnvironmentInfo> = {
    'Space station (low Earth orbit)': {
      delay: '< 1 s, near-continuous contact',
      autonomy: 'Low',
      routine: 'Routine: keep daily measurements; ground can review in real time.',
      attention: 'Real-time support: send the data to the flight surgeon at the next contact window and apply the suggested action.',
      alert: 'Contact the flight surgeon NOW (real-time support available).',
    },
    'Moon base / lunar surface': {
      delay: 'about 1.3 s one way',
      autonomy: 'Medium',
      routine: 'Routine: keep daily measurements; ground can review quickly.',
      attention: 'Near-real-time support: apply the suggested action and send the data package to the flight surgeon.',
      alert: 'Contact the flight surgeon now; apply first aid guidance while waiting for the reply (small delay).',
    },
    'Mars transit / surface': {
      delay: 'about 3 to 22 min one way, plus blackouts (solar conjunction)',
      autonomy: 'High',
      routine: 'Routine: the crew self-assesses; data is stored and sent asynchronously.',
      attention: 'Delayed support: follow the onboard guidance first, log the trend, and send an asynchronous report to the flight surgeon.',
      alert: 'Delayed support: start the onboard emergency procedure first, then send the report and data package; do not wait for the reply.',
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

  readonly DESTINATIONS: MissionDestination[] = [
    {
      id: 'iss',
      name: 'Estación Espacial Internacional (ISS)',
      environmentKey: 'Space station (low Earth orbit)',
      image: '/assets/images/destinations/iss.jpg',
      description: 'Órbita terrestre baja, microgravedad continua, retraso < 1s con el centro de control.',
    },
    {
      id: 'moon',
      name: 'La Luna (Base Lunar Artemis)',
      environmentKey: 'Moon base / lunar surface',
      image: '/assets/images/destinations/luna.jpg',
      description: 'Gravedad 1/6 g, radiación lunar, retraso ~1.3 s de comunicación de ida.',
    },
    {
      id: 'mars',
      name: 'Marte (Tránsito & Superficie)',
      environmentKey: 'Mars transit / surface',
      image: '/assets/images/destinations/marte.jpeg',
      description: 'Gravedad 0.38 g, alta autonomía requerida, retraso de 3 a 22 minutos.',
    },
  ];

  readonly TRAINING_GOALS: TrainingGoal[] = [
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
}
