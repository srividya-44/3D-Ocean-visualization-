# OceanScope3D — Starter Project

A working prototype skeleton for: **web-based interactive 3D visualization
of ocean model outputs + in-situ (Argo/Glider) observations.**

This gets your team from zero to a running demo, then you customize it
with real INCOIS data.

---

## 1. Architecture

```
┌───────────────────────┐         ┌──────────────────────────┐
│   RAW SCIENTIFIC DATA │         │                            │
│  model_output.nc      │         │                            │
│  argo_floats.csv      │         │                            │
└──────────┬────────────┘         │                            │
           │  preprocess.py       │                            │
           │  (xarray, pandas)    │                            │
           ▼                      │                            │
┌───────────────────────┐         │                            │
│  PROCESSED JSON        │        │                            │
│  model_grid.json       │        │                            │
│  argo_profiles.json    │        │                            │
│  meta.json             │        │                            │
└──────────┬─────────────┘        │                            │
           │                      │                            │
           ▼                      │                            │
┌───────────────────────┐  HTTP   │      ┌─────────────────┐   │
│   FASTAPI BACKEND      │◄────────────── │  REACT FRONTEND │   │
│   main.py              │  JSON   │      │  (Vite)         │   │
│  /api/temperature      │────────►│      │                 │   │
│  /api/argo             │         │      │  Globe.jsx      │   │
│  /api/argo/{id}        │         │      │   (CesiumJS)    │   │
│  /api/mismatch/{id}    │         │      │  Sliders.jsx    │   │
└───────────────────────┘         │      │  ProfileChart.jsx│  │
                                   │      │   (Chart.js)     │  │
                                   │      └─────────────────┘   │
                                   └────────────────────────────┘
```

**Flow:** raw files → preprocessed once into JSON → FastAPI serves JSON on
request → React/CesiumJS renders the 3D scene and fetches new data whenever
sliders change → clicking an Argo float triggers the mismatch-detection
endpoint and shows the Chart.js popup.

---

## 2. Folder structure

```
ocean-viz-starter/
├── README.md
├── backend/
│   ├── requirements.txt
│   ├── generate_sample_data.py   # makes fake NetCDF + Argo CSV for testing
│   ├── preprocess.py             # NetCDF/CSV -> JSON
│   ├── main.py                   # FastAPI server
│   ├── data_raw/                 # created by generate_sample_data.py
│   └── data_processed/           # created by preprocess.py
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        └── components/
            ├── Globe.jsx          # CesiumJS 3D scene
            ├── Sliders.jsx        # time/depth controls
            └── ProfileChart.jsx   # Chart.js popup + mismatch flags
```

---

## 3. Step-by-step: first run (with fake sample data)

Do this FIRST, before plugging in real INCOIS data — it proves the whole
pipeline works end-to-end.

### A. Backend setup

```bash
cd ocean-viz-starter/backend

# create an isolated Python environment (recommended)
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install -r requirements.txt

# Step 1: generate fake NetCDF + Argo CSV
python generate_sample_data.py

# Step 2: convert them into web-ready JSON
python preprocess.py

# Step 3: start the API server
uvicorn main:app --reload --port 8000
```

Leave this running. Visit **http://localhost:8000/docs** — you should see
the interactive API docs and be able to test each endpoint.

### B. Frontend setup (in a NEW terminal)

```bash
cd ocean-viz-starter/frontend

npm install
npm run dev
```

Visit **http://localhost:5173** — you should see a 3D globe centered on
the Bay of Bengal with:
- A colored layer of "temperature" boxes at the selected depth/time
- Yellow vertical threads = Argo/glider floats
- Sliders (bottom-left) to change time and depth
- Click a yellow float → popup chart (top-right) comparing observed vs.
  model temperature, with a red warning banner if they disagree

If you see this working, **the entire pipeline is proven** — data ingestion,
API, 3D rendering, and the mismatch-detection differentiator all work
together.

---

## 4. Step-by-step: switching to REAL INCOIS data

1. Get a real NetCDF file from INCOIS (or a public source like Copernicus
   Marine / NOAA for testing) and a real Argo/glider text file.
2. Put them in `backend/data_raw/`, replacing the fake ones — but check
   the **variable and dimension names** in your real file first:
   ```bash
   python3 -c "import xarray as xr; ds = xr.open_dataset('data_raw/model_output.nc'); print(ds)"
   ```
   Real INCOIS files may name things differently (e.g. `TEMP` instead of
   `temperature`, or `LATITUDE` instead of `lat`). Update the variable
   names in `preprocess.py` to match.
3. Do the same check for the Argo CSV/ASCII columns and adjust
   `preprocess.py`'s CSV-reading section if the column names differ.
4. Re-run `python preprocess.py`, restart `uvicorn`, refresh the frontend.
   No other code should need to change.

---

## 5. Team role mapping (6 members)

| Files you own | Role |
|---|---|
| `generate_sample_data.py`, `preprocess.py` | Data Team (2 people) — adapt these to real INCOIS file formats |
| `main.py` | Backend/API (1 person) — add endpoints as needed (e.g. currents) |
| `Globe.jsx` | Frontend/3D (2 people) — this is the visual core, most important file |
| `Sliders.jsx`, `ProfileChart.jsx`, `App.jsx` | Frontend/UX + integration (1 person) — wiring, polish, demo flow |

---

## 6. Build order (don't skip ahead)

1. ✅ Run the fake-data pipeline above and confirm it works
2. Swap in real NetCDF/Argo data, fix variable names in `preprocess.py`
3. Confirm the 3D layer + Argo threads still render correctly
4. Confirm the mismatch popup still works with real data
5. Only then: polish visuals, add current vectors, improve color scale,
   add more depth/time steps

---

## 7. Common issues

- **CORS error in browser console** → make sure `main.py` is running and
  `allow_origins=["*"]` is still in place (already set in the starter code).
- **CesiumJS shows a blank grey screen** → check the browser console; most
  often it's a missing `cesium()` plugin in `vite.config.js`, or the app
  wasn't restarted after `npm install`.
- **"No data for that time/depth" error** → the `time` string sent by the
  frontend must exactly match the string format in `meta.json` (e.g.
  `"2026-09-01"`). Check with `/api/meta` in the browser.
- **Real NetCDF file won't open** → run the inspection command in step 4
  above; almost always it's a variable-naming mismatch, not a real bug.
