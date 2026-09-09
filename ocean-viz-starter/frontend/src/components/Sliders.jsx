export default function Sliders({
  times, depths,
  timeIndex, depthIndex,
  onTimeChange, onDepthChange,
}) {
  return (
    <div style={panelStyle}>
      <div style={rowStyle}>
        <label style={labelStyle}>
          Time: <strong>{times[timeIndex]}</strong>
        </label>
        <input
          type="range"
          min={0}
          max={times.length - 1}
          value={timeIndex}
          onChange={(e) => onTimeChange(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>
          Depth: <strong>{depths[depthIndex]} m</strong>
        </label>
        <input
          type="range"
          min={0}
          max={depths.length - 1}
          value={depthIndex}
          onChange={(e) => onDepthChange(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}

const panelStyle = {
  position: "absolute",
  bottom: 20,
  left: 20,
  background: "rgba(20, 30, 40, 0.85)",
  color: "white",
  padding: "14px 18px",
  borderRadius: 10,
  width: 320,
  fontFamily: "Arial, sans-serif",
  zIndex: 10,
};

const rowStyle = { marginBottom: 10 };
const labelStyle = { display: "block", marginBottom: 4, fontSize: 13 };
