import { useEffect, useState } from "react";
import Globe from "./components/Globe.jsx";
import Sliders from "./components/Sliders.jsx";
import ProfileChart from "./components/ProfileChart.jsx";
import GridPointInfo from "./components/GridPointInfo.jsx";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function App() {
  const [meta, setMeta] = useState(null);
  const [timeIndex, setTimeIndex] = useState(0);
  const [depthIndex, setDepthIndex] = useState(0);
  const [selectedFloat, setSelectedFloat] = useState(null);
  const [selectedGridPoint, setSelectedGridPoint] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/meta`)
      .then((res) => res.json())
      .then(setMeta)
      .catch((err) => console.error("Failed to load meta:", err));
  }, []);

  if (!meta) {
    return <div style={loadingStyle}>Loading OceanScope3D…</div>;
  }

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div style={titleStyle}>
        <strong>OceanScope3D</strong> — Web-Based 3D Ocean Visualization
      </div>

      <Globe
        time={meta.times[timeIndex]}
        depth={meta.depths[depthIndex]}
        onFloatClick={(floatId) => {
          setSelectedFloat(floatId);
          setSelectedGridPoint(null); // don't show both popups at once
        }}
        onGridClick={(point) => {
          setSelectedGridPoint(point);
          setSelectedFloat(null);
        }}
      />

      <Sliders
        times={meta.times}
        depths={meta.depths}
        timeIndex={timeIndex}
        depthIndex={depthIndex}
        onTimeChange={setTimeIndex}
        onDepthChange={setDepthIndex}
      />

      <ProfileChart
        floatId={selectedFloat}
        onClose={() => setSelectedFloat(null)}
      />

      <GridPointInfo
        point={selectedGridPoint}
        onClose={() => setSelectedGridPoint(null)}
      />
    </div>
  );
}

const loadingStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  fontFamily: "Arial, sans-serif",
  fontSize: 18,
};

const titleStyle = {
  position: "absolute",
  top: 20,
  left: 20,
  color: "white",
  background: "rgba(20, 30, 40, 0.85)",
  padding: "8px 16px",
  borderRadius: 8,
  fontFamily: "Arial, sans-serif",
  zIndex: 10,
};