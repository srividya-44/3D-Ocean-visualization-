import { WaveEmblem } from "./Icons.jsx";

export default function TopNav({ activeTab = "Home", onTabChange }) {
  const tabs = ["Home", "Analytics", "About"];

  return (
    <header className="top-nav">
      <div className="nav-brand">
        <div className="nav-logo-icon">
          <WaveEmblem size={22} />
        </div>
        <div className="nav-titles">
          <h1 className="nav-title">OceanScope3D</h1>
          <span className="nav-subtitle">Ocean Visualization &amp; Analysis</span>
        </div>
      </div>

      <nav className="nav-pills" aria-label="Main Navigation">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`nav-pill-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => onTabChange && onTabChange(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </nav>
    </header>
  );
}
