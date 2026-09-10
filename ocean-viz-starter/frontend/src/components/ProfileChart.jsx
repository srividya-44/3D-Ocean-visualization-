import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Title);

const API_BASE = import.meta.env.VITE_API_BASE;

export default function ProfileChart({ floatId, onClose }) {
  const [mismatchData, setMismatchData] = useState(null);

  useEffect(() => {
    if (!floatId) return;
    setMismatchData(null);
    fetch(`${API_BASE}/api/mismatch/${floatId}?threshold=1.0`)
      .then((res) => res.json())
      .then(setMismatchData)
      .catch((err) => console.error("Failed to load mismatch data:", err));
  }, [floatId]);

  if (!floatId) return null;

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-btn" title="Close" type="button">
          ✕
        </button>

        <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 18, color: "#00D2FF" }}>
          Argo Float: {floatId}
        </h3>

        {!mismatchData ? (
          <p style={{ color: "rgba(255,255,255,0.7)" }}>Loading float profile comparison...</p>
        ) : !mismatchData.comparison || mismatchData.comparison.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.7)" }}>No comparable model data found for this float.</p>
        ) : (
          <>
            {mismatchData.severity === "high" && (
              <div style={alertHighStyle}>
                🚨 <strong>HIGH DEVIATION ALERT</strong>
                <p style={{ margin: "6px 0 0 0", fontSize: 12 }}>{mismatchData.alert_message}</p>
              </div>
            )}
            {mismatchData.severity === "moderate" && (
              <div style={alertModerateStyle}>
                ⚠️ <strong>Moderate Deviation</strong>
                <p style={{ margin: "6px 0 0 0", fontSize: 12 }}>{mismatchData.alert_message}</p>
              </div>
            )}
            {mismatchData.severity === "normal" && (
              <div style={alertOkStyle}>
                ✓ <strong>Model Verified</strong>
                <p style={{ margin: "6px 0 0 0", fontSize: 12 }}>{mismatchData.alert_message}</p>
              </div>
            )}

            <div style={{ marginTop: 14, marginBottom: 14 }}>
              <Line
                data={{
                  labels: mismatchData.comparison.map((c) => `${c.depth}m`),
                  datasets: [
                    {
                      label: "Observed (Argo)",
                      data: mismatchData.comparison.map((c) => c.observed_temperature),
                      borderColor: "#00D2FF",
                      backgroundColor: "#00D2FF",
                      borderWidth: 2,
                      pointRadius: 3,
                    },
                    {
                      label: "Model Prediction",
                      data: mismatchData.comparison.map((c) => c.model_temperature),
                      borderColor: "#1E88E5",
                      backgroundColor: "#1E88E5",
                      borderWidth: 2,
                      borderDash: [4, 4],
                      pointRadius: 3,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { labels: { color: "#FFFFFF", font: { family: "Inter" } } },
                    title: {
                      display: true,
                      text: "Depth vs. Temperature (°C)",
                      color: "#FFFFFF",
                      font: { family: "Inter", size: 13, weight: "600" },
                    },
                  },
                  scales: {
                    x: {
                      title: { display: true, text: "Depth (m)", color: "rgba(255,255,255,0.7)" },
                      ticks: { color: "rgba(255,255,255,0.7)", font: { size: 11 } },
                      grid: { color: "rgba(255,255,255,0.06)" },
                    },
                    y: {
                      title: { display: true, text: "Temperature (°C)", color: "rgba(255,255,255,0.7)" },
                      ticks: { color: "rgba(255,255,255,0.7)", font: { size: 11 } },
                      grid: { color: "rgba(255,255,255,0.06)" },
                    },
                  },
                }}
              />
            </div>

            <table style={tableStyle}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.15)", textAlign: "left" }}>
                  <th style={{ padding: "6px 8px" }}>Depth (m)</th>
                  <th style={{ padding: "6px 8px" }}>Observed (°C)</th>
                  <th style={{ padding: "6px 8px" }}>Model (°C)</th>
                  <th style={{ padding: "6px 8px" }}>Diff</th>
                </tr>
              </thead>
              <tbody>
                {mismatchData.comparison.map((c, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      color: c.mismatch ? "#FF5252" : "inherit",
                    }}
                  >
                    <td style={{ padding: "6px 8px" }}>{c.depth}</td>
                    <td style={{ padding: "6px 8px" }}>{c.observed_temperature}</td>
                    <td style={{ padding: "6px 8px" }}>{c.model_temperature}</td>
                    <td style={{ padding: "6px 8px", fontWeight: "600" }}>{c.difference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

const alertHighStyle = {
  background: "rgba(255, 82, 82, 0.15)",
  border: "1px solid #FF5252",
  padding: "10px 14px",
  borderRadius: 8,
  fontSize: 13,
  marginBottom: 10,
};

const alertModerateStyle = {
  background: "rgba(255, 183, 77, 0.15)",
  border: "1px solid #FFB74D",
  padding: "10px 14px",
  borderRadius: 8,
  fontSize: 13,
  marginBottom: 10,
};

const alertOkStyle = {
  background: "rgba(0, 230, 118, 0.15)",
  border: "1px solid #00E676",
  padding: "10px 14px",
  borderRadius: 8,
  fontSize: 13,
  marginBottom: 10,
};

const tableStyle = {
  width: "100%",
  marginTop: 12,
  fontSize: 12,
  borderCollapse: "collapse",
};