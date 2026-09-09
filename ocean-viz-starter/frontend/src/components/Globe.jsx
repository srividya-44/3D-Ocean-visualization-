import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

const API_BASE = "http://localhost:8000";

// Turn a temperature value into a color: blue (cold) -> red (hot).
// This is the simplest possible color scale -- good enough for a demo,
// swap for a proper colormap (e.g. colorbrewer) if you have time later.
function temperatureToColor(temp, min = 5, max = 30) {
  const t = Math.min(1, Math.max(0, (temp - min) / (max - min)));
  const r = Math.round(255 * t);
  const b = Math.round(255 * (1 - t));
  return Cesium.Color.fromBytes(r, 60, b, 200);
}

export default function Globe({ time, depth, onFloatClick }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const modelEntitiesRef = useRef([]);
  const argoEntitiesRef = useRef([]);

  // ------------------------------------------------------------
  // Set up the CesiumJS viewer ONCE when the component mounts
  // ------------------------------------------------------------
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

    // Start the camera looking at the Bay of Bengal (matches sample data)
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(85.0, 15.0, 1_500_000),
    });

    viewerRef.current = viewer;

    // Load the Argo floats once (they don't change with the time/depth slider
    // in this simple version -- their positions are fixed, only the
    // profile/mismatch data changes)
    loadArgoFloats(viewer, onFloatClick).then((entities) => {
      argoEntitiesRef.current = entities;
    });

    // Click handler: detect clicks on Argo float entities
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement) => {
      const picked = viewer.scene.pick(movement.position);
      if (Cesium.defined(picked) && picked.id && picked.id.floatId) {
        onFloatClick(picked.id.floatId);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
      viewer.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------
  // Re-fetch and re-draw the MODEL temperature layer whenever the
  // time/depth slider changes
  // ------------------------------------------------------------
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    fetch(`${API_BASE}/api/temperature?time=${time}&depth=${depth}`)
      .then((res) => res.json())
      .then((gridPoints) => {
        // Remove the previous layer
        modelEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
        modelEntitiesRef.current = [];

        // Draw each grid point as a small colored box positioned at
        // (lat, lon, -depth). Height is negative because CesiumJS
        // treats "up" as positive, and depth goes down into the ocean.
        gridPoints.forEach((p) => {
          const entity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, -p.depth * 50),
            box: {
              dimensions: new Cesium.Cartesian3(30000, 30000, 15000),
              material: temperatureToColor(p.temperature),
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

// ------------------------------------------------------------
// Load Argo floats as vertical "threads" (polylines) so their
// FULL depth profile is visible directly in the 3D scene, not just
// a single point at the surface.
// ------------------------------------------------------------
async function loadArgoFloats(viewer, onFloatClick) {
  const listRes = await fetch(`${API_BASE}/api/argo`);
  const floats = await listRes.json();
  const entities = [];

  for (const f of floats) {
    const profileRes = await fetch(`${API_BASE}/api/argo/${f.float_id}`);
    const profile = await profileRes.json();

    // Build a vertical line through all the float's depth readings
    const positions = profile.map((p) =>
      Cesium.Cartesian3.fromDegrees(p.lon, p.lat, -p.depth * 50)
    );

    const entity = viewer.entities.add({
      floatId: f.float_id, // custom property used by the click handler
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
