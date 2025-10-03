import React, { useMemo, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  ZoomControl,
  CircleMarker,
  Tooltip,
  Popup,
} from "react-leaflet";
import L, { LatLngBoundsExpression } from "leaflet";
import "leaflet.heat";
import type { PropertiesMapProps } from "../../types/PropertiesMapProps";

const weightByStatus = (s?: string) => {
  switch (s) {
    case "Interesado":     return 1.0;
    case "En negociación": return 0.75;
    case "Cerrado":        return 0.45;
    default:               return 0.6;
  }
};

const colorByStatus = (s?: string) => {
  switch (s) {
    case "Interesado":     return "#1AA0B3"; // turquesa
    case "En negociación": return "#FF8C00"; // naranja
    case "Cerrado":        return "#E53935"; // rojo
    default:               return "#6B7280"; // gris
  }
};

/** Capa de calor con leaflet.heat en un pane superior */
const HeatLayer: React.FC<{
  points: { lat: number; lng: number; intensity: number }[];
}> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const paneName = "heatmap";
    if (!map.getPane(paneName)) {
      map.createPane(paneName);
      const pane = map.getPane(paneName)!;
      pane.style.zIndex = "450";
      pane.style.pointerEvents = "none";
    }

    const heatPoints = points.map(
      (p) => [p.lat, p.lng, p.intensity] as [number, number, number]
    );

    // @ts-expect-error: lo añade el plugin
    const layer = L.heatLayer(heatPoints, {
      radius: 32,
      blur: 26,
      max: 1,
      pane: "heatmap",
      gradient: {
        0.0: "rgba(0,0,0,0)",
        0.3: "rgba(26,160,179,.55)",
        0.6: "rgba(255,140,0,.70)",
        0.9: "rgba(255,0,0,.85)",
      },
    }).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
};

/** Encadra el mapa a los puntos cuando cambian */
const FitToPoints: React.FC<{
  coords: { lat: number; lng: number }[];
}> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (!coords.length) return;
    const bounds = L.latLngBounds(coords.map((c) => [c.lat, c.lng])) as LatLngBoundsExpression;
    map.fitBounds(bounds, { padding: [16, 16] });
  }, [map, coords]);
  return null;
};

const PropertiesMap: React.FC<PropertiesMapProps> = ({ properties = [], mapConfig }) => {
  // centro/zoom (fallback Bogotá). Igual haremos fitBounds con los puntos:
  const center: [number, number] = [
    mapConfig?.center?.latitude ?? 4.711,
    mapConfig?.center?.longitude ?? -74.0721,
  ];
  const zoom = mapConfig?.zoom ?? 12;

  const points = useMemo(
    () =>
      properties.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        intensity: weightByStatus(p.status),
        color: colorByStatus(p.status),
        name: p.name,
        address: (p as any).address as string | undefined,
        status: (p as any).status as string | undefined,
      })),
    [properties]
  );

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      // Controles visibles:
      zoomControl={false}        // lo ponemos manual abajo para moverlo
      scrollWheelZoom={true}
      doubleClickZoom={true}
      attributionControl={false}
      preferCanvas={true}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Controles de zoom visibles */}
      <ZoomControl position="bottomright" />

      {/* Mosaico base */}
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Autoencuadre a resultados */}
      <FitToPoints coords={points} />

      {/* Heatmap */}
      <HeatLayer points={points} />

      {/* Marcadores clicables con tooltip y popup */}
      {points.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.lat, p.lng]}
          radius={7}
          pathOptions={{
            color: p.color,
            weight: 2,
            fillColor: p.color,
            fillOpacity: 0.85,
            pane: "markerPane", // por encima del heat
          }}
        >
          <Tooltip
            direction="top"
            offset={[0, -6]}
            opacity={1}
            permanent={false}
            className="map-tip"
          >
            {p.name}
          </Tooltip>
          <Popup>
            <div style={{ minWidth: 160 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
              {p.address && <div style={{ opacity: 0.8 }}>{p.address}</div>}
              {p.status && (
                <div style={{ marginTop: 6 }}>
                  <span
                    style={{
                      padding: "2px 6px",
                      borderRadius: 999,
                      fontSize: 12,
                      background: "#EDF2F7",
                      color: "#0B1320",
                    }}
                  >
                    {p.status}
                  </span>
                </div>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};

export default PropertiesMap;
export {};
