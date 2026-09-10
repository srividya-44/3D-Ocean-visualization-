import {
  ReticleIcon,
  PinIcon,
  LayersIcon,
  CalendarIcon,
  ThermometerIcon,
  DropletIcon
} from "./Icons.jsx";

export default function GridPointInspector({
  point,
  activeDepth,
  activeTime,
  activeVariable = "temperature"
}) {
  const locationText = point
    ? `${point.lat >= 0 ? point.lat.toFixed(3) + "°N" : Math.abs(point.lat).toFixed(3) + "°S"}, ${point.lon >= 0 ? point.lon.toFixed(3) + "°E" : Math.abs(point.lon).toFixed(3) + "°W"}`
    : "2.590°N, 90.000°E";

  const depthText = point
    ? `${point.depth} m`
    : (activeDepth !== undefined ? `${activeDepth} m` : "0.5 m");

  const timeText = point ? point.time : (activeTime || "2025-04-20");
  const tempText = point ? `${point.temperature.toFixed(2)} °C` : "29.85 °C";
  const salinityText = point ? `${point.salinity.toFixed(2)} PSU` : "34.23 PSU";

  const isSalinity = activeVariable === "salinity";

  return (
    <div className="inspector-card">
      <div className="inspector-header">
        <div className="inspector-header-left">
          <span className="reticle-icon">
            <ReticleIcon size={20} />
          </span>
          <h3>Model Grid Point</h3>
        </div>
        <span className="inspector-live-tag">
          {point ? "Selected" : "Sample"}
        </span>
      </div>

      <div className="inspector-list">
        <div className="inspector-row">
          <span className="inspector-key">
            <PinIcon size={15} className="inspector-row-icon" /> Location
          </span>
          <span className="inspector-val">{locationText}</span>
        </div>

        <div className="inspector-row">
          <span className="inspector-key">
            <LayersIcon size={15} className="inspector-row-icon" /> Depth
          </span>
          <span className="inspector-val">{depthText}</span>
        </div>

        <div className="inspector-row">
          <span className="inspector-key">
            <CalendarIcon size={15} className="inspector-row-icon" /> Time
          </span>
          <span className="inspector-val">{timeText}</span>
        </div>

        <div className="inspector-row">
          <span className="inspector-key">
            <ThermometerIcon size={15} className="inspector-row-icon" /> Temperature
          </span>
          <span className={`inspector-val ${!isSalinity ? "highlight" : ""}`}>{tempText}</span>
        </div>

        <div className="inspector-row">
          <span className="inspector-key">
            <DropletIcon size={15} className="inspector-row-icon" /> Salinity
          </span>
          <span className={`inspector-val ${isSalinity ? "highlight" : ""}`}>{salinityText}</span>
        </div>
      </div>

      {/* Color Scale Legend */}
      <div className="color-scale-legend">
        <div className="legend-title">
          {isSalinity ? "Data Value (Salinity PSU)" : "Data Value (Temperature °C)"}
        </div>
        <div
          className="legend-gradient-bar"
          style={{
            background: isSalinity
              ? "linear-gradient(90deg, #004D40 0%, #00B4D8 35%, #52B788 70%, #D8F3DC 100%)"
              : "linear-gradient(90deg, #1E88E5 0%, #00D2FF 25%, #00E676 50%, #FFEB3B 75%, #FF5252 100%)",
          }}
        />
        <div className="legend-ticks">
          {isSalinity ? (
            <>
              <span>33.5</span>
              <span>34.0</span>
              <span>34.5</span>
              <span>35.0</span>
              <span>35.5</span>
            </>
          ) : (
            <>
              <span>20</span>
              <span>24</span>
              <span>28</span>
              <span>32</span>
              <span>36</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
