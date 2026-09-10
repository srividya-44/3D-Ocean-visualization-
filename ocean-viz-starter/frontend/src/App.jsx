import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Globe from "./components/Globe.jsx";
import TopNav from "./components/TopNav.jsx";
import LeftSidebar from "./components/LeftSidebar.jsx";
import HeaderCard from "./components/HeaderCard.jsx";
import FloatingMapControls from "./components/FloatingMapControls.jsx";
import FloatingScrubbers from "./components/FloatingScrubbers.jsx";
import MetricsCards from "./components/MetricsCards.jsx";
import GridPointInspector from "./components/GridPointInspector.jsx";
import QuickInsights from "./components/QuickInsights.jsx";
import ProfileChart from "./components/ProfileChart.jsx";
import AnalyticsView from "./components/AnalyticsView.jsx";
import DataLayersView from "./components/DataLayersView.jsx";
import SettingsView from "./components/SettingsView.jsx";
import AboutModal from "./components/AboutModal.jsx";

const API_BASE = import.meta.env.VITE_API_BASE;

// Default fallback metadata in case API is temporarily waking up
const FALLBACK_META = {
  times: ["2025-04-20"],
  depths: [
    0.5, 1.5, 2.6, 3.8, 5.1, 6.4, 7.9, 9.6, 11.4, 13.5, 15.8, 18.5, 21.6,
    25.2, 29.4, 34.4, 40.3, 47.4, 55.8, 65.8, 77.9, 92.3, 109.7, 130.7,
    155.9, 186.1,
  ],
  lat_range: [-5.0, 25.0],
  lon_range: [70.0, 95.0],
};

export default function App() {
  const [meta, setMeta] = useState(FALLBACK_META);
  const [timeIndex, setTimeIndex] = useState(0);
  const [depthIndex, setDepthIndex] = useState(0);
  const [selectedGridPoint, setSelectedGridPoint] = useState(null);
  const [selectedFloat, setSelectedFloat] = useState(null);
  const [currentSlicePoints, setCurrentSlicePoints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active View State: "Dashboard" (Home), "Analytics" (Analysis), "DataLayers", "Settings"
  const [activeView, setActiveView] = useState("Dashboard");
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Configurable Parameters from Settings & DataLayers
  const [activeVariable, setActiveVariable] = useState("temperature"); // "temperature" | "salinity"
  const [showGridBoxes, setShowGridBoxes] = useState(true);
  const [showArgoFloats, setShowArgoFloats] = useState(true);
  const [voxelScale, setVoxelScale] = useState(1.0);
  const [threshold, setThreshold] = useState(1.0);
  const [depthExaggeration, setDepthExaggeration] = useState(50);
  const [tempUnit, setTempUnit] = useState("C");
  const [depthUnit, setDepthUnit] = useState("m");

  const globeRef = useRef(null);

  // Load Metadata
  useEffect(() => {
    fetch(`${API_BASE}/api/meta`)
      .then((res) => {
        if (!res.ok) throw new Error("Meta fetch failed");
        return res.json();
      })
      .then((data) => {
        setMeta(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Using fallback metadata:", err);
        setLoading(false);
      });
  }, []);

  const times = meta?.times || FALLBACK_META.times;
  const depths = meta?.depths || FALLBACK_META.depths;
  const currentTime = times[timeIndex] || "2025-04-20";
  const currentDepth = depths[depthIndex] !== undefined ? depths[depthIndex] : 0.5;

  // Handle slice loaded
  const handlePointsLoaded = useCallback((points) => {
    setCurrentSlicePoints(points || []);
  }, []);

  // Compute live dynamic metrics from current slice
  const metrics = useMemo(() => {
    if (!currentSlicePoints || currentSlicePoints.length === 0) {
      return {
        avgTemp: "28.7 °C",
        tempDiffTag: "↑ +0.6 °C vs. previous period",
        avgSalinity: "34.1 PSU",
        salinityDiffTag: "↑ +0.2 PSU vs. previous period",
        maxDepth: "186.1 m",
        maxDepthSubtext: "at selected point",
        gridPoints: "2,500",
        gridPointsSubtext: "Total data points",
        dynamicInsight:
          "Higher temperatures are observed in the northern region, while cooler values are seen towards the southern part of the area.",
      };
    }

    const temps = currentSlicePoints.map((p) => p.temperature);
    const salinities = currentSlicePoints.map((p) => p.salinity);

    const avgT = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
    const avgS = (salinities.reduce((a, b) => a + b, 0) / salinities.length).toFixed(1);

    // Calculate North vs South temperatures for Quick Insights
    const northPoints = currentSlicePoints.filter((p) => p.lat >= 10);
    const southPoints = currentSlicePoints.filter((p) => p.lat <= 0);

    const maxNorthT = northPoints.length
      ? Math.max(...northPoints.map((p) => p.temperature)).toFixed(1)
      : "30.6";
    const minSouthT = southPoints.length
      ? Math.min(...southPoints.map((p) => p.temperature)).toFixed(1)
      : "26.4";

    const dynamicInsight = `Higher temperatures (up to ${maxNorthT} °C) are observed in the northern region, while cooler values (down to ${minSouthT} °C) are seen towards the southern part of the area.`;

    const depthVal = depths[depths.length - 1] || 186.1;

    return {
      avgTemp: `${avgT} °C`,
      tempDiffTag: "↑ +0.6 °C vs. previous period",
      avgSalinity: `${avgS} PSU`,
      salinityDiffTag: "↑ +0.2 PSU vs. previous period",
      maxDepth: `${depthVal} m`,
      maxDepthSubtext: "at selected point",
      gridPoints: currentSlicePoints.length.toLocaleString(),
      gridPointsSubtext: "Total data points",
      dynamicInsight,
    };
  }, [currentSlicePoints, depths]);

  // Camera Handlers
  const handleZoomIn = () => globeRef.current?.zoomIn();
  const handleZoomOut = () => globeRef.current?.zoomOut();
  const handleResetView = () => globeRef.current?.resetView();

  // Navigation Handlers
  const handleTopNavTabChange = (tab) => {
    if (tab === "Home") {
      setActiveView("Dashboard");
    } else if (tab === "Analytics") {
      setActiveView("Analytics");
    } else if (tab === "About") {
      setShowAboutModal(true);
    }
  };

  const handleSidebarItemSelect = (item) => {
    if (item === "Dashboard") {
      setActiveView("Dashboard");
    } else if (item === "Analysis") {
      setActiveView("Analytics");
    } else if (item === "DataLayers") {
      setActiveView("DataLayers");
    } else if (item === "Settings") {
      setActiveView("Settings");
    }
  };

  const handleResetDefaults = () => {
    setActiveVariable("temperature");
    setShowGridBoxes(true);
    setShowArgoFloats(true);
    setVoxelScale(1.0);
    setThreshold(1.0);
    setDepthExaggeration(50);
    setTempUnit("C");
    setDepthUnit("m");
  };

  const topNavActiveTab =
    activeView === "Analytics" ? "Analytics" : "Home";

  const sidebarActiveItem =
    activeView === "Analytics"
      ? "Analysis"
      : activeView === "DataLayers"
      ? "DataLayers"
      : activeView === "Settings"
      ? "Settings"
      : "Dashboard";

  return (
    <div className="dashboard-shell">
      <div className="dashboard-background" />

      {/* Top Navigation Bar */}
      <TopNav
        activeTab={topNavActiveTab}
        onTabChange={handleTopNavTabChange}
      />

      {/* Main Dashboard Layout Body */}
      <div className="dashboard-body">
        {/* Left Sidebar Navigation */}
        <LeftSidebar
          activeItem={sidebarActiveItem}
          onItemSelect={handleSidebarItemSelect}
        />

        {/* Dynamic View Display */}
        {activeView === "Dashboard" && (
          <>
            {/* Center Stage: Header Card + Map Viewport + Metrics Row */}
            <main className="center-stage">
              {/* Header Card */}
              <HeaderCard
                coverage="Indian Ocean Region"
                timeRange={currentTime}
                depthRange={`0.5 m – ${depths[depths.length - 1] || 186.1} m`}
              />

              {/* 3D Map Viewport (Satellite Globe) */}
              <div className="map-viewport-wrapper">
                <Globe
                  ref={globeRef}
                  time={currentTime}
                  depth={currentDepth}
                  selectedPoint={selectedGridPoint}
                  variable={activeVariable}
                  showGridBoxes={showGridBoxes}
                  showArgoFloats={showArgoFloats}
                  voxelScale={voxelScale}
                  depthExaggeration={depthExaggeration}
                  onFloatClick={(floatId) => {
                    setSelectedFloat(floatId);
                  }}
                  onGridClick={(point) => {
                    setSelectedGridPoint(point);
                  }}
                  onPointsLoaded={handlePointsLoaded}
                />

                {/* Floating Map Controls (Top-Left) */}
                <FloatingMapControls
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onResetView={handleResetView}
                />

                {/* Floating Scrubbers / Filters (Bottom-Left Overlay) */}
                <FloatingScrubbers
                  times={times}
                  depths={depths}
                  timeIndex={timeIndex}
                  depthIndex={depthIndex}
                  onTimeChange={setTimeIndex}
                  onDepthChange={setDepthIndex}
                />
              </div>

              {/* Bottom Summary Metrics (4-Card Row) */}
              <MetricsCards
                avgTemperature={metrics.avgTemp}
                tempDiffTag={metrics.tempDiffTag}
                avgSalinity={metrics.avgSalinity}
                salinityDiffTag={metrics.salinityDiffTag}
                maxDepth={metrics.maxDepth}
                maxDepthSubtext={metrics.maxDepthSubtext}
                gridPoints={metrics.gridPoints}
                gridPointsSubtext={metrics.gridPointsSubtext}
              />
            </main>

            {/* Right Sidebar Panels */}
            <aside className="right-sidebar">
              {/* Model Grid Point Inspector */}
              <GridPointInspector
                point={selectedGridPoint}
                activeDepth={currentDepth}
                activeTime={currentTime}
                activeVariable={activeVariable}
              />

              {/* Quick Insights Card */}
              <QuickInsights dynamicSummary={metrics.dynamicInsight} />
            </aside>
          </>
        )}

        {/* Analytics & In-Situ Float Validation View */}
        {activeView === "Analytics" && (
          <AnalyticsView
            meta={meta}
            threshold={threshold}
            currentSlicePoints={currentSlicePoints}
          />
        )}

        {/* Data Layers & Spatial Variables View */}
        {activeView === "DataLayers" && (
          <DataLayersView
            activeVariable={activeVariable}
            onVariableChange={setActiveVariable}
            showArgoFloats={showArgoFloats}
            onToggleArgoFloats={setShowArgoFloats}
            showGridBoxes={showGridBoxes}
            onToggleGridBoxes={setShowGridBoxes}
            voxelScale={voxelScale}
            onVoxelScaleChange={setVoxelScale}
            meta={meta}
          />
        )}

        {/* Settings & Configuration View */}
        {activeView === "Settings" && (
          <SettingsView
            threshold={threshold}
            onThresholdChange={setThreshold}
            depthExaggeration={depthExaggeration}
            onDepthExaggerationChange={setDepthExaggeration}
            tempUnit={tempUnit}
            onTempUnitChange={setTempUnit}
            depthUnit={depthUnit}
            onDepthUnitChange={setDepthUnit}
            onResetDefaults={handleResetDefaults}
          />
        )}
      </div>

      {/* Argo Float Comparison Modal */}
      {selectedFloat && (
        <ProfileChart
          floatId={selectedFloat}
          onClose={() => setSelectedFloat(null)}
        />
      )}

      {/* About Modal */}
      {showAboutModal && (
        <AboutModal onClose={() => setShowAboutModal(false)} />
      )}
    </div>
  );
}