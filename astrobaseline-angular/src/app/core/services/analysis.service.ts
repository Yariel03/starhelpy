import { Injectable, inject } from '@angular/core';
import { ConfigService } from './config.service';
import {
  IndicatorEvaluation,
  IndicatorKey,
  EvaluationResults,
  HealthRecord,
} from '../models/indicator.model';
import {
  computeBaseline,
  computeRecentValue,
  computeDataQuality,
} from '../utils/statistics';

@Injectable({
  providedIn: 'root',
})
export class AnalysisService {
  private config = inject(ConfigService);

  /**
   * Clasifica el indicador:
   * level: -1 (sin dato), 0 (normal), 1 (atención), 2 (alerta).
   */
  classify(
    key: IndicatorKey,
    recent: number | null,
    med: number | null,
    sigma: number | null
  ): { level: number; z: number | null; reasons: string[] } {
    const cfg = this.config.INDICATORS[key];

    if (recent === null || isNaN(recent)) {
      return {
        level: -1,
        z: null,
        reasons: ['No recent measurement'],
      };
    }

    let level = 0;
    const reasons: string[] = [];
    const lo = cfg.ref_low;
    const hi = cfg.ref_high;
    const hlo = cfg.hard_low;
    const hhi = cfg.hard_high;

    if ((hlo !== null && recent < hlo) || (hhi !== null && recent > hhi)) {
      level = 2;
      reasons.push('Beyond the hard limit');
    } else if ((lo !== null && recent < lo) || (hi !== null && recent > hi)) {
      level = 1;
      reasons.push('Outside the reference range');
    }

    let z: number | null = null;
    if (med !== null && sigma !== null && sigma > 0) {
      z = (recent - med) / sigma;
      if (Math.abs(z) >= 3) {
        level = Math.max(level, 2);
        reasons.push(`${z >= 0 ? '+' : ''}${z.toFixed(1)} sigma from personal baseline`);
      } else if (Math.abs(z) >= 2) {
        level = Math.max(level, 1);
        reasons.push(`${z >= 0 ? '+' : ''}${z.toFixed(1)} sigma from personal baseline`);
      }
    } else {
      reasons.push('Baseline not available yet (fewer than 5 readings)');
    }

    return {
      level,
      z: z !== null ? Number(z.toFixed(2)) : null,
      reasons,
    };
  }

  /**
   * Evalúa todos los indicadores para una serie temporal recortada hasta currentDateStr
   */
  evaluateHealth(
    recordsUpToCurrent: HealthRecord[],
    currentDateStr: string,
    baselineDays = 14
  ): EvaluationResults {
    const results = {} as EvaluationResults;

    for (const key of this.config.INDICATOR_KEYS) {
      const cfg = this.config.INDICATORS[key];
      const series = recordsUpToCurrent.map((r) => ({
        date: r.date,
        value: typeof r[key] === 'number' ? (r[key] as number) : null,
      }));

      const rawValues = series.map((s) => s.value).filter((v): v is number => v !== null);
      const { baseline, sigma } = computeBaseline(rawValues, baselineDays, cfg.min_sigma);
      const recent = computeRecentValue(series, currentDateStr, 3);
      const classification = this.classify(key, recent, baseline, sigma);
      const quality = computeDataQuality(series, currentDateStr, 7);

      results[key] = {
        level: classification.level,
        z: classification.z,
        recent: recent !== null ? Number(recent.toFixed(2)) : null,
        reasons: classification.reasons,
        baseline,
        sigma,
        quality,
      };
    }

    return results;
  }

  /**
   * Calcula el estado global: el máximo nivel entre los indicadores válidos
   */
  computeOverallStatus(results: EvaluationResults): number {
    const levels = Object.values(results)
      .map((r) => r.level)
      .filter((lvl) => lvl >= 0);
    return levels.length > 0 ? Math.max(...levels) : -1;
  }

  /**
   * Texto de escalación médica según el entorno y nivel
   */
  getEscalationText(envKey: string, level: number): string {
    const env = this.config.ENVIRONMENTS[envKey] || this.config.ENVIRONMENTS['Space station (low Earth orbit)'];
    if (level <= 0) {
      return env.routine;
    }
    return level === 1 ? env.attention : env.alert;
  }
}
