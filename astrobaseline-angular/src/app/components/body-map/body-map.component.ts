import { Component, inject } from '@angular/core';
import { MissionStateService } from '../../core/services/mission-state.service';
import { BodyRegionKey } from '../../core/models/indicator.model';

@Component({
  selector: 'app-body-map',
  standalone: true,
  template: `
    <div class="body-map-container">
      <svg
        viewBox="0 0 200 410"
        xmlns="http://www.w3.org/2000/svg"
        class="body-svg"
      >
        <!-- Head -->
        <circle
          cx="100"
          cy="45"
          r="30"
          [attr.fill]="colors().head"
          stroke="#222"
          stroke-width="2"
          class="interactive-region"
          [class.selected]="selectedRegion() === 'head'"
          (click)="selectRegion('head')"
        >
          <title>Cabeza: Cerebro y comportamiento</title>
        </circle>

        <!-- Chest -->
        <rect
          x="60"
          y="85"
          width="80"
          height="70"
          rx="18"
          [attr.fill]="colors().chest"
          stroke="#222"
          stroke-width="2"
          class="interactive-region"
          [class.selected]="selectedRegion() === 'chest'"
          (click)="selectRegion('chest')"
        >
          <title>Pecho: Sistema cardiovascular</title>
        </rect>

        <!-- Abdomen -->
        <rect
          x="68"
          y="158"
          width="64"
          height="60"
          rx="14"
          [attr.fill]="colors().abdomen"
          stroke="#222"
          stroke-width="2"
          class="interactive-region"
          [class.selected]="selectedRegion() === 'abdomen'"
          (click)="selectRegion('abdomen')"
        >
          <title>Abdomen: Metabolismo (Glucosa)</title>
        </rect>

        <!-- Left Arm -->
        <rect
          x="22"
          y="90"
          width="30"
          height="125"
          rx="14"
          [attr.fill]="colors().arms"
          stroke="#222"
          stroke-width="2"
          class="interactive-region"
          [class.selected]="selectedRegion() === 'arms'"
          (click)="selectRegion('arms')"
        >
          <title>Brazos: Termorregulación y respuesta inmunológica</title>
        </rect>

        <!-- Right Arm -->
        <rect
          x="148"
          y="90"
          width="30"
          height="125"
          rx="14"
          [attr.fill]="colors().arms"
          stroke="#222"
          stroke-width="2"
          class="interactive-region"
          [class.selected]="selectedRegion() === 'arms'"
          (click)="selectRegion('arms')"
        >
          <title>Brazos: Termorregulación y respuesta inmunológica</title>
        </rect>

        <!-- Left Leg -->
        <rect
          x="70"
          y="222"
          width="26"
          height="170"
          rx="12"
          [attr.fill]="colors().legs"
          stroke="#222"
          stroke-width="2"
          class="interactive-region"
          [class.selected]="selectedRegion() === 'legs'"
          (click)="selectRegion('legs')"
        >
          <title>Piernas: Sistema musculoesquelético</title>
        </rect>

        <!-- Right Leg -->
        <rect
          x="104"
          y="222"
          width="26"
          height="170"
          rx="12"
          [attr.fill]="colors().legs"
          stroke="#222"
          stroke-width="2"
          class="interactive-region"
          [class.selected]="selectedRegion() === 'legs'"
          (click)="selectRegion('legs')"
        >
          <title>Piernas: Sistema musculoesquelético</title>
        </rect>
      </svg>
    </div>
  `,
  styles: [`
    .body-map-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0.75rem;
      background: rgba(248, 250, 252, 0.85);
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      width: 100%;
      box-sizing: border-box;
    }
    .body-svg {
      width: 100%;
      max-width: 160px;
      height: auto;
      max-height: 330px;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.06));
    }
    .interactive-region {
      cursor: pointer;
      transition: all 0.2s ease;
      &:hover {
        opacity: 0.85;
        stroke: #0284c7;
        stroke-width: 3;
      }
      &.selected {
        stroke: #2563eb;
        stroke-width: 3.5;
        filter: brightness(1.1);
      }
    }
  `],
})
export class BodyMapComponent {
  private state = inject(MissionStateService);

  readonly colors = this.state.bodyRegionColors;
  readonly selectedRegion = this.state.selectedBodyRegion;

  selectRegion(region: BodyRegionKey) {
    this.state.selectedBodyRegion.set(region);
  }
}
