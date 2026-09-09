import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

// Get a free token from https://ion.cesium.com/tokens and paste it here.
Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;

const API_BASE = import.meta.env.VITE_API_BASE;

// Turn a temperature value into a color: blue (cold) -> yellow -> red (hot).
// min/max are computed dynamically per-slice (see loadTemperatureLayer)
// so the color spread is always meaningful, whether you're looking at a
// warm surface layer (26-31C) or a cold deep layer (5-10C).
function temperatureToColor(temp, min, max) {
  const t = Math.min(1, Math.max(0, (temp - min) / (max - min || 1)));
  // Blue -> Cyan -> Yellow -> Red gradient (more informative than plain
  // red-to-blue for a narrow real-world range like ocean surface temps)
  let r, g, b;
  if (t < 0.5) {
    const k = t / 0.5;
    r = Math.round(0 + k * 255);
    g = Math.round(120 + k * 135);
    b = Math.round(255 - k * 155);
  } else {
    const k = (t - 0.5) / 0.5;
    r = 255;
    g = Math.round(255 - k * 255);
    b = Math.round(100 - k * 100);
  }
  return Cesium.Color.fromBytes(r, g, Math.max(0, b), 210);
}

export default function Globe({ time, depth, onFloatClick, onGridClick }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const modelEntitiesRef = useRef([]);
  const argoEntitiesRef = useRef([]);

  useEffect(() => {
    const viewer = new Cesium.Viewer(containerRef.current, {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: true,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
    });

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(85.0, 15.0, 1_500_000),
    });

    viewerRef.current = viewer;

    loadArgoFloats(viewer, onFloatClick).then((entities) => {
      argoEntitiesRef.current = entities;
    });

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement) => {
      const picked = viewer.scene.pick(movement.position);
      if (!Cesium.defined(picked) || !picked.id) return;
      if (picked.id.floatId) {
        onFloatClick(picked.id.floatId);
      } else if (picked.id.gridPoint) {
        onGridClick(picked.id.gridPoint);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
      viewer.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    fetch(`${API_BASE}/api/temperature?time=${time}&depth=${depth}`)
      .then((res) => res.json())
      .then((gridPoints) => {
        modelEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
        modelEntitiesRef.current = [];

        if (gridPoints.length === 0) return;

        // Compute the ACTUAL min/max temperature in this slice, so the
        // color gradient always spans the real range instead of clipping
        // everything to one end (which is what caused the uniform-orange
        // look before).
        const temps = gridPoints.map((p) => p.temperature);
        const min = Math.min(...temps);
        const max = Math.max(...temps);

        gridPoints.forEach((p) => {
          const entity = viewer.entities.add({
            gridPoint: p, // custom property read by the click handler
            position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, -p.depth * 50),
            box: {
              dimensions: new Cesium.Cartesian3(25000, 25000, 12000),
              material: temperatureToColor(p.temperature, min, max),
              outline: false,
            },
          });
          modelEntitiesRef.current.push(entity);
        });
      })
      .catch((err) => console.error("Failed to load temperature layer:", err));
  }, [time, depth]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

async function loadArgoFloats(viewer, onFloatClick) {
  const listRes = await fetch(`${API_BASE}/api/argo`);
  const floats = await listRes.json();
  const entities = [];

  for (const f of floats) {
    const profileRes = await fetch(`${API_BASE}/api/argo/${f.float_id}`);
    const profile = await profileRes.json();

    const positions = profile.map((p) =>
      Cesium.Cartesian3.fromDegrees(p.lon, p.lat, -p.depth * 50)
    );

    const entity = viewer.entities.add({
      floatId: f.float_id,
      polyline: {
        positions,
        width: 6,
        material: new Cesium.PolylineOutlineMaterialProperty({
          color: Cesium.Color.YELLOW,
          outlineWidth: 1,
          outlineColor: Cesium.Color.BLACK,
        }),
      },
      point: {
        pixelSize: 12,
        color: Cesium.Color.YELLOW,
      },
      position: positions[0],
      label: {
        text: f.float_id,
        font: "12px sans-serif",
        pixelOffset: new Cesium.Cartesian2(0, -20),
        fillColor: Cesium.Color.WHITE,
      },
    });
    entities.push(entity);
  }

  return entities;
}