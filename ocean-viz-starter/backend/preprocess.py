"""
preprocess.py

Converts the raw scientific files (NetCDF model output + Argo/glider CSV)
into lightweight, web-ready JSON files.

--- v3: adds a sanity-range filter to catch land/placeholder points that
slip past the NaN check (some real-world NetCDF files mark land with a
fill value like -32767 or 0 instead of a clean NaN) ---

Input  (from data_raw/):
    data_raw/model_output.nc   (from Copernicus Marine `subset` command)
    data_raw/argo_floats.csv   (from INCOIS ERDDAP)

Output (consumed by main.py / the frontend):
    data_processed/model_grid.json
    data_processed/argo_profiles.json
    data_processed/meta.json

Run:
    python preprocess.py
"""

import xarray as xr
import pandas as pd
import json
import os

os.makedirs("data_processed", exist_ok=True)

# ---------------------------------------------------------------
# 1. MODEL OUTPUT: NetCDF -> JSON
# ---------------------------------------------------------------
ds = xr.open_dataset("data_raw/model_output.nc")

TEMP_VAR = "thetao"
SAL_VAR = "so"
LAT_DIM = "latitude"
LON_DIM = "longitude"
DEPTH_DIM = "depth"
TIME_DIM = "time"

# Real-world sanity bounds -- anything outside these is almost certainly
# a land/fill-value point, not a real ocean reading, regardless of
# whether it was properly marked as NaN in the file.
TEMP_MIN, TEMP_MAX = -3.0, 40.0
SAL_MIN, SAL_MAX = 2.0, 45.0

model_records = []
times = ds[TIME_DIM].values
depths = ds[DEPTH_DIM].values
lats = ds[LAT_DIM].values
lons = ds[LON_DIM].values

STEP = 6  # downsample the lat/lon grid for a lighter, faster-rendering JSON

skipped = 0
for ti, t in enumerate(times):
    t_str = pd.to_datetime(t).strftime("%Y-%m-%d")
    for di, d in enumerate(depths):
        temp_slice = ds[TEMP_VAR].isel({TIME_DIM: ti, DEPTH_DIM: di}).values
        sal_slice = ds[SAL_VAR].isel({TIME_DIM: ti, DEPTH_DIM: di}).values
        for lai in range(0, len(lats), STEP):
            for loi in range(0, len(lons), STEP):
                temp_val = temp_slice[lai, loi]
                sal_val = sal_slice[lai, loi]

                if pd.isna(temp_val) or pd.isna(sal_val):
                    skipped += 1
                    continue
                if not (TEMP_MIN <= temp_val <= TEMP_MAX):
                    skipped += 1
                    continue
                if not (SAL_MIN <= sal_val <= SAL_MAX):
                    skipped += 1
                    continue

                model_records.append({
                    "time": t_str,
                    "depth": round(float(d), 1),
                    "lat": round(float(lats[lai]), 3),
                    "lon": round(float(lons[loi]), 3),
                    "temperature": round(float(temp_val), 2),
                    "salinity": round(float(sal_val), 2),
                })

with open("data_processed/model_grid.json", "w") as f:
    json.dump(model_records, f)
print(f"Wrote data_processed/model_grid.json ({len(model_records)} grid points, {skipped} land/invalid points skipped)")

ds.close()

# ---------------------------------------------------------------
# 2. ARGO / GLIDER: CSV -> JSON
# ---------------------------------------------------------------
argo_df = pd.read_csv("data_raw/argo_floats.csv", skiprows=[1])

argo_df = argo_df.rename(columns={
    "PLATFORM_NUMBER": "float_id",
    "latitude": "lat",
    "longitude": "lon",
    "PRES": "depth",
    "TEMP": "temperature",
    "PSAL": "salinity",
    "time": "time",
})

needed_cols = ["float_id", "lat", "lon", "depth", "temperature", "salinity", "time"]
argo_df = argo_df[[c for c in needed_cols if c in argo_df.columns]].dropna(
    subset=["temperature", "salinity", "depth"]
)

argo_df["time"] = pd.to_datetime(argo_df["time"]).dt.strftime("%Y-%m-%d")
argo_df["float_id"] = argo_df["float_id"].astype(str)

argo_records = argo_df.to_dict(orient="records")

with open("data_processed/argo_profiles.json", "w") as f:
    json.dump(argo_records, f)
print(f"Wrote data_processed/argo_profiles.json ({len(argo_records)} observation points)")

# ---------------------------------------------------------------
# 3. META
# ---------------------------------------------------------------
meta = {
    "times": sorted(set(r["time"] for r in model_records)),
    "depths": sorted(set(r["depth"] for r in model_records)),
    "lat_range": [float(lats.min()), float(lats.max())],
    "lon_range": [float(lons.min()), float(lons.max())],
}
with open("data_processed/meta.json", "w") as f:
    json.dump(meta, f)
print("Wrote data_processed/meta.json")

print("\nPreprocessing complete.")