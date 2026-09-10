import { useState } from "react";
import { SettingsIcon, ThermometerIcon, LayersIcon, ReticleIcon } from "./Icons.jsx";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function SettingsView({
  threshold = 1.0,
  onThresholdChange,
  depthExaggeration = 50,
  onDepthExaggerationChange,
  tempUnit = "C",
  onTempUnitChange,
  depthUnit = "m",
  onDepthUnitChange,
  onResetDefaults,
}) {
  const [testStatus, setTestStatus] = useState("Connected (200 OK)");
  const [testing, setTesting] = useState(false);

  const testApiConnection = () => {
    setTesting(true);
    fetch(`${API_BASE}/api/meta`)
      .then((res) => {
        if (res.ok) {
          setTestStatus(`Operational (${res.status} OK)`);
        } else {
          setTestStatus(`Warning (${res.status})`);
        }
        setTesting(false);
      })
      .catch(() => {
        setTestStatus("Failed to connect");
        setTesting(false);
      });
  };

  return (
    <div className="settings-view-container">
      {/* Header */}
      <div className="settings-header">
        <div className="settings-title-group">
          <div className="settings-icon-badge">
            <SettingsIcon size={22} />
          </div>
          <div>
            <h2>Application Settings &amp; Model Thresholds</h2>
            <p>Customize analytical tolerance thresholds, 3D vertical geometry, and measurement units.</p>
          </div>
        </div>

        <button type="button" className="glass-btn-secondary" onClick={onResetDefaults}>
          Reset to Defaults
        </button>
      </div>

      {/* Settings Grid */}
      <div className="settings-content-grid">
        {/* Card 1: Mismatch Sensitivity & Severity Threshold */}
        <div className="settings-card">
          <div className="settings-card-title">
            <ReticleIcon size={18} />
            <h3>Observation Mismatch Threshold</h3>
          </div>
          <p className="settings-card-desc">
            Defines the temperature deviation tolerance (&plusmn;°C) before an Argo reading is flagged as a model forecast divergence.
          </p>

          <div className="slider-config-group">
            <div className="slider-config-header">
              <span>Tolerance Threshold</span>
              <strong className="accent-text">&plusmn;{threshold.toFixed(1)} °C</strong>
            </div>
            <input
              type="range"
              className="custom-range-slider"
              min={0.5}
              max={2.5}
              step={0.1}
              value={threshold}
              onChange={(e) => onThresholdChange(Number(e.target.value))}
            />
            <div className="threshold-scales">
              <span>0.5 °C (Strict)</span>
              <span>1.0 °C (Standard)</span>
              <span>2.5 °C (Permissive)</span>
            </div>
          </div>

          <div className="threshold-explanation">
            <div className="severity-row">
              <span className="badge-normal">Normal</span>
              <span>Diff &lt; {threshold.toFixed(1)} °C — Forecast verified and trusted</span>
            </div>
            <div className="severity-row">
              <span className="badge-moderate">Moderate</span>
              <span>Diff between {threshold.toFixed(1)} °C and {(threshold * 2).toFixed(1)} °C — Monitor drift</span>
            </div>
            <div className="severity-row">
              <span className="badge-high">High Alert</span>
              <span>Diff &ge; {(threshold * 2).toFixed(1)} °C — Requires manual review</span>
            </div>
          </div>
        </div>

        {/* Card 2: 3D Visualization & Vertical Exaggeration */}
        <div className="settings-card">
          <div className="settings-card-title">
            <LayersIcon size={18} />
            <h3>3D Vertical Depth Exaggeration</h3>
          </div>
          <p className="settings-card-desc">
            Because oceans are horizontally broad but vertically shallow, scaling depth levels emphasizes vertical thermoclines and bathymetric gradients.
          </p>

          <div className="slider-config-group">
            <div className="slider-config-header">
              <span>Vertical Depth Multiplier</span>
              <strong className="accent-text">{depthExaggeration}x</strong>
            </div>
            <input
              type="range"
              className="custom-range-slider"
              min={10}
              max={100}
              step={5}
              value={depthExaggeration}
              onChange={(e) => onDepthExaggerationChange(Number(e.target.value))}
            />
            <div className="threshold-scales">
              <span>10x (True scale)</span>
              <span>50x (Default)</span>
              <span>100x (Deep relief)</span>
            </div>
          </div>

          <div className="unit-selection-group">
            <h4>Measurement Units</h4>
            <div className="unit-buttons-row">
              <div className="unit-group">
                <label>Temperature:</label>
                <div className="segmented-btn-group">
                  <button
                    type="button"
                    className={tempUnit === "C" ? "active" : ""}
                    onClick={() => onTempUnitChange("C")}
                  >
                    °C (Celsius)
                  </button>
                  <button
                    type="button"
                    className={tempUnit === "F" ? "active" : ""}
                    onClick={() => onTempUnitChange("F")}
                  >
                    °F (Fahrenheit)
                  </button>
                </div>
              </div>

              <div className="unit-group">
                <label>Depth:</label>
                <div className="segmented-btn-group">
                  <button
                    type="button"
                    className={depthUnit === "m" ? "active" : ""}
                    onClick={() => onDepthUnitChange("m")}
                  >
                    Meters (m)
                  </button>
                  <button
                    type="button"
                    className={depthUnit === "ft" ? "active" : ""}
                    onClick={() => onDepthUnitChange("ft")}
                  >
                    Feet (ft)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Backend API Connectivity & Diagnostics */}
        <div className="settings-card full-width">
          <div className="settings-card-title">
            <ThermometerIcon size={18} />
            <h3>System Status &amp; Backend Telemetry</h3>
          </div>

          <div className="api-status-row">
            <div className="api-endpoint-info">
              <span className="api-label">OceanScope3D FastAPI Service:</span>
              <code className="api-url">{API_BASE}</code>
            </div>

            <div className="api-ping-group">
              <span className="status-indicator-dot online" />
              <span className="api-status-text">{testStatus}</span>
              <button
                type="button"
                className="glass-btn-sm"
                onClick={testApiConnection}
                disabled={testing}
              >
                {testing ? "Testing..." : "Ping Service"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
