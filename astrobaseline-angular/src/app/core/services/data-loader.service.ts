import { Injectable, inject } from '@angular/core';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ConfigService } from './config.service';
import { HealthRecord, IndicatorKey } from '../models/indicator.model';
import { median } from '../utils/statistics';

export interface StandardizationResult {
  records: HealthRecord[];
  log: string[];
  mapping: Record<string, string>;
  astronauts: string[];
  dates: string[];
}

@Injectable({
  providedIn: 'root',
})
export class DataLoaderService {
  private config = inject(ConfigService);

  private norm(s: any): string {
    return String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Auto-detección de columnas usando sinónimos
   */
  autoMap(columns: string[]): Record<string, string> {
    const normCols: Record<string, string> = {};
    columns.forEach((c) => (normCols[c] = this.norm(c)));
    const used = new Set<string>();

    const pick = (synonyms: string[]): string | undefined => {
      const synNorm = synonyms.map((s) => this.norm(s));
      for (const c of columns) {
        if (synNorm.includes(normCols[c]) && !used.has(c)) {
          used.add(c);
          return c;
        }
      }
      return undefined;
    };

    const found: Record<string, string | undefined> = {
      [this.config.DATE_COL]: pick(this.config.DATE_SYNONYMS),
      [this.config.SUBJECT_COL]: pick(this.config.SUBJECT_SYNONYMS),
    };

    for (const key of this.config.INDICATOR_KEYS) {
      const cfg = this.config.INDICATORS[key];
      found[key] = pick([...cfg.synonyms, key]);
    }

    const mapping: Record<string, string> = {};
    for (const [k, v] of Object.entries(found)) {
      if (v) mapping[k] = v;
    }
    return mapping;
  }

  /**
   * Lee un archivo (File) detectando extensión (.csv, .xlsx, .json)
   */
  async readFile(file: File): Promise<any[]> {
    const name = file.name.toLowerCase();

    if (name.endsWith('.json')) {
      const text = await file.text();
      return JSON.parse(text);
    }

    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
    }

    // CSV por defecto
    const text = await file.text();
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results: any) => resolve(results.data),
        error: (err: any) => reject(err),
      });
    });
  }

  /**
   * Procesa y estandariza los datos crudos a una tabla diaria
   */
  standardize(
    rawRows: any[],
    customMapping?: Record<string, string>,
    startDate = '2026-01-01'
  ): StandardizationResult {
    const log: string[] = [];
    if (!rawRows || rawRows.length === 0) {
      return { records: [], log: ['Empty dataset provided.'], mapping: {}, astronauts: [], dates: [] };
    }

    const columns = Object.keys(rawRows[0] || {});
    let mapping = customMapping ? { ...customMapping } : this.autoMap(columns);
    log.push(`Column mapping used: ${JSON.stringify(mapping)}`);

    // Detectar si el dataset viene en formato LARGO
    let df = [...rawRows];
    const hasAnyIndicatorMapped = this.config.INDICATOR_KEYS.some((k) => mapping[k]);

    if (!hasAnyIndicatorMapped) {
      const vcol = columns.find((c) =>
        this.config.LONG_VAR_SYNONYMS.map((s) => this.norm(s)).includes(this.norm(c))
      );
      const valcol = columns.find((c) =>
        this.config.LONG_VAL_SYNONYMS.map((s) => this.norm(s)).includes(this.norm(c))
      );

      if (vcol && valcol) {
        log.push(`Long format detected (variable='${vcol}', value='${valcol}') -> pivoting to wide.`);
        const nameToKey: Record<string, IndicatorKey> = {};
        for (const key of this.config.INDICATOR_KEYS) {
          const cfg = this.config.INDICATORS[key];
          for (const s of [...cfg.synonyms, key]) {
            nameToKey[this.norm(s)] = key;
          }
        }

        const wideMap = new Map<string, any>();
        for (const row of df) {
          const k = nameToKey[this.norm(row[vcol])];
          if (!k) continue;
          const dateVal = row[mapping[this.config.DATE_COL] || this.config.DATE_COL];
          const sidVal = row[mapping[this.config.SUBJECT_COL] || this.config.SUBJECT_COL] || 'A-01';
          const compositeKey = `${sidVal}___${dateVal}`;

          if (!wideMap.has(compositeKey)) {
            wideMap.set(compositeKey, {
              [this.config.DATE_COL]: dateVal,
              [this.config.SUBJECT_COL]: sidVal,
            });
          }
          const entry = wideMap.get(compositeKey);
          const num = parseFloat(row[valcol]);
          entry[k] = isNaN(num) ? null : num;
        }

        df = Array.from(wideMap.values());
        mapping = this.autoMap(Object.keys(df[0] || {}));
      }
    }

    // Renombrar a nombres estándar
    const records: any[] = df.map((row) => {
      const rec: any = {};
      if (mapping[this.config.DATE_COL]) {
        rec.date = row[mapping[this.config.DATE_COL]];
      }
      if (mapping[this.config.SUBJECT_COL]) {
        rec.astronaut_id = String(row[mapping[this.config.SUBJECT_COL]]);
      } else {
        rec.astronaut_id = 'A-01';
      }

      for (const k of this.config.INDICATOR_KEYS) {
        if (mapping[k] && row[mapping[k]] !== undefined && row[mapping[k]] !== null && row[mapping[k]] !== '') {
          const val = parseFloat(row[mapping[k]]);
          rec[k] = isNaN(val) ? null : val;
        } else {
          rec[k] = null;
        }
      }
      return rec;
    });

    // Validar y normalizar fechas
    let baseStartDate = new Date(startDate + 'T00:00:00');
    records.forEach((r, idx) => {
      if (!r.date) {
        const d = new Date(baseStartDate);
        d.setDate(d.getDate() + idx);
        r.date = d.toISOString().split('T')[0];
      } else if (typeof r.date === 'number') {
        const d = new Date(baseStartDate);
        d.setDate(d.getDate() + r.date);
        r.date = d.toISOString().split('T')[0];
      } else {
        const parsed = new Date(r.date);
        if (isNaN(parsed.getTime())) {
          const d = new Date(baseStartDate);
          d.setDate(d.getDate() + idx);
          r.date = d.toISOString().split('T')[0];
        } else {
          r.date = parsed.toISOString().split('T')[0];
        }
      }
    });

    // Conversiones de unidades
    // 1. Temperatura: Fahrenheit a Celsius
    let fCount = 0;
    records.forEach((r) => {
      if (typeof r.temperature === 'number' && r.temperature > 45) {
        r.temperature = Number(((r.temperature - 32) * (5 / 9)).toFixed(2));
        fCount++;
      }
    });
    if (fCount > 0) log.push(`temperature: ${fCount} values looked like Fahrenheit -> converted to °C.`);

    // 2. Glucosa: mmol/L a mg/dL
    let gCount = 0;
    records.forEach((r) => {
      if (typeof r.glucose === 'number' && r.glucose > 0 && r.glucose < 30) {
        r.glucose = Number((r.glucose * 18.016).toFixed(1));
        gCount++;
      }
    });
    if (gCount > 0) log.push(`glucose: ${gCount} values looked like mmol/L -> converted to mg/dL.`);

    // 3. Sueño: minutos a horas
    const sleepVals = records
      .map((r) => r.sleep_hours)
      .filter((v): v is number => typeof v === 'number');
    const sleepMed = median(sleepVals);
    if (sleepMed !== null && sleepMed > 24) {
      records.forEach((r) => {
        if (typeof r.sleep_hours === 'number') {
          r.sleep_hours = Number((r.sleep_hours / 60).toFixed(2));
        }
      });
      log.push('sleep_hours: median > 24, interpreted as minutes -> converted to hours.');
    }

    // 4. Plausibilidad biológica
    for (const key of this.config.INDICATOR_KEYS) {
      const cfg = this.config.INDICATORS[key];
      let badCount = 0;
      records.forEach((r) => {
        if (typeof r[key] === 'number') {
          if (r[key] < cfg.plaus_low || r[key] > cfg.plaus_high) {
            r[key] = null;
            badCount++;
          }
        }
      });
      if (badCount > 0) {
        log.push(`${key}: ${badCount} implausible values discarded (outside ${cfg.plaus_low}-${cfg.plaus_high}).`);
      }
    }

    // 5. Agrupación diaria promedio por astronauta y fecha
    const dailyMap = new Map<string, any>();
    records.forEach((r) => {
      const key = `${r.astronaut_id}___${r.date}`;
      if (!dailyMap.has(key)) {
        dailyMap.set(key, {
          astronaut_id: r.astronaut_id,
          date: r.date,
          counts: {},
          sums: {},
        });
      }
      const item = dailyMap.get(key);
      for (const k of this.config.INDICATOR_KEYS) {
        if (typeof r[k] === 'number') {
          item.sums[k] = (item.sums[k] || 0) + r[k];
          item.counts[k] = (item.counts[k] || 0) + 1;
        }
      }
    });

    const aggregated: HealthRecord[] = [];
    dailyMap.forEach((item) => {
      const rec: HealthRecord = {
        astronaut_id: item.astronaut_id,
        date: item.date,
      };
      for (const k of this.config.INDICATOR_KEYS) {
        rec[k] = item.counts[k] ? Number((item.sums[k] / item.counts[k]).toFixed(2)) : null;
      }
      aggregated.push(rec);
    });

    // 6. Construir calendario completo rellenando huecos por astronauta
    const astronauts = Array.from(new Set(aggregated.map((r) => r.astronaut_id))).sort();
    const finalCleanRecords: HealthRecord[] = [];

    for (const sid of astronauts) {
      const astroRecords = aggregated
        .filter((r) => r.astronaut_id === sid)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (astroRecords.length === 0) continue;

      const minDate = new Date(astroRecords[0].date + 'T00:00:00');
      const maxDate = new Date(astroRecords[astroRecords.length - 1].date + 'T00:00:00');
      const recMap = new Map<string, HealthRecord>();
      astroRecords.forEach((r) => recMap.set(r.date, r));

      const curr = new Date(minDate);
      while (curr <= maxDate) {
        const dStr = curr.toISOString().split('T')[0];
        if (recMap.has(dStr)) {
          finalCleanRecords.push(recMap.get(dStr)!);
        } else {
          finalCleanRecords.push({
            astronaut_id: sid,
            date: dStr,
            heart_rate: null,
            systolic_bp: null,
            diastolic_bp: null,
            glucose: null,
            temperature: null,
            sleep_hours: null,
            mood: null,
          });
        }
        curr.setDate(curr.getDate() + 1);
      }
    }

    const allDates = Array.from(new Set(finalCleanRecords.map((r) => r.date))).sort();
    log.push(
      `Full daily calendar built: ${finalCleanRecords.length} rows, ${astronauts.length} astronaut(s).`
    );

    return {
      records: finalCleanRecords,
      log,
      mapping,
      astronauts,
      dates: allDates,
    };
  }
}
