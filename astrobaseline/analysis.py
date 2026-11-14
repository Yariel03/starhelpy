"""analysis.py - linea base personal, clasificacion de estado y calidad del dato."""
import numpy as np
import pandas as pd
from config import INDICATORS, ENVIRONMENTS


def baseline(series, n_days=14, min_sigma=1.0):
    """Mediana y sigma robusta (MAD) de los primeros n_days con datos."""
    base = series.dropna().iloc[:n_days]
    if len(base) < 5:
        return np.nan, np.nan
    med = base.median()
    mad = (base - med).abs().median() * 1.4826
    return float(med), float(max(mad, min_sigma))


def recent_value(series, window=3):
    """Promedio de los ultimos `window` dias calendario (ignora huecos)."""
    last = series.index.max()
    w = series.loc[last - pd.Timedelta(days=window - 1):last]
    return float(w.mean()) if w.notna().any() else np.nan


def classify(key, recent, med, sigma):
    """level: -1 sin dato | 0 normal | 1 atencion | 2 alerta."""
    cfg = INDICATORS[key]
    if pd.isna(recent):
        return dict(level=-1, z=np.nan, recent=np.nan,
                    reasons=["No recent measurement"])
    level, reasons = 0, []
    lo, hi = cfg["ref_low"], cfg["ref_high"]
    hlo, hhi = cfg["hard_low"], cfg["hard_high"]
    if (hlo is not None and recent < hlo) or (hhi is not None and recent > hhi):
        level = 2
        reasons.append("Beyond the hard limit")
    elif (lo is not None and recent < lo) or (hi is not None and recent > hi):
        level = 1
        reasons.append("Outside the reference range")
    z = np.nan
    if not pd.isna(med):
        z = (recent - med) / sigma
        if abs(z) >= 3:
            level = max(level, 2)
            reasons.append(f"{z:+.1f} sigma from personal baseline")
        elif abs(z) >= 2:
            level = max(level, 1)
            reasons.append(f"{z:+.1f} sigma from personal baseline")
    else:
        reasons.append("Baseline not available yet (fewer than 5 readings)")
    return dict(level=level, z=z, recent=recent, reasons=reasons)


def data_quality(series, window=7):
    """Puntaje 0-100: 60% completitud (ultimos 7 dias) + 40% recencia."""
    last = series.index.max()
    w = series.loc[last - pd.Timedelta(days=window - 1):last]
    completeness = float(w.notna().mean())
    nn = series.dropna()
    if len(nn) == 0:
        return dict(score=0, completeness=0.0, days_since=np.nan, flag="No data")
    days_since = int((last - nn.index.max()).days)
    recency = max(0.0, 1 - days_since / window)
    score = round(100 * (0.6 * completeness + 0.4 * recency))
    flags = []
    if days_since >= 3:
        flags.append("Stale")
    if completeness < 0.5:
        flags.append("Low coverage")
    return dict(score=score, completeness=completeness, days_since=days_since,
                flag=", ".join(flags) if flags else "OK")


def overall_level(results):
    levels = [r["level"] for r in results.values() if r["level"] >= 0]
    return max(levels) if levels else -1


def escalation_text(env_key, level):
    env = ENVIRONMENTS[env_key]
    if level <= 0:
        return env["routine"]
    return env["attention"] if level == 1 else env["alert"]
