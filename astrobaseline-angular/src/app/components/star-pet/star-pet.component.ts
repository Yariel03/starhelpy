import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MissionStateService } from '../../core/services/mission-state.service';
import { ConfigService } from '../../core/services/config.service';
import { NasaDonkiService } from '../../core/services/nasa-donki.service';
import { NeuroSleepService } from '../../core/services/neuro-sleep.service';
import { I18nService } from '../../core/services/i18n.service';

export interface ChatMessage {
  sender: 'helpy' | 'astronaut';
  text: string;
  time: string;
  mood?: 'happy' | 'sad' | 'angry';
  isAlert?: boolean;
}

export type StarEmotion =
  | 'celebrate'
  | 'motivated'
  | 'waiting'
  | 'peaceful'
  | 'anxious'
  | 'panic'
  | 'psychosis'
  | 'danger'
  | 'angry';

export interface HelpyPriorityState {
  level: 'CRITICAL_RADIATION' | 'PSYCHOSIS' | 'PANIC' | 'ANXIETY' | 'REPAIR_SLEEP' | 'RADIATION_WARNING' | 'ROUTINE';
  priority: 1 | 2 | 3 | 4;
  emotion: StarEmotion;
  mood: 'happy' | 'sad' | 'angry';
  badge: string;
  badgeColor: string;
  message: string;
  actionType: 'breathe' | 'chat' | 'panic' | 'psychosis' | 'report';
  actionText: string;
}

@Component({
  selector: 'app-star-pet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './star-pet.component.html',
  styleUrl: './star-pet.component.scss',
})
export class StarPetComponent implements OnInit {
  readonly state = inject(MissionStateService);
  readonly config = inject(ConfigService);
  readonly nasa = inject(NasaDonkiService);
  readonly neuro = inject(NeuroSleepService);
  readonly i18n = inject(I18nService);
  private el = inject(ElementRef);

  // Posición flotante arrastrable
  readonly position = signal<{ x: number; y: number }>({ x: 20, y: 300 });

  // Control de arrastre
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialPosX = 0;
  private initialPosY = 0;
  private totalDragDistance = 0;

  // Estado del chat y burbuja
  readonly isChatOpen = signal<boolean>(false);
  readonly isBubbleVisible = signal<boolean>(true);
  readonly userInput = signal<string>('');

  // Mensajes del chat
  readonly messages = signal<ChatMessage[]>([
    {
      sender: 'helpy',
      text: '¡Hola, astronauta! Soy Star Helpy, tu mascota y copiloto orbital ⭐. Monitoreo tus entrenamientos, la radiación con NASA DONKI y tu salud cerebral 3D y sueño en tiempo real 🛰️🧠.',
      time: 'Ahora',
      mood: 'happy',
    },
  ]);

  // Preguntas rápidas
  readonly quickPrompts = [
    '🧠 ¿Cómo está mi cerebro y sueño?',
    '🫁 Guiar respiración 4-7-8',
    '☢️ ¿La radiación espacial es peligrosa?',
    '🛰️ Reporte NASA DONKI en vivo',
    '📄 Reporte Médico de Vuelo',
    '🔥 ¿Cómo va mi racha hoy?',
    '🏋️ ¿Qué ejercicios me tocan?',
  ];

  // Máquina de estados jerárquica unificada para Star Helpy con 9 emociones únicas
  readonly activeState = computed<HelpyPriorityState>(() => {
    const isEn = this.i18n.currentLang() === 'en';

    // 1. NIVEL CRÍTICO 1: Tormenta de Radiación Espacial Solar NASA DONKI (>1000 pfu)
    if (this.nasa.isDangerous()) {
      return {
        level: 'CRITICAL_RADIATION',
        priority: 1,
        emotion: 'danger',
        mood: 'angry',
        badge: isEn ? '☢️ Solar Storm Alert!' : '☢️ ¡Alerta Solar!',
        badgeColor: '#ef4444',
        message: isEn ? 'Critical space radiation flux! Suspend all EVA operations and seek shelter.' : '¡Flujo crítico de radiación espacial! Suspende toda actividad exterior y refúgiate.',
        actionType: 'chat',
        actionText: isEn ? '🛡️ View Protocol' : '🛡️ Ver Protocolo',
      };
    }

    // Comprobar si el astronauta interactuó más recientemente con la simulación neuroconductual
    const isNeuroMoreRecent = this.neuro.lastNeuroInteraction() > this.state.lastExerciseInteraction();

    if (isNeuroMoreRecent) {
      const neuroCase = this.neuro.activeCase();

      // 2. NIVEL DE CRISIS 2: Emergencias Neuroconductuales Agudas (Psicosis o Pánico)
      if (neuroCase.id === 'PSYCHOSIS') {
        return {
          level: 'PSYCHOSIS',
          priority: 2,
          emotion: 'psychosis',
          mood: 'angry',
          badge: isEn ? '🔴 Psychosis Alert L3' : '🔴 Alerta Psicosis N3',
          badgeColor: '#ef4444',
          message: isEn
            ? `Critical prefrontal disconnect (${this.neuro.liveLpm()} BPM)! Securing controls and connecting to Flight Surgeon.`
            : `¡Desconexión prefrontal crítica (${this.neuro.liveLpm()} LPM)! Bloqueando mandos y enlazando con Houston.`,
          actionType: 'psychosis',
          actionText: isEn ? '🚨 Flight Surgeon SOS' : '🚨 SOS Cirujano de Vuelo',
        };
      }

      if (neuroCase.id === 'PANIC') {
        return {
          level: 'PANIC',
          priority: 2,
          emotion: 'panic',
          mood: 'angry',
          badge: isEn ? '🟠 Panic Awakening' : '🟠 Pánico Nocturno',
          badgeColor: '#f97316',
          message: isEn
            ? `Confusional tachycardic arousal (${this.neuro.liveLpm()} BPM). Cabin is 100% safe, start rescue sighs!`
            : `Despertar confusional taquicárdico (${this.neuro.liveLpm()} LPM). ¡Cabina 100% segura, activa el rescate!`,
          actionType: 'panic',
          actionText: isEn ? '⚡ 5-4-3-2-1 Grounding' : '⚡ Suspiro & Anclaje 5-4-3-2-1',
        };
      }

      // 3. NIVEL DE ADVERTENCIA 3: Estrés en Sueño
      if (neuroCase.id === 'ANXIETY') {
        return {
          level: 'ANXIETY',
          priority: 3,
          emotion: 'anxious',
          mood: 'sad',
          badge: isEn ? '🟡 Anxiety Detected' : '🟡 Ansiedad Detectada',
          badgeColor: '#f59e0b',
          message: isEn
            ? `Sympathetic hyperarousal detected (${this.neuro.liveLpm()} BPM). Regulate vagal tone with guided breathing.`
            : `Detecto hiperarousal simpático (${this.neuro.liveLpm()} LPM). Regula tu tono con respiración vagal.`,
          actionType: 'breathe',
          actionText: isEn ? '🫁 4-7-8 Breathing' : '🫁 Respiración 4-7-8',
        };
      }

      // Caso de Sueño Reparador explícito simulado por el astronauta
      if (neuroCase.id === 'REPAIR_SLEEP') {
        return {
          level: 'REPAIR_SLEEP',
          priority: 4,
          emotion: 'peaceful',
          mood: 'happy',
          badge: isEn ? '🟢 Restorative Sleep' : '🟢 Sueño Reparador',
          badgeColor: '#10b981',
          message: isEn
            ? 'Optimal heart rate (50 BPM), slow delta N3 waves and full cellular regeneration.'
            : 'Frecuencia ideal (50 LPM), ondas lentas delta N3 y regeneración sinusal plena.',
          actionType: 'report',
          actionText: isEn ? '📄 Sleep Medical Report' : '📄 Reporte Médico de Sueño',
        };
      }
    }

    if (this.nasa.radiationLevel() === 'WARNING') {
      return {
        level: 'RADIATION_WARNING',
        priority: 3,
        emotion: 'anxious',
        mood: 'sad',
        badge: isEn ? '🟡 Active Sun' : '🟡 Sol Activo',
        badgeColor: '#f59e0b',
        message: isEn ? 'Moderate solar disturbance detected by DONKI. Exercise caution during EVA.' : 'Perturbación solar moderada detectada por DONKI. Precaución en actividades EVA.',
        actionType: 'chat',
        actionText: isEn ? '🛰️ View DONKI Report' : '🛰️ Ver Reporte DONKI',
      };
    }

    // 4. NIVEL DE RUTINA: Reacción Directa e Instantánea a los Ejercicios Físicos
    const completed = this.state.completedExercisesCount();
    const total = this.state.currentExercises().length;
    const day = this.state.missionDay();

    if (completed === 0) {
      // SI NO HAY EJERCICIO: LA ESTRELLA DEBE ESTAR ENOJADA
      return {
        level: 'ROUTINE',
        priority: 4,
        emotion: 'angry',
        mood: 'angry',
        badge: isEn ? `😠 Sol ${day} · 0/${total} Exercises` : `😠 Sol ${day} · 0/${total} Ejercicios`,
        badgeColor: '#ef4444',
        message: isEn
          ? `You have not done any exercise yet! In microgravity your muscles and bones atrophy without training. Let's work out, Commander!`
          : `¡No has hecho ningún ejercicio todavía! En gravedad cero tus músculos y huesos se atrofian si no entrenas hoy. ¡A entrenar, comandante!`,
        actionType: 'chat',
        actionText: isEn ? '🏋️ Go to Training' : '🏋️ Ir al Entrenamiento',
      };
    } else if (completed === total && total > 0) {
      return {
        level: 'ROUTINE',
        priority: 4,
        emotion: 'celebrate',
        mood: 'happy',
        badge: isEn ? `🎉 Sol ${day} · Goal Reached!` : `🎉 Sol ${day} · ¡Meta Cumplida!`,
        badgeColor: '#10b981',
        message: isEn
          ? `Outstanding, Commander! You completed ${completed}/${total} exercises. Daily streak secured and physical readiness protected ⭐.`
          : `¡Increíble, comandante! Has completado ${completed}/${total} ejercicios. Racha diaria asegurada y físico protegido ⭐.`,
        actionType: 'chat',
        actionText: isEn ? '🏆 View Rewards' : '🏆 Ver Recompensas',
      };
    } else {
      return {
        level: 'ROUTINE',
        priority: 4,
        emotion: 'motivated',
        mood: 'happy',
        badge: isEn ? `⚡ ${completed}/${total} Completed` : `⚡ ${completed}/${total} Completados`,
        badgeColor: '#3b82f6',
        message: isEn
          ? `Good pace! You have finished ${completed}/${total} exercises. Onto the next one to complete the Sol!`
          : `¡Buen ritmo! Llevas ${completed}/${total} ejercicios. ¡A por el siguiente de la rutina para completar el Sol!`,
        actionType: 'chat',
        actionText: isEn ? '🏋️ View Routine' : '🏋️ Ver Rutina',
      };
    }
  });

  // Atajos derivados
  readonly currentEmotion = computed<StarEmotion>(() => this.activeState().emotion);
  readonly currentMood = computed(() => this.activeState().mood);
  readonly mood = computed(() => this.activeState().mood);
  readonly bubbleText = computed(() => this.activeState().message);
  readonly moodTitle = computed(() => `${this.activeState().badge} — ${this.activeState().message}`);

  private previousCheckCount = 0;
  private lastNeuroState = 'REPAIR_SLEEP';

  constructor() {
    // Abrir automáticamente la burbuja ante cambios de ejercicio para dar feedback inmediato
    effect(() => {
      // Reaccionar ante cambios de conteo o interacción de ejercicios
      const _ = this.state.completedExercisesCount();
      const __ = this.state.lastExerciseInteraction();
      this.isBubbleVisible.set(true);
    });

    // Reabrir la burbuja ante cambios de neuroconducta o emergencias espaciales
    effect(() => {
      const isDanger = this.nasa.isDangerous();
      const _ = this.neuro.lastNeuroInteraction();

      if (isDanger) {
        this.isBubbleVisible.set(true);
      } else if (this.neuro.lastNeuroInteraction() > 0) {
        this.isBubbleVisible.set(true);
      }
    });

    // Notificaciones discretas en el historial de chat para no saturar la pantalla
    effect(() => {
      const count = this.nasa.checkCount();
      if (count > this.previousCheckCount && count > 1) {
        this.previousCheckCount = count;
        if (this.nasa.isDangerous()) {
          const timeStr = this.nasa.lastCheckedTime().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          this.addMessage(
            'helpy',
            `☢️ [${timeStr}] ALERTA CRÍTICA NASA DONKI: Flujo de protones energéticos peligroso (>1000 pfu). Refugio obligatorio.`,
            true
          );
        }
      } else {
        this.previousCheckCount = count;
      }
    });
  }

  ngOnInit(): void {
    // Posición inicial en la esquina inferior derecha
    const initialX = Math.max(20, window.innerWidth - 130);
    const initialY = Math.max(80, window.innerHeight - 200);
    this.position.set({ x: initialX, y: initialY });

    // Iniciar monitoreo de radiación espacial NASA DONKI solo tras iniciar la misión
    this.nasa.startRadiationMonitoring();
  }

  // Eventos de arrastre con Ratón
  onMouseDown(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('.pet-bubble-close') || (event.target as HTMLElement).closest('.chat-panel') || (event.target as HTMLElement).closest('.chat-open-btn') || (event.target as HTMLElement).closest('.refresh-donki-btn')) {
      return;
    }
    this.startDrag(event.clientX, event.clientY);
    event.preventDefault();
  }

  // Eventos de arrastre táctil para móvil / tablet
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.startDrag(touch.clientX, touch.clientY);
    }
  }

  private startDrag(clientX: number, clientY: number): void {
    this.isDragging = true;
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.initialPosX = this.position().x;
    this.initialPosY = this.position().y;
    this.totalDragDistance = 0;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.moveDrag(event.clientX, event.clientY);
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length === 0) return;
    const touch = event.touches[0];
    this.moveDrag(touch.clientX, touch.clientY);
  }

  private moveDrag(clientX: number, clientY: number): void {
    const deltaX = clientX - this.dragStartX;
    const deltaY = clientY - this.dragStartY;
    this.totalDragDistance += Math.abs(deltaX) + Math.abs(deltaY);

    const maxX = window.innerWidth - 90;
    const maxY = window.innerHeight - 90;

    const newX = Math.max(10, Math.min(this.initialPosX + deltaX, maxX));
    const newY = Math.max(10, Math.min(this.initialPosY + deltaY, maxY));

    this.position.set({ x: newX, y: newY });
  }

  @HostListener('document:mouseup')
  @HostListener('document:touchend')
  onDragEnd(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
  }

  // Al hacer clic en la estrella (si no fue arrastrada significativamente)
  onStarClick(): void {
    if (this.totalDragDistance > 8) {
      return; // Fue un arrastre, no un clic intencional
    }
    this.toggleChat();
  }

  toggleChat(): void {
    this.isChatOpen.update((open) => !open);
    if (this.isChatOpen()) {
      this.isBubbleVisible.set(false);
    }
  }

  closeChat(): void {
    this.isChatOpen.set(false);
  }

  onActionButtonClick(): void {
    const type = this.activeState().actionType;
    if (type === 'breathe') {
      this.neuro.openBreathingExercise();
    } else if (type === 'panic') {
      this.neuro.openPanicGrounding();
    } else if (type === 'psychosis') {
      this.neuro.openEmergencySos();
    } else if (type === 'report') {
      this.neuro.openFlightReport();
    } else {
      this.toggleChat();
    }
  }

  dismissBubble(event: Event): void {
    event.stopPropagation();
    this.isBubbleVisible.set(false);
  }

  showBubbleAgain(): void {
    this.isBubbleVisible.set(true);
  }

  // Refrescar manualmente DONKI si el astronauta lo pide
  refreshDonki(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.nasa.checkRadiationStatus();
  }

  // Envío de mensaje en el chat
  sendMessage(): void {
    const text = this.userInput().trim();
    if (!text) return;

    this.addMessage('astronaut', text);
    this.userInput.set('');

    // Respuesta inteligente de Star Helpy
    setTimeout(() => {
      this.generateHelpyResponse(text);
    }, 400);
  }

  sendQuickPrompt(prompt: string): void {
    this.userInput.set(prompt);
    this.sendMessage();
  }

  private addMessage(sender: 'helpy' | 'astronaut', text: string, isAlert = false): void {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    this.messages.update((list) => [
      ...list,
      {
        sender,
        text,
        time: timeStr,
        mood: sender === 'helpy' ? this.currentMood() : undefined,
        isAlert,
      },
    ]);
  }

  // Cerebro conversacional orbital de Star Helpy con NASA DONKI y Neuroconducta integrado
  private generateHelpyResponse(userQuery: string): void {
    const q = userQuery.toLowerCase();
    const completed = this.state.completedExercisesCount();
    const total = this.state.currentExercises().length;
    const goal = this.state.missionConfig().trainingGoal;
    const day = this.state.missionDay();
    const env = this.state.selectedEnvironment();

    let reply = '';

    // Consulta de Neuro-Sueño, Cerebro 3D o Ansiedad
    if (
      q.includes('sueño') ||
      q.includes('sueno') ||
      q.includes('dormir') ||
      q.includes('cerebro') ||
      q.includes('ansiedad') ||
      q.includes('psicosis') ||
      q.includes('panico') ||
      q.includes('pánico') ||
      q.includes('pesadilla') ||
      q.includes('neuro') ||
      q.includes('3d')
    ) {
      const nCase = this.neuro.activeCase();
      const lpm = this.neuro.liveLpm();
      let advice = 'Puedes probar la pestaña "🧠 Neuro-Sueño 3D" para ver la simulación en tiempo real.';
      if (nCase.id === 'ANXIETY') {
        advice = 'Presiona "🫁 Respiración 4-7-8" para calmar el tono simpático y reducir el cortisol.';
      } else if (nCase.id === 'PANIC') {
        advice = 'Presiona "⚡ Suspiro Fisiológico & Anclaje" para verificar soporte de cabina y normalizar el pulso.';
      } else if (nCase.id === 'PSYCHOSIS') {
        advice = 'Presiona "🚨 SOS Cirujano de Vuelo" para asegurar la nave con bloqueo cautelar y enlace médico a Tierra.';
      }
      reply = `🧠 [ANÁLISIS NEUROCONDUCTUAL & SUEÑO EN TIEMPO REAL]\n\n• Estado Activo: ${nCase.name} (${lpm} LPM)\n• Fase del Hipnograma: ${nCase.dominantStage}\n• Zonas Cerebrales Estimuladas: ${nCase.zonesActivated.join(', ')}\n\n🔍 Diagnóstico Clínico:\n${nCase.clinicalDescription}\n\n💡 Contramedida Médica (${nCase.countermeasureTitle}):\n${nCase.countermeasures.join('\n')}\n\n⭐ Consejo de Helpy: ${advice}`;
    } else if (q.includes('panico') || q.includes('pánico') || q.includes('pesadilla') || q.includes('suspiro') || q.includes('taquicardia')) {
      this.neuro.openPanicGrounding();
      reply = `⚡ ¡Iniciando Protocolo de Rescate por Pánico! Aplicaremos el Suspiro Fisiológico Cíclico (doble inhalación nasal + exhalación oral prolongada) y la verificación de soporte vital de cabina para desactivar la sobrecarga de la amígdala.`;
    } else if (q.includes('psicosis') || q.includes('delirio') || q.includes('confinamiento') || q.includes('sos') || q.includes('alucinacion')) {
      this.neuro.openEmergencySos();
      reply = `🚨 ¡Activando Protocolo Médico de Emergencia Nivel 3! Bloqueando cautelarmente mandos de esclusas y propulsión, y transmitiendo telemetría directa al Cirujano de Vuelo en Houston.`;
    } else if (q.includes('respirar') || q.includes('respiracion') || q.includes('respiración') || q.includes('4-7-8') || q.includes('calmar')) {
      this.neuro.openBreathingExercise();
      reply = `🫁 ¡Iniciando protocolo de Respiración Guiada 4-7-8! Sigue el orbe en pantalla (Inhala 4s, Retén 7s, Exhala 8s) durante 3 ciclos para regularizar tu tono vagal y bajar tus LPM a reposo.`;
    } else if (q.includes('reporte') || q.includes('informe') || q.includes('medico') || q.includes('médico') || q.includes('cirujano')) {
      this.neuro.openFlightReport();
      reply = `📄 Abriendo el Resumen Médico de Vuelo para el Cirujano de Vuelo (Flight Surgeon Briefing). Puedes imprimirlo o guardarlo como PDF oficial de la misión.`;
    }
    // Consulta de Radiación y NASA DONKI
    else if (
      q.includes('radiacion') ||
      q.includes('radiación') ||
      q.includes('donki') ||
      q.includes('peligro') ||
      q.includes('peligros') ||
      q.includes('particula') ||
      q.includes('partícula') ||
      q.includes('solar') ||
      q.includes('rayo') ||
      q.includes('alerta') ||
      q.includes('rbe') ||
      q.includes('sep') ||
      q.includes('eva')
    ) {
      const isDanger = this.nasa.isDangerous();
      const level = this.nasa.radiationLevel();
      const headline = this.nasa.radiationHeadline();
      const details = this.nasa.radiationDetails();
      const time = this.nasa.lastCheckedTime().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const nextSeconds = this.nasa.secondsUntilNextCheck();

      if (isDanger) {
        reply = `☢️ ¡ESTADO: PELIGROSO! (Alerta activa de NASA DONKI a las ${time})\n\n⚠️ ${headline}\n\n🔍 Análisis de telemetría: ${details}\n\n🚨 PROTOCOLO DE SEGURIDAD:\n• Suspender de inmediato toda actividad extravehicular (EVA).\n• Protegerse en el compartimento blindado contra partículas energéticas (>1000 pfu).\n• Reanudaremos el escaneo automático en ${nextSeconds}s.`;
      } else if (level === 'WARNING') {
        reply = `🟡 [NASA DONKI - ${time}] ESTADO: PRECAUCIÓN (Moderado).\n\n⚠️ ${headline}\n\nDetalles: ${details}\n\nRecomendación: Se registran perturbaciones solares moderadas. Mantener comunicación constante con el control de misión. Próximo escaneo en ${nextSeconds}s.`;
      } else {
        reply = `🛡️ [NASA DONKI - ${time}] ESTADO: SEGURO (Nominal).\n\n✅ ${headline}\n\nDetalles: ${details}\n\nEl flujo de protones y electrones energéticos está por debajo del umbral de riesgo. ¡No es peligroso! Puedes continuar con tu rutina de entrenamiento físico con normalidad. Próximo escaneo en ${nextSeconds}s.`;
      }
    } else if (q.includes('racha') || q.includes('dias') || q.includes('fuego')) {
      if (completed === total) {
        reply = `¡Tu racha está en llamas 🔥! Llevas ${day} días consecutivos en el espacio manteniendo el hábito. Tus ${completed}/${total} ejercicios de hoy ya están listos.`;
      } else {
        reply = `¡Cuidado con la racha! Llevas ${day} días de misión, pero hoy tienes ${completed}/${total} ejercicios completados. ¡Termina tus ejercicios antes de finalizar el Sol para no perder tus puntos XP!`;
      }
    } else if (q.includes('ejercicio') || q.includes('rutina') || q.includes('toca') || q.includes('entrenar')) {
      const exNames = this.state.currentExercises().map((e) => `• ${e.name} (${e.completed ? '✓ Listo' : '⏳ Pendiente'})`).join('\n');
      reply = `Para tu meta "${goal.name}" tienes programados:\n${exNames}\nRecuerda que cada repetición combate la atrofia muscular en ${env}.`;
    } else if (q.includes('corazon') || q.includes('ritmo') || q.includes('frecuencia') || q.includes('pulso') || q.includes('lpm')) {
      reply = `Tu telemetría cardiovascular en la barra lateral está registrando tus latidos por minuto en tiempo real. En microgravedad, el corazón bombea con menor resistencia hidrostática, por lo que el ejercicio resistivo en ARED y aeróbico en CEVIS es vital para evitar el descondicionamiento cardíaco.`;
    } else if (q.includes('ánimo') || q.includes('animo') || q.includes('motivacion') || q.includes('fuerza')) {
      reply = `¡Eres un titán espacial! Recuerda que estás representando a la humanidad en ${env}. No dejes que la gravedad cero te debilite. ¡Ponte el arnés, sube a la máquina y vamos a ganar más masa muscular! ⭐🚀`;
    } else if (q.includes('hola') || q.includes('buenos') || q.includes('hey')) {
      reply = `¡Hola, comandante! Star Helpy reportándose para el servicio. ¿Listo para darlo todo en la sesión de hoy? Cuéntame qué necesitas.`;
    } else {
      reply = `¡Entendido, astronauta! Como tu mascota y copiloto de salud, te recuerdo que tu protocolo físico de hoy lleva ${completed}/${total} ejercicios completados. Mantén la hidratación y recuerda que monitoreo la radiación espacial con NASA DONKI cada 60s.`;
    }

    this.addMessage('helpy', reply);
  }

  // Reajuste de límites en redimensionamiento de pantalla
  @HostListener('window:resize')
  onWindowResize(): void {
    const maxX = window.innerWidth - 90;
    const maxY = window.innerHeight - 90;
    const curr = this.position();
    this.position.set({
      x: Math.min(curr.x, maxX),
      y: Math.min(curr.y, maxY),
    });
  }
}
