"""
generate_sample_data.py

Creates FAKE but realistic sample data so the team can build and test
the whole pipeline WITHOUT waiting for real INCOIS NetCDF files.

Produces:
  data_raw/model_output.nc   -> a synthetic ocean model NetCDF file
                                 (dims: time, depth, lat, lon; var: temperature, salinity)
  data_raw/argo_floats.csv   -> synthetic Argo float profile readings

Run:
    python generate_sample_data.py
"""

import numpy as np
import pandas as pd
import netCDF4 as nc
import os

os.makedirs("data_raw", exist_ok=True)

# ---------------------------------------------------------------
# 1. Synthetic ocean MODEL output (NetCDF)
# ---------------------------------------------------------------
# Cover a patch of the east coast of India (Bay of Bengal) as an example.
lats = np.linspace(10.0, 20.0, 21)          # 21 latitude points
lons = np.linspace(80.0, 90.0, 21)          # 21 longitude points
depths = np.array([0, 10, 25, 50, 100, 200, 500, 1000])  # 8 depth levels (meters)
times = pd.date_range("2026-09-01", periods=5, freq="D")  # 5 daily timesteps

n_lat, n_lon, n_depth, n_time = len(lats), len(lons), len(depths), len(times)

# Fabricate temperature: warmer near surface, cooler with depth, mild spatial variation
temperature = np.zeros((n_time, n_depth, n_lat, n_lon), dtype="f4")
salinity = np.zeros((n_time, n_depth, n_lat, n_lon), dtype="f4")

for ti in range(n_time):
    for di, d in enumerate(depths):
        base_temp = 29.0 - (d / 1000.0) * 20.0          # ~29C surface -> ~9C at 1000m
        base_sal = 34.0 + (d / 1000.0) * 1.5             # salinity increases slightly with depth
        lat_grid, lon_grid = np.meshgrid(lats, lons, indexing="ij")
        # Add a fake warm-core eddy centered near (15N, 85E) for a realistic story
        eddy = 2.5 * np.exp(-(((lat_grid - 15.0) ** 2 + (lon_grid - 85.0) ** 2) / 4.0))
        noise_t = np.random.normal(0, 0.15, size=(n_lat, n_lon))
        noise_s = np.random.normal(0, 0.05, size=(n_lat, n_lon))
        temperature[ti, di] = base_temp + eddy - ti * 0.05 + noise_t
        salinity[ti, di] = base_sal + noise_s

ds = nc.Dataset("data_raw/model_output.nc", "w", format="NETCDF4")
ds.createDimension("time", n_time)
ds.createDimension("depth", n_depth)
ds.createDimension("lat", n_lat)
ds.createDimension("lon", n_lon)

time_var = ds.createVariable("time", "f8", ("time",))
depth_var = ds.createVariable("depth", "f4", ("depth",))
lat_var = ds.createVariable("lat", "f4", ("lat",))
lon_var = ds.createVariable("lon", "f4", ("lon",))
temp_var = ds.createVariable("temperature", "f4", ("time", "depth", "lat", "lon"))
sal_var = ds.createVariable("salinity", "f4", ("time", "depth", "lat", "lon"))

time_var.units = "days since 2026-09-01"
time_var[:] = np.arange(n_time)
depth_var.units = "meters"
depth_var[:] = depths
lat_var.units = "degrees_north"
lat_var[:] = lats
lon_var.units = "degrees_east"
lon_var[:] = lons
temp_var.units = "degC"
temp_var[:] = temperature
sal_var.units = "psu"
sal_var[:] = salinity

ds.close()
print("Wrote data_raw/model_output.nc")

# ---------------------------------------------------------------
# 2. Synthetic Argo / Glider observation profiles (CSV)
# ---------------------------------------------------------------
# A handful of floats scattered in the same region, each with a vertical profile.
float_ids = ["ARGO_2901623", "ARGO_2901744", "ARGO_2902188", "GLIDER_SG512"]
float_locations = [
    (14.8, 84.7),   # sits inside the fake eddy -> good demo of mismatch/agreement
    (17.2, 88.1),
    (11.5, 81.9),
    (16.0, 86.5),
]

rows = []
for fid, (flat, flon) in zip(float_ids, float_locations):
    for d in depths:
        base_temp = 29.0 - (d / 1000.0) * 20.0
        eddy = 2.5 * np.exp(-(((flat - 15.0) ** 2 + (flon - 85.0) ** 2) / 4.0))
        # Real observation deviates slightly from the model (this is the point!)
        observed_temp = base_temp + eddy + np.random.normal(0, 0.6)
        observed_sal = 34.0 + (d / 1000.0) * 1.5 + np.random.normal(0, 0.1)
        rows.append({
            "float_id": fid,
            "lat": flat,
            "lon": flon,
            "depth": d,
            "temperature": round(float(observed_temp), 2),
            "salinity": round(float(observed_sal), 2),
            "time": "2026-09-01",
        })

df = pd.DataFrame(rows)
df.to_csv("data_raw/argo_floats.csv", index=False)
print("Wrote data_raw/argo_floats.csv")
print("\nSample data generation complete.")
