# 🧠 Plan de Monitoreo Neuro-Sueño y Conducta Espacial (Hackathon MVP)

## 📌 Contexto y Objetivos
Implementación del módulo neuroconductual de **Start Helpy** para la preservación de la salud mental y calidad de sueño de los astronautas durante misiones de larga duración (ISS, Lunar Gateway, Marte). El sistema correlaciona la variabilidad de la frecuencia cardíaca en reposo (LPM) y fases del sueño con la activación neuronal y riesgos de ansiedad o psicosis por confinamiento.

---

## 🚀 Las 4 Prioridades Implementadas

### 1. 🧠 Módulo Neuro-Sueño con Cerebro 3D Interactivo
- **Tecnología**: Three.js WebGL integrado en Angular 19.
- **Visualización 3D**: Estructuras corticales y subcorticales con red neuronal de partículas conectivas reactivas al pulso cardíaco (LPM).
- **Zonas Reactivas**:
  - Corteza Prefrontal Dorso-Lateral (Función ejecutiva y toma de decisiones).
  - Complejo Amigdalino (Respuesta de lucha, pánico y alerta aguda).
  - Corteza Insular (Percepción interoceptiva de taquicardia).
  - Formación Hipocampal (Consolidación de memoria y ritmo circadiano).
  - Tronco Encefálico & Locus Coeruleus (Regulación autonómica noradrenérgica).
  - Giro Cingular Anterior (Resolución de conflicto cognitivo).
- **Simulador de 4 Casos Clínicos Espaciales**:
  1. `🟢 Sueño Reparador (50 LPM)`: Ondas delta lentas N3, amígdala inhibida, prefrontal sereno.
  2. `🟡 Ansiedad Nocturna (92 LPM)`: Hiperactividad amigdalina, sueño N1 fragmentado.
  3. `🟠 Pánico / Despertar (122 LPM)`: Taquicardia paroxística, ínsula y tronco encefálico encendidos.
  4. `🔴 Psicosis / Confinamiento (138 LPM)`: Delirio hiperadrenérgico, prefrontal desacoplado.
- **Hipnograma 8 Horas**: Curva de sueño continua con registro de etapas (Vigilia, REM, N1, N2, N3) y marcadores de estrés.

### 2. ⭐ Reacción Emocional de Star Helpy a la Neuroconducta
- **Expresiones Dinámicas**: Cambios faciales automáticos en SVG (ojos brillantes de felicidad, lágrimas de preocupación, cejas afiladas de alerta crítica).
- **Aura y Resplandor**: Cambios cromáticos en la atmósfera de Helpy (Esmeralda para sueño reparador, Ámbar para ansiedad, Naranja para pánico y Carmesí pulsante para alerta de psicosis).
- **Burbuja de Alerta y Chat Proactivo**: Si la telemetría cardíaca en reposo detecta un ataque de pánico o psicosis, Star Helpy emite una alerta en vivo en la pantalla y ofrece recomendaciones de calma.
- **Respuestas Conversacionales**: Helpy responde dudas sobre el cerebro 3D, ondas de sueño, taquicardia y protocolos de confinamiento.

### 3. 📄 Botón y Reporte Médico de Vuelo (Flight Surgeon Briefing)
- **Acceso Directo**: Botón `📄 Reporte Médico` en la cabecera superior de la aplicación y dentro del módulo de sueño.
- **Modal Aeroespacial Oficial**:
  - Comparativa de Línea Base Terrestre vs Telemetría Espacial Actual (FC, Presión, SpO2, Variabilidad HRV, Masa Magra, Densidad Ósea).
  - Clima de Radiación Espacial en tiempo real vía **NASA DONKI** (flujo de protones, RBE y dosis acumulada).
  - Resumen Neuroconductual y Fase de Sueño.
  - Firma Criptográfica Digital del Cirujano de Vuelo (Flight Surgeon SHA-256).
  - Soporte de impresión y exportación a PDF nativo (`window.print()`).

### 4. 🫁 Contramedida Interactiva de Respiración Guiada 4-7-8
- **Base Fisiológica**: Técnica 4-7-8 diseñada para estimular el nervio vago y activar el sistema parasimpático, desacelerando el nodo sinusal cardíaco.
- **Interfaz Inmersiva**:
  - Orbe luminiscente con contracción y expansión fluida al compás de las fases:
    - Inhala (4 segundos).
    - Retén (7 segundos).
    - Exhala (8 segundos).
  - Indicador numérico central con barra de progreso.
  - Contador de ciclos (3 repeticiones por sesión de contramedida).
  - Telemetría en vivo reduciendo progresivamente la frecuencia cardíaca de taquicardia hasta ~52 LPM (Sueño Reparador).

---

## 🛠️ Archivos Creados & Modificados
- `src/app/core/services/neuro-sleep.service.ts`
- `src/app/components/brain-3d/brain-3d.component.ts` (.html, .scss)
- `src/app/components/neuro-sleep/neuro-sleep.component.ts` (.html, .scss)
- `src/app/components/guided-breathing/guided-breathing.component.ts` (.html, .scss)
- `src/app/components/flight-report/flight-report.component.ts` (.html, .scss)
- `src/app/components/star-pet/star-pet.component.ts` (.html, .scss)
- `src/app/app.component.ts` (.html, .scss)
