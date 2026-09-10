import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;
const API_BASE = import.meta.env.VITE_API_BASE;

// Target camera destination matching the satellite globe perspective in the reference screenshot:
const DEFAULT_CAMERA_POS = Cesium.Cartesian3.fromDegrees(68.0, 14.0, 5_800_000);

function temperatureToColor(temp, min, max) {
  const t = Math.min(1, Math.max(0, (temp - min) / (max - min || 1)));
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

function salinityToColor(sal, min, max) {
  const t = Math.min(1, Math.max(0, (sal - min) / (max - min || 1)));
  let r, g, b;
  if (t < 0.5) {
    const k = t / 0.5;
    r = Math.round(0 + k * 30);
    g = Math.round(150 + k * 80);
    b = Math.round(180 - k * 30);
  } else {
    const k = (t - 0.5) / 0.5;
    r = Math.round(30 + k * 215);
    g = Math.round(230 + k * 10);
    b = Math.round(150 - k * 110);
  }
  return Cesium.Color.fromBytes(r, g, b, 210);
}

const Globe = forwardRef(function Globe(
  {
    time,
    depth,
    selectedPoint,
    variable = "temperature",
    showGridBoxes = true,
    showArgoFloats = true,
    voxelScale = 1.0,
    depthExaggeration = 50,
    onFloatClick,
    onGridClick,
    onPointsLoaded,
  },
  ref
) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const modelEntitiesRef = useRef([]);
  const argoEntitiesRef = useRef([]);
  const focusBoxRef = useRef(null);

  // Expose camera controls to parent via ref
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      const viewer = viewerRef.current;
      if (!viewer) return;
      const camera = viewer.camera;
      const height = camera.positionCartographic.height;
      camera.zoomIn(Math.max(100000, height * 0.35));
    },
    zoomOut: () => {
      const viewer = viewerRef.current;
      if (!viewer) return;
      const camera = viewer.camera;
      const height = camera.positionCartographic.height;
      camera.zoomOut(Math.max(100000, height * 0.35));
    },
    resetView: () => {
      const viewer = viewerRef.current;
      if (!viewer) return;
      viewer.camera.flyTo({
        destination: DEFAULT_CAMERA_POS,
        duration: 1.2,
      });
    },
  }));

  // Initialize Cesium Viewer with default satellite globe & selection indicator
  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      selectionIndicator: true, // Enables green target focus reticle
      infoBox: false,
    });

    // Set camera to frame the globe as shown in the reference image
    viewer.camera.setView({
      destination: DEFAULT_CAMERA_POS,
    });

    // Ensure atmosphere and earth lighting match satellite globe
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.globe.enableLighting = false;

    viewerRef.current = viewer;

    loadArgoFloats(viewer, depthExaggeration, onFloatClick).then((entities) => {
      argoEntitiesRef.current = entities;
      entities.forEach((e) => (e.show = showArgoFloats));
    });

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement) => {
      const picked = viewer.scene.pick(movement.position);
      if (!Cesium.defined(picked) || !picked.id) return;

      // Activate Cesium's green selection focus reticle on the picked entity
      viewer.selectedEntity = picked.id;

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

  // Update Argo floats visibility
  useEffect(() => {
    argoEntitiesRef.current.forEach((e) => {
      e.show = showArgoFloats;
    });
  }, [showArgoFloats]);

  // Update Grid boxes visibility
  useEffect(() => {
    modelEntitiesRef.current.forEach((e) => {
      e.show = showGridBoxes;
    });
  }, [showGridBoxes]);

  // Update 3D focus box & selection reticle whenever selectedPoint changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (focusBoxRef.current) {
      viewer.entities.remove(focusBoxRef.current);
      focusBoxRef.current = null;
    }

    if (!selectedPoint) return;

    const focusEntity = viewer.entities.add({
      name: `Focus: ${selectedPoint.lat.toFixed(2)}°N, ${selectedPoint.lon.toFixed(2)}°E`,
      position: Cesium.Cartesian3.fromDegrees(
        selectedPoint.lon,
        selectedPoint.lat,
        -selectedPoint.depth * depthExaggeration
      ),
      box: {
        dimensions: new Cesium.Cartesian3(
          28000 * voxelScale,
          28000 * voxelScale,
          14000 * voxelScale
        ),
        material: Cesium.Color.LIME.withAlpha(0.2),
        outline: true,
        outlineColor: Cesium.Color.LIME,
        outlineWidth: 3,
      },
    });

    focusBoxRef.current = focusEntity;
    viewer.selectedEntity = focusEntity;
  }, [selectedPoint, depthExaggeration, voxelScale]);

  // Load grid slice data when time, depth, variable, or exaggeration changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !time || depth === undefined) return;

    fetch(`${API_BASE}/api/temperature?time=${time}&depth=${depth}`)
      .then((res) => res.json())
      .then((gridPoints) => {
        modelEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
        modelEntitiesRef.current = [];

        if (onPointsLoaded) {
          onPointsLoaded(gridPoints);
        }

        if (!gridPoints || gridPoints.length === 0) return;

        const values = gridPoints.map((p) =>
          variable === "salinity" ? p.salinity : p.temperature
        );
        const min = Math.min(...values);
        const max = Math.max(...values);

        gridPoints.forEach((p) => {
          const color =
            variable === "salinity"
              ? salinityToColor(p.salinity, min, max)
              : temperatureToColor(p.temperature, min, max);

          const entity = viewer.entities.add({
            gridPoint: p,
            show: showGridBoxes,
            position: Cesium.Cartesian3.fromDegrees(
              p.lon,
              p.lat,
              -p.depth * depthExaggeration
            ),
            box: {
              dimensions: new Cesium.Cartesian3(
                25000 * voxelScale,
                25000 * voxelScale,
                12000 * voxelScale
              ),
              material: color,
              outline: false,
            },
          });
          modelEntitiesRef.current.push(entity);
        });
      })
      .catch((err) => console.error("Failed to load ocean layer:", err));
  }, [time, depth, variable, voxelScale, depthExaggeration, showGridBoxes, onPointsLoaded]);

  return <div ref={containerRef} className="cesium-host" />;
});

export default Globe;

async function loadArgoFloats(viewer, depthExaggeration, onFloatClick) {
  try {
    const listRes = await fetch(`${API_BASE}/api/argo`);
    const floats = await listRes.json();
    const entities = [];

    for (const f of floats) {
      const profileRes = await fetch(`${API_BASE}/api/argo/${f.float_id}`);
      const profile = await profileRes.json();

      const positions = profile.map((p) =>
        Cesium.Cartesian3.fromDegrees(p.lon, p.lat, -p.depth * depthExaggeration)
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
          showBackground: true,
          backgroundColor: Cesium.Color.fromBytes(10, 20, 30, 200),
          backgroundPadding: new Cesium.Cartesian2(5, 3),
        },
      });
      entities.push(entity);
    }

    return entities;
  } catch (err) {
    console.warn("Could not load Argo floats:", err);
    return [];
  }
}