export type Property = {
  id: number ;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  status?: "Interesado" | "En negociación" | "Cerrado";
  /** ← nuevo, opcional: número de interesados reales */
  interested?: number;
};


export type MapConfig = {
  zoom: number;
  center: { latitude: number; longitude: number };
};

export type PropertiesMapProps = {
  properties: Property[];
  mapConfig: MapConfig;
  onSelect?: (p: Property) => void; // ⬅️ nuevo
};


export {};
