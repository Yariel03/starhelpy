# ⭐ Start Helpy — Preservación Fisiológica & Neuroconductual para Misiones Espaciales

<div align="center">

![Start Helpy Logo](public/assets/images/logo/logo-dark.png)

**Plataforma Integral de Telemetría Biomédica, Monitoreo Neuroconductual 3D y Gamificación Física para Astronautas en Microgravedad**  
*Desarrollado para Hackathons de Innovación Aeroespacial & NASA Space Apps Challenge*

[![Angular](https://img.shields.io/badge/Angular-19.0-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_3D-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NASA DONKI](https://img.shields.io/badge/NASA-DONKI_API-0B3D91?style=for-the-badge&logo=nasa&logoColor=white)](https://kauai.ccmc.gsfc.nasa.gov/DONKI/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#)

</div>

---

## 🌌 Visión del Proyecto

En misiones de larga duración (Estación Espacial Internacional, Lunar Gateway y viajes tripulados a Marte), los astronautas enfrentan dos grandes amenazas críticas e interconectadas:

1. **Deterioro Fisiológico Acelerado**: Atrofia muscular severa (hasta 20% en 11 días), pérdida de densidad mineral ósea (1-1.5% mensual) y descondicionamiento cardiovascular por ausencia de resistencia hidrostática en gravedad cero.
2. **Crisis Neuroconductual y Desincronización del Sueño**: Alteraciones del ritmo circadiano (16 amaneceres/puestas de sol cada 24 horas en LEO), estrés por confinamiento extremo, microdespertares con taquicardia y riesgo de episodios de ansiedad o psicosis aguda inducida por aislamiento y flujo de radiación cósmica.

**Start Helpy** soluciona esto a través de un ecosistema reactivo impulsado por **Angular 19 Signals**, renderizado tridimensional **Three.js**, monitoreo climático espacial vía **NASA DONKI**, gamificación de hábitos estilo Duolingo y contramedidas parasimpáticas guiadas en tiempo real.

---

## 🚀 Características Principales

### 1. 🧠 Módulo Neuro-Sueño 3D & Simulador de Casos Clínicos
* **Cerebro 3D Interactivo (Three.js WebGL)**: Render tridimensional en tiempo real con partículas neuronales que pulsan sincrónicamente con la frecuencia cardíaca en reposo (LPM). Permite orbitar 360°, rotación libre, zoom e interacción directa.
* **Mapeo de Zonas Anatómicas Reactivas**:
  * **Corteza Prefrontal Dorso-Lateral**: Control ejecutivo y regulación emocional.
  * **Complejo Amigdalino**: Respuestas de pánico, miedo y alerta simpática.
  * **Corteza Insular**: Procesamiento interoceptivo del pulso y taquicardia.
  * **Formación Hipocampal**: Consolidación de memoria y fases del sueño.
  * **Tronco Encefálico & Locus Coeruleus**: Regulación autonómica e hiperalerta noradrenérgica.
  * **Giro Cingular Anterior**: Evaluación de conflicto cognitivo y estrés.
* **Simulador de 4 Escenarios Clínicos Aeroespaciales**:
  * `🟢 Sueño Reparador (50 LPM)`: Ondas delta lentas (N3), amígdala silenciada, homeostasis parasimpática.
  * `🟡 Ansiedad Nocturna (92 LPM)`: Hiperactivación de amígdala e insular, sueño N1 fragmentado.
  * `🟠 Pánico / Despertar Agudo (122 LPM)`: Taquicardia paroxística nocturna y activación simpática masiva.
  * `🔴 Psicosis / Confinamiento Espacial (138 LPM)`: Sobrecarga adrenérgica continua, desincronización prefrontal-límbica.
* **Hipnograma Continuo de 8 Horas**: Curva de sueño multi-fase (Vigilia, REM, N1, N2, N3) con índice de estrés neuronal.

---

### 2. ⭐ Mascota Flotante Orbital "Star Helpy"
* **Acompañamiento Psicoemocional**: Star Helpy acompaña al astronauta durante cada Sol de la misión, flotando en pantalla y arrastrable por el espacio de trabajo.
* **Expresiones Faciales Dinámicas en SVG**:
  * *Feliz y Radiante*: Cumplimiento de metas de entrenamiento y sueño profundo.
  * *Preocupado*: Rutina de ejercicio incompleta o detección de ansiedad nocturna.
  * *Alerta / Enojado*: 0 ejercicios realizados o emergencia neuroconductual crítica (psicosis / radiación).
* **Aura Cromática Reactiva**: Resplandor que cambia entre Dorado Solar, Esmeralda, Ámbar, Naranja y Carmesí pulsante.
* **Chat Orbital Inteligente**: Asistente conversacional con recomendaciones clínicas, motivación para el ejercicio en gravedad cero y respuestas basadas en la telemetría actual.

---

### 3. 🫁 Contramedida Interactiva: Respiración Guiada 4-7-8
* **Base Neurofisiológica**: Protocolo diseñado para estimular el nervio vago y desacelerar el nodo sinoauricular del corazón mediante una cadencia 4-7-8.
* **Interfaz de Inmersión**:
  * Orbe respiratorio luminiscente con expansión y contracción fluida.
  * Indicador de tiempo: **Inhala (4s)** $\to$ **Retén (7s)** $\to$ **Exhala (8s)**.
  * Telemetría reactiva en vivo: Durante los 3 ciclos de la contramedida, el pulso cardíaco desciende progresivamente desde niveles de taquicardia/pánico (>120 LPM) hasta un estado de reposo nominal (~52 LPM).

---

### 4. 🛰️ Integración en Tiempo Real con NASA DONKI
* **Detección Automática de Clima Espacial**: Conexión periódica (cada 60 segundos) con la API oficial de **NASA DONKI** (*Database of Notifications, Knowledge, and Information*).
* **Análisis de Partículas Energéticas Solares (SEP) & Flujo de Protones**:
  * `🛡️ Nominal / Seguro (< 10 pfu)`: Actividades físicas y caminatas espaciales (EVA) permitidas.
  * `🟡 Precaución (10 - 1000 pfu)`: Perturbaciones geomagnéticas moderadas.
  * `☢️ ¡PELIGROSO! (> 1000 pfu)`: Alerta roja automática en Star Helpy, banner superior de emergencia, bloqueo de EVA y orden de resguardo en compartimento blindado.

---

### 5. 📄 Reporte Médico de Vuelo (*Flight Surgeon Briefing*)
* **Documento Clínico Oficial**: Generación instantánea de informe médico espacial para el Cirujano de Vuelo (*Flight Surgeon*).
* **Métricas Fisiológicas vs Línea Base Terrestre**:
  * Frecuencia Cardíaca, Presión Arterial, Saturación SpO2, Variabilidad HRV.
  * Masa Muscular Magra y Densidad Mineral Ósea (Z-Score).
  * Nivel de Adherencia al Ejercicio físico (ARED / CEVIS / T2).
  * Exposición radiológica acumulada e índice RBE.
* **Firma Digital Criptográfica**: Código de verificación SHA-256 generado con la fecha y Sol de la misión.
* **Exportable e Imprimible**: Estilizado mediante `@media print` para exportación directa a PDF limpio.

---

### 6. 🏆 Gamificación de Hábitos & Racha Física (Estilo Duolingo)
* **Arquetipos de Entrenamiento Físico**:
  * *Chris Bumstead (CBUM)*: Hipertrofia y preservación de masa muscular magra.
  * *Eliud Kipchoge*: Resistencia aeróbica y capacidad cardiovascular (VO2 Max).
  * *Scott Kelly*: Densidad ósea, resistencia musculoesquelética y longevidad en microgravedad.
* **Entornos & Destinos Configurables**:
  * Estación Espacial Internacional (LEO - Órbita Baja Terrestre).
  * Lunar Gateway (Órbita Cislunar).
  * Base Artemisa (Superficie Lunar).
  * Misión Tripulada a Marte (Tránsito Interplanetario y Superficie Marciana).
* **Sistema de Rachas, Puntos XP y Cofre de Recompensas**.

---

### 7. 🩺 Mapa Anatómico Corporal Interactivo (SVG Vectorial)
* Mapa corporal segmentado en regiones clave: **Cabeza & Cuello**, **Tórax & Corazón**, **Abdomen**, **Brazos & Cintura Escapular**, **Piernas & Muslo (Sóleos/Gastrocnemios)**.
* Coloración dinámica por z-score biológico personal con acceso directo a diagnósticos específicos.

---

## 🛠️ Arquitectura y Tecnologías

| Componente | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Framework Web** | [Angular 19](https://angular.dev/) | Arquitectura Standalone, reactividad sin zone.js (`Signals`), renderizado ultrarrápido |
| **Gráficos 3D** | [Three.js](https://threejs.org/) | Renderizado WebGL de estructuras corticales, partículas sinápticas y nodos cerebrales |
| **Lenguaje** | [TypeScript 5.5+](https://www.typescriptlang.org/) | Tipado estricto para telemetría, z-scores, casos clínicos y modelos de datos |
| **Estilos & UI** | SCSS Moderno | Diseño aeroespacial inspirado en interfaces NASA/SpaceX, Glassmorphism y temas adaptativos |
| **Telemetría Espacial**| NASA DONKI API | Monitoreo continuo de eventos solares, CMEs, llamaradas solares y flujo de radiación |
| **Visualización** | SVG Nativo & Canvas | Hipnograma de 8 horas, mascota interactiva y mapa anatómico corporal |

---

## 📂 Estructura del Proyecto

```text
astrobaseline-angular/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── badge/              # Insignias de alerta biomédica y calidad
│   │   │   ├── body-map/           # Mapa corporal vectorial SVG interactivo
│   │   │   ├── brain-3d/           # Render 3D Three.js del cerebro con zonas activas
│   │   │   ├── flight-report/      # Modal y vista imprimible del Reporte Médico
│   │   │   ├── guided-breathing/   # Orbe animado de respiración guiada 4-7-8
│   │   │   ├── mission-wizard/     # Asistente de configuración de misión y astronauta
│   │   │   ├── neuro-sleep/        # Tab de Neuro-Sueño, Hipnograma y Simulador de Casos
│   │   │   ├── realtime-bpm/       # Widget lateral de telemetría de pulso en tiempo real
│   │   │   ├── reward-streak/      # Sistema de racha estilo Duolingo y ejercicios
│   │   │   └── star-pet/           # Mascota orbital Star Helpy, auras y chat interactivo
│   │   ├── core/
│   │   │   ├── models/             # Tipado TypeScript (indicadores, zonas, radiación)
│   │   │   └── services/
│   │   │       ├── config.service.ts       # Configuración de misiones y arquetipos
│   │   │       ├── mission-state.service.ts# Estado global de telemetría y ejercicios
│   │   │       ├── nasa-donki.service.ts   # Integración con API NASA DONKI en vivo
│   │   │       ├── neuro-sleep.service.ts  # Control de casos de simulación, LPM y 3D
│   │   │       └── storage.service.ts      # Persistencia de racha y progreso
│   │   ├── app.component.ts        # Enrutador principal de pestañas y modales
│   │   ├── app.component.html      # Shell principal de la estación orbital
│   │   └── app.component.scss      # Estilos globales y navegación espacial
│   └── assets/                     # Logos, fondos de destinos espaciales y avatares
├── angular.json
├── package.json
└── tsconfig.json
```

---

## ⚡ Instalación y Puesta en Marcha

### Prerrequisitos
* [Node.js](https://nodejs.org/) v18.19.0 o superior
* [npm](https://www.npmjs.com/) v9 o superior

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/start-helpy.git
cd start-helpy/astrobaseline-angular
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Ejecutar servidor de desarrollo
```bash
npm start
```
La aplicación estará disponible de inmediato en [http://localhost:4200](http://localhost:4200).

### 4. Compilar para Producción
```bash
npm run build
```
Los artefactos estáticos optimizados se generarán en la carpeta `dist/astrobaseline-angular/browser`.

---

## 🎯 Guía Rápida de Demostración para Jueces de Hackathon

1. **Iniciar la Misión**: Haz clic en el asistente de misión para seleccionar tu destino (*ISS*, *Gateway*, *Marte*) y meta física (*CBUM*, *Kipchoge*, *Scott Kelly*).
2. **Explorar el Cerebro 3D**: Ve a la pestaña **`🧠 Neuro-Sueño 3D`**. Arrastra el cursor para rotar el cerebro.
3. **Simular Estados Neuroconductuales**: Prueba los 4 botones:
   * `🟢 Sueño Reparador`: Pulsaciones relajadas (50 LPM).
   * `🟡 Ansiedad Nocturna`: Observa el encendido ámbar de la amígdala y el cambio de expresión de Star Helpy.
   * `🟠 Pánico / Despertar`: Taquicardia aguda con activación de la ínsula.
   * `🔴 Psicosis / Confinamiento`: Alerta crítica con resplandor carmesí y advertencia en tiempo real.
4. **Probar la Contramedida 4-7-8**: Haz clic en `🫁 Iniciar Respiración 4-7-8`. Sigue la animación del orbe y observa cómo el ritmo cardíaco desciende hasta estabilizarse en ~52 LPM.
5. **Generar el Reporte Médico**: Presiona el botón azul `📄 Reporte Médico` en la esquina superior para visualizar o imprimir el informe del Cirujano de Vuelo con la telemetría completa y firma criptográfica.
6. **Interactuar con Star Helpy**: Escribe en el chat preguntas como *"¿Cómo está mi cerebro?"*, *"¿La radiación es peligrosa?"* o *"Dame ánimos"*.

---

## ⚖️ Descargo de Responsabilidad (Medical Disclaimer)

> **AVISO IMPORTANTE:** Este proyecto es un prototipo desarrollado con fines de demostración tecnológica y educativa para competencias de innovación aeroespacial. **No constituye un dispositivo médico certificado ni una herramienta de diagnóstico clínico validada**. Los umbrales y simulaciones presentados son ilustrativos y deben ser calibrados con estándares clínicos de la División de Medicina Espacial de NASA / ESA en caso de implementaciones futuras.

---

<div align="center">

Hecho con ❤️ y ciencia para el futuro de la exploración espacial humana 🚀🌌  
**Start Helpy Team — 2026**

</div>
