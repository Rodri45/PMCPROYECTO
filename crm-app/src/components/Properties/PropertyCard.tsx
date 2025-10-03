import React from "react";
import type { Property } from "../../types/PropertiesMapProps";

type Props = {
  data: Property;
  onClick?: (id: number) => void;
};

const statusClass = (s?: string) => {
  switch (s) {
    case "Interesado":
      return "st a";
    case "En negociación":
      return "st b";
    case "Cerrado":
      return "st c";
    default:
      return "st";
  }
};

const PropertyCard: React.FC<Props> = ({ data, onClick }) => {
  return (
    <button className="prop-card" onClick={() => onClick?.(data.id)}>
      <div className="prop-thumb" aria-hidden>
        {/* si tuvieras foto real: <img src={data.photoUrl!} alt="" /> */}
        <div className="thumb-fallback">🏠</div>
      </div>

      <div className="prop-main">
        <div className="prop-title">{data.name}</div>
        {data.address && <div className="prop-sub">{data.address}</div>}
        <div className="prop-meta">
          <span className={statusClass(data.status)}>{data.status}</span>
        </div>
      </div>

      <div className="prop-cta" aria-hidden>›</div>
    </button>
  );
};

export default PropertyCard;

/* Asegura que el archivo sea tratado como módulo bajo --isolatedModules */
export {};
