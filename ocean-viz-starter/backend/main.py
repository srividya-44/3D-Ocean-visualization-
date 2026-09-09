"""
main.py

FastAPI server. Loads the preprocessed JSON once at startup (fast),
then serves it to the React/CesiumJS frontend on request.

Run:
    uvicorn main:app --reload --port 8000

Then visit http://localhost:8000/docs for interactive API docs.
"""

import json
import math
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

app = FastAPI(title="OceanScope3D API")

# Allow the React dev server (usually localhost:5173) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # for hackathon speed; restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------
# Load preprocessed data ONCE at startup
# ---------------------------------------------------------------
with open("data_processed/model_grid.json") as f:
    MODEL_DATA = json.load(f)

with open("data_processed/argo_profiles.json") as f:
    ARGO_DATA = json.load(f)

with open("data_processed/meta.json") as f:
    META = json.load(f)


@app.get("/api/meta")
def get_meta():
    """Available times/depths so the frontend can build sliders."""
    return META


@app.get("/api/temperature")
def get_temperature(time: str = Query(...), depth: float = Query(...)):
    """
    Return the model grid (temperature + salinity) for one timestep and depth.
    This is what gets drawn as the colored 3D layer in CesiumJS.
    """
    results = [
        r for r in MODEL_DATA
        if r["time"] == time and abs(r["depth"] - depth) < 1e-6
    ]
    if not results:
        raise HTTPException(status_code=404, detail="No data for that time/depth")
    return results


@app.get("/api/argo")
def get_argo_floats():
    """
    Return one entry per float (its location + first depth reading),
    so the frontend can plot markers on the globe.
    """
    seen = {}
    for r in ARGO_DATA:
        if r["float_id"] not in seen:
            seen[r["float_id"]] = {
                "float_id": r["float_id"],
                "lat": r["lat"],
                "lon": r["lon"],
                "time": r["time"],
            }
    return list(seen.values())


@app.get("/api/argo/{float_id}")
def get_argo_profile(float_id: str):
    """
    Return the FULL vertical profile for one float (every depth reading).
    Used for: (a) drawing the 3D vertical thread, (b) the Chart.js popup.
    """
    profile = [r for r in ARGO_DATA if r["float_id"] == float_id]
    if not profile:
        raise HTTPException(status_code=404, detail="Float not found")
    return sorted(profile, key=lambda r: r["depth"])


def _nearest_model_value(lat: float, lon: float, depth: float, time: str) -> Optional[dict]:
    """
    Find the closest model grid point to a given (lat, lon, depth, time).

    Real Argo depths (pressure readings) are continuous values (e.g. 5.2m,
    10.7m) that won't exactly match the model's fixed depth levels (e.g.
    0.49m, 1.54m, 2.65m...), so we match on the NEAREST depth, not an
    exact one -- standard practice when comparing gridded model output
    to point observations.

    Similarly, an Argo float's reading might be from a date the model
    snapshot doesn't have (e.g. only one model day was downloaded for
    this prototype) -- so we fall back to the NEAREST available model
    date rather than requiring an exact match.
    """
    if not MODEL_DATA:
        return None

    available_times = sorted(set(r["time"] for r in MODEL_DATA))
    if time in available_times:
        nearest_time = time
    else:
        # Pick whichever available model date is closest to the requested one
        target = pd.Timestamp(time)
        nearest_time = min(available_times, key=lambda t: abs(pd.Timestamp(t) - target))

    same_time = [r for r in MODEL_DATA if r["time"] == nearest_time]
    nearest_depth = min(same_time, key=lambda r: abs(r["depth"] - depth))["depth"]
    candidates = [r for r in same_time if r["depth"] == nearest_depth]
    best = min(candidates, key=lambda r: (r["lat"] - lat) ** 2 + (r["lon"] - lon) ** 2)
    return best


@app.get("/api/mismatch/{float_id}")
def get_mismatch(float_id: str, threshold: float = 1.0):
    """
    THE KEY DIFFERENTIATOR FEATURE.

    For every depth in this float's profile, compare its OBSERVED
    temperature against the nearest MODEL-predicted temperature at the
    same depth/time. Flag points where they disagree by more than
    `threshold` degrees.

    This is what proves real usability: a forecaster can instantly see
    where the model and reality disagree, instead of manually
    cross-checking two separate tools.
    """
    profile = [r for r in ARGO_DATA if r["float_id"] == float_id]
    if not profile:
        raise HTTPException(status_code=404, detail="Float not found")

    comparison = []
    for obs in profile:
        model_point = _nearest_model_value(obs["lat"], obs["lon"], obs["depth"], obs["time"])
        if model_point is None:
            continue
        diff = round(obs["temperature"] - model_point["temperature"], 2)
        comparison.append({
            "depth": obs["depth"],
            "observed_temperature": obs["temperature"],
            "model_temperature": model_point["temperature"],
            "difference": diff,
            "mismatch": abs(diff) > threshold,
        })

    return {
        "float_id": float_id,
        "threshold": threshold,
        "comparison": comparison,
        "any_mismatch": any(c["mismatch"] for c in comparison),
    }


@app.get("/")
def root():
    return {"status": "ok", "message": "OceanScope3D API is running. See /docs for endpoints."}