"""config.py - TODO lo que cambia segun la base de datos del hackathon vive aqui.
Si el dataset trae otras columnas, unidades o rangos, solo editas este archivo."""

APP_NAME = "AstroBaseline"
TAGLINE = "Personal-baseline health monitoring for long-duration missions"

# Nombres ESTANDAR que usa todo el codigo (no los cambies; cambia SYNONYMS)
DATE_COL = "date"
SUBJECT_COL = "astronaut_id"

DATE_SYNONYMS = ["date", "fecha", "day", "timestamp", "time", "datetime",
                 "fechahora", "missionday", "dia", "sol"]
SUBJECT_SYNONYMS = ["astronautid", "astronaut", "subject", "subjectid", "crew",
                    "crewmember", "participant", "patient", "userid", "user", "id"]
# Por si la base viene en formato LARGO (una fila por medicion):
LONG_VAR_SYNONYMS = ["variable", "metric", "measurement", "indicator",
                     "parameter", "test", "tipo", "type"]
LONG_VAL_SYNONYMS = ["value", "valor", "result", "reading", "measure"]

# ---------------------------------------------------------------------------
# INDICADORES. Rangos = valores DEMOSTRATIVOS, NO clinicos (documentalo asi).
#   ref_low/ref_high   -> rango de referencia (fuera = "Attention")
#   hard_low/hard_high -> limite duro (fuera = "Alert")
#   plaus_low/high     -> fisicamente posible (fuera = error de sensor -> se descarta)
#   min_sigma          -> variacion minima para la linea base (evita falsas alarmas)
# ---------------------------------------------------------------------------
INDICATORS = {
    "heart_rate": dict(
        label="Resting heart rate", unit="bpm",
        ref_low=50, ref_high=100, hard_low=40, hard_high=120,
        plaus_low=20, plaus_high=250, min_sigma=2.0, region="chest",
        hazard="Gravity fields (fluid shifts, cardiovascular deconditioning); stress",
        why="Fluid shifts and cardiovascular deconditioning in microgravity, plus "
            "stress and sleep loss, can change resting heart rate.",
        how="Wearable or manual pulse at rest (seated, 5 min).",
        attention="Rest, hydrate, repeat in 10 min; review sleep and stress.",
        alert="Repeat the measurement; if confirmed, follow the onboard medical "
              "procedure and notify the flight surgeon.",
        synonyms=["hr", "heartrate", "pulse", "bpm", "fc", "frecuenciacardiaca",
                  "pulso", "heart_rate_bpm"]),
    "systolic_bp": dict(
        label="Systolic blood pressure", unit="mmHg",
        ref_low=90, ref_high=130, hard_low=80, hard_high=160,
        plaus_low=60, plaus_high=260, min_sigma=4.0, region="chest",
        hazard="Gravity fields (fluid shifts); space radiation (cardiovascular risk)",
        why="Altered gravity shifts body fluids and changes blood-pressure "
            "regulation; radiation is studied for long-term cardiovascular risk.",
        how="Automatic cuff, seated and rested, same arm and time of day.",
        attention="Repeat after 10 min of rest; reduce salt/caffeine; log it.",
        alert="Repeat; if confirmed, follow onboard procedure and notify the "
              "flight surgeon.",
        synonyms=["sbp", "systolic", "sys", "bpsys", "presionsistolica",
                  "systolicbloodpressure", "ps"]),
    "diastolic_bp": dict(
        label="Diastolic blood pressure", unit="mmHg",
        ref_low=60, ref_high=85, hard_low=50, hard_high=100,
        plaus_low=30, plaus_high=160, min_sigma=3.0, region="chest",
        hazard="Gravity fields (fluid shifts); space radiation (cardiovascular risk)",
        why="Same mechanism as systolic pressure; both are read together.",
        how="Same cuff reading as systolic.",
        attention="Repeat after 10 min of rest; log it.",
        alert="Repeat; if confirmed, follow onboard procedure and notify the "
              "flight surgeon.",
        synonyms=["dbp", "diastolic", "dia", "bpdia", "presiondiastolica",
                  "diastolicbloodpressure", "pd"]),
    "glucose": dict(
        label="Blood glucose", unit="mg/dL",
        ref_low=70, ref_high=110, hard_low=60, hard_high=180,
        plaus_low=20, plaus_high=600, min_sigma=5.0, region="abdomen",
        hazard="Hostile closed environment (diet, stress); reduced activity",
        why="Diet changes, stress and reduced physical load can alter glucose "
            "metabolism; it is studied in spaceflight research.",
        how="Fingertip glucometer, fasting, same time each day.",
        attention="Review meals and exercise; repeat measurement fasting.",
        alert="Repeat; if confirmed, follow onboard procedure and notify the "
              "flight surgeon.",
        synonyms=["glucose", "glucosa", "bloodsugar", "bg", "glu", "glycemia",
                  "glicemia", "bloodglucose"]),
    "temperature": dict(
        label="Body temperature", unit="C",
        ref_low=36.0, ref_high=37.5, hard_low=35.0, hard_high=38.5,
        plaus_low=30, plaus_high=43, min_sigma=0.2, region="arms",
        hazard="Hostile closed environment (infection risk, thermal load); "
               "immune changes",
        why="Spaceflight alters immune function and closed habitats favour "
            "infection spread; habitat heat load also matters.",
        how="Non-contact or oral thermometer, same time each day.",
        attention="Hydrate, check habitat temperature, repeat in 30 min.",
        alert="Isolate if possible, repeat, follow onboard procedure and notify "
              "the flight surgeon.",
        synonyms=["temp", "bodytemp", "bodytemperature", "temperatura", "tempc",
                  "temperature_c", "temperaturec"]),
    "sleep_hours": dict(
        label="Sleep duration", unit="h",
        ref_low=6.0, ref_high=10.0, hard_low=4.5, hard_high=None,
        plaus_low=0, plaus_high=24, min_sigma=0.5, region="head",
        hazard="Isolation and confinement; circadian disruption; workload",
        why="Light cycles (about 16 sunrises per day on the ISS), noise, workload "
            "and isolation reduce sleep.",
        how="Wearable sleep tracker or the crew sleep log.",
        attention="Protect the sleep window; reduce light/noise; review workload.",
        alert="Report fatigue risk to the flight surgeon; request schedule relief.",
        synonyms=["sleep", "sleeptime", "sleepduration", "sueno", "horassueno",
                  "sleephours", "hoursofsleep", "totalsleep"]),
    "mood": dict(
        label="Mood (1-5)", unit="score",
        ref_low=3, ref_high=None, hard_low=2, hard_high=None,
        plaus_low=1, plaus_high=5, min_sigma=0.5, region="head",
        hazard="Isolation and confinement; distance from Earth",
        why="Isolation, confinement and distance from Earth affect behavioral "
            "health. Self-reported scale: 1 = very low, 5 = very good.",
        how="Daily self-report (1-5) in under 10 seconds.",
        attention="Schedule a call with family/crew, review rest and workload.",
        alert="Request a behavioral-health check-in with the flight surgeon.",
        synonyms=["mood", "animo", "estadoanimo", "wellbeing", "mentalstate",
                  "moodscore"]),
}

# Regiones del cuerpo para el mapa corporal
REGIONS = {
    "head": dict(label="Brain and behavior", indicators=["sleep_hours", "mood"],
                 note="Behavioral health and sleep."),
    "chest": dict(label="Cardiovascular system",
                  indicators=["heart_rate", "systolic_bp", "diastolic_bp"],
                  note="Heart and circulation."),
    "abdomen": dict(label="Metabolism", indicators=["glucose"],
                    note="Glucose and nutrition."),
    "arms": dict(label="Thermoregulation and immune response (whole body)",
                 indicators=["temperature"],
                 note="Temperature as a proxy for infection or heat load."),
    "legs": dict(label="Musculoskeletal system", indicators=[],
                 note="Bone density loss is a key spaceflight risk, but it needs "
                      "imaging (e.g. DXA or ultrasound). Not simulated here: "
                      "future work."),
}

# Colores / etiquetas de estado
STATUS = {-1: ("No data", "#757575"), 0: ("Normal", "#2e7d32"),
          1: ("Attention", "#f9a825"), 2: ("Alert", "#c62828")}

# Entornos: la autonomia cambia segun el retraso de comunicacion
ENVIRONMENTS = {
    "Space station (low Earth orbit)": dict(
        delay="< 1 s, near-continuous contact", autonomy="Low",
        routine="Routine: keep daily measurements; ground can review in real time.",
        attention="Real-time support: send the data to the flight surgeon at the "
                  "next contact window and apply the suggested action.",
        alert="Contact the flight surgeon NOW (real-time support available)."),
    "Moon base / lunar surface": dict(
        delay="about 1.3 s one way", autonomy="Medium",
        routine="Routine: keep daily measurements; ground can review quickly.",
        attention="Near-real-time support: apply the suggested action and send "
                  "the data package to the flight surgeon.",
        alert="Contact the flight surgeon now; apply first aid guidance while "
              "waiting for the reply (small delay)."),
    "Mars transit / surface": dict(
        delay="about 3 to 22 min one way, plus blackouts (solar conjunction)",
        autonomy="High",
        routine="Routine: the crew self-assesses; data is stored and sent "
                "asynchronously.",
        attention="Delayed support: follow the onboard guidance first, log the "
                  "trend, and send an asynchronous report to the flight surgeon.",
        alert="Delayed support: start the onboard emergency procedure first, "
              "then send the report and data package; do not wait for the reply."),
}
