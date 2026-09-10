import {
  DashboardIcon,
  LayersIcon,
  AnalyticsIcon,
  SettingsIcon,
  WaveEmblem
} from "./Icons.jsx";

export default function LeftSidebar({ activeItem = "Dashboard", onItemSelect }) {
  const menuItems = [
    { id: "Dashboard", label: "Dashboard", icon: DashboardIcon },
    { id: "DataLayers", label: "Data Layers", icon: LayersIcon },
    { id: "Analysis", label: "Analysis", icon: AnalyticsIcon },
    { id: "Settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <aside className="left-sidebar">
      <div className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-btn ${isActive ? "active" : ""}`}
              onClick={() => onItemSelect && onItemSelect(item.id)}
              type="button"
            >
              <span className="sidebar-icon">
                <Icon size={18} />
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-wave-art">
          <WaveEmblem size={26} />
        </div>
        <p className="sidebar-branding-text">
          <em>&ldquo;Better Insights for Healthier Oceans&rdquo;</em>
        </p>
      </div>
    </aside>
  );
}
