# AstroBaseline (Angular 19 + TypeScript)

Personal-baseline health monitoring prototype for astronauts (NASA Space Apps 2026) migrated to **Angular 19** with Standalone Components and Signals.

> [!WARNING]
> Prototype with synthetic/demo data. Not a medical device. No clinical validation. Demonstrative thresholds.

---

## Características

- **Angular 19 Standalone & Signals:** Reactividad sin sobrecarga de estado; cálculo automático al cambiar astronauta o día de misión.
- **Tipado estricto (TypeScript):** Modelos definidos para telemetría, rangos biológicos, z-scores e índices de calidad.
- **Visualización Plotly.js:** Gráficos de series de tiempo con bandas de referencia biológica, línea base personalizada $\pm 2\sigma$ y marcadores de fallos de medición.
- **Body Map SVG Interactivo:** Representación vectorial de regiones anatómicas (cabeza, tórax, abdomen, brazos, piernas) con colores dinámicos según estado de salud.
- **Procesamiento de Archivos:** Soporta subida de datasets en formato `.csv`, `.xlsx`, `.json` con detección automática de columnas y normalización de unidades (Fahrenheit $\to$ Celsius, mmol/L $\to$ mg/dL, minutos $\to$ horas).

---

## Ejecución Rápida

### 1. Iniciar servidor de desarrollo
```bash
npm start
```
La aplicación se abrirá en `http://localhost:4200`.

### 2. Regenerar datos sintéticos
```bash
npm run generate-data
```
Genera `public/data/synthetic_health.csv` con escenarios de deriva, huecos y fallas controladas de sensores.

### 3. Compilar para producción
```bash
npm run build
```
Genera los artefactos estáticos optimizados en `dist/astrobaseline-angular/browser`.
