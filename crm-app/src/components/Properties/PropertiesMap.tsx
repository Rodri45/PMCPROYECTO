// src/components/Properties/PropertiesMap.tsx
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

/* =========================
   Utiles de estilo/estado
========================= */
const weightByStatus = (s?: string) => {
  switch (s) {
    case "Interesado": return 1.0;
    case "En negociación": return 0.75;
    case "Cerrado": return 0.45;
    default: return 0.6;
  }
};
const colorByStatus = (s?: string) => {
  switch (s) {
    case "Interesado": return "#1AA0B3"; // turquesa
    case "En negociación": return "#FF8C00"; // naranja
    case "Cerrado": return "#E53935"; // rojo
    default: return "#6B7280"; // gris
  }
};

/* =========================
   Imagen robusta para popup
========================= */

/** Pool curado de fotos de casas/deptos (Unsplash RAW con ancho máx y compresión) */
/** Pool curado de fotos de casas/deptos (solo inmobiliario) */
const HOUSE_PHOTOS: string[] = [
  // Exteriores
  "https://media1.amarilo.com.co/website/s3fs-public/2024-03/Fachada_Coral_Web_.webp",
  "https://d219336yigegi3.cloudfront.net/sites/noticias-m2/files/field/image/montereserva-apto.jpg",
  "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0d/a6/97/22/regency-boutique.jpg?w=1200&h=-1&s=1",
  "https://www.estrenarvivienda.com/sites/default/files/styles/cards_results/public/imagenes-proyectos/images/2024-10/Render_1.jpg?itok=vDURWJBu",
  "https://image.wasi.co/eyJidWNrZXQiOiJzdGF0aWN3Iiwia2V5IjoiaW5tdWVibGVzXC9ncjExNzg2MTIyMDIyMDIxNDA4MTgwMC5qcGciLCJlZGl0cyI6eyJub3JtYWxpc2UiOnRydWUsInJvdGF0ZSI6MCwicmVzaXplIjp7IndpZHRoIjo5MDAsImhlaWdodCI6Njc1LCJmaXQiOiJjb250YWluIiwiYmFja2dyb3VuZCI6eyJyIjoyNTUsImciOjI1NSwiYiI6MjU1LCJhbHBoYSI6MX19fX0=",
  "https://cloudfront-us-east-1.images.arcpublishing.com/infobae/6XCVYKUCHJHMFI7PQEUXTLK2PU.jpg",
  "https://cdn.sedierp.com/api/Files/GetFile?PublicKey=2ECE05C4-4C08-4CD4-A23D-68D150F49203&UniqueID=4849a03c-7c62-4aed-a9db-4220e688fee5&Disposition=Inline",
  "https://listingsprod.blob.core.windows.net/ourlistings-col/842d5d21-2d19-4eee-85d5-3cc86d83701c/ebe6fe73-8831-4c4c-815f-74119216030f-w",
  "https://www-img-cc.s3.amazonaws.com/inmuebles/images/3176748/fbdde_173221958115_plana.jpeg"


  


];


/** Hash simple y estable para mapear nombre+id -> índice del pool */
function hashToIndex(s: string, mod: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % Math.max(1, mod);
}

/** Devuelve la URL de imagen inicial y un fallback determinístico */
function getPhotoFor(name?: string, id?: number | string) {
  const key = `${name ?? "prop"}_${id ?? ""}`;
  const idx = hashToIndex(key, HOUSE_PHOTOS.length);
  const primary = HOUSE_PHOTOS[idx];

  // Si todo falla, usa un placeholder con seed estable (siempre casa/depto-like)
  const ultimateFallback = `https://picsum.photos/seed/house-${encodeURIComponent(
    key
  )}/900/520`;

  return { primary, ultimateFallback, idx };
}

/* =========================
   HeatLayer y Fit Bounds
========================= */
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

    // @ts-expect-error: provisto por leaflet.heat
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

/* =========================
   Mapa principal
========================= */
const PropertiesMap: React.FC<PropertiesMapProps> = ({ properties = [], mapConfig }) => {
  const center: [number, number] = [
    mapConfig?.center?.latitude ?? 4.711,
    mapConfig?.center?.longitude ?? -74.0721,
  ];
  const zoom = mapConfig?.zoom ?? 12;

  const points = useMemo(
    () =>
      properties.map((p) => ({
        id: (p as any).id as number | string | undefined,
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
      zoomControl={false}
      scrollWheelZoom={true}
      doubleClickZoom={true}
      attributionControl={false}
      preferCanvas={true}
      style={{ width: "100%", height: "100%" }}
    >
      <ZoomControl position="bottomright" />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitToPoints coords={points} />
      <HeatLayer points={points} />

      {points.map((p, i) => {
        const { primary, ultimateFallback } = getPhotoFor(p.name, p.id);

        return (
          <CircleMarker
            key={i}
            center={[p.lat, p.lng]}
            radius={7}
            pathOptions={{
              color: p.color,
              weight: 2,
              fillColor: p.color,
              fillOpacity: 0.85,
              pane: "markerPane",
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

            <Popup maxWidth={360} minWidth={260}>
              <div style={{ width: 300 }}>
                {/* Imagen SIEMPRE visible, con fallback */}
                <img
                  src={primary}
                  alt={p.name}
                  style={{
                    width: "100%",
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 12,
                    display: "block",
                    marginBottom: 8,
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = ultimateFallback;
                  }}
                  loading="lazy"
                  decoding="async"
                />
                <div style={{ fontWeight: 800, margin: "4px 0 2px" }}>{p.name}</div>
                {p.address && <div style={{ opacity: 0.8, marginBottom: 6 }}>{p.address}</div>}
                {p.status && (
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      background: "rgba(26,160,179,.15)",
                      color: "#0E223A",
                      fontWeight: 700,
                    }}
                  >
                    {p.status}
                  </span>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
};

export default PropertiesMap;
