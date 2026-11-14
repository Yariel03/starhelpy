"""data_loader.py - lee CUALQUIER base (csv/xlsx/json/sqlite), detecta columnas,
corrige unidades, descarta valores imposibles y devuelve una tabla DIARIA estandar
+ un registro de transformaciones (log) que sirve como evidencia para el jurado."""
import re
import numpy as np
import pandas as pd
from config import (INDICATORS, DATE_COL, SUBJECT_COL, DATE_SYNONYMS,
                    SUBJECT_SYNONYMS, LONG_VAR_SYNONYMS, LONG_VAL_SYNONYMS)


def _norm(s):
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


def read_table(src, table=None, sheet=0):
    """src = ruta o archivo subido. Detecta el formato por la extension."""
    name = getattr(src, "name", str(src)).lower()
    if name.endswith((".xlsx", ".xls")):
        return pd.read_excel(src, sheet_name=sheet)
    if name.endswith(".json"):
        return pd.read_json(src)
    if name.endswith((".db", ".sqlite", ".sqlite3")):
        import sqlite3
        con = sqlite3.connect(str(src))
        tables = pd.read_sql("SELECT name FROM sqlite_master WHERE type='table'", con)
        print("Tablas disponibles:", tables["name"].tolist())
        table = table or tables["name"].iloc[0]
        return pd.read_sql(f"SELECT * FROM {table}", con)
    return pd.read_csv(src, sep=None, engine="python")  # detecta , ; tab


def auto_map(columns):
    """Devuelve {nombre_estandar: columna_original} usando sinonimos."""
    norm = {c: _norm(c) for c in columns}
    used = set()

    def pick(synonyms):
        syn = {_norm(s) for s in synonyms}
        for c, n in norm.items():
            if n in syn and c not in used:
                used.add(c)
                return c
        return None

    found = {DATE_COL: pick(DATE_SYNONYMS), SUBJECT_COL: pick(SUBJECT_SYNONYMS)}
    for key, cfg in INDICATORS.items():
        found[key] = pick(cfg["synonyms"] + [key])
    return {k: v for k, v in found.items() if v}


def _long_to_wide(df, mapping, log):
    """Formato largo (fecha, sujeto, variable, valor) -> ancho (una col por indicador)."""
    vcol = next((c for c in df.columns if _norm(c) in
                 {_norm(s) for s in LONG_VAR_SYNONYMS}), None)
    valcol = next((c for c in df.columns if _norm(c) in
                   {_norm(s) for s in LONG_VAL_SYNONYMS}), None)
    if not (vcol and valcol):
        return df, mapping
    name_to_key = {}
    for key, cfg in INDICATORS.items():
        for s in cfg["synonyms"] + [key]:
            name_to_key[_norm(s)] = key
    df = df.copy()
    df["_key"] = df[vcol].map(lambda v: name_to_key.get(_norm(v)))
    df[valcol] = pd.to_numeric(df[valcol], errors="coerce")
    df = df.dropna(subset=["_key"])
    idx = [mapping[k] for k in (DATE_COL, SUBJECT_COL) if k in mapping]
    wide = df.pivot_table(index=idx, columns="_key", values=valcol,
                          aggfunc="mean").reset_index()
    wide.columns.name = None
    new_map = {k: k for k in INDICATORS if k in wide.columns}
    for k in (DATE_COL, SUBJECT_COL):
        if k in mapping:
            new_map[k] = mapping[k]
    log.append(f"Long format detected (variable='{vcol}', value='{valcol}') "
               f"-> pivoted to wide: {len(wide)} rows.")
    return wide, new_map


def standardize(raw, mapping=None, start_date="2026-01-01"):
    """Devuelve (df_diario_estandar, log). Una fila por astronauta y por dia."""
    log = []
    df = raw.copy()
    if mapping is None:
        mapping = auto_map(df.columns)
    mapping = {k: v for k, v in mapping.items() if v}
    log.append(f"Column mapping used: {mapping}")

    if not any(k in mapping for k in INDICATORS):
        df, mapping = _long_to_wide(df, mapping, log)

    inv = {v: k for k, v in mapping.items()}
    df = df.rename(columns=inv)[[c for c in inv.values()]]

    # --- Fecha -------------------------------------------------------------
    if DATE_COL not in df:
        df[DATE_COL] = pd.Timestamp(start_date) + pd.to_timedelta(np.arange(len(df)), "D")
        log.append("No date column: row order used as mission day.")
    elif pd.api.types.is_numeric_dtype(df[DATE_COL]):
        df[DATE_COL] = pd.Timestamp(start_date) + pd.to_timedelta(df[DATE_COL], "D")
        log.append("Numeric date column interpreted as mission day number.")
    else:
        df[DATE_COL] = pd.to_datetime(df[DATE_COL], errors="coerce")
        bad = int(df[DATE_COL].isna().sum())
        if bad:
            log.append(f"{bad} rows dropped: unreadable date.")
            df = df.dropna(subset=[DATE_COL])
    if SUBJECT_COL not in df:
        df[SUBJECT_COL] = "A-01"
        log.append("No subject column: single astronaut 'A-01' assumed.")
    df[SUBJECT_COL] = df[SUBJECT_COL].astype(str)

    # --- Numericos, unidades y plausibilidad ------------------------------
    for key, cfg in INDICATORS.items():
        if key not in df:
            df[key] = np.nan
            log.append(f"Indicator '{key}' not in dataset -> shown as 'No data'.")
            continue
        before = df[key].notna().sum()
        df[key] = pd.to_numeric(df[key], errors="coerce")
        lost = int(before - df[key].notna().sum())
        if lost:
            log.append(f"{key}: {lost} non-numeric values set to missing.")

    f = df["temperature"] > 45                      # Fahrenheit -> Celsius
    if f.any():
        df.loc[f, "temperature"] = (df.loc[f, "temperature"] - 32) * 5 / 9
        log.append(f"temperature: {int(f.sum())} values looked like Fahrenheit -> C.")
    g = (df["glucose"] > 0) & (df["glucose"] < 30)  # mmol/L -> mg/dL
    if g.any():
        df.loc[g, "glucose"] = df.loc[g, "glucose"] * 18.016
        log.append(f"glucose: {int(g.sum())} values looked like mmol/L -> mg/dL.")
    if df["sleep_hours"].median() > 24:             # minutos -> horas
        df["sleep_hours"] = df["sleep_hours"] / 60
        log.append("sleep_hours: median > 24, interpreted as minutes -> hours.")

    for key, cfg in INDICATORS.items():
        bad = (df[key] < cfg["plaus_low"]) | (df[key] > cfg["plaus_high"])
        if bad.any():
            df.loc[bad, key] = np.nan
            log.append(f"{key}: {int(bad.sum())} implausible values discarded "
                       f"(outside {cfg['plaus_low']}-{cfg['plaus_high']}).")

    # --- Agregado diario + calendario completo (los huecos quedan visibles) -
    df[DATE_COL] = df[DATE_COL].dt.normalize()
    n0 = len(df)
    daily = df.groupby([SUBJECT_COL, DATE_COL], as_index=False)[list(INDICATORS)].mean()
    log.append(f"Daily aggregation (mean per day): {n0} rows -> {len(daily)} rows.")
    out = []
    for sid, g in daily.groupby(SUBJECT_COL):
        idx = pd.date_range(g[DATE_COL].min(), g[DATE_COL].max(), freq="D")
        g = g.set_index(DATE_COL).drop(columns=SUBJECT_COL).reindex(idx)
        g.index.name = DATE_COL
        g[SUBJECT_COL] = sid
        out.append(g.reset_index())
    clean = pd.concat(out, ignore_index=True)
    log.append(f"Full daily calendar built: {len(clean)} rows, "
               f"{clean[SUBJECT_COL].nunique()} astronaut(s).")
    return clean, log
