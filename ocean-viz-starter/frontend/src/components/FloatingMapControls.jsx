import { ZoomInIcon, ZoomOutIcon, TargetIcon } from "./Icons.jsx";

export default function FloatingMapControls({ onZoomIn, onZoomOut, onResetView }) {
  return (
    <div className="floating-controls-stack" aria-label="Map Navigation Controls">
      <button
        type="button"
        className="map-ctrl-btn"
        onClick={onZoomIn}
        title="Zoom In"
      >
        <ZoomInIcon size={16} />
      </button>
      <button
        type="button"
        className="map-ctrl-btn"
        onClick={onZoomOut}
        title="Zoom Out"
      >
        <ZoomOutIcon size={16} />
      </button>
      <button
        type="button"
        className="map-ctrl-btn"
        onClick={onResetView}
        title="Center / Reset View"
      >
        <TargetIcon size={16} />
      </button>
    </div>
  );
}
