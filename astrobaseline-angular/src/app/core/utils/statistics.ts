/**
 * Utilidades estadísticas robustas para AstroBaseline.
 * Paridad exacta con el algoritmo de Python (analysis.py).
 */

export function median(values: number[]): number | null {
  const valid = values.filter((v) => v !== null && v !== undefined && !isNaN(v));
  if (valid.length === 0) return null;
  const sorted = [...valid].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function mean(values: number[]): number | null {
  const valid = values.filter((v) => v !== null && v !== undefined && !isNaN(v));
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, v) => acc + v, 0);
  return sum / valid.length;
}

/**
 * Mediana y sigma robusta (MAD * 1.4826) de los primeros `nDays` con datos.
 */
export function computeBaseline(
  values: number[],
  nDays = 14,
  minSigma = 1.0
): { baseline: number | null; sigma: number | null } {
  const valid = values.filter((v) => v !== null && v !== undefined && !isNaN(v));
  const base = valid.slice(0, nDays);
  if (base.length < 5) {
    return { baseline: null, sigma: null };
  }
  const med = median(base);
  if (med === null) {
    return { baseline: null, sigma: null };
  }
  const deviations = base.map((v) => Math.abs(v - med));
  const madVal = median(deviations);
  if (madVal === null) {
    return { baseline: null, sigma: null };
  }
  const madSigma = madVal * 1.4826;
  return {
    baseline: Number(med.toFixed(4)),
    sigma: Number(Math.max(madSigma, minSigma).toFixed(4)),
  };
}

/**
 * Promedio de los últimos `window` días calendario (ignora huecos).
 * Paridad con:
 *   last = series.index.max()
 *   w = series.loc[last - pd.Timedelta(days=window - 1):last]
 */
export function computeRecentValue(
  entries: { date: string; value: number | null }[],
  currentDateStr: string,
  windowDays = 3
): number | null {
  const curr = new Date(currentDateStr + 'T00:00:00');
  const start = new Date(curr);
  start.setDate(start.getDate() - (windowDays - 1));

  const windowValues = entries
    .filter((e) => {
      const d = new Date(e.date + 'T00:00:00');
      return d >= start && d <= curr;
    })
    .map((e) => e.value)
    .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));

  if (windowValues.length === 0) return null;
  return mean(windowValues);
}

/**
 * Puntaje de calidad 0-100: 60% completitud (últimos 7 días) + 40% recencia.
 */
export function computeDataQuality(
  entries: { date: string; value: number | null }[],
  currentDateStr: string,
  windowDays = 7
): { score: number; completeness: number; days_since: number | null; flag: string } {
  const curr = new Date(currentDateStr + 'T00:00:00');
  const start = new Date(curr);
  start.setDate(start.getDate() - (windowDays - 1));

  const windowEntries = entries.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    return d >= start && d <= curr;
  });

  const totalInWindow = Math.max(windowEntries.length, windowDays);
  const presentInWindow = windowEntries.filter(
    (e) => e.value !== null && e.value !== undefined && !isNaN(e.value)
  ).length;

  const completeness = totalInWindow > 0 ? presentInWindow / totalInWindow : 0;

  // Filtrar todas las válidas hasta currentDateStr
  const pastValid = entries.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    return (
      d <= curr &&
      e.value !== null &&
      e.value !== undefined &&
      !isNaN(e.value)
    );
  });

  if (pastValid.length === 0) {
    return {
      score: 0,
      completeness: 0,
      days_since: null,
      flag: 'No data',
    };
  }

  // Última medición registrada
  const lastValidDate = new Date(
    pastValid[pastValid.length - 1].date + 'T00:00:00'
  );
  const diffTime = curr.getTime() - lastValidDate.getTime();
  const daysSince = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  const recency = Math.max(0.0, 1 - daysSince / windowDays);
  const score = Math.round(100 * (0.6 * completeness + 0.4 * recency));

  const flags: string[] = [];
  if (daysSince >= 3) {
    flags.push('Stale');
  }
  if (completeness < 0.5) {
    flags.push('Low coverage');
  }

  return {
    score,
    completeness,
    days_since: daysSince,
    flag: flags.length > 0 ? flags.join(', ') : 'OK',
  };
}
