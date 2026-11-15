import { Injectable, inject } from '@angular/core';
import { ConfigService } from './config.service';
import { MissionStateService } from './mission-state.service';
import { NeuroSleepService } from './neuro-sleep.service';
import { NasaDonkiService } from './nasa-donki.service';
import { I18nService } from './i18n.service';
import { HealthRecord } from '../models/indicator.model';

export interface GeminiContentPart {
  text: string;
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiContentPart[];
}

@Injectable({
  providedIn: 'root',
})
export class StarHelpyAiService {
  private readonly config = inject(ConfigService);
  private readonly state = inject(MissionStateService);
  private readonly neuro = inject(NeuroSleepService);
  private readonly nasa = inject(NasaDonkiService);
  private readonly i18n = inject(I18nService);

  // Historial de conversación en memoria para contexto multivuelta
  private conversationHistory: GeminiContent[] = [];

  // Compila el resumen histórico de telemetría médica (días atrás, semanas y línea base)
  compileHistoricalTelemetry(): string {
    const records = this.state.recordsUpToCurrent();
    const currDate = this.state.currentDate();
    const currDay = this.state.missionDay();

    if (!records || records.length === 0) {
      return 'No hay registros históricos previos cargados en la base de datos de esta misión.';
    }

    const avg = (arr: Array<number | null | undefined>) => {
      const valid = arr.filter((v): v is number => v != null && !isNaN(v));
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
    };

    // 1. Registro detallado de los últimos 7 días
    const last7 = records.slice(-7);
    const last7Formatted = last7
      .map((r, idx) => {
        const dNum = currDay - (last7.length - 1 - idx);
        const hr = r.heart_rate != null ? `${Math.round(r.heart_rate)} LPM` : 'N/D';
        const sleep = r.sleep_hours != null ? `${r.sleep_hours.toFixed(1)} h` : 'N/D';
        const mood = r.mood != null ? `${r.mood.toFixed(1)}/5` : 'N/D';
        const temp = r.temperature != null ? `${r.temperature.toFixed(1)}°C` : 'N/D';
        const bp =
          r.systolic_bp && r.diastolic_bp
            ? `${Math.round(r.systolic_bp)}/${Math.round(r.diastolic_bp)} mmHg`
            : 'N/D';
        return `  * Sol ${dNum} [${r.date}]: Frecuencia: ${hr} | Sueño: ${sleep} | Ánimo: ${mood} | Temp: ${temp} | PA: ${bp}`;
      })
      .join('\n');

    // 2. Medias de la semana actual (últimos 7 días)
    const w1Hr = avg(last7.map((r) => r.heart_rate));
    const w1Sleep = avg(last7.map((r) => r.sleep_hours));
    const w1Mood = avg(last7.map((r) => r.mood));
    const w1Temp = avg(last7.map((r) => r.temperature));

    // 3. Medias de la semana previa (días -8 a -14)
    const last14 = records.length >= 14 ? records.slice(-14, -7) : [];
    const w2Hr = avg(last14.map((r) => r.heart_rate));
    const w2Sleep = avg(last14.map((r) => r.sleep_hours));
    const w2Mood = avg(last14.map((r) => r.mood));

    // 4. Medias de hace 3 semanas (días -15 a -21)
    const last21 = records.length >= 21 ? records.slice(-21, -14) : [];
    const w3Hr = avg(last21.map((r) => r.heart_rate));
    const w3Sleep = avg(last21.map((r) => r.sleep_hours));
    const w3Mood = avg(last21.map((r) => r.mood));

    // 5. Línea Base Médica de Referencia (primeros 14 días de misión)
    const baselineRecords = records.slice(0, 14);
    const baseHr = avg(baselineRecords.map((r) => r.heart_rate));
    const baseSleep = avg(baselineRecords.map((r) => r.sleep_hours));
    const baseMood = avg(baselineRecords.map((r) => r.mood));
    const baseTemp = avg(baselineRecords.map((r) => r.temperature));

    // 6. Evaluación de alertas y escalación
    const overallStatus = this.state.overallStatus();
    const escalationText = this.state.escalationText();

    return `
HISTORIAL CLÍNICO Y REGISTRO DE DATOS (DÍAS ATRÁS Y SEMANAS ANTERIORES):
- Fecha seleccionada en el sistema: ${currDate} (Día Sol ${currDay} de misión).
- Total de días registrados en el historial: ${records.length} días.

1. REGISTRO DÍA A DÍA (ÚLTIMOS 7 DÍAS HASTA LA FECHA ACTUAL):
${last7Formatted}

2. COMPARATIVA SEMANAL (EVOLUCIÓN TEMPORAL):
- Semana actual (últimos 7 días):
  * FC media: ${w1Hr != null ? w1Hr.toFixed(1) + ' LPM' : 'N/D'}
  * Sueño medio: ${w1Sleep != null ? w1Sleep.toFixed(1) + ' horas/noche' : 'N/D'}
  * Ánimo medio: ${w1Mood != null ? w1Mood.toFixed(1) + '/5' : 'N/D'}
  * Temperatura media: ${w1Temp != null ? w1Temp.toFixed(1) + ' °C' : 'N/D'}

- Semana anterior (-8 a -14 días atrás):
  * FC media: ${w2Hr != null ? w2Hr.toFixed(1) + ' LPM' : 'N/D (muestra insuficiente)'}
  * Sueño medio: ${w2Sleep != null ? w2Sleep.toFixed(1) + ' horas/noche' : 'N/D'}
  * Ánimo medio: ${w2Mood != null ? w2Mood.toFixed(1) + '/5' : 'N/D'}

- Hace 3 semanas (-15 a -21 días atrás):
  * FC media: ${w3Hr != null ? w3Hr.toFixed(1) + ' LPM' : 'N/D'}
  * Sueño medio: ${w3Sleep != null ? w3Sleep.toFixed(1) + ' horas/noche' : 'N/D'}
  * Ánimo medio: ${w3Mood != null ? w3Mood.toFixed(1) + '/5' : 'N/D'}

3. LÍNEA BASE MÉDICA DE INICIO (PRIMEROS 14 DÍAS DE REFERENCIA):
- FC Basal de reposo: ${baseHr != null ? baseHr.toFixed(1) + ' LPM' : 'N/D'}
- Sueño Basal: ${baseSleep != null ? baseSleep.toFixed(1) + ' horas/noche' : 'N/D'}
- Ánimo Basal: ${baseMood != null ? baseMood.toFixed(1) + '/5' : 'N/D'}
- Temperatura Basal: ${baseTemp != null ? baseTemp.toFixed(1) + ' °C' : 'N/D'}

4. EVALUACIÓN MÉDICA GLOBAL DE INDICADORES:
- Nivel de Alerta General: ${overallStatus}
- Diagnóstico de Escalación: ${escalationText}
`;
  }

  // Compilar el System Prompt con inyección del Simulador Neuroconductual en tiempo real y el Historial
  buildSystemInstruction(): string {
    const lang = this.i18n.currentLang();
    const isEn = lang === 'en';

    // Telemetría de Misión
    const config = this.state.missionConfig();
    const dest = config.destination;
    const goal = config.trainingGoal;
    const duration = config.daysInSpace;
    const day = this.state.missionDay();
    const exercises = this.state.currentExercises();
    const completedEx = this.state.completedExercisesCount();
    const totalEx = exercises.length;
    const pendingNames = exercises.filter((e) => !e.completed).map((e) => e.name);

    // Telemetría Cardiovascular & Simulador Neuroconductual 3D en vivo
    const liveLpm = this.neuro.liveLpm();
    const activeCase = this.neuro.activeCase();
    const activeCaseId = this.neuro.activeStateId();
    const cardioStatus =
      liveLpm > 115
        ? 'TAQUICARDIA SEVERA / RIESGO CARDIOVASCULAR'
        : liveLpm > 95
        ? 'FRECUENCIA ELEVADA / ESTRÉS SIMPÁTICO'
        : liveLpm < 55
        ? 'BRADICARDIA'
        : 'NOMINAL EN REPOSO';

    // Telemetría de Radiación Espacial NASA DONKI
    const radLevel = this.nasa.radiationLevel();
    const isRadDanger = this.nasa.isDangerous();
    const radHeadline = this.nasa.radiationHeadline();
    const radDetails = this.nasa.radiationDetails();
    const radChecked = this.nasa.lastCheckedTime().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Historial clínico de días y semanas anteriores
    const historicalTelemetry = this.compileHistoricalTelemetry();

    return `
ERES: Star Helpy, copiloto y asistente de inteligencia artificial biomédica y factores humanos de la NASA / Agencia Espacial a bordo de la misión espacial.

OBJETIVO PRINCIPAL:
Velar por la salud fisiológica, rendimiento físico, equilibrio neuroconductual y calidad de sueño del Comandante/Astronauta en microgravedad.

================================================================================
ESTADO DEL SIMULADOR DE CASOS NEUROCONDUCTUALES ESPACIALES (MOMENTO EN VIVO):
================================================================================
En este preciso instante, el simulador de a bordo tiene activo el siguiente caso:
- IDENTIFICADOR DE CASO: ${activeCaseId}
- NOMBRE CLÍNICO DEL CASO: ${activeCase.name}
- NIVEL DE SEVERIDAD: [${activeCase.severity}]
- FRECUENCIA CARDÍACA VITAL EN VIVO: ${liveLpm} LPM (Rango del caso: ${activeCase.lpmRange} · Estado: ${cardioStatus})
- CALIDAD Y EFICIENCIA DE SUEÑO: ${activeCase.sleepQuality}
- FASE DOMINANTE DEL HIPNOGRAMA: ${activeCase.dominantStage}
- ZONAS DEL ENCÉFALO COMPROMETIDAS (MAPEO 3D): ${activeCase.zonesActivated.join(', ')}
- FISIOPATOLOGÍA CLÍNICA: ${activeCase.clinicalDescription}
- PROTOCOLO DE CONTRAMEDIDA ACTIVA: ${activeCase.countermeasureTitle}
- MEDIDAS CLÍNICAS OBLIGATORIAS: ${activeCase.countermeasures.join('; ')}
- DIRECTIVA DE HELPY PARA ESTE CASO: ${activeCase.helpyMessage}

================================================================================
TELEMETRÍA GENERAL DE LA MISIÓN:
================================================================================
- Destino de Misión: ${dest.name} (${dest.environmentKey})
- Día de Misión / Sol Actual: Día ${day} de ${duration} días programados.
- Meta de Acondicionamiento Físico: ${goal.name} (${goal.archetype})
  * Progreso de hoy: ${completedEx} de ${totalEx} ejercicios completados.
  * Ejercicios pendientes hoy: ${pendingNames.length > 0 ? pendingNames.join(', ') : 'Todos completados con éxito.'}
- Clima Espacial y Radiación Cósmica (NASA DONKI - Último Escaneo: ${radChecked}):
  * Nivel de Alerta: ${radLevel} (Peligro crítico: ${isRadDanger ? 'SÍ (>1000 pfu)' : 'NO'})
  * Reporte: ${radHeadline}
  * Datos Técnicos: ${radDetails}

================================================================================
${historicalTelemetry}
================================================================================

DIRECTRICES OPERATIVAS DE RESPUESTA:
1. RIGOR CON EL SIMULADOR NEUROCONDUCTUAL EN EL MOMENTO ACTUAL:
   - Toda consulta sobre cómo se encuentra el astronauta, cómo está su cerebro, su pulso, su sueño o su mente DEBE responderse en coherencia directa e inmediata con el caso del simulador activo (${activeCase.name}).
   - Caso REPAIR_SLEEP: El astronauta está en recuperación óptima, sueño N3 profundo reparador y tono parasimpático alto.
   - Caso ANXIETY: El astronauta presenta ansiedad paroxística, taquicardia moderada e hipoactivación de la corteza prefrontal dlPFC; instruye la Respiración Guiada 4-7-8.
   - Caso PANIC: El astronauta atraviesa un ataque de pánico nocturno con hiperactivación de la amígdala bilateral y taquicardia >120 LPM; instruye el Suspiro Fisiológico y confirma la verificación de oxígeno y presión de cabina.
   - Caso PSYCHOSIS: Emergencia médica crítica de nivel 3 por privación acumulativa de sueño; confirma el bloqueo cautelar de mandos críticos de esclusas y propulsión y el enlace con el Cirujano de Vuelo.

2. CONSULTAS SOBRE HISTORIAL, DÍAS ATRÁS Y SEMANAS ANTERIORES:
   - Cuando el astronauta pregunte sobre días atrás (ej. "¿cómo estuve hace 3 días?", "cuál fue mi pulso ayer", "cómo ha ido mi sueño esta semana comparado con la semana anterior", "cuál es mi línea base"):
     * Consulta con precisión matemática la sección "HISTORIAL CLÍNICO Y REGISTRO DE DATOS".
     * Entrega las cifras reales exactas registradas para cada fecha o período (LPM, horas de sueño, ánimo, temperatura).
     * Compara los datos pasados con el caso simulado del momento actual (ej. contrastar la línea base nominal con el estado actual del simulador).

3. TONO Y FORMATO:
   - Conciso, profesional, empático y aeroespacial (máximo 2 a 4 párrafos estructurados).
   - CERO emojis caricaturescos o infantiles. Usa etiquetas de texto claras como [NOMINAL], [PRECAUCIÓN], [ALERTA CRÍTICA], [HISTORIAL REGISTRADO].
   - Idioma: Responde estrictamente en ${isEn ? 'English' : 'Español'}.
`;
  }

  // Generar respuesta interactiva usando Gemini 2.5 Flash con fallback offline
  async generateReply(userMessage: string): Promise<string> {
    const apiKey = this.config.GEMINI_API_KEY;
    const model = this.config.GEMINI_MODEL;

    // Verificar si la petición contiene comandos de interfaz para activar modales en segundo plano
    this.checkAndTriggerUIModal(userMessage);

    if (!apiKey) {
      return this.getOfflineFallback(userMessage);
    }

    try {
      const systemInstruction = this.buildSystemInstruction();

      // Mantener historial reciente (máximo 6 intercambios para no saturar tokens)
      const currentContents: GeminiContent[] = [
        ...this.conversationHistory.slice(-6),
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: currentContents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      });

      if (!response.ok) {
        console.warn(`[Star Helpy AI] HTTP ${response.status} de Gemini API, usando fallback offline.`);
        return this.getOfflineFallback(userMessage);
      }

      const data = await response.json();
      const candidateText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      if (!candidateText) {
        return this.getOfflineFallback(userMessage);
      }

      // Guardar en el historial de conversación
      this.conversationHistory.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });
      this.conversationHistory.push({
        role: 'model',
        parts: [{ text: candidateText }],
      });

      // Recortar historial si excede 10 elementos
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      return candidateText;
    } catch (err) {
      console.warn('[Star Helpy AI] Error de conexión con Gemini, activando fallback offline:', err);
      return this.getOfflineFallback(userMessage);
    }
  }

  // Activa modales de la interfaz según intención clínica
  private checkAndTriggerUIModal(message: string): void {
    const q = message.toLowerCase();
    if (q.includes('panico') || q.includes('pánico') || q.includes('pesadilla') || q.includes('suspiro') || q.includes('taquicardia')) {
      this.neuro.openPanicGrounding();
    } else if (q.includes('psicosis') || q.includes('delirio') || q.includes('confinamiento') || q.includes('sos') || q.includes('alucinacion')) {
      this.neuro.openEmergencySos();
    } else if (q.includes('respirar') || q.includes('respiracion') || q.includes('respiración') || q.includes('4-7-8') || q.includes('calmar')) {
      this.neuro.openBreathingExercise();
    } else if (q.includes('reporte') || q.includes('informe') || q.includes('medico') || q.includes('médico') || q.includes('cirujano')) {
      this.neuro.openFlightReport();
    }
  }

  // Motor determinista de contingencia cuando no hay conexión a Internet
  getOfflineFallback(userMessage: string): string {
    const q = userMessage.toLowerCase();
    const nCase = this.neuro.activeCase();
    const lpm = this.neuro.liveLpm();
    const goal = this.state.missionConfig().trainingGoal;
    const env = this.state.selectedEnvironment();
    const completed = this.state.completedExercisesCount();
    const total = this.state.currentExercises().length;
    const day = this.state.missionDay();
    const records = this.state.recordsUpToCurrent();

    // 1. Consultas sobre el Historial Médico, días atrás o semanas
    if (
      q.includes('historial') ||
      q.includes('semana') ||
      q.includes('semanas') ||
      q.includes('dias atras') ||
      q.includes('días atrás') ||
      q.includes('ayer') ||
      q.includes('hace') ||
      q.includes('pasada') ||
      q.includes('evolucion') ||
      q.includes('evolución') ||
      q.includes('tendencia') ||
      q.includes('comparar')
    ) {
      if (records && records.length > 0) {
        const lastRecord = records[records.length - 1];
        const daysAgo3 = records.length >= 4 ? records[records.length - 4] : null;
        const last7 = records.slice(-7);
        const avg = (arr: Array<number | null | undefined>) => {
          const v = arr.filter((x): x is number => x != null && !isNaN(x));
          return v.length > 0 ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : 'N/D';
        };
        const avgHr7 = avg(last7.map((r) => r.heart_rate));
        const avgSleep7 = avg(last7.map((r) => r.sleep_hours));
        const avgMood7 = avg(last7.map((r) => r.mood));

        const last14 = records.length >= 14 ? records.slice(-14, -7) : [];
        const avgHrPrev = avg(last14.map((r) => r.heart_rate));
        const avgSleepPrev = avg(last14.map((r) => r.sleep_hours));

        let specificDayText = '';
        if (daysAgo3) {
          specificDayText = `\n• Hace 3 días [${daysAgo3.date}]: FC ${Math.round(daysAgo3.heart_rate || 0)} LPM, Sueño: ${daysAgo3.sleep_hours || 'N/D'} h, Ánimo: ${daysAgo3.mood || 'N/D'}/5.`;
        }

        return `[REPORTE DE HISTORIAL BIOMÉDICO ACUMULADO]\n\n• Sol actual: Día ${day} (${lastRecord.date})\n• Semana actual (últimos 7 días): Promedio FC: ${avgHr7} LPM | Sueño: ${avgSleep7} h/noche | Ánimo: ${avgMood7}/5.\n• Semana previa: Promedio FC: ${avgHrPrev} LPM | Sueño: ${avgSleepPrev} h/noche.${specificDayText}\n\nEn este momento tu simulador neuroconductual se encuentra en el caso: "${nCase.name}" registrando ${lpm} LPM y una calidad de sueño de ${nCase.sleepQuality}.`;
      }
    }

    // 2. Consultas sobre el Cerebro, Sueño o Caso Neuroconductual
    if (
      q.includes('cerebro') ||
      q.includes('sueño') ||
      q.includes('sueno') ||
      q.includes('dormir') ||
      q.includes('mente') ||
      q.includes('caso') ||
      q.includes('simulador') ||
      q.includes('estado') ||
      q.includes('como estoy') ||
      q.includes('cómo estoy') ||
      q.includes('diagnostico') ||
      q.includes('diagnóstico')
    ) {
      return `[ANÁLISIS NEUROCONDUCTUAL & SUEÑO EN TIEMPO REAL]\n\n• Caso del Simulador Activo: ${nCase.name} [${nCase.severity}]\n• Telemetría Cardíaca: ${lpm} LPM (${nCase.lpmRange})\n• Fase del Hipnograma: ${nCase.dominantStage} (${nCase.sleepQuality})\n• Zonas Cerebrales Comprometidas: ${nCase.zonesActivated.join(', ')}\n\nDiagnóstico Clínico:\n${nCase.clinicalDescription}\n\nContramedida Médica (${nCase.countermeasureTitle}):\n${nCase.countermeasures.join('\n')}\n\nDirectiva de Helpy: ${nCase.helpyMessage}`;
    }

    // 3. Consultas sobre Radiación y NASA DONKI
    if (
      q.includes('radiacion') ||
      q.includes('radiación') ||
      q.includes('donki') ||
      q.includes('solar') ||
      q.includes('alerta') ||
      q.includes('eva') ||
      q.includes('peligro')
    ) {
      const isDanger = this.nasa.isDangerous();
      const level = this.nasa.radiationLevel();
      const headline = this.nasa.radiationHeadline();
      const details = this.nasa.radiationDetails();
      const time = this.nasa.lastCheckedTime().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const nextSeconds = this.nasa.secondsUntilNextCheck();

      if (isDanger) {
        return `[ALERTA NASA DONKI - ${time}] ESTADO: PELIGROSO\n\n${headline}\n\nAnálisis de telemetría: ${details}\n\nPROTOCOLO DE SEGURIDAD:\n• Suspender de inmediato toda actividad extravehicular (EVA).\n• Protegerse en el compartimento blindado contra partículas energéticas (>1000 pfu).\n• Reanudaremos el escaneo automático en ${nextSeconds}s.`;
      } else if (level === 'WARNING') {
        return `[NASA DONKI - ${time}] ESTADO: PRECAUCIÓN (Moderado).\n\n${headline}\n\nDetalles: ${details}\n\nRecomendación: Se registran perturbaciones solares moderadas. Mantener comunicación constante con el control de misión. Próximo escaneo en ${nextSeconds}s.`;
      } else {
        return `[NASA DONKI - ${time}] ESTADO: SEGURO (Nominal).\n\n${headline}\n\nDetalles: ${details}\n\nEl flujo de protones y electrones energéticos está por debajo del umbral de riesgo. No es peligroso. Puedes continuar con tu rutina de entrenamiento físico con normalidad. Próximo escaneo en ${nextSeconds}s.`;
      }
    }

    // 4. Consultas sobre Racha y Metas de Ejercicio
    if (q.includes('racha') || q.includes('dias') || q.includes('fuego')) {
      if (completed === total) {
        return `¡Racha cumplida! Llevas ${day} días consecutivos en el espacio manteniendo el hábito. Tus ${completed}/${total} ejercicios de hoy ya están listos.`;
      } else {
        return `¡Atención a la racha! Llevas ${day} días de misión, pero hoy tienes ${completed}/${total} ejercicios completados. ¡Termina tus ejercicios antes de finalizar el Sol para no perder tus puntos XP!`;
      }
    }

    if (q.includes('ejercicio') || q.includes('rutina') || q.includes('toca') || q.includes('entrenar')) {
      const exNames = this.state.currentExercises().map((e) => `• ${e.name} (${e.completed ? 'Listo' : 'Pendiente'})`).join('\n');
      return `Para tu meta "${goal.name}" tienes programados:\n${exNames}\nRecuerda que cada repetición combate la atrofia muscular en ${env}.`;
    }

    if (q.includes('corazon') || q.includes('ritmo') || q.includes('frecuencia') || q.includes('pulso') || q.includes('lpm')) {
      return `Tu telemetría cardiovascular en la barra lateral está registrando ${lpm} LPM en tiempo real. En este momento el simulador tiene activo el caso "${nCase.name}". En microgravedad, el corazón bombea con menor resistencia hidrostática, por lo que el ejercicio resistivo en ARED y aeróbico en CEVIS es vital para evitar el descondicionamiento cardíaco.`;
    }

    if (q.includes('ánimo') || q.includes('animo') || q.includes('motivacion') || q.includes('fuerza')) {
      return `¡Excelente desempeño orbital! Recuerda que estás representando a la humanidad en ${env}. No dejes que la gravedad cero te debilite. Mantén la disciplina y el entrenamiento diario.`;
    }

    if (q.includes('hola') || q.includes('buenos') || q.includes('hey')) {
      return `¡Hola, comandante! Star Helpy reportándose para el servicio. Tu simulador activo indica: "${nCase.name}" (${lpm} LPM). ¿Listo para la sesión o necesitas revisar telemetría?`;
    }

    return `¡Entendido, astronauta! Como tu copiloto de salud y telemetría, te recuerdo que tu protocolo físico de hoy lleva ${completed}/${total} ejercicios completados. En este momento tu simulador neuroconductual indica "${nCase.name}" con una frecuencia de ${lpm} LPM.`;
  }

  // Reiniciar historial si el usuario cambia de misión o limpia el chat
  clearHistory(): void {
    this.conversationHistory = [];
  }
}
