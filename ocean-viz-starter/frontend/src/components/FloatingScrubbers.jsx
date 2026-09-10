import { CalendarIcon, LayersIcon } from "./Icons.jsx";

export default function FloatingScrubbers({
  times = [],
  depths = [],
  timeIndex = 0,
  depthIndex = 0,
  onTimeChange,
  onDepthChange
}) {
  const currentTime = times[timeIndex] || "2025-04-20";
  const currentDepth = depths[depthIndex] !== undefined ? `${depths[depthIndex]} m` : "0.5 m";

  return (
    <div className="floating-scrubbers-card">
      <div className="scrubber-group">
        <div className="scrubber-header">
          <span className="scrubber-title">
            <CalendarIcon size={14} /> Time
          </span>
          <span className="scrubber-badge">{currentTime}</span>
        </div>
        <input
          type="range"
          className="custom-range-slider"
          min={0}
          max={Math.max(0, times.length - 1)}
          value={timeIndex}
          onChange={(e) => onTimeChange(Number(e.target.value))}
          aria-label="Time Scrubber"
        />
      </div>

      <div className="scrubber-group">
        <div className="scrubber-header">
          <span className="scrubber-title">
            <LayersIcon size={14} /> Depth
          </span>
          <span className="scrubber-badge">{currentDepth}</span>
        </div>
        <input
          type="range"
          className="custom-range-slider"
          min={0}
          max={Math.max(0, depths.length - 1)}
          value={depthIndex}
          onChange={(e) => onDepthChange(Number(e.target.value))}
          aria-label="Depth Scrubber"
        />
      </div>
    </div>
  );
}
