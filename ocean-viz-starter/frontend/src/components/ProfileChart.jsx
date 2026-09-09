import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Legend, Title,
} from "chart.js";

// Chart.js v4 requires every scale/element type used to be explicitly
// registered. CategoryScale was missing before, which is what caused
// the "category is not a registered scale" crash when the chart tried
// to use the depth values as x-axis labels.
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Title);

const API_BASE = "http://localhost:8000";

export default function ProfileChart({ floatId, onClose }) {
  const [mismatchData, setMismatchData] = useState(null);

  useEffect(() => {
    if (!floatId) return;
    setMismatchData(null); // reset while loading the new float's data
    fetch(`${API_BASE}/api/mismatch/${floatId}?threshold=1.0`)
      .then((res) => res.json())
      .then(setMismatchData)
      .catch((err) => console.error("Failed to load mismatch data:", err));
  }, [floatId]);

  if (!floatId) return null;
  if (!mismatchData) return <div style={panelStyle}>Loading {floatId}...</div>;
  if (!mismatchData.comparison || mismatchData.comparison.length === 0) {
    return (
      <div style={panelStyle}>
        <button onClick={onClose} style={closeButtonStyle}>✕</button>
        <p>No comparable model data found for this float.</p>
      </div>
    );
  }

  const depths = mismatchData.comparison.map((c) => c.depth);
  const observed = mismatchData.comparison.map((c) => c.observed_temperature);
  const modeled = mismatchData.comparison.map((c) => c.model_temperature);

  const chartData = {
    labels: depths.map((d) => `${d}m`),
    datasets: [
      {
        label: "Observed (Argo)",
        data: observed,
        borderColor: "#f1c40f",
        backgroundColor: "#f1c40f",
      },
      {
        label: "Model prediction",
        data: modeled,
        borderColor: "#3498db",
        backgroundColor: "#3498db",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: "white" } },
      title: { display: true, text: "Depth vs. Temperature (°C)", color: "white" },
    },
    scales: {
      x: {
        type: "category",
        title: { display: true, text: "Depth", color: "white" },
        ticks: { color: "white" },
      },
      y: {
        type: "linear",
        title: { display: true, text: "Temperature (°C)", color: "white" },
        ticks: { color: "white" },
      },
    },
  };

  return (
    <div style={panelStyle}>
      <button onClick={onClose} style={closeButtonStyle}>✕</button>
      <h3 style={{ marginTop: 0 }}>{floatId}</h3>

      {mismatchData.severity === "high" && (
        <div style={highAlertBannerStyle}>
          🚨 <strong>HIGH DEVIATION ALERT</strong>
          <p style={{ margin: "6px 0 0 0" }}>{mismatchData.alert_message}</p>
        </div>
      )}
      {mismatchData.severity === "moderate" && (
        <div style={moderateBannerStyle}>
          ⚠ <strong>Moderate Deviation</strong>
          <p style={{ margin: "6px 0 0 0" }}>{mismatchData.alert_message}</p>
        </div>
      )}
      {mismatchData.severity === "normal" && (
        <div style={okBannerStyle}>
          ✓ <strong>Model Verified</strong>
          <p style={{ margin: "6px 0 0 0" }}>{mismatchData.alert_message}</p>
        </div>
      )}

      <Line data={chartData} options={chartOptions} />

      {mismatchData.depths_beyond_model_coverage > 0 && (
        <p style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>
          Note: {mismatchData.depths_beyond_model_coverage} deeper reading(s)
          from this float are beyond the model data's coverage
          (0–{mismatchData.max_model_depth}m) and are not shown above.
        </p>
      )}

      <table style={tableStyle}>
        <thead>
          <tr>
            <th>Depth (m)</th>
            <th>Observed (°C)</th>
            <th>Model (°C)</th>
            <th>Diff</th>
          </tr>
        </thead>
        <tbody>
          {mismatchData.comparison.map((c, i) => (
            <tr key={i} style={c.mismatch ? { color: "#ff6b6b" } : {}}>
              <td>{c.depth}</td>
              <td>{c.observed_temperature}</td>
              <td>{c.model_temperature}</td>
              <td>{c.difference}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const panelStyle = {
  position: "absolute",
  top: 20,
  right: 20,
  width: 380,
  maxHeight: "85vh",
  overflowY: "auto",
  background: "rgba(20, 30, 40, 0.92)",
  color: "white",
  padding: "16px 20px",
  borderRadius: 10,
  fontFamily: "Arial, sans-serif",
  zIndex: 10,
};

const closeButtonStyle = {
  position: "absolute",
  top: 10,
  right: 10,
  background: "transparent",
  color: "white",
  border: "none",
  fontSize: 16,
  cursor: "pointer",
};

const mismatchBannerStyle = {
  background: "#5c1f1f",
  border: "1px solid #ff6b6b",
  padding: 10,
  borderRadius: 6,
  fontSize: 13,
  marginBottom: 12,
};

const highAlertBannerStyle = {
  background: "#5c1414",
  border: "2px solid #ff3b3b",
  padding: 12,
  borderRadius: 6,
  fontSize: 13,
  marginBottom: 12,
  animation: "none",
};

const moderateBannerStyle = {
  background: "#5c4a1f",
  border: "1px solid #ffb74d",
  padding: 10,
  borderRadius: 6,
  fontSize: 13,
  marginBottom: 12,
};

const okBannerStyle = {
  background: "#1f5c2f",
  border: "1px solid #6bff8f",
  padding: 10,
  borderRadius: 6,
  fontSize: 13,
  marginBottom: 12,
};

const tableStyle = {
  width: "100%",
  marginTop: 12,
  fontSize: 12,
  borderCollapse: "collapse",
};