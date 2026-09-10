import {
  LayersIcon,
  ThermometerIcon,
  DropletIcon,
  WaveEmblem,
  GridIcon,
  PinIcon,
} from "./Icons.jsx";

export default function DataLayersView({
  activeVariable = "temperature",
  onVariableChange,
  showArgoFloats = true,
  onToggleArgoFloats,
  showGridBoxes = true,
  onToggleGridBoxes,
  voxelScale = 1.0,
  onVoxelScaleChange,
  meta,
}) {
  const depths = meta?.depths || [];

  return (
    <div className="layers-view-container">
      {/* Header */}
      <div className="layers-header">
        <div className="layers-title-group">
          <div className="layers-icon-badge">
            <LayersIcon size={22} />
          </div>
          <div>
            <h2>Data Layers &amp; Spatial Variables</h2>
            <p>Configure active 3D oceanographic layers, parameter fields, and data assimilation streams.</p>
          </div>
        </div>
      </div>

      {/* Layer Options Grid */}
      <div className="layers-content-grid">
        {/* Card 1: Active Physical Variable */}
        <div className="layer-config-card">
          <div className="layer-card-title">
            <ThermometerIcon size={18} />
            <h3>Active Physical Variable</h3>
          </div>
          <p className="layer-card-desc">
            Select the primary scalar field mapped to the 3D voxel point cloud across depth layers.
          </p>

          <div className="variable-toggle-group">
            <button
              type="button"
              className={`variable-btn ${activeVariable === "temperature" ? "active" : ""}`}
              onClick={() => onVariableChange("temperature")}
            >
              <ThermometerIcon size={18} />
              <div>
                <strong>Sea Water Temperature</strong>
                <span>Units: °C (Range: 14.0 °C – 31.0 °C)</span>
              </div>
            </button>

            <button
              type="button"
              className={`variable-btn ${activeVariable === "salinity" ? "active" : ""}`}
              onClick={() => onVariableChange("salinity")}
            >
              <DropletIcon size={18} />
              <div>
                <strong>Sea Water Practical Salinity</strong>
                <span>Units: PSU (Range: 33.5 PSU – 35.5 PSU)</span>
              </div>
            </button>
          </div>

          <div className="colormap-preview">
            <span className="colormap-label">Colormap Gradient:</span>
            <div
              className="colormap-bar"
              style={{
                background:
                  activeVariable === "temperature"
                    ? "linear-gradient(90deg, #1E88E5 0%, #00D2FF 25%, #00E676 50%, #FFEB3B 75%, #FF5252 100%)"
                    : "linear-gradient(90deg, #004D40 0%, #00B4D8 35%, #52B788 70%, #D8F3DC 100%)",
              }}
            />
            <div className="colormap-ticks">
              <span>{activeVariable === "temperature" ? "Cold (14°C)" : "Low (33.5)"}</span>
              <span>{activeVariable === "temperature" ? "Mean (28°C)" : "Mean (34.5)"}</span>
              <span>{activeVariable === "temperature" ? "Warm (31°C)" : "High (35.5)"}</span>
            </div>
          </div>
        </div>

        {/* Card 2: 3D Visualization Overlays */}
        <div className="layer-config-card">
          <div className="layer-card-title">
            <GridIcon size={18} />
            <h3>3D Scene Overlays</h3>
          </div>
          <p className="layer-card-desc">
            Toggle visibility and scale of observation networks and numerical model cells.
          </p>

          <div className="layer-switch-list">
            <label className="toggle-row">
              <div className="toggle-text">
                <strong>Model Grid Point Cloud</strong>
                <span>Render ~2,500 ocean cells per horizontal depth slice</span>
              </div>
              <input
                type="checkbox"
                className="glass-checkbox"
                checked={showGridBoxes}
                onChange={(e) => onToggleGridBoxes(e.target.checked)}
              />
            </label>

            <label className="toggle-row">
              <div className="toggle-text">
                <strong>Argo Profiling Floats Layer</strong>
                <span>High-resolution in-situ CTD vertical profiles and tracks</span>
              </div>
              <input
                type="checkbox"
                className="glass-checkbox"
                checked={showArgoFloats}
                onChange={(e) => onToggleArgoFloats(e.target.checked)}
              />
            </label>
          </div>

          <div className="slider-config-group">
            <div className="slider-config-header">
              <span>3D Voxel Box Scale</span>
              <strong>{voxelScale.toFixed(1)}x</strong>
            </div>
            <input
              type="range"
              className="custom-range-slider"
              min={0.5}
              max={2.0}
              step={0.1}
              value={voxelScale}
              onChange={(e) => onVoxelScaleChange(Number(e.target.value))}
            />
            <span className="slider-hint">Adjust spacing and density of 3D temperature boxes.</span>
          </div>
        </div>

        {/* Card 3: Dataset Provenance & Metadata */}
        <div className="layer-config-card full-width">
          <div className="layer-card-title">
            <WaveEmblem size={18} />
            <h3>Model Grid Provenance &amp; Coverage Specifications</h3>
          </div>

          <div className="metadata-specs-grid">
            <div className="spec-item">
              <span className="spec-label">Assimilation Model</span>
              <span className="spec-value">Mercator Ocean / Copernicus (CMEMS)</span>
            </div>

            <div className="spec-item">
              <span className="spec-label">Region Bounds</span>
              <span className="spec-value">5.0°S – 25.0°N, 70.0°E – 95.0°E</span>
            </div>

            <div className="spec-item">
              <span className="spec-label">Vertical Discretization</span>
              <span className="spec-value">{depths.length} Standard Depths (0.5m – 186.1m)</span>
            </div>

            <div className="spec-item">
              <span className="spec-label">Observation Timestamp</span>
              <span className="spec-value">2025-04-20T00:00:00Z</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
