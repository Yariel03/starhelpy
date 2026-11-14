import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MissionStateService } from '../../core/services/mission-state.service';
import { ConfigService } from '../../core/services/config.service';
import {
  MissionDestination,
  TrainingGoal,
} from '../../core/models/indicator.model';

@Component({
  selector: 'app-mission-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mission-wizard.component.html',
  styleUrl: './mission-wizard.component.scss',
})
export class MissionWizardComponent {
  private state = inject(MissionStateService);
  readonly config = inject(ConfigService);

  readonly currentStep = signal<number>(1);
  readonly totalSteps = 3;

  // Respuestas del usuario
  readonly daysInSpace = signal<number>(60);
  readonly selectedDestination = signal<MissionDestination>(
    this.config.DESTINATIONS[0]
  );
  readonly selectedGoal = signal<TrainingGoal>(
    this.config.TRAINING_GOALS[0]
  );

  setStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep.set(step);
    }
  }

  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update((s) => s + 1);
    } else {
      this.finishWizard();
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  setDaysPreset(days: number): void {
    this.daysInSpace.set(days);
  }

  selectDestination(dest: MissionDestination): void {
    this.selectedDestination.set(dest);
    // Cambiar inmediatamente el entorno en el estado global para que el fondo cambie en vivo
    this.state.selectedEnvironment.set(dest.environmentKey);
  }

  selectGoal(goal: TrainingGoal): void {
    this.selectedGoal.set(goal);
  }

  finishWizard(): void {
    this.state.applyMissionConfig({
      daysInSpace: this.daysInSpace(),
      destination: this.selectedDestination(),
      trainingGoal: this.selectedGoal(),
    });
  }

  skipWizard(): void {
    this.state.isWizardOpen.set(false);
  }
}
