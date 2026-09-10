import { PinIcon, CalendarIcon, LayersIcon, MapIcon } from "./Icons.jsx";

export default function HeaderCard({
  coverage = "Indian Ocean Region",
  timeRange = "2025-04-20",
  depthRange = "0.5 m – 186.1 m"
}) {
  return (
    <div className="header-card">
      <div className="header-card-left">
        <div className="header-icon-badge">
          <MapIcon size={20} />
        </div>
        <div className="header-texts">
          <h2>Ocean Visualization</h2>
          <p>Explore ocean data in 3D and analyze spatial patterns across regions.</p>
        </div>
      </div>

      <div className="header-card-right">
        <div className="meta-pill" title="Total Geographic Coverage">
          <span className="meta-pill-icon"><PinIcon size={14} /></span>
          <span className="meta-pill-label">Total Coverage:</span>
          <span className="meta-pill-val">{coverage}</span>
        </div>

        <div className="meta-pill" title="Observation Time Range">
          <span className="meta-pill-icon"><CalendarIcon size={14} /></span>
          <span className="meta-pill-label">Time Range:</span>
          <span className="meta-pill-val">{timeRange}</span>
        </div>

        <div className="meta-pill" title="Model Depth Range">
          <span className="meta-pill-icon"><LayersIcon size={14} /></span>
          <span className="meta-pill-label">Depth Range:</span>
          <span className="meta-pill-val">{depthRange}</span>
        </div>
      </div>
    </div>
  );
}
