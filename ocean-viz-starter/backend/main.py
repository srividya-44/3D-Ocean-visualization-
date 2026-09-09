"""
main.py

FastAPI server. Loads the preprocessed JSON once at startup (fast),
then serves it to the React/CesiumJS frontend on request.

Run:
    uvicorn main:app --reload --port 8000

Then visit http://localhost:8000/docs for interactive API docs.
"""

import json
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

app = FastAPI(title="OceanScope3D API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

with open("data_processed/model_grid.json") as f:
    MODEL_DATA = json.load(f)

with open("data_processed/argo_profiles.json") as f:
    ARGO_DATA = json.load(f)

with open("data_processed/meta.json") as f:
    META = json.load(f)

# The deepest depth level actually present in the downloaded model data.
# Beyond this, we have NO real model data -- comparing an Argo reading
# from e.g. 800m against the deepest available model layer (e.g. 205m)
# would silently repeat the same stale value and produce a misleading
# "mismatch" that isn't really about model accuracy, just missing data.
MAX_MODEL_DEPTH = max((r["depth"] for r in MODEL_DATA), default=0)


@app.get("/api/meta")
def get_meta():
    return META


@app.get("/api/temperature")
def get_temperature(time: str = Query(...), depth: float = Query(...)):
    results = [
        r for r in MODEL_DATA
        if r["time"] == time and abs(r["depth"] - depth) < 1e-6
    ]
    if not results:
        raise HTTPException(status_code=404, detail="No data for that time/depth")
    return results


@app.get("/api/argo")
def get_argo_floats():
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
    profile = [r for r in ARGO_DATA if r["float_id"] == float_id]
    if not profile:
        raise HTTPException(status_code=404, detail="Float not found")
    return sorted(profile, key=lambda r: r["depth"])


def _nearest_model_value(lat: float, lon: float, depth: float, time: str) -> Optional[dict]:
    """
    Find the closest model grid point to a given (lat, lon, depth, time).

    Returns None if `depth` is beyond the deepest level our downloaded
    model data actually covers (MAX_MODEL_DEPTH) -- rather than silently
    matching against the deepest available layer, which would produce a
    misleading flat/repeated comparison value.
    """
    if not MODEL_DATA or depth > MAX_MODEL_DEPTH:
        return None

    available_times = sorted(set(r["time"] for r in MODEL_DATA))
    if time in available_times:
        nearest_time = time
    else:
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

    For every depth in this float's profile that falls WITHIN the range
    our model data actually covers, compare its observed temperature
    against the nearest model-predicted temperature at the same
    depth/time, and flag disagreements beyond `threshold` degrees.

    Also classifies overall SEVERITY so a forecaster gets an immediate
    verdict, not just a table of numbers:
        normal   -> max deviation < threshold
        moderate -> max deviation between threshold and 2x threshold
        high     -> max deviation >= 2x threshold (flagged as an alert --
                    this magnitude of model/observation disagreement is
                    the kind of thing that would prompt a forecaster to
                    manually double check the forecast before relying on it)
    """
    profile = [r for r in ARGO_DATA if r["float_id"] == float_id]
    if not profile:
        raise HTTPException(status_code=404, detail="Float not found")

    comparison = []
    beyond_model_range = 0

    for obs in profile:
        if obs["depth"] > MAX_MODEL_DEPTH:
            beyond_model_range += 1
            continue

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

    max_abs_diff = max((abs(c["difference"]) for c in comparison), default=0.0)

    if max_abs_diff >= 2 * threshold:
        severity = "high"
        alert_message = (
            f"ALERT: observed and modeled temperature disagree by up to "
            f"{max_abs_diff}\u00b0C at this location -- a deviation this large "
            f"means the model forecast at this point should not be relied on "
            f"without manual review. Recommend flagging for forecaster attention."
        )
    elif max_abs_diff >= threshold:
        severity = "moderate"
        alert_message = (
            f"Moderate deviation detected (up to {max_abs_diff}\u00b0C). "
            f"Model is broadly reliable here but showing some drift -- "
            f"worth monitoring, not yet a critical concern."
        )
    else:
        severity = "normal"
        alert_message = (
            f"Model and observation agree closely (max deviation "
            f"{max_abs_diff}\u00b0C). Forecast can be trusted at this location."
        )

    return {
        "float_id": float_id,
        "threshold": threshold,
        "max_model_depth": MAX_MODEL_DEPTH,
        "comparison": comparison,
        "any_mismatch": any(c["mismatch"] for c in comparison),
        "depths_beyond_model_coverage": beyond_model_range,
        "max_abs_diff": max_abs_diff,
        "severity": severity,
        "alert_message": alert_message,
    }


@app.get("/")
def root():
    return {"status": "ok", "message": "OceanScope3D API is running. See /docs for endpoints."}