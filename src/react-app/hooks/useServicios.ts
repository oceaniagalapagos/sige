import { useState, useEffect } from "react";

interface Servicio {
  id: number;
  tipo_servicio: string;
  tipo_transporte: string;
  tipo_embalaje: string;
  costo_base: number;
  unidad_medida: string;
  descripcion: string;
  is_activo: boolean;
}

export function useServicios() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServicios = async () => {
      try {
        const response = await fetch("/api/configuracion");
        const data = await response.json();
        setServicios(data.filter((s: Servicio) => s.is_activo));
      } catch (error) {
        console.error("Error fetching servicios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServicios();
  }, []);

  return { servicios, loading };
}
