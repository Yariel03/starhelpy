"""generate_data.py - datos SINTETICOS con problemas realistas para la demo:
deriva de presion, sueno bajo, huecos, error de unidad (Fahrenheit), sensor en 0,
mediciones duplicadas. Todo se rotula como SYNTHETIC."""
import numpy as np
import pandas as pd


def make_subject(sid, days=60, start="2026-03-01", drift=True, seed=1):
    rng = np.random.default_rng(seed)
    t = np.arange(days)
    d = 1.0 if drift else 0.0
    sleep = 7.0 + rng.normal(0, 0.5, days) - d * np.where((t >= 30) & (t <= 48), 1.8, 0)
    sbp = 116 + rng.normal(0, 3, days) + d * np.where(t > 25, (t - 25) * 0.5, 0)
    df = pd.DataFrame({
        "date": pd.date_range(start, periods=days, freq="D"),
        "astronaut_id": sid,
        "heart_rate": 62 + rng.normal(0, 2.5, days) + d * np.where(t > 35, (t - 35) * 0.3, 0),
        "systolic_bp": sbp,
        "diastolic_bp": 74 + rng.normal(0, 2.5, days) + (sbp - 116) * 0.5,
        "glucose": 92 + rng.normal(0, 5, days),
        "temperature": 36.6 + rng.normal(0, 0.15, days),
        "sleep_hours": sleep,
        "mood": np.clip(np.round(4 + rng.normal(0, 0.6, days) + (sleep - 7) * 0.5), 1, 5),
        "source": "SYNTHETIC",
    })
    cols = ["heart_rate", "systolic_bp", "diastolic_bp", "glucose",
            "temperature", "sleep_hours", "mood"]
    for c in cols:                                   # 8% de huecos aleatorios
        df.loc[rng.random(days) < 0.08, c] = np.nan
    if drift:
        df.loc[40:43, "glucose"] = np.nan            # bloque sin glucosa
        df.loc[days - 4:, "temperature"] = np.nan    # temperatura "vencida"
        df.loc[20, "temperature"] = 98.4             # error: Fahrenheit
        df.loc[33, "heart_rate"] = 0                 # error: sensor en 0
        df = pd.concat([df, df.iloc[[10]]], ignore_index=True)  # duplicado
    df[cols] = df[cols].round(2)
    return df


def build_all():
    return pd.concat([make_subject("A-01", drift=True, seed=1),
                      make_subject("A-02", drift=False, seed=2)], ignore_index=True)


if __name__ == "__main__":
    build_all().to_csv("data/synthetic_health.csv", index=False)
    print("Saved data/synthetic_health.csv")
