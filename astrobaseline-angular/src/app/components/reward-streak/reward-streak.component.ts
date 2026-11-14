import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissionStateService } from '../../core/services/mission-state.service';
import { ConfigService } from '../../core/services/config.service';

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
    if (days >= 30) return 'Comandante Titán (Nivel 5)';
    if (days >= 21) return 'Atleta Orbital Élite (Nivel 4)';
    if (days >= 14) return 'Veterano Gravitacional (Nivel 3)';
    if (days >= 7) return 'Especialista en Misión (Nivel 2)';
    return 'Cadete Espacial (Nivel 1)';
  });

  // Lista de días en el carrusel de racha (círculos que se encienden)
  readonly streakNodes = computed(() => {
    const current = this.streakDays();
    const totalToShow = Math.max(14, current + 3);
    const nodes = [];

    for (let d = 1; d <= totalToShow; d++) {
      const isCompleted = d < current;
      const isToday = d === current;
      const isFuture = d > current;

      let milestone: string | null = null;
      if (d === 3) milestone = '🎖️ Hábito Cero-G';
      if (d === 7) milestone = '🚀 Racha 7D (+150 XP)';
      if (d === 14) milestone = '🛡️ Escudo Anti-Atrofia';
      if (d === 21) milestone = '👑 Fuerza Espacial';
      if (d === 30) milestone = '🏆 Medalla de Oro Orbital';

      nodes.push({
        day: d,
        isCompleted,
        isToday,
        isFuture,
        milestone,
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

  // Solo 2 ejercicios principales por meta, con detalles de series y repeticiones al expandir
  readonly exercisesList = signal<Record<string, DailyExercise[]>>({
    'A-01': [
      {
        id: 'cbum-1',
        name: 'Sentadilla con pistón neumático ARED',
        description: 'Sobrecarga axial controlada para preservar densidad ósea lumbar y masa muscular de cuádriceps en microgravedad.',
        target: '4 series × 8-10 repeticiones · Carga axial de 140 kg simulados',
        icon: '🏋️',
        completed: true,
      },
      {
        id: 'cbum-2',
        name: 'Peso muerto rumano antigravedad',
        description: 'Tensión mecánica excéntrica continua en isquiotibiales y cadena posterior para prevenir la atrofia del tronco.',
        target: '4 series × 10 repeticiones · Carga guiada de 120 kg simulados',
        icon: '⚡',
        completed: false,
      },
    ],
    'A-02': [
      {
        id: 'spartacus-1',
        name: 'Protocolo HIIT en Cicloergómetro CEVIS',
        description: 'Intervalos anaeróbicos de alta exigencia para mantener el VO2 max y la fuerza contráctil del miocardio.',
        target: '20 min · 30s sprint (95% FCM) / 30s recuperación activa',
        icon: '🚴',
        completed: true,
      },
      {
        id: 'spartacus-2',
        name: 'Carrera con arnés de carga en Cinta Rodante T2',
        description: 'Simulación biomecánica de impacto gravitatorio para mantener la masa ósea y resistencia vascular periférica.',
        target: '45 min continuos a 11.5 km/h · Carga elástica de 1.0g simulado',
        icon: '🏃',
        completed: false,
      },
    ],
  });

  // Ejercicios activos correspondientes a la meta actual
  readonly currentExercises = computed<DailyExercise[]>(() => {
    const gid = this.currentGoal().id;
    const all = this.exercisesList();
    return all[gid] || all['A-01'];
  });

  // Conteo de ejercicios completados hoy
  readonly completedCount = computed(() => {
    return this.currentExercises().filter((e) => e.completed).length;
  });

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
    const gid = this.currentGoal().id;
    this.exercisesList.update((curr) => {
      const list = curr[gid] || curr['A-01'];
      const updated = list.map((ex) =>
        ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
      );
      return {
        ...curr,
        [gid]: updated,
      };
    });
  }
}
