export default function GridPointInfo({ point, onClose }) {
  if (!point) return null;

  return (
    <div style={panelStyle}>
      <button onClick={onClose} style={closeButtonStyle}>✕</button>
      <h4 style={{ marginTop: 0, marginBottom: 10 }}>Model Grid Point</h4>
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td>Location</td>
            <td>{point.lat.toFixed(3)}°N, {point.lon.toFixed(3)}°E</td>
          </tr>
          <tr>
            <td>Depth</td>
            <td>{point.depth} m</td>
          </tr>
          <tr>
            <td>Time</td>
            <td>{point.time}</td>
          </tr>
          <tr>
            <td>Temperature</td>
            <td><strong>{point.temperature} °C</strong></td>
          </tr>
          <tr>
            <td>Salinity</td>
            <td><strong>{point.salinity} PSU</strong></td>
          </tr>
        </tbody>
      </table>
      {/* <p style={noteStyle}>
        Note: chlorophyll is not included in this prototype's downloaded
        dataset, but the pipeline supports it the same way as temperature
        and salinity if that variable is added to the model download.
      </p> */}
    </div>
  );
}

const panelStyle = {
  position: "absolute",
  bottom: 20,
  right: 20,
  width: 300,
  background: "rgba(20, 30, 40, 0.92)",
  color: "white",
  padding: "14px 18px",
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

const tableStyle = {
  width: "100%",
  fontSize: 13,
  borderCollapse: "collapse",
};

const noteStyle = {
  fontSize: 10,
  color: "#aaa",
  marginTop: 10,
  marginBottom: 0,
};