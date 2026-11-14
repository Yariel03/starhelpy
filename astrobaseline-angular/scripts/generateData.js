/**
 * scripts/generateData.js - Generador de datos sintéticos con problemas realistas para la demo
 * Reemplaza generate_data.py
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple PRNG (Linear Congruential Generator / Mulberry32)
function createRng(seed) {
  let s = seed;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Normal distribution via Box-Muller
function normalRandom(rng, mean = 0, std = 1) {
  const u1 = Math.max(1e-7, rng());
  const u2 = rng();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * std;
}

function makeSubject(sid, days = 60, startDate = '2026-03-01', drift = true, seed = 1) {
  const rng = createRng(seed);
  const rows = [];
  const baseDate = new Date(startDate + 'T00:00:00');
  const dMult = drift ? 1.0 : 0.0;

  for (let t = 0; t < days; t++) {
    const curDate = new Date(baseDate);
    curDate.setDate(curDate.getDate() + t);
    const dateStr = curDate.toISOString().split('T')[0];

    const sleepDrop = t >= 30 && t <= 48 ? 1.8 : 0;
    const sleep = 7.0 + normalRandom(rng, 0, 0.5) - dMult * sleepDrop;

    const sbpRise = t > 25 ? (t - 25) * 0.5 : 0;
    const sbp = 116 + normalRandom(rng, 0, 3) + dMult * sbpRise;

    const hrRise = t > 35 ? (t - 35) * 0.3 : 0;
    const hr = 62 + normalRandom(rng, 0, 2.5) + dMult * hrRise;

    const dbp = 74 + normalRandom(rng, 0, 2.5) + (sbp - 116) * 0.5;
    const glucose = 92 + normalRandom(rng, 0, 5);
    const temp = 36.6 + normalRandom(rng, 0, 0.15);

    let moodRaw = 4 + normalRandom(rng, 0, 0.6) + (sleep - 7) * 0.5;
    const mood = Math.min(5, Math.max(1, Math.round(moodRaw)));

    rows.push({
      date: dateStr,
      astronaut_id: sid,
      heart_rate: Number(hr.toFixed(2)),
      systolic_bp: Number(sbp.toFixed(2)),
      diastolic_bp: Number(dbp.toFixed(2)),
      glucose: Number(glucose.toFixed(2)),
      temperature: Number(temp.toFixed(2)),
      sleep_hours: Number(sleep.toFixed(2)),
      mood,
      source: 'SYNTHETIC',
    });
  }

  // Huecos aleatorios (8%)
  const cols = ['heart_rate', 'systolic_bp', 'diastolic_bp', 'glucose', 'temperature', 'sleep_hours', 'mood'];
  rows.forEach((r) => {
    cols.forEach((c) => {
      if (rng() < 0.08) {
        r[c] = null;
      }
    });
  });

  if (drift) {
    // Bloque sin glucosa (días 40 a 43)
    for (let i = 40; i <= 43 && i < rows.length; i++) {
      rows[i].glucose = null;
    }
    // Temperatura "vencida" (últimos 4 días)
    for (let i = days - 4; i < days; i++) {
      if (rows[i]) rows[i].temperature = null;
    }
    // Error Fahrenheit
    if (rows[20]) rows[20].temperature = 98.4;
    // Error sensor en 0
    if (rows[33]) rows[33].heart_rate = 0;
    // Duplicado de la fila 10
    if (rows[10]) rows.push({ ...rows[10] });
  }

  return rows;
}

export function buildAll() {
  const a1 = makeSubject('A-01', 60, '2026-03-01', true, 1);
  const a2 = makeSubject('A-02', 60, '2026-03-01', false, 2);
  return [...a1, ...a2];
}

function toCsv(rows) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  rows.forEach((r) => {
    const line = headers.map((h) => (r[h] === null || r[h] === undefined ? '' : r[h])).join(',');
    lines.push(line);
  });
  return lines.join('\n');
}

const allData = buildAll();
const csvContent = toCsv(allData);

const outDir = path.resolve(__dirname, '../public/data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
const outPath = path.join(outDir, 'synthetic_health.csv');
fs.writeFileSync(outPath, csvContent, 'utf-8');
console.log(`Saved ${outPath} (${allData.length} records)`);
