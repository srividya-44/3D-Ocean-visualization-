import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, LineElement, PointElement,
  LinearScale, Tooltip, Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, Tooltip, Legend);

const API_BASE = "http://localhost:8000";

export default function ProfileChart({ floatId, onClose }) {
  const [mismatchData, setMismatchData] = useState(null);

  useEffect(() => {
    if (!floatId) return;
    fetch(`${API_BASE}/api/mismatch/${floatId}?threshold=1.0`)
      .then((res) => res.json())
      .then(setMismatchData)
      .catch((err) => console.error("Failed to load mismatch data:", err));
  }, [floatId]);

  if (!floatId) return null;
  if (!mismatchData) return <div style={panelStyle}>Loading {floatId}...</div>;

  const depths = mismatchData.comparison.map((c) => c.depth);
  const observed = mismatchData.comparison.map((c) => c.observed_temperature);
  const modeled = mismatchData.comparison.map((c) => c.model_temperature);

  const chartData = {
    labels: depths,
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
      title: { display: true, text: "Depth (m) vs. Temperature (°C)", color: "white" },
    },
    scales: {
      x: { title: { display: true, text: "Depth (m)", color: "white" }, ticks: { color: "white" } },
      y: { title: { display: true, text: "Temperature (°C)", color: "white" }, ticks: { color: "white" } },
    },
  };

  return (
    <div style={panelStyle}>
      <button onClick={onClose} style={closeButtonStyle}>✕</button>
      <h3 style={{ marginTop: 0 }}>{floatId}</h3>

      {mismatchData.any_mismatch ? (
        <div style={mismatchBannerStyle}>
          ⚠ Model and observation disagree by more than {mismatchData.threshold}°C
          at one or more depths — this is exactly the kind of validation gap this
          platform is built to surface immediately.
        </div>
      ) : (
        <div style={okBannerStyle}>
          ✓ Model and observation agree within {mismatchData.threshold}°C at all depths.
        </div>
      )}

      <Line data={chartData} options={chartOptions} />

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
          {mismatchData.comparison.map((c) => (
            <tr key={c.depth} style={c.mismatch ? { color: "#ff6b6b" } : {}}>
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
