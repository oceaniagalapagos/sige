import { useState, useEffect } from "react";

interface EmbarqueServicio {
  id: number;
  id_embarque: number;
  id_servicio: number;
  cantidad: number;
  costo_unitario: number;
  costo_total: number;
  notas: string;
  tipo_servicio: string;
  descripcion_servicio: string;
  unidad_medida: string;
  created_at: string;
  updated_at: string;
}

export function useEmbarqueServicios(idEmbarque: string | undefined) {
  const [servicios, setServicios] = useState<EmbarqueServicio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServicios = async () => {
    if (!idEmbarque) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/embarques-servicios/${idEmbarque}`);
      const data = await response.json();
      setServicios(data);
    } catch (error) {
      console.error("Error fetching servicios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, [idEmbarque]);

  return { servicios, loading, refetch: fetchServicios };
}
