import { useState, useEffect } from "react";

interface CalendarioEmbarque {
  id: number;
  fecha_embarque: string;
  id_barco: number;
  nombre_barco: string;
  tipos_productos_aceptados: string;
  cupo_total_peso: number;
  cupo_total_volumen: number;
  cupo_utilizado_peso: number;
  cupo_utilizado_volumen: number;
  id_puerto_destino: number | null;
  nombre_destino: string | null;
  isla: string | null;
  fecha_arribo_puerto: string | null;
  tipo_transporte: string;
  is_activo: boolean;
  created_at: string;
  updated_at: string;
}

export function useCalendario() {
  const [calendario, setCalendario] = useState<CalendarioEmbarque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendario = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/calendario");

      if (!response.ok) {
        throw new Error("Error al cargar calendario");
      }

      const data = await response.json();
      // Filter only active and future dates
      const today = new Date().toISOString().split('T')[0];
      const filtered = data.filter((item: CalendarioEmbarque) => 
        item.is_activo && item.fecha_embarque >= today
      );
      setCalendario(filtered);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendario();
  }, []);

  // Check if calendar is full
  const isCalendarioFull = (item: CalendarioEmbarque) => {
    const pesoPercent = item.cupo_total_peso > 0 
      ? (item.cupo_utilizado_peso / item.cupo_total_peso) * 100 
      : 0;
    const volumenPercent = item.cupo_total_volumen > 0 
      ? (item.cupo_utilizado_volumen / item.cupo_total_volumen) * 100 
      : 0;
    
    const isFullByPeso = pesoPercent >= 100;
    const isFullByVolumen = volumenPercent >= 100;
    
    return {
      isFull: isFullByPeso || isFullByVolumen,
      isFullByPeso,
      isFullByVolumen,
      pesoPercent,
      volumenPercent
    };
  };

  // Filter calendario by product type
  const getCalendarioByProductType = (tipoProducto: string) => {
    if (!tipoProducto) return [];
    return calendario
      .filter(item => {
        if (!item.tipos_productos_aceptados) return false;
        // tipos_productos_aceptados is a comma-separated string
        const tipos = item.tipos_productos_aceptados.split(',').map(t => t.trim());
        return tipos.includes(tipoProducto);
      })
      .map(item => ({
        ...item,
        ...isCalendarioFull(item)
      }));
  };

  return { calendario, loading, error, refetch: fetchCalendario, getCalendarioByProductType, isCalendarioFull };
}
