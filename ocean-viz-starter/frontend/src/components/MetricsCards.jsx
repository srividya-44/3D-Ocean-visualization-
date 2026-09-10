import { ThermometerIcon, DropletIcon, DepthIcon, GridIcon } from "./Icons.jsx";

export default function MetricsCards({
  avgTemperature = "28.7 °C",
  tempDiffTag = "↑ +0.6 °C vs. previous period",
  avgSalinity = "34.1 PSU",
  salinityDiffTag = "↑ +0.2 PSU vs. previous period",
  maxDepth = "186.1 m",
  maxDepthSubtext = "at selected point",
  gridPoints = "2,500",
  gridPointsSubtext = "Total data points"
}) {
  return (
    <div className="metrics-row">
      {/* Card 1: Avg Temperature */}
      <div className="metric-card">
        <div className="metric-top">
          <span className="metric-label">Avg. Temperature</span>
          <div className="metric-icon-wrap">
            <ThermometerIcon size={16} />
          </div>
        </div>
        <div className="metric-value">{avgTemperature}</div>
        <div className="metric-tag">{tempDiffTag}</div>
      </div>

      {/* Card 2: Avg Salinity */}
      <div className="metric-card">
        <div className="metric-top">
          <span className="metric-label">Avg. Salinity</span>
          <div className="metric-icon-wrap">
            <DropletIcon size={16} />
          </div>
        </div>
        <div className="metric-value">{avgSalinity}</div>
        <div className="metric-tag">{salinityDiffTag}</div>
      </div>

      {/* Card 3: Max Depth */}
      <div className="metric-card">
        <div className="metric-top">
          <span className="metric-label">Max Depth</span>
          <div className="metric-icon-wrap">
            <DepthIcon size={16} />
          </div>
        </div>
        <div className="metric-value">{maxDepth}</div>
        <div className="metric-subtext">{maxDepthSubtext}</div>
      </div>

      {/* Card 4: Grid Points */}
      <div className="metric-card">
        <div className="metric-top">
          <span className="metric-label">Grid Points</span>
          <div className="metric-icon-wrap">
            <GridIcon size={16} />
          </div>
        </div>
        <div className="metric-value">{gridPoints}</div>
        <div className="metric-subtext">{gridPointsSubtext}</div>
      </div>
    </div>
  );
}
