import { WaveEmblem, InfoIcon } from "./Icons.jsx";

export default function AboutModal({ onClose }) {
  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-btn" title="Close" type="button">
          ✕
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div className="nav-logo-icon">
            <WaveEmblem size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: "#FFFFFF" }}>OceanScope3D</h3>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              Interactive 3D Ocean Circulation &amp; In-Situ Observation Platform
            </span>
          </div>
        </div>

        <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
          <strong>OceanScope3D</strong> bridges high-resolution numerical ocean model forecasts with live
          autonomous Argo profiling floats across the Indian Ocean basin. Forecasters and marine scientists
          can explore vertical thermoclines, detect model discrepancies in real-time, and analyze
          spatial temperature and salinity gradients in full 3D.
        </p>

        <div style={{ marginTop: 20 }}>
          <h4 style={{ fontSize: 14, color: "#00D2FF", marginBottom: 8 }}>Primary Data Streams</h4>
          <ul style={{ paddingLeft: 18, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>
            <li>
              <strong>Mercator Ocean / Copernicus (CMEMS)</strong>: 3D hydrodynamic model grid covering surface down to 186.1m depth.
            </li>
            <li>
              <strong>Global Argo Float Telemetry</strong>: Real-time autonomous CTD profiling floats recording depth-indexed temperature and practical salinity (PSU).
            </li>
            <li>
              <strong>Cesium Ion 3D Globe</strong>: Hardware-accelerated WebGL geospatial rendering engine.
            </li>
          </ul>
        </div>

        <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>
            &ldquo;Better Insights for Healthier Oceans&rdquo; &mdash; Version 0.2.0
          </p>
        </div>
      </div>
    </div>
  );
}
