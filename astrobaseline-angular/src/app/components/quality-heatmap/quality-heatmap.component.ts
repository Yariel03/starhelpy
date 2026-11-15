import {
  Component,
  ElementRef,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
import Plotly from 'plotly.js-dist-min';
import { MissionStateService } from '../../core/services/mission-state.service';
import { ConfigService } from '../../core/services/config.service';

@Component({
  selector: 'app-quality-heatmap',
  standalone: true,
  template: `
    <div class="heatmap-wrapper">
      <div #plotlyHeatmap class="heatmap-container"></div>
    </div>
  `,
  styles: [`
    .heatmap-wrapper {
      width: 100%;
      min-height: 380px;
      background: var(--card-glass-bg);
      backdrop-filter: var(--card-glass-blur);
      -webkit-backdrop-filter: var(--card-glass-blur);
      border-radius: 12px;
      padding: 0.5rem;
      border: var(--card-glass-border);
      box-shadow: var(--card-glass-shadow);
    }
    .heatmap-container {
      width: 100%;
      height: 360px;
    }
  `],
})
export class QualityHeatmapComponent {
  @ViewChild('plotlyHeatmap', { static: true }) heatmapContainer!: ElementRef<HTMLDivElement>;

  private state = inject(MissionStateService);
  private config = inject(ConfigService);

  constructor() {
    effect(() => {
      const records = this.state.recordsUpToCurrent();
      if (records.length > 0 && this.heatmapContainer) {
        this.renderHeatmap(records);
      }
    });
  }

  private renderHeatmap(records: any[]) {
    const dates = records.map((r) => r.date);
    const keys = this.config.INDICATOR_KEYS;
    const yLabels = keys.map((k) => this.config.INDICATORS[k].label);

    // z: array de arrays [indicators x dates]
    // 1 si presente, 0 si ausente
    const zMatrix: number[][] = keys.map((k) => {
      return records.map((r) => {
        const val = r[k];
        return val !== null && val !== undefined && !isNaN(val) ? 1 : 0;
      });
    });

    const data: any[] = [
      {
        z: zMatrix,
        x: dates,
        y: yLabels,
        type: 'heatmap',
        colorscale: [
          [0, '#c62828'], // Rojo: ausente
          [1, '#2e7d32'], // Verde: presente
        ],
        showscale: false,
        xgap: 1,
        ygap: 1,
      },
    ];

    const layout: any = {
      title: {
        text: 'Mediciones registradas (verde) vs ausentes (rojo)',
        font: { color: '#ffffff', size: 14 },
      },
      margin: { t: 40, r: 20, l: 240, b: 60 },
      xaxis: {
        title: { text: 'Fecha de Misión', font: { color: '#cbd5e1' } },
        tickfont: { color: '#cbd5e1' },
        tickangle: -45,
        showgrid: false,
      },
      yaxis: {
        autorange: 'reversed',
        tickfont: { color: '#ffffff' },
      },
      plot_bgcolor: 'transparent',
      paper_bgcolor: 'transparent',
    };

    Plotly.react(this.heatmapContainer.nativeElement, data, layout, {
      responsive: true,
      displayModeBar: false,
    });
  }
}
