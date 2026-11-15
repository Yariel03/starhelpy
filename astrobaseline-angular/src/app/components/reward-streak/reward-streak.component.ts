import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissionStateService } from '../../core/services/mission-state.service';
import { ConfigService } from '../../core/services/config.service';
import { I18nService } from '../../core/services/i18n.service';

export interface DailyExercise {
  id: string;
  name: string;
  description: string;
  target: string;
  icon: string;
  completed: boolean;
}

@Component({
  selector: 'app-reward-streak',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reward-streak.component.html',
  styleUrl: './reward-streak.component.scss',
})
export class RewardStreakComponent {
  readonly state = inject(MissionStateService);
  readonly config = inject(ConfigService);
  readonly i18n = inject(I18nService);

  // Ejercicio actualmente desplegado para ver detalles
  readonly expandedExerciseId = signal<string | null>(null);

  // Días de racha acumulada
  readonly streakDays = computed(() => {
    const day = this.state.missionDay();
    return Math.max(1, day);
  });

  // Puntos XP ganados (estilo Duolingo)
  readonly xpPoints = computed(() => {
    return this.streakDays() * 120 + 250;
  });

  // Nivel de astronauta atleta
  readonly currentLevel = computed(() => {
    const days = this.streakDays();
    const isEn = this.i18n.currentLang() === 'en';
    if (days >= 30) return isEn ? 'Titan Commander (Level 5)' : 'Comandante Titán (Nivel 5)';
    if (days >= 21) return isEn ? 'Elite Orbital Athlete (Level 4)' : 'Atleta Orbital Élite (Nivel 4)';
    if (days >= 14) return isEn ? 'Gravitational Veteran (Level 3)' : 'Veterano Gravitacional (Nivel 3)';
    if (days >= 7) return isEn ? 'Mission Specialist (Level 2)' : 'Especialista en Misión (Nivel 2)';
    return isEn ? 'Space Cadet (Level 1)' : 'Cadete Espacial (Nivel 1)';
  });

  // Lista de días en el carrusel de racha (círculos que se encienden)
  // Muestra solo los últimos 3 días cumplidos y 2 días futuros (+ el día actual)
  readonly streakNodes = computed(() => {
    const current = this.streakDays();
    const isEn = this.i18n.currentLang() === 'en';
    const startDay = Math.max(1, current - 3);
    const endDay = current + 2;
    const nodes = [];

    for (let d = startDay; d <= endDay; d++) {
      const isCompleted = d < current;
      const isToday = d === current;
      const isFuture = d > current;

      let milestone: string | null = null;
      if (d === 3) milestone = isEn ? 'Zero-G Habit' : 'Hábito Cero-G';
      if (d === 7) milestone = isEn ? '7D Streak (+150 XP)' : 'Racha 7D (+150 XP)';
      if (d === 14) milestone = isEn ? 'Anti-Atrophy Shield' : 'Escudo Anti-Atrofia';
      if (d === 21) milestone = isEn ? 'Space Strength' : 'Fuerza Espacial';
      if (d === 30) milestone = isEn ? 'Orbital Gold Medal' : 'Medalla de Oro Orbital';

      nodes.push({
        day: d,
        isCompleted,
        isToday,
        isFuture,
        milestone,
        isFirst: d === startDay,
      });
    }

    return nodes;
  });

  // Meta seleccionada actualmente (CBUM o Spartacus)
  readonly currentGoal = computed(() => {
    return (
      this.state.missionConfig().trainingGoal ||
      this.config.TRAINING_GOALS.find((g) => g.id === this.state.selectedAstronaut()) ||
      this.config.TRAINING_GOALS[0]
    );
  });

  // Ejercicios compartidos desde el estado global de la misión
  readonly currentExercises = this.state.currentExercises;
  readonly completedCount = this.state.completedExercisesCount;

  // Porcentaje de progreso de entrenamiento diario
  readonly progressPercentage = computed(() => {
    const total = this.currentExercises().length;
    if (total === 0) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });

  // Alternar apertura/cierre de la descripción detallada
  toggleDetails(exerciseId: string): void {
    this.expandedExerciseId.update((curr) => (curr === exerciseId ? null : exerciseId));
  }

  // Alternar estado de completitud (check)
  toggleCompletion(exerciseId: string, event: Event): void {
    event.stopPropagation();
    this.state.toggleExerciseCompletion(exerciseId);
  }
}
