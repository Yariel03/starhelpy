"""app.py - interfaz Streamlit. Ejecutar:  streamlit run app.py"""
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st
import streamlit.components.v1 as components

import generate_data
from analysis import (baseline, recent_value, classify, data_quality,
                      overall_level, escalation_text)
from config import (APP_NAME, TAGLINE, INDICATORS, REGIONS, ENVIRONMENTS,
                    STATUS, DATE_COL, SUBJECT_COL)
from data_loader import read_table, auto_map, standardize

st.set_page_config(page_title=APP_NAME, layout="wide")


def badge(level):
    name, color = STATUS[level]
    return (f"<span style='background:{color};color:white;padding:2px 10px;"
            f"border-radius:12px;font-size:0.8rem'>{name}</span>")


def fmt(v, unit):
    return "-" if pd.isna(v) else f"{v:.1f} {unit}"


def body_svg(colors):
    c = colors
    st_ = "stroke='#222' stroke-width='2'"
    return f"""
<svg viewBox="0 0 200 410" width="210" height="420" xmlns="http://www.w3.org/2000/svg">
 <circle cx="100" cy="45" r="30" fill="{c['head']}" {st_}/>
 <rect x="60" y="85" width="80" height="70" rx="18" fill="{c['chest']}" {st_}/>
 <rect x="68" y="158" width="64" height="60" rx="14" fill="{c['abdomen']}" {st_}/>
 <rect x="22" y="90" width="30" height="125" rx="14" fill="{c['arms']}" {st_}/>
 <rect x="148" y="90" width="30" height="125" rx="14" fill="{c['arms']}" {st_}/>
 <rect x="70" y="222" width="26" height="170" rx="12" fill="{c['legs']}" {st_}/>
 <rect x="104" y="222" width="26" height="170" rx="12" fill="{c['legs']}" {st_}/>
</svg>"""


@st.cache_data
def demo_data():
    return standardize(generate_data.build_all())


# ----------------------------- SIDEBAR ------------------------------------
st.sidebar.title(APP_NAME)
st.sidebar.caption(TAGLINE)
source = st.sidebar.radio("Data source", ["Synthetic demo", "Upload file"])

if source == "Synthetic demo":
    data, log = demo_data()
else:
    up = st.sidebar.file_uploader("CSV / XLSX / JSON", type=["csv", "xlsx", "json"])
    if up is None:
        st.info("Upload the dataset provided at the hackathon, or switch to the demo.")
        st.stop()
    raw = read_table(up)
    guess = auto_map(raw.columns)
    with st.sidebar.expander("Column mapping (fix it if wrong)", expanded=True):
        options = ["(none)"] + list(raw.columns)
        mapping = {}
        for std in [DATE_COL, SUBJECT_COL] + list(INDICATORS):
            default = guess.get(std)
            i = options.index(default) if default in options else 0
            choice = st.selectbox(std, options, index=i, key="map_" + std)
            if choice != "(none)":
                mapping[std] = choice
    data, log = standardize(raw, mapping)

sid = st.sidebar.selectbox("Astronaut", sorted(data[SUBJECT_COL].unique()))
env = st.sidebar.selectbox("Environment", list(ENVIRONMENTS))
n_days = st.sidebar.slider("Baseline window (days)", 7, 30, 14)

full = data[data[SUBJECT_COL] == sid].sort_values(DATE_COL)
dates = full[DATE_COL].dt.date.tolist()
current = st.sidebar.select_slider("Mission date", options=dates, value=dates[-1])
mission_day = dates.index(current) + 1
sub = full.set_index(DATE_COL)
sub = sub[sub.index <= pd.Timestamp(current)]

# ----------------------------- CALCULOS -----------------------------------
results = {}
for key, cfg in INDICATORS.items():
    s = sub[key]
    med, sig = baseline(s, n_days, cfg["min_sigma"])
    res = classify(key, recent_value(s), med, sig)
    res.update(baseline=med, sigma=sig, quality=data_quality(s))
    results[key] = res
overall = overall_level(results)

# ----------------------------- CABECERA -----------------------------------
st.title(f"{APP_NAME} - Astronaut {sid}, mission day {mission_day}")
st.warning("Prototype with SYNTHETIC or demo data. Not a medical device, not a "
           "diagnosis, no clinical validation. Thresholds are demonstrative.")

tab1, tab2, tab3, tab4, tab5 = st.tabs(
    ["Dashboard", "Trends", "Body map", "Data quality", "Method and limits"])

# ----------------------------- TAB 1: PANEL -------------------------------
with tab1:
    a, b = st.columns([1, 2])
    with a:
        st.markdown("**Overall status**")
        st.markdown(badge(overall), unsafe_allow_html=True)
        e = ENVIRONMENTS[env]
        st.caption(f"Environment: {env} | delay: {e['delay']} | "
                   f"crew autonomy: {e['autonomy']}")
    with b:
        st.info(escalation_text(env, overall))
        due = [INDICATORS[k]["label"] for k, r in results.items()
               if r["quality"]["flag"] != "OK"
               and (pd.isna(r["quality"]["days_since"]) or r["quality"]["days_since"] >= 1)]
        if due:
            st.error("Measurements due / data problems: " + ", ".join(due))
    cols = st.columns(4)
    for i, (key, cfg) in enumerate(INDICATORS.items()):
        r = results[key]
        with cols[i % 4]:
            st.metric(cfg["label"], fmt(r["recent"], cfg["unit"]),
                      delta=None if pd.isna(r["z"]) else f"{r['z']:+.1f} sigma vs baseline",
                      delta_color="off")
            st.markdown(badge(r["level"]), unsafe_allow_html=True)
            with st.expander("Why / what to do"):
                st.write("**Why it matters:** " + cfg["why"])
                st.write("**How to measure:** " + cfg["how"])
                st.write("**Hazard:** " + cfg["hazard"])
                if r["reasons"]:
                    st.write("**Flags:** " + "; ".join(r["reasons"]))
                if r["level"] == 1:
                    st.write("**Action:** " + cfg["attention"])
                if r["level"] == 2:
                    st.write("**Action:** " + cfg["alert"])

# ----------------------------- TAB 2: TENDENCIAS --------------------------
with tab2:
    key = st.selectbox("Indicator", list(INDICATORS),
                       format_func=lambda k: INDICATORS[k]["label"])
    cfg, r, s = INDICATORS[key], results[key], sub[key]
    fig = go.Figure()
    lo = cfg["ref_low"] if cfg["ref_low"] is not None else float(np.nanmin(s)) - 1
    hi = cfg["ref_high"] if cfg["ref_high"] is not None else float(np.nanmax(s)) + 1
    fig.add_hrect(y0=lo, y1=hi, fillcolor="green", opacity=0.08, line_width=0,
                  annotation_text="reference range")
    if not pd.isna(r["baseline"]):
        fig.add_hrect(y0=r["baseline"] - 2 * r["sigma"], y1=r["baseline"] + 2 * r["sigma"],
                      fillcolor="blue", opacity=0.10, line_width=0,
                      annotation_text="personal baseline +/- 2 sigma")
        fig.add_hline(y=r["baseline"], line_dash="dash", line_color="blue")
    fig.add_trace(go.Scatter(x=s.index, y=s.values, mode="lines+markers",
                             name=cfg["label"], connectgaps=False))
    miss = s[s.isna()].index
    if len(miss):
        fig.add_trace(go.Scatter(x=miss, y=[float(np.nanmin(s))] * len(miss),
                                 mode="markers", marker_symbol="x",
                                 marker_color="red", name="Missing measurement"))
    fig.update_layout(yaxis_title=f"{cfg['label']} ({cfg['unit']})", height=450)
    st.plotly_chart(fig, use_container_width=True)

# ----------------------------- TAB 3: CUERPO ------------------------------
with tab3:
    colors = {}
    for reg, info in REGIONS.items():
        lv = overall_level({k: results[k] for k in info["indicators"]}) if info["indicators"] else -1
        colors[reg] = STATUS[lv][1]
    c1, c2 = st.columns([1, 2])
    with c1:
        components.html(body_svg(colors), height=430)
    with c2:
        reg = st.radio("Select a body region", list(REGIONS), horizontal=True,
                       format_func=lambda k: k.capitalize())
        info = REGIONS[reg]
        st.subheader(info["label"])
        st.write(info["note"])
        for k in info["indicators"]:
            r, cfg = results[k], INDICATORS[k]
            st.markdown(f"**{cfg['label']}**: {fmt(r['recent'], cfg['unit'])} "
                        + badge(r["level"]), unsafe_allow_html=True)
            st.caption(cfg["why"])

# ----------------------------- TAB 4: CALIDAD -----------------------------
with tab4:
    rows = []
    for k, cfg in INDICATORS.items():
        q = results[k]["quality"]
        rows.append({"Indicator": cfg["label"], "Quality score": q["score"],
                     "Coverage (7 d)": f"{q['completeness']:.0%}",
                     "Days since last": q["days_since"], "Flag": q["flag"]})
    st.dataframe(pd.DataFrame(rows), use_container_width=True)
    present = sub[list(INDICATORS)].notna().astype(int).T
    fig = go.Figure(go.Heatmap(z=present.values, x=present.columns,
                               y=[INDICATORS[k]["label"] for k in present.index],
                               colorscale=[[0, "#c62828"], [1, "#2e7d32"]],
                               showscale=False))
    fig.update_layout(title="Measurements present (green) vs missing (red)", height=360)
    st.plotly_chart(fig, use_container_width=True)

# ----------------------------- TAB 5: METODO ------------------------------
with tab5:
    st.markdown("""
**Method.** For each astronaut we compute a personal baseline (median and robust
sigma of the first N days). Status combines (1) reference ranges and (2) deviation
from the personal baseline, using the mean of the last 3 days. Data quality = 60%
coverage + 40% recency over 7 days.

**Limits.** Synthetic/demo data; demonstrative thresholds; no clinical validation;
not a diagnosis. Bone density needs imaging and is not simulated.

**NASA sources.** (Fill in: resource name, URL, access date, terms of use.)

**AI disclosure.** (Fill in: tools used, where and for what.)
""")
    st.subheader("Thresholds used")
    st.dataframe(pd.DataFrame([
        {"Indicator": c["label"], "Unit": c["unit"], "Ref low": c["ref_low"],
         "Ref high": c["ref_high"], "Hard low": c["hard_low"], "Hard high": c["hard_high"]}
        for c in INDICATORS.values()]), use_container_width=True)
    st.subheader("Transformation log (evidence)")
    for line in log:
        st.write("- " + line)
