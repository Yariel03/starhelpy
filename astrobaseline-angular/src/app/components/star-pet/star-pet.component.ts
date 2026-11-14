import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MissionStateService } from '../../core/services/mission-state.service';
import { ConfigService } from '../../core/services/config.service';

export interface ChatMessage {
  sender: 'helpy' | 'astronaut';
  text: string;
  time: string;
  mood?: 'happy' | 'sad' | 'angry';
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
      text: '¡Hola, astronauta! Soy Star Helpy, tu mascota y asistente orbital ⭐. Estoy aquí para cuidar tu racha y vigilar que no te saltes tu entrenamiento contra la microgravedad.',
      time: 'Ahora',
      mood: 'happy',
    },
  ]);

  // Preguntas rápidas
  readonly quickPrompts = [
    '🔥 ¿Cómo va mi racha hoy?',
    '🏋️ ¿Qué ejercicios me tocan?',
    '❤️ ¿Cómo está mi corazón?',
    '🚀 Dame ánimos para entrenar',
  ];

  // Estado emocional de la mascota estrella
  // Reacciona en tiempo real a los ejercicios completados en MissionStateService
  readonly mood = this.state.petMood;

  // Texto contextual de la burbuja según el estado emocional
  readonly bubbleText = computed(() => {
    const m = this.mood();
    const completed = this.state.completedExercisesCount();
    const total = this.state.currentExercises().length;
    const day = this.state.missionDay();

    if (m === 'happy') {
      return `¡Genial, astronauta! Has completado ${completed}/${total} ejercicios. Racha de ${day} días asegurada ⭐`;
    } else if (m === 'sad') {
      return `Llevas ${completed}/${total} ejercicios completados... ¡La atrofia muscular no espera! Vamos por el segundo 🥺`;
    } else {
      return `¡OYE! Tienes 0/${total} ejercicios hoy. ¿Quieres perder densidad ósea? ¡A entrenar de inmediato! 😤`;
    }
  });

  // Título del estado emocional
  readonly moodTitle = computed(() => {
    const m = this.mood();
    if (m === 'happy') return 'Feliz & Radiante (Meta Cumplida)';
    if (m === 'sad') return 'Preocupado (Entrenamiento Incompleto)';
    return 'Enojado (Cero Ejercicios Hoy)';
  });

  ngOnInit(): void {
    // Posición inicial en la esquina inferior derecha
    const initialX = Math.max(20, window.innerWidth - 130);
    const initialY = Math.max(80, window.innerHeight - 200);
    this.position.set({ x: initialX, y: initialY });
  }

  // Eventos de arrastre con Ratón
  onMouseDown(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('.pet-bubble-close') || (event.target as HTMLElement).closest('.chat-panel')) {
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

  dismissBubble(event: Event): void {
    event.stopPropagation();
    this.isBubbleVisible.set(false);
  }

  showBubbleAgain(): void {
    this.isBubbleVisible.set(true);
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
    }, 450);
  }

  sendQuickPrompt(prompt: string): void {
    this.userInput.set(prompt);
    this.sendMessage();
  }

  private addMessage(sender: 'helpy' | 'astronaut', text: string): void {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    this.messages.update((list) => [
      ...list,
      {
        sender,
        text,
        time: timeStr,
        mood: sender === 'helpy' ? this.mood() : undefined,
      },
    ]);
  }

  // Cerebro conversacional orbital de Star Helpy
  private generateHelpyResponse(userQuery: string): void {
    const q = userQuery.toLowerCase();
    const completed = this.state.completedExercisesCount();
    const total = this.state.currentExercises().length;
    const goal = this.state.missionConfig().trainingGoal;
    const day = this.state.missionDay();
    const env = this.state.selectedEnvironment();

    let reply = '';

    if (q.includes('racha') || q.includes('dias') || q.includes('fuego')) {
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
      reply = `¡Entendido, astronauta! Como tu mascota y copiloto de salud, te recuerdo que tu protocolo físico de hoy lleva ${completed}/${total} ejercicios completados. Mantén la hidratación y no olvides monitorear tus signos vitales en la pestaña Telemetría.`;
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
