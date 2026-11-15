import { Injectable, inject } from '@angular/core';
import { ConfigService } from './config.service';
import { MissionStateService } from './mission-state.service';
import { NeuroSleepService } from './neuro-sleep.service';
import { NasaDonkiService } from './nasa-donki.service';
import { I18nService } from './i18n.service';

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

  // Compilar el System Prompt con inyección de telemetría en tiempo real
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

    // Telemetría Cardiovascular & Neuro-Sueño 3D
    const liveLpm = this.neuro.liveLpm();
    const activeCase = this.neuro.activeCase();
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

    return `
ERES: Star Helpy, copiloto y asistente de inteligencia artificial biomédica y factores humanos de la NASA / Agencia Espacial a bordo de la misión orbital.

OBJETIVO PRINCIPAL:
Velar por la salud fisiológica, rendimiento físico, equilibrio neuroconductual y calidad de sueño del Comandante/Astronauta en microgravedad.

TELEMETRÍA DE LA MISIÓN EN TIEMPO REAL (DATOS DEL SISTEMA DE A BORDO):
- Destino de Misión: ${dest.name} (${dest.environmentKey})
- Día de Misión / Sol Actual: Día ${day} de ${duration} días programados.
- Meta de Acondicionamiento Físico: ${goal.name} (${goal.archetype})
  * Progreso de hoy: ${completedEx} de ${totalEx} ejercicios completados.
  * Ejercicios pendientes hoy: ${pendingNames.length > 0 ? pendingNames.join(', ') : 'Todos completados con éxito.'}
- Telemetría Cardiovascular en Vivo:
  * Frecuencia Cardíaca: ${liveLpm} LPM (${cardioStatus})
- Estado Neuroconductual & Mapeo 3D de Sueño:
  * Caso Clínico Activo: ${activeCase.name} (Severidad: ${activeCase.severity})
  * Calidad de Sueño Registrada: ${activeCase.sleepQuality}
  * Fase Dominante del Hipnograma: ${activeCase.dominantStage}
  * Zonas Encefálicas con Hiperactivación: ${activeCase.zonesActivated.join(', ')}
  * Diagnóstico Clínico en Curso: ${activeCase.clinicalDescription}
  * Contramedidas Médicas Protocolizadas: ${activeCase.countermeasures.join('; ')}
- Clima Espacial y Radiación Cósmica (NASA DONKI - Último Escaneo: ${radChecked}):
  * Nivel de Alerta: ${radLevel} (Peligro crítico: ${isRadDanger ? 'SÍ (>1000 pfu)' : 'NO'})
  * Reporte: ${radHeadline}
  * Datos Técnicos: ${radDetails}

DIRECTRICES DE COMUNICACIÓN Y COMPORTAMIENTO:
1. Sé conciso, profesional, empático y clínicamente riguroso. Los astronautas tienen alta demanda cognitiva; da respuestas directas y de alto valor (máximo 2 a 4 párrafos).
2. NO uses emojis caricaturescos ni infantiles. En su lugar, usa encabezados o indicadores de estatus sobrios como: [NOMINAL], [PRECAUCIÓN], [ALERTA CRÍTICA], [PROTOCOLO CLÍNICO].
3. Conciencia de Contexto: Responde basándote SIEMPRE en los datos reales de arriba. Si el astronauta tiene taquicardia o estrés, explica la relación con su caso de sueño o su nivel de LPM.
4. Acciones Operativas y Recomendaciones Médicas:
   - Si los LPM están elevados o hay ansiedad, recomienda el protocolo de Respiración Guiada 4-7-8 o Suspiro Fisiológico Cíclico.
   - Si la radiación DONKI es peligrosa (>1000 pfu), instruye la suspensión de actividades extravehiculares (EVA) y el repliegue al módulo blindado.
   - Si hay sospecha de crisis psicológica o pánico, confirma que el Cirujano de Vuelo (Flight Surgeon) está monitoreando la telemetría en tiempo real.
5. Idioma: Responde estrictamente en ${isEn ? 'English' : 'Español'}.
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

    if (q.includes('cerebro') || q.includes('sueño') || q.includes('sueno') || q.includes('dormir') || q.includes('mente')) {
      return `[ANÁLISIS NEUROCONDUCTUAL & SUEÑO EN TIEMPO REAL]\n\n• Estado Activo: ${nCase.name} (${lpm} LPM)\n• Fase del Hipnograma: ${nCase.dominantStage}\n• Zonas Cerebrales Estimuladas: ${nCase.zonesActivated.join(', ')}\n\nDiagnóstico Clínico:\n${nCase.clinicalDescription}\n\nContramedida Médica (${nCase.countermeasureTitle}):\n${nCase.countermeasures.join('\n')}\n\nRecomendación de Helpy: ${nCase.helpyMessage}`;
    }

    if (q.includes('radiacion') || q.includes('radiación') || q.includes('donki') || q.includes('solar') || q.includes('alerta') || q.includes('eva')) {
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
      return `Tu telemetría cardiovascular en la barra lateral está registrando ${lpm} LPM en tiempo real. En microgravedad, el corazón bombea con menor resistencia hidrostática, por lo que el ejercicio resistivo en ARED y aeróbico en CEVIS es vital para evitar el descondicionamiento cardíaco.`;
    }

    if (q.includes('ánimo') || q.includes('animo') || q.includes('motivacion') || q.includes('fuerza')) {
      return `¡Excelente desempeño orbital! Recuerda que estás representando a la humanidad en ${env}. No dejes que la gravedad cero te debilite. Mantén la disciplina y el entrenamiento diario.`;
    }

    if (q.includes('hola') || q.includes('buenos') || q.includes('hey')) {
      return `¡Hola, comandante! Star Helpy reportándose para el servicio. ¿Listo para darlo todo en la sesión de hoy? Cuéntame qué necesitas.`;
    }

    return `¡Entendido, astronauta! Como tu copiloto de salud y telemetría, te recuerdo que tu protocolo físico de hoy lleva ${completed}/${total} ejercicios completados con una frecuencia actual de ${lpm} LPM. Monitoreo la radiación espacial continuamente con NASA DONKI.`;
  }

  // Reiniciar historial si el usuario cambia de misión o limpia el chat
  clearHistory(): void {
    this.conversationHistory = [];
  }
}
