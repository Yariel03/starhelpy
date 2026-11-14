import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MissionStateService } from './core/services/mission-state.service';
import { ConfigService } from './core/services/config.service';
import { BadgeComponent } from './components/badge/badge.component';
import { BodyMapComponent } from './components/body-map/body-map.component';
import { MissionWizardComponent } from './components/mission-wizard/mission-wizard.component';
import { RealtimeBpmComponent } from './components/realtime-bpm/realtime-bpm.component';
import { RewardStreakComponent } from './components/reward-streak/reward-streak.component';
import { StarPetComponent } from './components/star-pet/star-pet.component';
import { BodyRegionKey, IndicatorKey } from './core/models/indicator.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BadgeComponent,
    BodyMapComponent,
    MissionWizardComponent,
    RealtimeBpmComponent,
    RewardStreakComponent,
    StarPetComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly state = inject(MissionStateService);
  readonly config = inject(ConfigService);

  readonly activeTab = signal<'dashboard' | 'trends' | 'body' | 'quality'>('dashboard');
  readonly expandedMetric = signal<string | null>(null);

  // Entornos disponibles
  readonly environmentKeys = Object.keys(this.config.ENVIRONMENTS);

  // Información del entorno seleccionado
  readonly currentEnvInfo = computed(() => {
    const env = this.state.selectedEnvironment();
    return this.config.ENVIRONMENTS[env] || this.config.ENVIRONMENTS['Space station (low Earth orbit)'];
  });

  // Meta de entrenamiento / arquetipo físico seleccionado
  readonly currentGoal = computed(() => {
    const sid = this.state.selectedAstronaut();
    return (
      this.config.TRAINING_GOALS.find((g) => g.id === sid) ||
      this.config.TRAINING_GOALS[0]
    );
  });

  // Destino seleccionado actualmente
  readonly currentDestination = computed(() => {
    const env = this.state.selectedEnvironment();
    return (
      this.config.DESTINATIONS.find((d) => d.environmentKey === env) ||
      this.config.DESTINATIONS[0]
    );
  });

  // Imagen de fondo dinámico de la misión activa
  readonly activeBgImage = this.state.activeBackgroundImage;

  // Información de la región anatómica seleccionada
  readonly currentRegionInfo = computed(() => {
    const reg = this.state.selectedBodyRegion();
    return this.config.REGIONS[reg];
  });

  // Lista de calidad para la tabla del Tab 4
  readonly qualityTableRows = computed(() => {
    const results = this.state.evaluationResults();
    return this.config.INDICATOR_KEYS.map((k) => {
      const cfg = this.config.INDICATORS[k];
      const q = results[k]?.quality || { score: 0, completeness: 0, days_since: null, flag: 'No data' };
      return {
        key: k,
        label: cfg.label,
        score: q.score,
        coverage: `${Math.round(q.completeness * 100)}%`,
        daysSince: q.days_since !== null ? q.days_since : '-',
        flag: q.flag,
      };
    });
  });

  // Métricas para la región seleccionada en el Tab 3
  readonly regionIndicators = computed(() => {
    const info = this.currentRegionInfo();
    const results = this.state.evaluationResults();
    return info.indicators.map((k) => ({
      key: k,
      config: this.config.INDICATORS[k],
      result: results[k],
    }));
  });

  setTab(tab: 'dashboard' | 'trends' | 'body' | 'quality') {
    this.activeTab.set(tab);
  }

  toggleExpand(key: string) {
    this.expandedMetric.update((curr) => (curr === key ? null : key));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.state.loadUploadedFile(input.files[0]);
    }
  }

  onDateSliderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const index = parseInt(target.value, 10);
    const dates = this.state.astronautDates();
    if (dates && dates[index]) {
      this.state.currentDate.set(dates[index]);
    }
  }

  getCurrentDateIndex(): number {
    const dates = this.state.astronautDates();
    const curr = this.state.currentDate();
    const idx = dates.indexOf(curr);
    return idx >= 0 ? idx : dates.length - 1;
  }

  formatValue(v: number | null, unit: string): string {
    return v === null || isNaN(v) ? '-' : `${v.toFixed(1)} ${unit}`;
  }
}
