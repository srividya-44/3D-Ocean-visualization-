# 🌊 OceanScope3D — Interactive 3D Ocean Visualization & Validation Platform

A web-based 3D visualization and validation application for ocean numerical model outputs (NetCDF) and in-situ oceanographic observations (Argo floats and gliders), focused on the Indian Ocean region.

---

## 🚀 Key Features

- **Interactive 3D Globe Visualization**: Powered by CesiumJS, displaying volumetric 3D grid voxels of ocean parameters (temperature, salinity) across depth levels and time steps.
- **In-Situ Argo Float Overlay & Validation**: Visualizes Argo float trajectories, vertical profiling threads, and depth profile comparisons.
- **Automated Mismatch & Alert System**: Detects significant discrepancies between numerical model forecasts and physical float observations, categorizing severity into `normal`, `moderate`, and `high` alerts.
- **Interactive Multi-View Interface**:
  - **Dashboard**: Live 3D globe with interactive floating scrubbers (time & depth slider), real-time slice metrics, grid point inspector, and regional insights.
  - **Analytics**: Validation dashboard summarizing float deviations, severity distribution, and profile error graphs.
  - **Data Layers**: Toggle spatial variables (temperature/salinity), voxel sizing, and float markers.
  - **Settings**: Customizable threshold parameters, vertical depth exaggeration scale, and unit preferences (°C / °F, m / ft).
- **RESTful FastAPI Backend**: Serves processed spatial grids and observational data fast via JSON endpoints.

---

## 🏗️ Architecture & Data Flow

```
┌─────────────────────────┐         ┌──────────────────────────┐
│   RAW SCIENTIFIC DATA   │         │                          │
│  model_output.nc        │         │                          │
│  argo_floats.csv        │         │                          │
└────────────┬────────────┘         │                          │
             │  preprocess.py       │                          │
             │  (xarray, pandas)    │                          │
             ▼                      │                          │
┌─────────────────────────┐         │                          │
│   PROCESSED JSON        │         │                          │
│  model_grid.json        │         │                          │
│  argo_profiles.json     │         │                          │
│  meta.json              │         │                          │
└────────────┬────────────┘         │                          │
             │                      │                          │
             ▼                      │                          │
┌─────────────────────────┐  HTTP   │      ┌─────────────────┐ │
│   FASTAPI BACKEND       │◄───────────────│  REACT FRONTEND │ │
│   main.py (Port 8000)   │  JSON   │      │  (Vite + Port   │ │
│   /api/meta             │────────►│      │   5173)         │ │
│   /api/temperature      │         │      │  Globe.jsx      │ │
│   /api/argo             │         │      │   (CesiumJS)    │ │
│   /api/mismatch/{id}    │         │      │  ProfileChart   │ │
└─────────────────────────┘         │      │   (Chart.js)    │ │
                                    └──────────────────────────┘
```

---

## 📁 Repository Structure

```
ocean-viz-starter/
├── backend/
│   ├── main.py                   # FastAPI application & endpoints
│   ├── preprocess.py             # Data conversion (NetCDF & CSV -> JSON)
│   ├── generate_sample_data.py   # Generates sample NetCDF & Argo data
│   ├── requirements.txt          # Python dependencies
│   ├── data_raw/                 # Raw NetCDF & CSV data storage
│   └── data_processed/           # Preprocessed JSON files for API consumption
└── frontend/
    ├── package.json              # Vite & React dependencies
    ├── vite.config.js            # Vite configuration with Cesium plugin
    ├── index.html                # Entry HTML
    └── src/
        ├── App.jsx               # Main React application & state router
        ├── index.css             # Glassmorphism dark theme styles
        └── components/
            ├── Globe.jsx         # CesiumJS 3D Globe component
            ├── FloatingScrubbers.jsx # Time & depth range controls
            ├── GridPointInspector.jsx # Inspector for grid points
            ├── ProfileChart.jsx  # Argo observation comparison popup (Chart.js)
            ├── AnalyticsView.jsx # Validation analytics view
            ├── DataLayersView.jsx# Variable & visualization settings
            └── SettingsView.jsx  # System units & threshold configurations
```

---

## 🛠️ Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **Python** (3.10 or 3.11 recommended)

---

### 1. Backend Setup (FastAPI)

Navigate to the `backend` directory:
```bash
cd ocean-viz-starter/backend
```

Create and activate a Python virtual environment:
```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

*(Optional)* Generate sample data if needed:
```bash
python generate_sample_data.py
python preprocess.py
```

Start the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```

> The API server runs at **http://localhost:8000**. Interactive API documentation is available at **http://localhost:8000/docs**.

---

### 2. Frontend Setup (React + Vite + CesiumJS)

In a **new terminal window**, navigate to the `frontend` directory:
```bash
cd ocean-viz-starter/frontend
```

Install npm packages:
```bash
npm install
```

Configure Environment Variables (Optional):
Create a `.env` file in `ocean-viz-starter/frontend/` if you wish to override default endpoints or set a Cesium Ion token:
```env
VITE_API_BASE=http://localhost:8000
VITE_CESIUM_TOKEN=your_cesium_ion_access_token
```

Start the development server:
```bash
npm run dev
```

> Open your browser at **http://localhost:5173** to launch the OceanScope3D application.

---

## ⚙️ Custom Data Ingestion (INCOIS / Custom Datasets)

To replace sample data with real ocean model output (e.g., INCOIS NetCDF or Copernicus Marine) and float observations:

1. Place your NetCDF `.nc` file and float `.csv` file into `backend/data_raw/`.
2. Inspect dimension names using Xarray:
   ```bash
   python -c "import xarray as xr; ds = xr.open_dataset('data_raw/model_output.nc'); print(ds)"
   ```
3. Update variable mappings (e.g., `lat`, `lon`, `depth`, `temperature`, `salinity`) in `backend/preprocess.py` to match your dataset schema.
4. Run preprocessing:
   ```bash
   python preprocess.py
   ```
5. Restart `uvicorn` backend and reload frontend.

---

## 📄 License

This project is open-source under the MIT License.
