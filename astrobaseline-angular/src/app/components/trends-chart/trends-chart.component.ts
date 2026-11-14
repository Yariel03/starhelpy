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
import { IndicatorKey } from '../../core/models/indicator.model';

@Component({
  selector: 'app-trends-chart',
  standalone: true,
  template: `
    <div class="chart-wrapper">
      <div #plotlyChart class="plotly-container"></div>
    </div>
  `,
  styles: [`
    .chart-wrapper {
      width: 100%;
      min-height: 460px;
      background: #ffffff;
      border-radius: 12px;
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
    }
    .plotly-container {
      width: 100%;
      height: 450px;
    }
  `],
})
export class TrendsChartComponent {
  @ViewChild('plotlyChart', { static: true }) chartContainer!: ElementRef<HTMLDivElement>;

  private state = inject(MissionStateService);
  private config = inject(ConfigService);

  constructor() {
    effect(() => {
      // Suscribirse a cambios en registros recortados, indicador seleccionado y resultados
      const records = this.state.recordsUpToCurrent();
      const indicatorKey = this.state.selectedIndicatorForTrends();
      const results = this.state.evaluationResults();

      if (records.length > 0 && indicatorKey && this.chartContainer) {
        this.renderPlot(records, indicatorKey, results[indicatorKey]);
      }
    });
  }

  private renderPlot(records: any[], key: IndicatorKey, result: any) {
    const cfg = this.config.INDICATORS[key];
    if (!cfg) return;

    const xDates = records.map((r) => r.date);
    const yValues = records.map((r) =>
      typeof r[key] === 'number' && !isNaN(r[key]) ? r[key] : null
    );

    const validY = yValues.filter((v): v is number => v !== null);
    const minY = validY.length > 0 ? Math.min(...validY) : 0;
    const maxY = validY.length > 0 ? Math.max(...validY) : 100;

    const shapes: any[] = [];
    const annotations: any[] = [];

    // 1. Rango de referencia (verde)
    const lo = cfg.ref_low !== null ? cfg.ref_low : minY - 1;
    const hi = cfg.ref_high !== null ? cfg.ref_high : maxY + 1;

    shapes.push({
      type: 'rect',
      xref: 'paper',
      yref: 'y',
      x0: 0,
      x1: 1,
      y0: lo,
      y1: hi,
      fillcolor: 'rgba(46, 125, 50, 0.08)',
      line: { width: 0 },
      layer: 'below',
    });

    annotations.push({
      xref: 'paper',
      yref: 'y',
      x: 0.02,
      y: hi,
      text: 'Rango de referencia',
      showarrow: false,
      font: { size: 10, color: '#2e7d32' },
      xanchor: 'left',
      yanchor: 'bottom',
    });

    // 2. Línea base personal +/- 2 sigma (azul)
    if (result && result.baseline !== null && result.sigma !== null) {
      const bLo = result.baseline - 2 * result.sigma;
      const bHi = result.baseline + 2 * result.sigma;

      shapes.push({
        type: 'rect',
        xref: 'paper',
        yref: 'y',
        x0: 0,
        x1: 1,
        y0: bLo,
        y1: bHi,
        fillcolor: 'rgba(37, 99, 235, 0.10)',
        line: { width: 0 },
        layer: 'below',
      });

      shapes.push({
        type: 'line',
        xref: 'paper',
        yref: 'y',
        x0: 0,
        x1: 1,
        y0: result.baseline,
        y1: result.baseline,
        line: {
          color: '#2563eb',
          width: 1.5,
          dash: 'dash',
        },
      });

      annotations.push({
        xref: 'paper',
        yref: 'y',
        x: 0.98,
        y: bHi,
        text: 'Línea base personal ± 2σ',
        showarrow: false,
        font: { size: 10, color: '#2563eb' },
        xanchor: 'right',
        yanchor: 'bottom',
      });
    }

    // 3. Mediciones faltantes (marca X en rojo)
    const missingDates: string[] = [];
    const missingY: number[] = [];
    records.forEach((r) => {
      if (r[key] === null || r[key] === undefined || isNaN(r[key])) {
        missingDates.push(r.date);
        missingY.push(minY);
      }
    });

    const traces: any[] = [
      {
        x: xDates,
        y: yValues,
        mode: 'lines+markers',
        name: cfg.label,
        line: { color: '#0284c7', width: 2.5 },
        marker: { size: 6, color: '#0284c7' },
        connectgaps: false,
      },
    ];

    if (missingDates.length > 0) {
      traces.push({
        x: missingDates,
        y: missingY,
        mode: 'markers',
        name: 'Medición ausente',
        marker: {
          symbol: 'x',
          size: 10,
          color: '#dc2626',
          line: { width: 2 },
        },
      });
    }

    const layout: any = {
      title: `${cfg.label} (${cfg.unit}) — Evolución Temporal`,
      xaxis: { title: 'Fecha de Misión', showgrid: true, gridcolor: '#f1f5f9' },
      yaxis: { title: `${cfg.label} (${cfg.unit})`, showgrid: true, gridcolor: '#f1f5f9' },
      shapes,
      annotations,
      margin: { t: 50, r: 30, l: 60, b: 50 },
      hovermode: 'closest',
      plot_bgcolor: '#ffffff',
      paper_bgcolor: '#ffffff',
    };

    Plotly.react(this.chartContainer.nativeElement, traces, layout, {
      responsive: true,
      displayModeBar: true,
    });
  }
}
