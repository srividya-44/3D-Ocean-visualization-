import { LightbulbIcon } from "./Icons.jsx";

export default function QuickInsights({ dynamicSummary }) {
  const defaultSummary =
    "Higher temperatures are observed in the northern region, while cooler values are seen towards the southern part of the area.";

  return (
    <div className="insights-card">
      <div className="insights-header">
        <div className="insights-icon-badge">
          <LightbulbIcon size={18} />
        </div>
        <h3>Quick Insights</h3>
      </div>
      <div className="insights-body">
        {dynamicSummary || defaultSummary}
      </div>
    </div>
  );
}
